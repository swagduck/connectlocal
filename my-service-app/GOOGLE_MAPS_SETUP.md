# Google Maps API Key Setup

## 1. Lấy Google Maps API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Đi đến **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **API Key**
5. Copy API key và bảo mật nó

## 2. Bật các API cần thiết

Trong **APIs & Services** > **Library**, bật các API sau:

- **Maps JavaScript API** - Cho bản đồ tương tác
- **Directions API** - Cho tính năng chỉ đường
- **Geocoding API** - Chuyển đổi địa chỉ thành tọa độ
- **Places API** - Tìm kiếm địa điểm (tùy chọn)

## 3. Cấu hình Environment Variables

### Client-side (React)

Tạo file `.env` trong thư mục `client`:

```bash
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Server-side (Node.js)

Thêm vào file `.env` trong thư mục `server`:

```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 4. Security Best Practices

1. **Restrict API Key**:
   - Trong Google Cloud Console, vào **Credentials** > API Key
   - Thêm **HTTP referrers**: `localhost:5173`, `yourdomain.com`
   - Thêm **IP addresses** (nếu cần)

2. **Environment Variables**:
   - Không bao giờ commit API key vào Git
   - Thêm `.env` vào `.gitignore`
   - Sử dụng different keys cho development và production

## 5. Usage Examples

### Frontend Component

```jsx
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const { isLoaded } = useJsApiLoader({
  id: 'google-map-script',
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
});
```

### Backend Geocoding

```javascript
const { GoogleMaps } = require('@googlemaps/google-maps-services-js');

const client = new GoogleMaps({});

const response = await client.geocode({
  params: {
    address: '123 Main St, New York, NY',
    key: process.env.GOOGLE_MAPS_API_KEY
  }
});
```

## 6. Testing

1. Kiểm tra API key hoạt động:
   - Mở browser developer tools
   - Tìm lỗi "Google Maps API key is invalid"
   - Kiểm tra network requests

2. Test các tính năng:
   - Bản đồ hiển thị
   - Marker hiển thị đúng vị trí
   - Directions API hoạt động
   - Geocoding chính xác

## 7. Monitoring

- Theo dõi usage trong Google Cloud Console
- Set up alerts cho quota limits
- Kiểm tra billing regularly

## 8. Common Issues

### "RefererNotAllowedMapError"
- Thêm domain của bạn vào API key restrictions

### "ApiNotActivatedMapError"
- Bật Maps JavaScript API trong Google Cloud Console

### "OverQuotaMapError"
- Kiểm tra API usage limits
- Nâng cấp billing account nếu cần

## 9. Production Deployment

1. Sử dụng production API key
2. Restrict API key cho production domain
3. Enable billing cho production usage
4. Set up monitoring and alerts

## 10. Cost Management

- Maps JavaScript API: Free tier $200/month
- Directions API: $5 per 1000 requests
- Geocoding API: $5 per 1000 requests
- Set up budget alerts in Google Cloud Console
