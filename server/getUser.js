require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({});
        if (user) {
            console.log('VALID_USER_ID:' + user._id.toString());
        } else {
            console.log('NO_USERS_FOUND');
        }
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
