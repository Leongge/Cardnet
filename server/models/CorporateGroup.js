const mongoose = require('mongoose');

const CorporateGroupSchema = new mongoose.Schema({
    corporate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Corporation',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Ensure unique group names within a corporation
CorporateGroupSchema.index({ corporate_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CorporateGroup', CorporateGroupSchema);
