# Hướng dẫn sử dụng tính năng kết bạn

## 📍 Vị trí các tính năng

### 1. **Navigation Bar**
- Menu "Bạn bè" (icon 👥) ở thanh navigation chính
- Dẫn đến trang danh sách bạn bè: `/friends`

### 2. **Trang quản lý bạn bè**
- **URL**: `/friends`
- Hiển thị danh sách bạn bè với thông tin chi tiết
- Tìm kiếm bạn bè theo tên/email
- Nút "Nhắn tin" và "Hủy kết bạn" cho mỗi bạn

### 3. **Trang lời mời kết bạn**
- **URL**: `/friends/requests`
- 2 tab: "Lời mời nhận được" và "Lời mời đã gửi"
- Chấp nhận/Từ chối lời mời nhận được
- Hủy lời mời đã gửi

### 4. **FriendButton Component**
- Nút kết bạn thông minh hiển thị theo trạng thái:
  - "Kết bạn" - Chưa có quan hệ
  - "Hủy lời mời" - Đã gửi lời mời đang chờ
  - "Chấp nhận/Từ chối" - Nhận được lời mời
  - "Bạn bè" - Đã là bạn bè

## 🔧 Cách sử dụng

### Gửi lời mời kết bạn:
1. Truy cập profile người dùng khác
2. Nhấn nút "Kết bạn"
3. Chờ người đó chấp nhận lời mời

### Xem danh sách bạn bè:
1. Nhấn menu "Bạn bè" ở navigation
2. Xem danh sách bạn bè với thông tin chi tiết
3. Tìm kiếm bạn bè nếu cần
4. Nhấn "Nhắn tin" để bắt đầu trò chuyện

### Quản lý lời mời:
1. Vào `/friends/requests`
2. Tab "Lời mời nhận được": Xem và chấp nhận/từ chối
3. Tab "Lời mời đã gửi": Xem và hủy nếu cần

## ⚡ Real-time Notifications

### Khi nhận lời mời mới:
- Toast notification: "👋 [Tên] muốn kết bạn với bạn!"
- Âm thanh thông báo
- Click notification → chuyển đến trang lời mời

### Khi lời mời được chấp nhận:
- Toast notification: "🎉 [Tên] đã chấp nhận lời mời kết bạn!"
- Âm thanh thông báo  
- Click notification → chuyển đến danh sách bạn bè

## 🎯 Tích hợp vào các trang khác

### Thêm FriendButton vào Profile:
```jsx
import FriendButton from '../components/FriendButton';

// Trong component profile
<FriendButton 
  userId={user._id} 
  onStatusChange={(status) => {
    // Xử lý khi trạng thái thay đổi
    if (status === 'accepted') {
      // Cập nhật UI
    }
  }}
/>
```

### Thêm FriendButton vào ServiceCard:
```jsx
<FriendButton 
  userId={service.provider._id}
  onStatusChange={() => {
    // Refresh component nếu cần
  }}
/>
```

## 🔄 API Endpoints

### Friend Service (`/src/services/friendService.js`):
- `sendRequest(recipientId)` - Gửi lời mời
- `acceptRequest(requestId)` - Chấp nhận lời mời
- `rejectRequest(requestId)` - Từ chối lời mời
- `cancelRequest(requestId)` - Hủy lời mời
- `unfriend(friendId)` - Hủy kết bạn
- `getFriends(page, limit)` - Lấy danh sách bạn bè
- `getPendingRequests(page, limit)` - Lời mời nhận được
- `getSentRequests(page, limit)` - Lời mời đã gửi
- `checkStatus(userId)` - Kiểm tra trạng thái

## 🎨 Customization

### Thay đổi màu sắc FriendButton:
```css
/* Trong FriendButton.jsx */
.bg-blue-500 → bg-[your-color]
.hover:bg-blue-600 → hover:bg-[your-hover-color]
```

### Thay đổi icon:
```jsx
import { UserPlus, UserCheck, UserX } from 'lucide-react';
// Thay thế text bằng icon
```

## 📱 Responsive Design

- Mobile: Ẩn text, chỉ hiện icon
- Tablet: Hiện text cho các menu chính
- Desktop: Hiện đầy đủ text và icon

## 🔒 Security Features

- Kiểm tra token authentication
- Không thể tự kết bạn
- Validate user ID
- Rate limiting cho API calls

## 🚀 Performance

- Lazy loading components
- Pagination cho danh sách lớn
- Debounce search input
- Cache friend status

## 🐛 Troubleshooting

### Lỗi "Không thể kiểm tra trạng thái":
- Kiểm tra token trong localStorage
- Kiểm tra API endpoint
- Kiểm tra network connection

### Lỗi real-time notification:
- Kiểm tra socket connection
- Kiểm tra user đã login chưa
- Kiểm tra browser console logs

### FriendButton không cập nhật:
- Kiểm tra `onStatusChange` callback
- Refresh component
- Kiểm tra API response
