const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection failed:', err));

// Business card data model
const BusinessCardSchema = new mongoose.Schema({
  name: String,
  position: String,
  email: String,
  phone: String,
  companyName: String,
  companyAddress: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const BusinessCard = mongoose.model('BusinessCard', BusinessCardSchema);

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API route: Upload and recognize business cards
app.post('/api/scan-cards', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Use OpenAI Vision API to recognize text in the image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify all business card information in this image. Extract the following from each card: name, position, email, phone number, company name, company address. Return as a JSON array where each business card is an object. If a field cannot be found, set it to an empty string."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const aiResponse = visionResponse.choices[0].message.content;
    
    // Try to parse JSON response
    let cards = [];
    try {
      // Extract JSON part (may be contained in markdown code block)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        cards = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('AI response:', aiResponse);
      
      // If parsing fails, return empty array
      cards = [];
    }

    // Ensure cards is an array
    if (!Array.isArray(cards)) {
      cards = [cards];
    }

    // Clean and standardize data
    cards = cards.map(card => ({
      name: card.name || card.姓名 || '',
      position: card.position || card.职位 || '',
      email: card.email || card.电子邮件 || card.邮箱 || '',
      phone: card.phone || card.电话号码 || card.电话 || '',
      companyName: card.companyName || card.公司名称 || card.公司 || '',
      companyAddress: card.companyAddress || card.公司地址 || card.地址 || '',
      category: card.category || card.类别 || ''
    }));

    res.json({
      success: true,
      cards: cards,
      count: cards.length,
      rawResponse: aiResponse
    });

  } catch (error) {
    console.error('Scanning error:', error);
    res.status(500).json({ 
      error: 'Business card recognition failed', 
      details: error.message 
    });
  }
});

// API route: Save business card information
app.post('/api/cards', async (req, res) => {
  try {
    const cards = req.body.cards;
    
    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const savedCards = await BusinessCard.insertMany(cards);
    res.json({ 
      success: true, 
      message: `Successfully saved ${savedCards.length} business card(s)`,
      cards: savedCards
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Save failed', details: error.message });
  }
});

// API route: Get all business cards
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await BusinessCard.find().sort({ createdAt: -1 });
    res.json({ success: true, cards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// API route: Update business card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const updatedCard = await BusinessCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, card: updatedCard });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// API route: Delete business card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    await BusinessCard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});