const mongoose = require('mongoose');

const CorporationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subscription_tier: { type: String, default: 'Standard' },
    max_licenses: { type: Number, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Corporation', CorporationSchema);
