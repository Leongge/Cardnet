const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const Client = require('../models/Client');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Debug: Check if Cloudinary config is loaded (don't log the secret)
console.log('Cloudinary Config Check:', {
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
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
            console.error('Cloudinary/Multer upload error full details:', err);
            return res.status(400).json({ message: err.message || 'Upload failed' });
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
            'name', 'position', 'phone', 'vcard_email', 'company_name', 'company_address',
            'company_website', 'bio', 'profile_picture', 'background_picture', 'social_links', 'theme_color', 'vcard_slug', 'url_slug' // Added url_slug just in case
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

        // Validate and check vcard_slug
        if (actualUpdates.vcard_slug && actualUpdates.vcard_slug !== currentUser.vcard_slug) {
            const slug = actualUpdates.vcard_slug;

            // 1. Format validation: only alphanumeric, hyphens, and underscores
            const slugRegex = /^[a-zA-Z0-9_-]+$/;
            if (!slugRegex.test(slug)) {
                log(`Invalid slug format: ${slug}`);
                return res.status(400).json({
                    message: 'Username can only contain letters, numbers, hyphens, and underscores'
                });
            }

            // 2. Length validation: 3-30 characters
            if (slug.length < 3 || slug.length > 30) {
                log(`Invalid slug length: ${slug.length}`);
                return res.status(400).json({
                    message: 'Username must be between 3 and 30 characters'
                });
            }

            // 3. Reserved words check
            const reservedWords = ['admin', 'api', 'profile', 'login', 'register', 'dashboard', 'settings', 'vcard', 'connect', 'design', 'upload'];
            if (reservedWords.includes(slug.toLowerCase())) {
                log(`Reserved slug attempted: ${slug}`);
                return res.status(400).json({
                    message: 'This username is reserved and cannot be used'
                });
            }

            // 4. Check if slug is taken (case-insensitive)
            const existing = await User.findOne({
                vcard_slug: { $regex: new RegExp(`^${slug}$`, 'i') }
            });
            if (existing) {
                log(`Slug ${slug} already taken by another user`);
                return res.status(400).json({
                    message: 'This username is already taken. Please choose another one.'
                });
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

// POST /connect/:slug - Connect with a VCard user (add to client list)
router.post('/connect/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Verify authentication
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const currentUserId = decoded.user.id;

        // Find the VCard owner by slug
        const vcardOwner = await User.findOne({ vcard_slug: slug });
        if (!vcardOwner) {
            return res.status(404).json({ message: 'VCard not found' });
        }

        // Prevent self-connection
        if (vcardOwner._id.toString() === currentUserId) {
            return res.status(400).json({ message: 'You cannot connect to your own VCard' });
        }

        // Check if already connected
        const existingClient = await Client.findOne({
            owner_id: currentUserId,
            'data.email': vcardOwner.email
        });

        if (existingClient) {
            return res.status(400).json({ message: 'Already connected with this user' });
        }

        // Get current user for corporate_id
        const currentUser = await User.findById(currentUserId);

        // Create new client entry
        const newClient = new Client({
            owner_id: currentUserId,
            corporate_id: currentUser.corporate_id,
            visibility: 'Private',
            data: {
                name: vcardOwner.name,
                position: vcardOwner.position,
                email: vcardOwner.email,
                phone: vcardOwner.phone,
                company_name: vcardOwner.company_name,
                company_address: vcardOwner.company_address
            },
            source: 'vCard',
            pdpa_consent: false
        });

        await newClient.save();

        res.json({
            message: 'Successfully connected!',
            client: newClient
        });

    } catch (err) {
        console.error('POST /connect/:slug - Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /design/generate - Generate AI design based on user prompt
router.post('/design/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ message: 'Design prompt is required' });
        }

        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const systemPrompt = `You are a professional UI/UX designer specializing in digital business cards. Generate a complete VCard design configuration based on the user's description.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "primary_color": "#hexcode",
  "secondary_color": "#hexcode",
  "accent_color": "#hexcode",
  "text_color": "#hexcode",
  "background_color": "#hexcode",
  "layout_style": "centered|left-aligned|split|minimal",
  "font_family": "modern|classic|playful",
  "heading_size": "small|medium|large",
  "spacing": "compact|normal|spacious",
  "show_decorations": true|false,
  "card_shape": "rounded|sharp|pill"
}

CRITICAL Guidelines:
1. CONTRAST IS MANDATORY:
   - If background_color is dark (#000000-#666666), text_color MUST be light (#CCCCCC-#FFFFFF)
   - If background_color is light (#CCCCCC-#FFFFFF), text_color MUST be dark (#000000-#444444)
   - Ensure WCAG AA contrast ratio (4.5:1 minimum)

2. Theme-appropriate colors:
   - "tech/technology/modern": Use dark backgrounds (#0a0a0a, #1a1a2e, #0f172a) with bright accents (#00d4ff, #7c3aed, #3b82f6)
   - "professional/business": Use navy/slate backgrounds (#1e293b, #334155) or clean whites (#ffffff) with blue accents
   - "creative/playful": Use vibrant backgrounds with complementary accents
   - "minimal/elegant": Use light backgrounds (#f8fafc, #ffffff) with subtle dark text

3. Color roles:
   - primary_color: Header/banner background
   - secondary_color: Subtitle/label color (must contrast with background_color)
   - accent_color: Buttons and links (must pop against background_color)
   - text_color: Main body text (must have high contrast with background_color)
   - background_color: Card background (choose based on theme)

4. Accessibility: All text must be readable. Never use similar colors for text and background.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Design style: ${prompt}` }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let designConfig;
        try {
            designConfig = JSON.parse(responseText);
        } catch (parseErr) {
            console.error('Failed to parse AI response:', responseText);
            return res.status(500).json({ message: 'Failed to parse AI response' });
        }

        // Validate required fields
        const requiredFields = ['primary_color', 'secondary_color', 'accent_color', 'text_color', 'background_color', 'layout_style', 'font_family', 'heading_size', 'spacing', 'show_decorations', 'card_shape'];
        for (const field of requiredFields) {
            if (designConfig[field] === undefined) {
                return res.status(500).json({ message: `AI response missing field: ${field}` });
            }
        }

        // CONTRAST VALIDATION AND AUTO-CORRECTION
        const getContrastRatio = (color1, color2) => {
            const getLuminance = (hex) => {
                const rgb = parseInt(hex.slice(1), 16);
                const r = (rgb >> 16) & 0xff;
                const g = (rgb >> 8) & 0xff;
                const b = (rgb >> 0) & 0xff;
                const [rs, gs, bs] = [r, g, b].map(c => {
                    c = c / 255;
                    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };
            const l1 = getLuminance(color1);
            const l2 = getLuminance(color2);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
        };

        // Check and fix text_color vs background_color contrast
        const textBgContrast = getContrastRatio(designConfig.text_color, designConfig.background_color);
        if (textBgContrast < 4.5) {
            // Auto-fix: If background is dark, make text light; if light, make text dark
            const bgLuminance = parseInt(designConfig.background_color.slice(1), 16);
            const isDarkBg = bgLuminance < 0x888888;
            designConfig.text_color = isDarkBg ? '#ffffff' : '#000000';
            console.log(`Auto-corrected text_color for contrast. Original contrast: ${textBgContrast.toFixed(2)}`);
        }

        // Check and fix secondary_color vs background_color contrast
        const secondaryBgContrast = getContrastRatio(designConfig.secondary_color, designConfig.background_color);
        if (secondaryBgContrast < 3.0) {
            // Auto-fix secondary color
            const bgLuminance = parseInt(designConfig.background_color.slice(1), 16);
            const isDarkBg = bgLuminance < 0x888888;
            // Keep the hue but adjust lightness
            designConfig.secondary_color = isDarkBg ? designConfig.accent_color : designConfig.primary_color;
            console.log(`Auto-corrected secondary_color for contrast. Original contrast: ${secondaryBgContrast.toFixed(2)}`);
        }

        // Check and fix primary_color vs background_color contrast (for Save button visibility)
        const primaryBgContrast = getContrastRatio(designConfig.primary_color, designConfig.background_color);
        if (primaryBgContrast < 3.0) {
            // Auto-fix: Make primary color contrast with background
            const bgLuminance = parseInt(designConfig.background_color.slice(1), 16);
            const isDarkBg = bgLuminance < 0x888888;
            // If background is light, make primary dark; if dark, keep it dark or use accent
            designConfig.primary_color = isDarkBg ? designConfig.accent_color : '#1e293b';
            console.log(`Auto-corrected primary_color for contrast. Original contrast: ${primaryBgContrast.toFixed(2)}`);
        }

        res.json({ design_config: designConfig });

    } catch (err) {
        console.error('POST /design/generate - Error:', err);
        res.status(500).json({ message: 'Failed to generate design', error: err.message });
    }
});

// POST /design/save - Save AI-generated design to user profile
router.post('/design/save', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        const { design_config } = req.body;

        if (!design_config) {
            return res.status(400).json({ message: 'design_config is required' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { design_config },
            { new: true }
        ).select('-password_hash -biometric_key');

        res.json({
            message: 'Design saved successfully',
            design_config: updatedUser.design_config
        });

    } catch (err) {
        console.error('POST /design/save - Error:', err);
        res.status(500).json({ message: 'Failed to save design' });
    }
});

// POST /design/reset - Reset design to default
router.post('/design/reset', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        const defaultDesign = {
            primary_color: '#1e293b',
            secondary_color: '#f59e0b',
            accent_color: '#3b82f6',
            text_color: '#0f172a',
            background_color: '#ffffff',
            layout_style: 'centered',
            font_family: 'modern',
            heading_size: 'medium',
            spacing: 'normal',
            show_decorations: true,
            card_shape: 'rounded'
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { design_config: defaultDesign },
            { new: true }
        ).select('-password_hash -biometric_key');

        res.json({
            message: 'Design reset to default',
            design_config: updatedUser.design_config
        });

    } catch (err) {
        console.error('POST /design/reset - Error:', err);
        res.status(500).json({ message: 'Failed to reset design' });
    }
});

module.exports = router;
