const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');
const rateLimit = require('express-rate-limit');

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

// Generate text with AI
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const result = await aiService.generateText(prompt, options);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          text: result.text,
          usage: result.usage
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate text',
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI generate endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get service recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { serviceType, location, userPreferences = {} } = req.body;
    
    if (!serviceType || !location) {
      return res.status(400).json({
        success: false,
        message: 'Service type and location are required'
      });
    }

    const result = await aiService.generateServiceRecommendation(serviceType, location, userPreferences);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          recommendations: result.text,
          serviceType,
          location
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI recommendations endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate service description
router.post('/service-description', async (req, res) => {
  try {
    const { serviceName, category, features = [] } = req.body;
    
    if (!serviceName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Service name and category are required'
      });
    }

    const result = await aiService.generateServiceDescription(serviceName, category, features);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          description: result.text,
          serviceName,
          category
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate service description',
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI service description endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Chat with AI
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await aiService.chatWithAI(message, conversationHistory);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          response: result.text
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process chat message',
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Check AI service status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      initialized: aiService.isInitialized(),
      service: 'Google AI (Gemini Pro)'
    }
  });
});

module.exports = router;
