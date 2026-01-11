const Friend = require("../models/Friend");
const User = require("../models/User");

// Socket.io instance (will be set by app.js)
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Gửi lời mời kết bạn
const sendFriendRequest = async (req, res) => {
  try {
    console.log('🚀 Starting sendFriendRequest...');
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    console.log('📝 Request data:', { recipientId, requesterId });

    // Kiểm tra không thể tự kết bạn
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Không thể gửi lời mời kết bạn cho chính mình",
      });
    }

    // Kiểm tra người nhận tồn tại
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    console.log('✅ Recipient found:', recipient.name);

    // Kiểm tra đã có mối quan hệ nào chưa
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({
          success: false,
          message: "Các bạn đã là bạn bè",
        });
      } else if (existingFriendship.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Đã có lời mời kết bạn đang chờ xử lý",
        });
      }
    }

    // Tạo lời mời kết bạn mới
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await friendRequest.save();
    console.log('💾 Friend request saved to database');

    // Populate thông tin người gửi và người nhận
    await friendRequest.populate([
      { path: "requester", select: "name email avatar" },
      { path: "recipient", select: "name email avatar" },
    ]);

    console.log('👤 Friend request populated:', {
      requester: friendRequest.requester.name,
      recipient: friendRequest.recipient.name
    });

    // Emit socket event for real-time notification
    const sendToUser = req.app.get('sendToUser');
    console.log('🔧 sendToUser function available:', !!sendToUser);
    console.log('🔧 Recipient ID:', recipientId);
    console.log('🔧 Friend request data:', {
      requestId: friendRequest._id,
      recipientId: recipientId,
      requester: friendRequest.requester
    });
    
    if (sendToUser) {
      const success = sendToUser(recipientId, 'friend_request_sent', {
        requestId: friendRequest._id,
        recipientId: recipientId,
        requester: friendRequest.requester
      });
      
      console.log('📤 Friend request notification result:', success);
      if (success) {
        console.log('👋 Friend request notification sent to:', recipientId);
      } else {
        console.log('❌ Failed to send friend request notification to:', recipientId);
      }
    } else {
      console.log('❌ sendToUser function not available');
    }

    console.log('✅ Friend request completed successfully');
    res.status(201).json({
      success: true,
      message: "Gửi lời mời kết bạn thành công",
      data: friendRequest,
    });
  } catch (error) {
    console.error("❌ Lỗi gửi lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Chấp nhận lời mời kết bạn
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lời mời kết bạn",
      });
    }

    // Kiểm tra người dùng là người nhận lời mời
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chấp nhận lời mời này",
      });
    }

    // Kiểm tra trạng thái
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Lời mời đã được xử lý",
      });
    }

    // Cập nhật trạng thái
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Populate thông tin
    await friendRequest.populate([
      { path: "requester", select: "name email avatar" },
      { path: "recipient", select: "name email avatar" },
    ]);

    // Emit socket event for real-time notification
    const sendToUser = req.app.get('sendToUser');
    if (sendToUser) {
      const success = sendToUser(friendRequest.requester._id, 'friend_request_accepted', {
        requestId: friendRequest._id,
        requesterId: friendRequest.requester._id,
        newFriend: friendRequest.recipient
      });
      
      if (success) {
        console.log('✅ Friend request accepted notification sent to:', friendRequest.requester._id);
      }
    }

    res.json({
      success: true,
      message: "Chấp nhận lời mời kết bạn thành công",
      data: friendRequest,
    });
  } catch (error) {
    console.error("Lỗi chấp nhận lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Từ chối lời mời kết bạn
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lời mời kết bạn",
      });
    }

    // Kiểm tra người dùng là người nhận lời mời
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền từ chối lời mời này",
      });
    }

    // Kiểm tra trạng thái
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Lời mời đã được xử lý",
      });
    }

    // Cập nhật trạng thái
    friendRequest.status = "rejected";
    await friendRequest.save();

    res.json({
      success: true,
      message: "Từ chối lời mời kết bạn thành công",
    });
  } catch (error) {
    console.error("Lỗi từ chối lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy danh sách bạn bè
const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Tìm các mối quan hệ đã được chấp nhận
    const friendships = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    })
      .populate([
        {
          path: "requester",
          select: "name email avatar phone role rating reviewCount",
        },
        {
          path: "recipient",
          select: "name email avatar phone role rating reviewCount",
        },
      ])
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Lấy danh sách bạn bè (loại trừ chính mình)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === userId
          ? friendship.recipient
          : friendship.requester;
      
      return {
        ...friend.toObject(),
        friendshipId: friendship._id,
        becameFriends: friendship.updatedAt,
      };
    });

    // Đếm tổng số bạn bè
    const totalFriends = await Friend.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    });

    res.json({
      success: true,
      data: friends,
      pagination: {
        page,
        limit,
        total: totalFriends,
        pages: Math.ceil(totalFriends / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách bạn bè:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy danh sách lời mời kết bạn đang chờ
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('🔍 Getting pending requests for user:', userId);

    const pendingRequests = await Friend.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "name email avatar phone role rating reviewCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('📋 Found pending requests:', pendingRequests.length);
    console.log('📋 Pending requests data:', pendingRequests);

    const totalRequests = await Friend.countDocuments({
      recipient: userId,
      status: "pending",
    });

    console.log('📊 Total pending requests:', totalRequests);

    res.json({
      success: true,
      data: pendingRequests,
      pagination: {
        page,
        limit,
        total: totalRequests,
        pages: Math.ceil(totalRequests / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy danh sách lời mời đã gửi
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sentRequests = await Friend.find({
      requester: userId,
      status: "pending",
    })
      .populate("recipient", "name email avatar phone role rating reviewCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRequests = await Friend.countDocuments({
      requester: userId,
      status: "pending",
    });

    res.json({
      success: true,
      data: sentRequests,
      pagination: {
        page,
        limit,
        total: totalRequests,
        pages: Math.ceil(totalRequests / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách lời mời đã gửi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Hủy lời mời kết bạn
const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lời mời kết bạn",
      });
    }

    // Kiểm tra người dùng là người gửi lời mời
    if (friendRequest.requester.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy lời mời này",
      });
    }

    // Kiểm tra trạng thái
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy lời mời đã được xử lý",
      });
    }

    await Friend.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: "Hủy lời mời kết bạn thành công",
    });
  } catch (error) {
    console.error("Lỗi hủy lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Hủy kết bạn
const unfriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: "accepted",
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mối quan hệ bạn bè",
      });
    }

    await Friend.findByIdAndDelete(friendship._id);

    res.json({
      success: true,
      message: "Hủy kết bạn thành công",
    });
  } catch (error) {
    console.error("Lỗi hủy kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Kiểm tra trạng thái kết bạn
const checkFriendStatus = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === targetUserId) {
      return res.json({
        success: true,
        status: "self",
      });
    }

    const friendship = await Friend.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUserId },
        { requester: targetUserId, recipient: currentUserId },
      ],
    });

    if (!friendship) {
      return res.json({
        success: true,
        status: "none",
      });
    }

    let status = friendship.status;
    if (friendship.status === "pending") {
      status = friendship.requester.toString() === currentUserId ? "sent" : "received";
    }

    res.json({
      success: true,
      status,
      friendshipId: friendship._id,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy số lượng lời mời kết bạn đang chờ
const getFriendRequestCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Friend.countDocuments({
      recipient: userId,
      status: "pending",
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Lỗi lấy số lượng lời mời kết bạn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

module.exports = {
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
  setSocketIO,
};
