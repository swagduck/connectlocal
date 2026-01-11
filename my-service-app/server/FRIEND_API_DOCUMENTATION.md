# Friend API Documentation

## Overview
API for managing friend relationships and friend requests in the Service App.

## Base URL
`/api/friends`

## Authentication
All endpoints require authentication token in Authorization header: `Bearer <token>`

## Endpoints

### 1. Send Friend Request
**POST** `/request`

Send a friend request to another user.

**Request Body:**
```json
{
  "recipientId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gửi lời mời kết bạn thành công",
  "data": {
    "_id": "friend_request_id",
    "requester": {
      "_id": "requester_id",
      "name": "Sender Name",
      "email": "sender@example.com",
      "avatar": "avatar_url"
    },
    "recipient": {
      "_id": "recipient_id",
      "name": "Recipient Name",
      "email": "recipient@example.com",
      "avatar": "avatar_url"
    },
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Accept Friend Request
**PUT** `/accept/:requestId`

Accept a pending friend request.

**Response:**
```json
{
  "success": true,
  "message": "Chấp nhận lời mời kết bạn thành công",
  "data": {
    "_id": "friend_request_id",
    "requester": {...},
    "recipient": {...},
    "status": "accepted",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Reject Friend Request
**PUT** `/reject/:requestId`

Reject a pending friend request.

**Response:**
```json
{
  "success": true,
  "message": "Từ chối lời mời kết bạn thành công"
}
```

### 4. Cancel Friend Request
**DELETE** `/cancel/:requestId`

Cancel a friend request that you sent (only works for pending requests).

**Response:**
```json
{
  "success": true,
  "message": "Hủy lời mời kết bạn thành công"
}
```

### 5. Unfriend
**DELETE** `/unfriend/:friendId`

Remove a friend from your friends list.

**Response:**
```json
{
  "success": true,
  "message": "Hủy kết bạn thành công"
}
```

### 6. Get Friends List
**GET** `/`

Get your list of friends (accepted relationships).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "friend_id",
      "name": "Friend Name",
      "email": "friend@example.com",
      "avatar": "avatar_url",
      "phone": "phone_number",
      "role": "user|provider|admin",
      "rating": 4.5,
      "reviewCount": 10,
      "friendshipId": "friendship_id",
      "becameFriends": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 7. Get Pending Requests
**GET** `/pending`

Get friend requests you've received (pending status).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "requester": {
        "_id": "requester_id",
        "name": "Sender Name",
        "email": "sender@example.com",
        "avatar": "avatar_url",
        "phone": "phone_number",
        "role": "user|provider|admin",
        "rating": 4.5,
        "reviewCount": 10
      },
      "recipient": "your_user_id",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### 8. Get Sent Requests
**GET** `/sent`

Get friend requests you've sent (pending status).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "requester": "your_user_id",
      "recipient": {
        "_id": "recipient_id",
        "name": "Recipient Name",
        "email": "recipient@example.com",
        "avatar": "avatar_url",
        "phone": "phone_number",
        "role": "user|provider|admin",
        "rating": 4.5,
        "reviewCount": 10
      },
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### 9. Check Friend Status
**GET** `/status/:userId`

Check the friendship status between you and another user.

**Response:**
```json
{
  "success": true,
  "status": "none|pending|sent|received|accepted|self",
  "friendshipId": "friendship_id_if_exists"
}
```

**Status Values:**
- `none`: No relationship exists
- `pending`: Request is pending (you are the recipient)
- `sent`: You sent a request that's pending
- `received`: You received a request that's pending
- `accepted`: You are friends
- `self`: Checking your own status

## Socket.io Events

### Client to Server Events

#### `friend_request_sent`
Emitted when a friend request is created.
```javascript
socket.emit('friend_request_sent', {
  requestId: 'request_id',
  recipientId: 'recipient_user_id'
});
```

#### `friend_request_accepted`
Emitted when a friend request is accepted.
```javascript
socket.emit('friend_request_accepted', {
  requestId: 'request_id',
  requesterId: 'requester_user_id'
});
```

### Server to Client Events

#### `new_friend_request`
Received when someone sends you a friend request.
```javascript
socket.on('new_friend_request', (data) => {
  console.log(data);
  // {
  //   requestId: "request_id",
  //   requester: {
  //     _id: "user_id",
  //     name: "Sender Name",
  //     email: "sender@example.com",
  //     avatar: "avatar_url"
  //   },
  //   message: "Sender Name muốn kết bạn với bạn!"
  // }
});
```

#### `friend_request_accepted`
Received when someone accepts your friend request.
```javascript
socket.on('friend_request_accepted', (data) => {
  console.log(data);
  // {
  //   requestId: "request_id",
  //   newFriend: {
  //     _id: "user_id",
  //     name: "Friend Name",
  //     email: "friend@example.com",
  //     avatar: "avatar_url"
  //   },
  //   message: "Friend Name đã chấp nhận lời mời kết bạn!"
  // }
});
```

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "message": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (validation errors, already friends, etc.)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (not authorized to perform action)
- `404`: Not Found (user or request not found)
- `500`: Internal Server Error

## Usage Examples

### Send a friend request:
```javascript
fetch('/api/friends/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token_here'
  },
  body: JSON.stringify({
    recipientId: '60d5ecb74b24a1234567890'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Get friends list:
```javascript
fetch('/api/friends?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Accept friend request:
```javascript
fetch('/api/friends/accept/60d5ecb74b24a1234567890', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```
