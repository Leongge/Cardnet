const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cardnet';

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        const email = 'admin@cardnet.com'; // Default Super Admin Email
        const password = 'admin'; // Default Password

        let user = await User.findOne({ email });
        if (user) {
            console.log('Super Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = new User({
            name: 'Platform Super Admin',
            email,
            password_hash,
            role: 'Admin', // Super Admin
            vcard_slug: 'super-admin-' + Date.now()
        });

        await user.save();
        console.log(`Super Admin Created! Email: ${email}, Password: ${password}`);
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
