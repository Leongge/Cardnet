const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');

// Middleware to verify token (Simplified inline for now)
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

// Get Clients
// Query Params: scope=private (default) or corporate
router.get('/', auth, async (req, res) => {
    try {
        const { scope } = req.query;
        // Fetch the user from DB to get fresh Corporate ID
        const userStore = require('../models/User'); // Import User model
        const currentUser = await userStore.findById(req.user.id);

        let query = {};
        if (scope === 'corporate' && currentUser.corporate_id) {
            query = {
                corporate_id: currentUser.corporate_id,
                visibility: 'Shared'
            };
        } else {
            // Personal
            query = { owner_id: req.user.id };
        }

        const clients = await Client.find(query).sort({ created_at: -1 });
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add Client
router.post('/', auth, async (req, res) => {
    try {
        const { name, position, email, phone, company, address, category, companyBackground, visibility, source } = req.body;

        // Fetch user to get corporate_id
        const userStore = require('../models/User');
        const currentUser = await userStore.findById(req.user.id);

        const newClient = new Client({
            owner_id: req.user.id,
            corporate_id: currentUser.corporate_id,
            visibility: visibility || 'Private',
            data: {
                name,
                position,
                email,
                phone,
                company_name: company,
                company_address: address,
                category,
                company_background: companyBackground
            },
            source: source || 'Manual'
        });

        const client = await newClient.save();
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete Clients (Bulk) / Unshare
router.delete('/', auth, async (req, res) => {
    try {
        const { clientIds, scope } = req.body;

        if (scope === 'corporate') {
            // Unshare: Set visibility to Private
            await Client.updateMany(
                { _id: { $in: clientIds }, owner_id: req.user.id },
                { $set: { visibility: 'Private' } }
            );
            return res.json({ msg: 'Clients removed from corporate pool (Unshared)' });
        } else {
            // Permanent Delete (Private Scope)
            await Client.deleteMany({
                _id: { $in: clientIds },
                owner_id: req.user.id
            });
            return res.json({ msg: 'Clients permanently deleted' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Bulk Share to Corporate
router.put('/share', auth, async (req, res) => {
    try {
        const { clientIds } = req.body;

        // Fetch user to ensure they are part of a corporation
        const userStore = require('../models/User');
        const currentUser = await userStore.findById(req.user.id);

        if (!currentUser.corporate_id) {
            return res.status(400).json({ msg: 'You do not belong to a corporation.' });
        }

        // Update clients
        await Client.updateMany(
            { _id: { $in: clientIds }, owner_id: req.user.id },
            { $set: { visibility: 'Shared', corporate_id: currentUser.corporate_id } }
        );

        res.json({ msg: 'Clients shared to corporate pool' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Connect via vCard Slug
router.post('/connect/:slug', auth, async (req, res) => {
    try {
        const { slug } = req.params;
        const User = require('../models/User');

        // 1. Find the vCard owner
        const targetUser = await User.findOne({ vcard_slug: slug });
        if (!targetUser) {
            return res.status(404).json({ msg: 'vCard not found' });
        }

        // 2. Check if connecting to self
        if (targetUser._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot connect to your own vCard' });
        }

        // 3. Check if already connected
        const existingConnection = await Client.findOne({
            owner_id: req.user.id,
            'data.email': targetUser.email
        });

        if (existingConnection) {
            return res.status(400).json({ msg: 'You are already connected to this person' });
        }

        // 4. Create new Client entry for the current user
        const currentUser = await User.findById(req.user.id);

        const newClient = new Client({
            owner_id: req.user.id,
            corporate_id: currentUser.corporate_id,
            visibility: 'Private',
            data: {
                name: targetUser.name,
                position: targetUser.position,
                email: targetUser.email,
                phone: targetUser.phone,
                company_name: targetUser.company_name,
                company_address: targetUser.company_address,
                category: 'vCard Connection'
            },
            source: 'vCard'
        });

        await newClient.save();
        res.json({ msg: `Successfully connected to ${targetUser.name}`, client: newClient });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
