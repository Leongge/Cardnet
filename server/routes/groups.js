const express = require('express');
const router = express.Router();
const CorporateGroup = require('../models/CorporateGroup');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

// Middleware to verify Corporate Admin role
const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'CorporateAdmin') {
            return res.status(403).json({ msg: 'Access denied. Corporate Admins only.' });
        }
        req.user.corporate_id = user.corporate_id;
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @route   GET /api/groups
// @desc    Get all groups for the user's corporation
// @access  Private (Any corporate member can see groups, or restrict to Admin?)
//          Let's allow all members to see groups so they can know existence, 
//          but likely only Admins manage them. 
//          For 'Sharing' context, regular users might need to see groups to share to them.
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.corporate_id) {
            return res.status(400).json({ msg: 'Not part of a corporation' });
        }

        const groups = await CorporateGroup.find({ corporate_id: user.corporate_id })
            .populate('members', 'name email profile_picture');

        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @route   POST /api/groups
// @desc    Create a new group
// @access  Corporate Member (Any member can create a group)
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.corporate_id) {
            return res.status(403).json({ msg: 'Not part of a corporation' });
        }
        // Set corporate_id for use below
        req.user.corporate_id = user.corporate_id;
        const { name, members } = req.body;

        const newGroup = new CorporateGroup({
            corporate_id: req.user.corporate_id,
            name,
            members: members || [] // Array of User IDs
        });

        const group = await newGroup.save();

        // Populate members for return
        const populatedGroup = await CorporateGroup.findById(group._id).populate('members', 'name email');

        res.json(populatedGroup);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Group name already exists' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group (name or members)
// @access  Corporate Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, members } = req.body;

        const group = await CorporateGroup.findOne({
            _id: req.params.id,
            corporate_id: req.user.corporate_id
        });

        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (name) group.name = name;
        if (members) group.members = members;

        await group.save();

        const populatedGroup = await CorporateGroup.findById(group._id).populate('members', 'name email');
        res.json(populatedGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Corporate Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const group = await CorporateGroup.findOne({
            _id: req.params.id,
            corporate_id: req.user.corporate_id
        });

        if (!group) return res.status(404).json({ msg: 'Group not found' });

        await group.deleteOne();
        res.json({ msg: 'Group removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
