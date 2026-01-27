# ConnectLocal - Nền tảng kết nối dịch vụ địa phương Real-time tích hợp AI

![ConnectLocal Logo](icon/ServiceConnect.svg)

ConnectLocal là nền tảng kết nối dịch vụ địa phương thời gian thực với tích hợp AI thông minh, giúp người dùng dễ dàng tìm kiếm, kết nối và sử dụng các dịch vụ trong khu vực của họ.

## 🌟 Tính năng nổi bật

- 🗺️ **Bản đồ thông minh**: Tìm kiếm dịch vụ theo vị trí real-time với Google Maps integration
- 🤖 **AI Assistant**: Tích hợp Google Gemini Pro để tư vấn dịch vụ và chat thông minh
- 💬 **Real-time Chat**: Hệ thống nhắn tin tức thì giữa người dùng và nhà cung cấp dịch vụ
- 👥 **Quản lý bạn bè**: Kết nối và quản lý mạng lưới quan hệ
- 💰 **Ví điện tử**: Hệ thống thanh toán an toàn và tiện lợi
- 📊 **Dashboard**: Giao diện quản lý chuyên nghiệp cho admin
- 📱 **Responsive Design**: Tương thích hoàn hảo trên mọi thiết bị

## 🛠 Tech Stack

### Backend
- **Node.js** & **Express.js** - Framework chính
- **MongoDB** - Database
- **Socket.IO** - Real-time communication
- **Redis** - Caching và session management
- **JWT** - Authentication
- **Google Gemini Pro AI** - AI integration
- **Cloudinary** - Image storage

### Frontend
- **React** & **React Router** - Frontend framework
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **Leaflet** & **Google Maps** - Maps integration
- **Socket.IO Client** - Real-time client

### DevOps & Tools
- **Docker** - Containerization
- **Jest** - Testing
- **Morgan** - Logging
- **Helmet** - Security
- **Rate Limiting** - API protection

## 📸 Screenshots

### 🗺️ Bản đồ tìm kiếm dịch vụ
![Map Feature](icon/davinci_image_1768020101820.png)

### 🤖 AI Chat Assistant
*(AI Chat interface for personalized service recommendations)*

### 📊 Admin Dashboard
*(Comprehensive dashboard for service management)*

## 🚀 Quick Start

### Yêu cầu
- Node.js 16+
- MongoDB
- Redis (optional)

### Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd my-service-app
```

2. **Cài đặt Server**
```bash
cd server
npm install
```

3. **Cài đặt Client**
```bash
cd client
npm install
```

4. **Cấu hình Environment**
```bash
# Server
cd server
cp .env.example .env
# Chỉnh sửa .env với MongoDB URI, JWT secret, Google API keys

# Client
cd client
cp .env.example .env
# Chỉnh sửa .env với API URL
```

5. **Khởi động ứng dụng**
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm run dev
```

### Truy cập ứng dụng
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/api-docs

## 📁 Cấu trúc dự án

```
my-service-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API services
│   └── public/
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── services/      # Business logic
│   └── uploads/           # File uploads
├── mobile-app/            # React Native app
└── icon/                  # Assets & icons
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token

### Services
- `GET /api/services` - Lấy danh sách dịch vụ
- `POST /api/services` - Tạo dịch vụ mới
- `GET /api/services/:id` - Chi tiết dịch vụ

### AI Features
- `POST /api/ai/chat` - Chat với AI assistant
- `POST /api/ai/recommendations` - Lấy gợi ý dịch vụ
- `POST /api/ai/generate-description` - Tạo mô tả dịch vụ

### Real-time
- Socket.IO events cho chat, notifications, và updates

## 🤝 Contributing

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

##  Team

- **Developer**: [Your Name]
- **Project**: ConnectLocal - Final Year Project

## 📞 Contact

- **Email**: [your.email@example.com]
- **GitHub**: [Your GitHub Profile]

---

⭐ Nếu bạn thích dự án này, hãy cho chúng tôi một star!