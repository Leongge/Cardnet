const express = require('express');
const router = express.Router();

// Mock Email Send
router.post('/send', (req, res) => {
    const { clientIds, subject, body } = req.body;

    console.log('--- MOCK EMAIL CAMPAIGN ---');
    console.log(`Sending to ${clientIds ? clientIds.length : 0} clients`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Snippet: ${body.substring(0, 50)}...`);
    console.log('---------------------------');

    res.json({ msg: 'Emails queued successfully (Mock)' });
});

module.exports = router;
