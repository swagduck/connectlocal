const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @desc    Tạo cuộc trò chuyện mới
exports.createConversation = async (req, res, next) => {
  try {
    // Tìm xem đã có cuộc hội thoại chưa
    let conversation = await Conversation.findOne({
      members: { $all: [req.user.id, req.body.receiverId] },
    });

    // Nếu chưa thì tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user.id, req.body.receiverId],
      });
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách các cuộc trò chuyện
exports.getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user.id] },
    })
      .populate("members", "name avatar role")
      .sort("-updatedAt");

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tin nhắn
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Gửi tin nhắn
exports.sendMessage = async (req, res, next) => {
  try {
    const newMessage = await Message.create(req.body);

    await Conversation.findByIdAndUpdate(req.body.conversationId, {
      lastMessage: req.body.text,
      lastMessageId: newMessage._id,
      updatedAt: Date.now(),
    });

    res.status(200).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};
