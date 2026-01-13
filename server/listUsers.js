const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Slug: ${u.vcard_slug}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
