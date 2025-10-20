# 📇 Business Card Scanner

A full-stack web application that automatically extracts information from business card photos using AI-powered OCR technology.

## 🌟 Features

- 📸 **Smart Card Recognition**: Upload business card photos and automatically extract contact information
- 🤖 **AI-Powered**: Uses OpenAI GPT-4o Vision API for accurate text recognition
- ✏️ **Editable Forms**: Review and edit extracted information before saving
- 💾 **Database Storage**: Store all business cards in MongoDB
- 🔍 **Search & Filter**: Quickly find cards by name, company, or position
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌐 **Multi-language Support**: Recognizes business cards in multiple languages

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - File upload handling
- **OpenAI API** - Vision AI for OCR
- **Mongoose** - MongoDB ODM

### Database
- **MongoDB** - NoSQL database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - Choose one:
  - Local installation: [Download here](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **OpenAI API Key** - [Get your API key](https://platform.openai.com/api-keys)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd business-card-scanner
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create uploads folder for storing images
mkdir uploads
```

### 3. Environment Variables Configuration

Create a `.env` file in the `backend` folder:

```bash
cd backend
touch .env  # On Windows: type nul > .env
```

Add the following environment variables to the `.env` file:

```env
# MongoDB Connection String
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/business-cards

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/business-cards

# OpenAI API Key
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Server Port (optional, defaults to 5000)
PORT=5000
```

#### 🔑 How to Get Your API Keys:

**MongoDB Atlas (Cloud Database):**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<username>` and `<password>` with your credentials
7. Replace `<cluster>` with your cluster name

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (⚠️ save it immediately, you can't see it again!)
6. Add credits to your account ($5-10 is sufficient for testing)

### 4. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend folder from project root
cd frontend

# Install dependencies
npm install
```

### 5. Start the Application

You need to run both backend and frontend simultaneously.

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will automatically open in your browser at `http://localhost:3000`

## 📖 Usage

### Scanning Business Cards

1. **Upload Photo**: Click "📸 Choose Business Card Photo" button
2. **Select Image**: Choose a photo containing one or more business cards
3. **Start Scanning**: Click "🔍 Start Scanning" button
4. **Review Information**: The system will automatically extract and display the information
5. **Edit if Needed**: Modify any fields that need correction
6. **Save**: Click "💾 Save All Cards" to store in database

### Viewing Saved Cards

1. Click "📋 View Cards" tab at the top
2. Browse all saved business cards
3. Use the search box to filter by name, company, or position
4. Click the 🗑️ icon to delete a card

## 📁 Project Structure

```
business-card-scanner/
├── backend/
│   ├── node_modules/
│   ├── uploads/              # Uploaded images storage
│   ├── server.js             # Main server file
│   ├── package.json
│   ├── .env                  # Environment variables (create this)
│   └── .gitignore
│
└── frontend/
    ├── node_modules/
    ├── public/
    ├── src/
    │   ├── App.js           # Main component
    │   ├── App.css          # Main styles
    │   ├── CardList.js      # Card list component
    │   ├── CardList.css     # Card list styles
    │   └── index.js
    ├── package.json
    └── .gitignore
```

## 🔒 Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` files** to version control
2. **Keep API keys secret** - don't share them publicly
3. **Add `.env` to `.gitignore`**:
   ```
   # .gitignore
   .env
   node_modules/
   uploads/*
   !uploads/.gitkeep
   ```
4. **Use environment-specific configurations** for development and production

##  Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoDB connection failed`

**Solutions:**
- Ensure MongoDB service is running (if using local installation)
- Check your connection string in `.env`
- For MongoDB Atlas: Verify your IP address is whitelisted
- Check username and password are correct

### OpenAI API Error

**Error:** `Business card recognition failed`

**Solutions:**
- Verify your API key is correct in `.env`
- Check you have sufficient credits in your OpenAI account
- Ensure the image is clear and readable
- Try with a smaller image file
