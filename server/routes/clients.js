const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const CorporateGroup = require('../models/CorporateGroup');
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
            // Find which groups the current user is in
            // Note: Admins see all? Alternatively, stick to group logic.
            // Let's allow CorporateAdmin to see ALL shared clients regardless of group
            // for oversight. But for Members, enforce group check.

            if (currentUser.role === 'CorporateAdmin') {
                query = {
                    corporate_id: currentUser.corporate_id,
                    visibility: 'Shared'
                };
            } else {
                const userGroups = await CorporateGroup.find({
                    corporate_id: currentUser.corporate_id,
                    members: req.user.id
                }).distinct('_id');

                query = {
                    corporate_id: currentUser.corporate_id,
                    visibility: 'Shared',
                    $or: [
                        { shared_groups: { $size: 0 } }, // Shared with everyone (empty array)
                        { shared_groups: { $exists: false } }, // Backward compatibility
                        { shared_groups: { $in: userGroups } } // Shared with specific group user is in
                    ]
                };
            }
        } else {
            // Personal
            query = { owner_id: req.user.id };
        }

        const clients = await Client.find(query)
            .populate('shared_groups', 'name')
            .sort({ created_at: -1 });
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
        const { clientIds, groupIds } = req.body;

        // Fetch user to ensure they are part of a corporation
        const userStore = require('../models/User');
        const currentUser = await userStore.findById(req.user.id);

        if (!currentUser.corporate_id) {
            return res.status(400).json({ msg: 'You do not belong to a corporation.' });
        }

        // Prepare update object
        const updateData = {
            visibility: 'Shared',
            corporate_id: currentUser.corporate_id
        };

        // If groupIds provided (even empty array to reset to "Everyone"), update it
        // If undefined, maybe keep existing? No, "Share" usually implies setting new state.
        // Let's assume if groupIds is passed, we use it. If not passed, we default to empty (Everyone)?
        // Or if the user selects "Public to Corp", groupIds = [].
        // If user selects "Group A", groupIds = [id].

        if (groupIds) {
            updateData.shared_groups = groupIds;
        } else {
            // If groupIds not provided, default to [] (Everyone) ONLY IF it's a fresh share?
            // But what if they just want to move to shared?
            // We'll set it to [] to be safe if not provided, ensuring "Shared" means "Shared with Corp" by default.
            updateData.shared_groups = [];
        }

        // Update clients
        await Client.updateMany(
            { _id: { $in: clientIds }, owner_id: req.user.id },
            { $set: updateData }
        );

        res.json({ msg: 'Clients shared to corporate pool' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
