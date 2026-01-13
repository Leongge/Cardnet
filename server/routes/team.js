const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to verify token and admin role
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'CorporateAdmin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        req.user.corporate_id = user.corporate_id; // Ensure we have the corp id
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Get Team Members
router.get('/', auth, adminAuth, async (req, res) => {
    try {
        const members = await User.find({
            corporate_id: req.user.corporate_id
        }).select('-password_hash'); // Exclude password
        res.json(members);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add Team Member (Register by Admin)
router.post('/register', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, password, position } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password_hash,
            role: 'CorporateMember', // Default role for added members
            corporate_id: req.user.corporate_id,
            vcard_slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
            // In a real app, 'position' would be added to User schema or a separate profile
        });

        await user.save();

        const userObj = user.toObject();
        delete userObj.password_hash;

        res.json(userObj);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
