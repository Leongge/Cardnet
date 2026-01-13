const jwt = require('jsonwebtoken');
require('dotenv').config();

// This script helps debug JWT token structure
const testToken = process.argv[2];

if (!testToken) {
    console.log('Usage: node debug_jwt.js <token>');
    console.log('Or check localStorage in browser console: localStorage.getItem("token")');
    process.exit(1);
}

try {
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('Decoded JWT:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\nUser ID location:');
    console.log('decoded.id:', decoded.id);
    console.log('decoded.user.id:', decoded.user?.id);
} catch (err) {
    console.error('Error decoding token:', err.message);
}
