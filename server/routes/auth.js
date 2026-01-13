const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Corporation = require('../models/Corporation');

// Register - DISABLED (Use Platform API for Corp Admin, Team API for Members)
// router.post('/register', async (req, res) => {
//     return res.status(403).json({ msg: 'Public registration is disabled. Contact Super Admin.' });
// });

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Match password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Return JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, corporate_id: user.corporate_id } });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get User by Token
router.get('/user', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.user.id).select('-password_hash');

        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, corporate_id: user.corporate_id });
    } catch (err) {
        console.error('Get user error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
