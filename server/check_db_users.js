const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const admin = await User.findOne({ email: 'admin@cardnet.com' });
        const allUsers = await User.find({}, 'email role');

        console.log('--- REPORT START ---');
        console.log(`Total Users: ${allUsers.length}`);

        if (admin) {
            console.log('ADMIN_EXISTS: YES');
            console.log(`Admin Role: ${admin.role}`);
        } else {
            console.log('ADMIN_EXISTS: NO');
        }

        console.log('All User Emails:');
        allUsers.forEach(u => console.log(`- ${u.email} (${u.role})`));
        console.log('--- REPORT END ---');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
