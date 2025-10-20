require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your .env file');
  process.exit(1);
}

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  server: {
    port: process.env.PORT || 5000,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  }
};