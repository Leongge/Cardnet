const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const checkSlugs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email vcard_slug role');
        console.log('\n--- User VCard Slugs ---');
        users.forEach(u => {
            console.log(`User: ${u.name} (${u.email})`);
            console.log(`Slug: ${u.vcard_slug || 'NOT SET'}`);
            console.log(`Role: ${u.role}`);
            console.log('------------------------');
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSlugs();
