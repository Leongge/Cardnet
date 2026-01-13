const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const TEST_SLUG = "leongge";
const LOG_FILE = 'verify_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function testVCardFlow() {
    fs.writeFileSync(LOG_FILE, ''); // Clear log
    log('--- STARTING VCARD TEST ---');

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cardnet');
        log('Mongo Connected');

        // Find the admin user
        const user = await User.findOne({ email: 'admin@cardnet.com' });
        if (!user) {
            log('FATAL: Admin user not found in DB');
            process.exit(1);
        }

        const REAL_ID = user._id.toString();
        log('FOUND REAL ID: ' + REAL_ID);
        mongoose.disconnect();

        // 1. Attempt Update
        log(`1. Updating profile for ID: ${REAL_ID} with slug: ${TEST_SLUG}...`);
        const updateRes = await axios.put('http://localhost:5000/api/vcard/profile', {
            userId: REAL_ID,
            name: "Leong Ge", // Matching user request name
            vcard_slug: TEST_SLUG,
            bio: "Verified System Update",
            position: "System Admin"
        });
        log('   Update Status: ' + updateRes.status);
        log('   Update Data: ' + (updateRes.data ? 'Success' : 'Null'));

        // 2. Attempt Retreival
        log(`2. Fetching public VCard for slug: ${TEST_SLUG}...`);
        const getRes = await axios.get(`http://localhost:5000/api/vcard/${TEST_SLUG}`);
        log('   Fetch Status: ' + getRes.status);
        log('   Fetch Name: ' + getRes.data.name);

        // 3. Output the ID for the Agent to see clearly
        log('--- SUCCESS_ID:' + REAL_ID + ' ---');

    } catch (e) {
        log('   ERROR: ' + (e.response ? JSON.stringify(e.response.data) : e.message));
        if (e.stack) log(e.stack);
    }
}

testVCardFlow();
