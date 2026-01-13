const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    corporate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation' },
    visibility: {
        type: String,
        enum: ['Private', 'Shared'],
        default: 'Private'
    },
    data: {
        name: { type: String },
        position: { type: String },
        email: { type: String },
        phone: { type: String },
        company_name: { type: String },
        company_address: { type: String },
        category: { type: String },
        company_background: { type: String },
    },
    source: {
        type: String,
        enum: ['Scan', 'Manual', 'vCard'],
        default: 'Manual'
    },
    pdpa_consent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
