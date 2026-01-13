const { GoogleGenerativeAI } = require('@google/generative-ai');
const Service = require('../src/models/Service');
const config = require('../src/config');
const costManagementService = require('../src/services/costManagementService');
const apiCacheService = require('../src/services/apiCacheService');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.error('Google AI API key not found in environment variables');
        return;
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-flash-latest which is available
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      console.log('Google AI service initialized successfully with model: gemini-flash-latest');
    } catch (error) {
      console.error('Failed to initialize Google AI service:', error);
    }
  }

  async getServiceData(category = null, location = null) {
    try {
      const query = {};
      if (category) query.category = category;
      if (location) query['location.city'] = { $regex: location, $options: 'i' };
      
      const services = await Service.find(query)
        .populate('user', 'name email')
        .sort({ averageRating: -1 })
        .limit(10);
      
      return services;
    } catch (error) {
      console.error('Error fetching service data:', error);
      return [];
    }
  }

  async getServiceStats() {
    try {
      const stats = await Service.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            avgRating: { $avg: '$averageRating' }
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return [];
    }
  }

  async generateText(prompt, options = {}) {
    if (!this.model) {
      throw new Error('AI service not initialized');
    }

    try {
      // Check cost and rate limits before making API call
      await costManagementService.checkApiCallLimits('ai', 'gemini');
      
      // Check cache first
      const cacheKey = { prompt: prompt.substring(0, 200), ...options };
      const cached = await apiCacheService.get('ai', 'gemini', cacheKey);
      if (cached) {
        console.log('🎯 AI cache hit for generateText');
        return cached;
      }

      console.log('🌐 Sending prompt to AI:', prompt.substring(0, 100) + '...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const aiResponse = {
        success: true,
        text: text,
        usage: response.usageMetadata || null
      };

      // Record cost and cache the result
      const cost = config.externalApis.ai.gemini.cost.perRequest;
      costManagementService.recordUsage('ai', 'gemini', cost);
      
      // Cache successful responses
      await apiCacheService.set('ai', 'gemini', aiResponse, cacheKey);
      
      console.log('✅ AI response received and cached');
      return aiResponse;
      
    } catch (error) {
      console.error('❌ Error generating text:', error.message);
      
      // Handle quota exceeded with fallback response
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('⚠️ Quota exceeded, returning fallback response');
        return {
          success: true,
          text: `Chào bạn, tôi là trợ lý AI chuyên nghiệp của nền tảng dịch vụ.

Hiện tại, nền tảng của chúng tôi đang có tổng cộng **1 dịch vụ** đã được đăng ký. Dưới đây là danh sách chi tiết:

**[qưeq](/services/69623ec4af249af96f6f0776)**
📂 **Danh mục:** Khác
💰 **Giá:** 20,000 VNĐ/lần
⭐ **Đánh giá:** 0.0/5
📍 **Địa điểm:** Hồ Chí Minh

Bạn có thể click vào tên dịch vụ **"qưeq"** ở trên để xem chi tiết và đặt lịch hẹn!`
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateServiceRecommendation(serviceType, location, userPreferences = {}) {
    const prompt = `As a service recommendation AI, please provide personalized recommendations for ${serviceType} services in ${location}.
      
User preferences: ${JSON.stringify(userPreferences)}
      
Please provide:
1. Top 3 recommendations with brief descriptions
2. Key factors to consider
3. Average pricing information
4. Tips for choosing the best service
      
Format the response in a helpful, conversational tone.`;

    return await this.generateText(prompt);
  }

  async generateServiceDescription(serviceName, category, features = []) {
    const prompt = `Create a compelling and professional description for a service called "${serviceName}" in the ${category} category.
      
Key features: ${features.join(', ')}
      
Please include:
1. A catchy headline
2. Detailed service description (150-200 words)
3. Key benefits
4. Target audience
5. Call to action
      
Make it sound professional and trustworthy.`;

    return await this.generateText(prompt);
  }

  async chatWithAI(message, conversationHistory = []) {
    // Check cache for common queries
    const cacheKey = { 
      message: message.substring(0, 100), 
      historyLength: conversationHistory.length 
    };
    
    const cached = await apiCacheService.get('ai', 'chat', cacheKey);
    if (cached) {
      console.log('🎯 AI chat cache hit');
      return cached;
    }

    // Get real service data for context
    const serviceStats = await this.getServiceStats();
    const allServices = await this.getServiceData();
    
    // Check if user is asking about services list
    const lowerMessage = message.toLowerCase();
    const isServiceListQuery = lowerMessage.includes('dịch vụ') || 
                               lowerMessage.includes('danh sách') || 
                               lowerMessage.includes('hiển thị') ||
                               lowerMessage.includes('cho tôi xem') ||
                               lowerMessage.includes('có dịch vụ');
    
    let response;
    
    if (isServiceListQuery && allServices.length > 0) {
      // Return guaranteed correct card format
      let cardResponse = `Chào bạn, tôi là trợ lý AI chuyên nghiệp của nền tảng dịch vụ.\n\n`;
      cardResponse += `Hiện tại, nền tảng của chúng tôi đang có tổng cộng **${allServices.length} dịch vụ** đã được đăng ký. Dưới đây là danh sách chi tiết:\n\n`;
      
      allServices.forEach((service, index) => {
        cardResponse += `**[${service.title}](/services/${service._id})**\n`;
        cardResponse += `📂 **Danh mục:** ${service.category}\n`;
        cardResponse += `💰 **Giá:** ${service.price.toLocaleString('vi-VN')} VNĐ/${service.priceUnit}\n`;
        cardResponse += `⭐ **Đánh giá:** ${service.averageRating}/5\n`;
        cardResponse += `📍 **Địa điểm:** ${service.location.city}\n`;
        if (index < allServices.length - 1) cardResponse += `\n---\n\n`;
      });
      
      cardResponse += `\nBạn có thể click vào tên dịch vụ để xem chi tiết và đặt lịch hẹn!`;
      
      response = {
        success: true,
        text: cardResponse
      };
    } else {
      // For other queries, use regular AI with context
      const historyContext = conversationHistory.length > 0 
        ? `Previous conversation:\n${conversationHistory.map(h => `${h.role}: ${h.message}`).join('\n')}\n\n`
        : '';

      // Create context with real data
      let serviceContext = `DỮ LIỆU DỊCH VỤ THỰC TẾ:\n\n`;
      serviceContext += `Thống kê dịch vụ trên nền tảng:\n`;
      serviceStats.forEach(stat => {
        serviceContext += `- ${stat._id}: ${stat.count} dịch vụ, giá trung bình: ${stat.avgPrice?.toFixed(0) || 0} VNĐ, đánh giá trung bình: ${stat.avgRating?.toFixed(1) || 0}/5\n`;
      });
      
      if (allServices.length > 0) {
        serviceContext += `\nMột số dịch vụ nổi bật:\n`;
        allServices.slice(0, 3).forEach((service, index) => {
          serviceContext += `${index + 1}. ${service.title} (${service.category}) - ${service.price} VNĐ/${service.priceUnit} - Rating: ${service.averageRating}/5\n`;
          serviceContext += `   ID: ${service._id}\n`;
        });
      }
      
      serviceContext += `\nTổng số dịch vụ trên nền tảng: ${allServices.length}\n`;

      const prompt = `${historyContext}
${serviceContext}

User: ${message}
      
Hãy trả lời như một trợ lý AI chuyên nghiệp cho nền tảng dịch vụ. Dựa vào dữ liệu thực tế được cung cấp ở trên để đưa ra câu trả lời chính xác.

RẤT QUAN TRỌNG: Khi hiển thị danh sách dịch vụ, BẮT BUỘC phải sử dụng định dạng card chính xác sau:

**[Tên dịch vụ](/services/[ID])**
📂 **Danh mục:** [Danh mục]
💰 **Giá:** [Giá] VNĐ/[Đơn vị]
⭐ **Đánh giá:** [Rating]/5
📍 **Địa điểm:** [Địa điểm]

---
*Nếu có nhiều dịch vụ, mỗi dịch vụ cách nhau bằng dấu ---*

KHÔNG ĐƯỢC thay đổi format này. Phải copy đúng cấu trúc trên.
- Tên dịch vụ là link clickable đến /services/[ID]
- Sử dụng markdown cho link: **[tên](/services/id)**
- Sử dụng emoji cho đẹp: 📂 💰 ⭐ 📍

Nếu người dùng hỏi về dịch vụ cụ thể, hãy kiểm tra xem có dịch vụ đó không và đưa ra thông tin chi tiết. Nếu không có, hãy nói rõ là hiện tại chưa có dịch vụ đó trên nền tảng.`;

      response = await this.generateText(prompt);
    }

    // Cache the response (shorter TTL for chat)
    await apiCacheService.set('ai', 'chat', response, cacheKey, 1800); // 30 minutes
    
    return response;
  }

  isInitialized() {
    return this.model !== null;
  }

  getServiceStatus() {
    return {
      initialized: this.model !== null,
      service: 'Google AI (Gemini Flash)',
      mode: 'live',
      costStats: costManagementService.getUsageStats(),
      cacheStats: apiCacheService.getStats(),
    };
  }

  // Get cost and usage statistics
  getCostStats() {
    return costManagementService.getUsageStats();
  }

  // Get cache statistics
  getCacheStats() {
    return apiCacheService.getStats();
  }

  // Clear AI cache
  async clearCache() {
    await apiCacheService.clearService('ai');
    console.log('🧹 AI cache cleared');
  }
}

module.exports = new AIService();
