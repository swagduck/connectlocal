import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds timeout for AI requests
    });
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.client.post('/ai/generate', {
        prompt,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error.response?.data || { message: 'Failed to generate text' };
    }
  }

  async getServiceRecommendations(serviceType, location, userPreferences = {}) {
    try {
      const response = await this.client.post('/ai/recommendations', {
        serviceType,
        location,
        userPreferences
      });
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error.response?.data || { message: 'Failed to get recommendations' };
    }
  }

  async generateServiceDescription(serviceName, category, features = []) {
    try {
      const response = await this.client.post('/ai/service-description', {
        serviceName,
        category,
        features
      });
      return response.data;
    } catch (error) {
      console.error('Error generating service description:', error);
      throw error.response?.data || { message: 'Failed to generate service description' };
    }
  }

  async chatWithAI(message, conversationHistory = []) {
    try {
      const response = await this.client.post('/ai/chat', {
        message,
        conversationHistory
      });
      return response.data;
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw error.response?.data || { message: 'Failed to process chat message' };
    }
  }

  async getAIStatus() {
    try {
      const response = await this.client.get('/ai/status');
      return response.data;
    } catch (error) {
      console.error('Error checking AI status:', error);
      throw error.response?.data || { message: 'Failed to check AI status' };
    }
  }
}

export default new AIService();
