const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Tạo hoặc Lấy cuộc trò chuyện (Access Conversation)
// @route   POST /api/chat
exports.accessConversation = async (req, res, next) => {
  // 👇 QUAN TRỌNG: Nhận 'userId' từ Frontend gửi lên
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "UserId param not sent with request" });
  }

  try {
    // 1. Tìm cuộc hội thoại đã tồn tại giữa 2 người
    let isChat = await Conversation.find({
      $and: [
        { members: { $elemMatch: { $eq: req.user.id } } },
        { members: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("members", "-password") // Lấy thông tin user (trừ password)
      .populate("latestMessage");

    // Populate thêm thông tin người gửi của tin nhắn cuối cùng
    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name avatar email",
    });

    if (isChat.length > 0) {
      // 2. Nếu đã có -> Trả về cuộc hội thoại đó
      res.send(isChat[0]);
    } else {
      // 3. Nếu chưa -> Tạo mới
      var chatData = {
        members: [req.user.id, userId],
      };

      const createdChat = await Conversation.create(chatData);

      // Trả về dữ liệu đầy đủ sau khi tạo
      const FullChat = await Conversation.findOne({
        _id: createdChat._id,
      }).populate("members", "-password");
      res.status(200).json(FullChat);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách các cuộc trò chuyện
// @route   GET /api/chat
exports.getMyConversations = async (req, res, next) => {
  try {
    const results = await Conversation.find({
      members: { $elemMatch: { $eq: req.user.id } },
    })
      .populate("members", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 }); // Mới nhất lên đầu

    const populatedResults = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name avatar email",
    });

    res.status(200).send(populatedResults);
  } catch (error) {
    next(error);
  }
};

// @desc    Gửi tin nhắn
// @route   POST /api/chat/messages
exports.sendMessage = async (req, res, next) => {
  console.log('🚀 ChatController.sendMessage called!');
  console.log('📝 Request body:', req.body);
  console.log('👤 Request user:', req.user);
  
  const { conversationId, text, fileUrl, fileName, fileType } = req.body;

  if (!conversationId || !text) {
    console.log('❌ Missing required data');
    return res.status(400).json({ message: "Thiếu dữ liệu gửi tin nhắn" });
  }

  try {
    var newMessage = {
      sender: req.user.id,
      text: text,
      conversation: conversationId,
    };

    // Thêm thông tin file nếu có
    if (fileUrl) {
      newMessage.fileUrl = fileUrl;
      newMessage.fileName = fileName || null;
      newMessage.fileType = fileType || null;
    }

    var message = await Message.create(newMessage);

    // Populate để Frontend hiển thị ngay lập tức
    message = await message.populate("sender", "name avatar");
    message = await message.populate("conversation");
    message = await User.populate(message, {
      path: "conversation.members",
      select: "name avatar email",
    });

    // Cập nhật tin nhắn cuối cùng cho Conversation
    await Conversation.findByIdAndUpdate(req.body.conversationId, {
      latestMessage: message,
    });

    // 👇 Gửi tin nhắn qua socket cho người nhận
    const sendToUser = req.app.get('sendToUser');
    console.log('🔧 ChatController - sendToUser available:', !!sendToUser);
    console.log('🔧 ChatController - Message conversation members:', message.conversation.members);
    console.log('🔧 ChatController - Current user ID:', req.user.id);
    
    if (sendToUser) {
      // Tìm người nhận trong conversation
      const receiverId = message.conversation.members.find(
        member => member._id.toString() !== req.user.id
      );
      
      console.log('🔧 ChatController - Found receiver ID:', receiverId);
      console.log('🔧 ChatController - Receiver ID type:', typeof receiverId);
      console.log('🔧 ChatController - Receiver ID toString:', receiverId.toString());
      
      if (receiverId) {
        const messageData = {
          _id: message._id,
          conversation: message.conversation._id,
          sender: message.sender,
          message: message.text,
          createdAt: message.createdAt,
          senderName: message.sender.name
        };
        
        console.log('🔧 ChatController - Sending message data:', messageData);
        
        // Convert ObjectId to string for comparison
        const receiverIdString = receiverId._id ? receiverId._id.toString() : receiverId.toString();
        const success = sendToUser(receiverIdString, 'get_message', messageData);
        
        console.log('📨 ChatController - Message sent via HTTP API to:', receiverIdString, 'Success:', success);
      } else {
        console.log('❌ ChatController - No receiver found in conversation');
      }
    } else {
      console.log('❌ ChatController - sendToUser function not available');
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tin nhắn của một cuộc hội thoại
// @route   GET /api/chat/messages/:conversationId
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .populate("sender", "name avatar email")
      .populate("conversation");
    res.json(messages);
  } catch (error) {
    next(error);
  }
};
