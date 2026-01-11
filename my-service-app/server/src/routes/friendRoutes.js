const express = require("express");
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  cancelFriendRequest,
  unfriend,
  checkFriendStatus,
  getFriendRequestCount,
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

// Middleware bảo vệ tất cả routes
router.use(protect);

// Gửi lời mời kết bạn
router.post("/request", sendFriendRequest);

// Chấp nhận lời mời kết bạn
router.put("/accept/:requestId", acceptFriendRequest);

// Từ chối lời mời kết bạn
router.put("/reject/:requestId", rejectFriendRequest);

// Hủy lời mời kết bạn (người gửi hủy)
router.delete("/cancel/:requestId", cancelFriendRequest);

// Hủy kết bạn
router.delete("/unfriend/:friendId", unfriend);

// Lấy danh sách bạn bè
router.get("/", getFriendsList);

// Lấy danh sách lời mời đang chờ (nhận được)
router.get("/pending", getPendingRequests);

// Lấy danh sách lời mời đã gửi
router.get("/sent", getSentRequests);

// Kiểm tra trạng thái kết bạn với một người dùng cụ thể
router.get("/status/:userId", checkFriendStatus);

// Lấy số lượng lời mời kết bạn đang chờ
router.get("/requests/count", getFriendRequestCount);

module.exports = router;
