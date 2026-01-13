const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'admin@cardnet.com';
        const newPassword = 'admin';

        console.log(`Resetting password for ${email}...`);

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email },
            { $set: { password_hash: password_hash } },
            { new: true }
        );

        if (user) {
            console.log(`SUCCESS: Password for ${email} has been reset to: ${newPassword}`);
        } else {
            console.log(`ERROR: User ${email} not found.`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
