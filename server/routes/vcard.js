const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
// const Client = require('../models/Client'); // Will need this later for "Add to Network"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'vcard_profiles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return file.fieldname + '-' + uniqueSuffix;
        }
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// GET /profile - Get my VCard profile (Authenticated)
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token' });

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.user.id).select('-password_hash -biometric_key');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Normalize profile picture URL
        const userData = user.toObject();
        if (userData.profile_picture) {
            userData.profile_picture = normalizeImageUrl(userData.profile_picture);
        }

        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Token is not valid' });
    }
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to normalize image URLs
const normalizeImageUrl = (url) => {
    if (!url) return url;
    // If URL contains localhost or full domain, extract just the /uploads/... part
    if (url.includes('localhost') || url.includes('http://') || url.includes('https://')) {
        const match = url.match(/\/uploads\/[^?]+/);
        return match ? match[0] : url;
    }
    return url;
};

// POST /upload - Upload profile picture
router.post('/upload', (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ message: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            // Return the Cloudinary URL (path contains the secure_url)
            const fileUrl = req.file.path;
            console.log('File uploaded to Cloudinary successfully:', fileUrl);
            res.json({ url: fileUrl });
        } catch (err) {
            console.error('Server error during upload:', err);
            res.status(500).json({ message: 'Server Error during upload' });
        }
    });
});

// GET /:slug - Get public VCard
router.get('/:slug', async (req, res) => {
    try {
        const user = await User.findOne({ vcard_slug: req.params.slug })
            .select('-password_hash -biometric_key -corporate_id -role'); // Exclude sensitive info

        if (!user) {
            return res.status(404).json({ message: 'VCard not found' });
        }

        // Normalize profile picture URL
        const userData = user.toObject();
        if (userData.profile_picture) {
            userData.profile_picture = normalizeImageUrl(userData.profile_picture);
        }

        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /profile - Update my VCard
router.put('/profile', async (req, res) => {
    const fs = require('fs');
    const logFile = path.join(__dirname, '../server_debug.log');
    const log = (msg) => {
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
        } catch (e) {
            console.error('Logging failed', e);
        }
    };

    try {
        log('PUT /profile called');
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            log('No token provided');
            return res.status(401).json({ message: 'No token' });
        }

        const jwt = require('jsonwebtoken');
        if (!process.env.JWT_SECRET) {
            log('JWT_SECRET is missing');
            return res.status(500).json({ message: 'Server Config Error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;
        log(`Updating user: ${userId}`);

        const { ...updateData } = req.body;

        // Validate updateData
        const allowedUpdates = [
            'name', 'position', 'phone', 'company_name', 'company_address',
            'company_website', 'bio', 'profile_picture', 'social_links', 'theme_color', 'vcard_slug', 'url_slug' // Added url_slug just in case
        ];

        const actualUpdates = {};
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                actualUpdates[key] = updateData[key];
            }
        });

        // Handle url_slug -> vcard_slug mapping if needed
        if (actualUpdates.url_slug && !actualUpdates.vcard_slug) {
            actualUpdates.vcard_slug = actualUpdates.url_slug;
            delete actualUpdates.url_slug;
        }

        log(`Updates: ${JSON.stringify(actualUpdates)}`);

        // Get current user to check if slug is changing
        const currentUser = await User.findById(userId);

        // Check if slug is taken (only if it's different from current slug)
        if (actualUpdates.vcard_slug && actualUpdates.vcard_slug !== currentUser.vcard_slug) {
            const existing = await User.findOne({ vcard_slug: actualUpdates.vcard_slug });
            if (existing) {
                log(`Slug ${actualUpdates.vcard_slug} taken by another user`);
                return res.status(400).json({ message: 'Slug already taken' });
            }
        }

        const user = await User.findByIdAndUpdate(userId, { $set: actualUpdates }, { new: true })
            .select('-password_hash -biometric_key');

        log('Success');
        res.json(user);
    } catch (err) {
        log(`Error: ${err.message}`);
        console.error('PUT /profile - Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
