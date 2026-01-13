const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

// Manually verify .env path if needed, but we will run this from inside 'server' directory
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cardnet';

const seedMember = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'client@cardnet.com';
        const password = 'client';

        let user = await User.findOne({ email });
        if (user) {
            console.log('Client User already exists');
            // If exists, just update password to be sure? 
            // Nah, just tell user it exists.
        } else {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            user = new User({
                name: 'Test Client User',
                email,
                password_hash,
                role: 'CorporateMember',
                vcard_slug: 'client-test-' + Date.now(),
                company_name: 'Test Corp',
                position: 'Member'
            });

            await user.save();
            console.log(`Client User Created!`);
        }

        console.log(`\n=== CREDENTIALS ===`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`===================\n`);

        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedMember();
