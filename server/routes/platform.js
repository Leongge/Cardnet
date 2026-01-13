const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Corporation = require('../models/Corporation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware: Platform Auth (Super Admin)
const platformAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;

        const user = await User.findById(req.user.id);
        if (user.role !== 'Admin') { // 'Admin' is Super Admin in schema default? No, schema says 'Admin' is enum.
            // enum: ['Admin', 'CorporateAdmin', 'CorporateMember']
            // So 'Admin' = Super Admin
            return res.status(403).json({ msg: 'Access Denied: Super Admin Only' });
        }
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Create Corporation & Corporate Admin
router.post('/create-corporation', platformAuth, async (req, res) => {
    try {
        const { companyName, adminName, adminEmail, adminPassword, maxLicenses } = req.body;

        // Check user existence
        let user = await User.findOne({ email: adminEmail });
        if (user) return res.status(400).json({ msg: 'User email already exists' });

        // Create Corporation
        const corporation = new Corporation({
            name: companyName,
            max_licenses: maxLicenses || 5, // Default 5
            subscription_tier: 'Standard'
        });
        await corporation.save();

        // Create Corporate Admin
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(adminPassword, salt);

        user = new User({
            name: adminName,
            email: adminEmail,
            password_hash,
            role: 'CorporateAdmin',
            corporate_id: corporation._id,
            vcard_slug: adminName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
        });
        await user.save();

        res.json({
            msg: 'Corporation and Admin created successfully',
            corporation,
            admin: { id: user.id, email: user.email, name: user.name }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// List All Corporations
router.get('/corporations', platformAuth, async (req, res) => {
    try {
        const corporations = await Corporation.find().sort({ created_at: -1 });
        res.json(corporations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
