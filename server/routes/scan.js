const express = require('express');
const router = express.Router();
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in .env
});

// Real AI Scan Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        if (!process.env.OPENAI_API_KEY) {
            console.warn("Missing OPENAI_API_KEY, falling back to mock data for demo purposes if desired, or erroring.");
            // return res.status(500).json({ msg: 'Server Configuration Error: Missing OpenAI Key' });
        }

        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Business Card OCR AI. 
          Analyze the provided image. It may contain one or multiple business cards.
          Extract the following details for EACH card found and use these EXACT field names:
          - name: Full name of the person
          - position: Job title or position
          - email: Email address
          - phone: Phone number (Format as +60... if Malaysian, or standard international)
          - company: Company name
          - address: Company address
          - category: Infer from company/title (e.g. Tech, Finance, Retail, Real Estate, Consulting, Other)
          - companyBackground: Based on your knowledge of the company, provide a DETAILED background (3-5 sentences) covering:
            * Industry position and market presence
            * Main products/services or business focus
            * Notable achievements, reputation, or key facts
            * Geographic reach or target market
            If the company is not well-known, infer details from the business card context and provide educated insights about typical companies in that industry/category.
          
          Return ONLY a valid JSON array of objects with these exact field names. Do not include markdown formatting like \`\`\`json.
          Example: [{"name": "John Doe", "position": "CEO", "email": "john@example.com", "phone": "+60123456789", "company": "Tech Corp", "address": "123 Main St", "category": "Tech", "companyBackground": "Tech Corp is a leading enterprise software company specializing in cloud-based solutions for Fortune 500 companies. Founded in 2010, they have grown to serve over 5,000 clients globally with their innovative SaaS platforms. The company is known for their cutting-edge AI integration and has received multiple industry awards for innovation. They operate in 25 countries with headquarters in Silicon Valley and regional offices across Asia-Pacific."}]`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract business cards from this image." },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const content = completion.choices[0].message.content;

        // Clean up if markdown is present (just in case)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(cleanContent);

        // Ensure it's an array
        const results = Array.isArray(parsedData) ? parsedData : [parsedData];

        res.json(results);

    } catch (err) {
        console.error("AI Scan Error:", err);
        res.status(500).json({ msg: 'AI Processing Failed', error: err.message });
    }
});

module.exports = router;
