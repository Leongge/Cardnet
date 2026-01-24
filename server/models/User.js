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
    design_config: {
        // Colors
        primary_color: { type: String, default: '#1e293b' },      // slate-900
        secondary_color: { type: String, default: '#f59e0b' },    // amber-500
        accent_color: { type: String, default: '#3b82f6' },       // blue-500
        text_color: { type: String, default: '#0f172a' },         // slate-950
        background_color: { type: String, default: '#ffffff' },   // white

        // Layout
        layout_style: { type: String, default: 'centered' },      // centered, left-aligned, split, minimal

        // Typography
        font_family: { type: String, default: 'modern' },         // modern, classic, playful
        heading_size: { type: String, default: 'medium' },        // small, medium, large

        // Spacing
        spacing: { type: String, default: 'normal' },             // compact, normal, spacious

        // Visual Elements
        show_decorations: { type: Boolean, default: true },
        card_shape: { type: String, default: 'rounded' }          // rounded, sharp, pill
    },
    theme_color: { type: String, default: '#3b82f6' } // Default to blue-500
}, { timestamps: true });

// Create a case-insensitive unique index for vcard_slug
UserSchema.index({ vcard_slug: 1 }, {
    unique: true,
    sparse: true,
    collation: { locale: 'en', strength: 2 } // Case-insensitive
});

module.exports = mongoose.model('User', UserSchema);
