# Tính năng tìm thợ theo bán kính (Radius-based Worker Search)

## Tổng quan
Đã thêm tính năng tìm kiếm thợ theo bán kính khu vực cho phép người dùng tìm thợ trong phạm vi khoảng cách nhất định từ vị trí của họ.

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### Models Update
- **User Model**: Thêm trường `location` với tọa độ GeoJSON
- **Service Model**: Thêm trường `location.coordinates` với tọa độ GeoJSON và index 2dsphere

#### New Files
- `server/src/utils/geocoding.js`: Utility để chuyển đổi địa chỉ thành tọa độ

#### Controller Updates
- **serviceController.js**: 
  - Cập nhật `getServices()` để hỗ trợ tìm kiếm theo bán kính
  - Cập nhật `createService()` để lưu tọa độ khi tạo dịch vụ

### 2. Frontend Changes

#### Home Component Updates
- Thêm state cho radius search: `radius`, `userLocation`, `useLocation`
- Thêm function `getUserLocation()` để lấy vị trí người dùng
- Cập nhật `fetchServices()` để gửi tham số location và radius
- Thêm UI components:
  - Button "Dùng vị trí" để bật/tắt định vị
  - Dropdown chọn bán kính (1km, 3km, 5km, 10km, 20km)

## Cách sử dụng

### 1. Bật tính năng định vị
- Người dùng nhấn vào nút "Dùng vị trí" 
- Browser sẽ yêu cầu quyền truy cập vị trí
- Nếu thành công, button sẽ chuyển thành màu xanh "Đã định vị"

### 2. Chọn bán kính
- Sau khi định vị thành công, dropdown bán kính sẽ hiện ra
- Người dùng chọn bán kính mong muốn (1-20km)

### 3. Tìm kiếm
- Hệ thống sẽ tự động tìm kiếm thợ trong bán kính đã chọn
- Kết quả sẽ được sắp xếp theo khoảng cách gần nhất

## API Endpoint

### GET /api/services
Hỗ trợ các tham số mới:
- `lat`: Vĩ độ của người dùng
- `lng`: Kinh độ của người dùng  
- `radius`: Bán kính tìm kiếm (km)

Ví dụ:
```
GET /api/services?category=Điện nước&lat=10.7769&lng=106.7009&radius=5
```

## Database Schema

### Service Location Field
```javascript
location: {
  address: String,
  city: String,
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
}
```

## Geocoding
Hiện tại sử dụng hardcoded coordinates cho các quận ở TP.HCM:
- Quận 1: [10.7769, 106.7009]
- Quận 2: [10.7851, 106.7356]
- Quận 3: [10.7825, 106.6822]
- ... và các quận khác

**Lưu ý**: Trong production, nên sử dụng geocoding service như Google Maps API hoặc OpenStreetMap Nominatim.

## Testing
1. Khởi động server: `cd server && npm start`
2. Khởi động client: `cd client && npm run dev`
3. Mở http://localhost:5173
4. Nhấn nút "Dùng vị trí" và cho phép định vị
5. Chọn bán kính và tìm kiếm

## Lợi ích
- Người dùng tìm được thợ gần nhất
- Tiết kiệm thời gian di chuyển
- Tăng tỷ lệ thành công của việc đặt dịch vụ
- Cải thiện trải nghiệm người dùng

## Hướng phát triển
- Tích hợp geocoding API thực tế
- Thêm bộ lọc nâng cao (rating, giá, availability)
- Hiển thị khoảng cách trên service cards
- Thêm map view để visualize kết quả
