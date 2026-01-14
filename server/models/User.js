const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'CorporateAdmin', 'CorporateMember'],
        default: 'CorporateMember'
    },
    corporate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation' },
    biometric_key: { type: String }, // Placeholder for WebAuthn public key
    vcard_slug: { type: String, unique: true },
    // VCard Profile Fields
    position: { type: String },
    phone: { type: String },
    company_name: { type: String },
    company_address: { type: String },
    company_website: { type: String },
    bio: { type: String },
    profile_picture: { type: String }, // URL to S3 or similar
    background_picture: { type: String }, // URL to background/cover photo
    social_links: {
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String
    },
    theme_color: { type: String, default: '#3b82f6' } // Default to blue-500
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
