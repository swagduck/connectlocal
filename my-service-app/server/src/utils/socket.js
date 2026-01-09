const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const socketHandler = (io) => {
  let onlineUsers = [];

  io.on('connection', (socket) => {
    console.log('🔗 User connected:', socket.id);

    // Add user to online users
    socket.on('add_user', (userId) => {
      if (!onlineUsers.find(user => user.userId === userId)) {
        onlineUsers.push({
          socketId: socket.id,
          userId: userId,
          lastSeen: new Date()
        });
      }
      
      // Broadcast updated online users list
      io.emit('get_users', onlineUsers);
      console.log('👥 Online users updated:', onlineUsers.length);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { userId, targetUserId } = data;
      
      // Send typing notification to target user
      const targetSocket = onlineUsers.find(user => user.userId === targetUserId);
      if (targetSocket) {
        io.to(targetSocket.socketId).emit('user_typing', {
          userId: userId,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { userId, targetUserId } = data;
      
      // Send stop typing notification to target user
      const targetSocket = onlineUsers.find(user => user.userId === targetUserId);
      if (targetSocket) {
        io.to(targetSocket.socketId).emit('user_typing', {
          userId: userId,
          isTyping: false
        });
      }
    });

    // Handle private messages
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, message, conversationId } = data;

        // Find or create conversation
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else {
          conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
          });
        }

        if (!conversation) {
          // Create new conversation
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
            lastMessage: message,
            lastMessageTime: new Date()
          });
        } else {
          // Update existing conversation
          conversation.lastMessage = message;
          conversation.lastMessageTime = new Date();
          await conversation.save();
        }

        // Save message to database
        const newMessage = await Message.create({
          conversation: conversation._id,
          sender: senderId,
          receiver: receiverId,
          message: message,
          read: false
        });

        // Populate message with sender info
        await newMessage.populate('sender', 'name avatar');

        // Send to receiver
        const receiverSocket = onlineUsers.find(user => user.userId === receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('get_message', {
            _id: newMessage._id,
            conversation: conversation._id,
            sender: newMessage.sender,
            message: message,
            createdAt: newMessage.createdAt
          });
        }

        // Send confirmation to sender
        socket.emit('message_sent', {
          tempId: data.tempId,
          messageId: newMessage._id
        });

        console.log('💬 Message sent from', senderId, 'to', receiverId);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId, userId } = data;
        
        await Message.updateMany(
          { conversation: conversationId, receiver: userId, read: false },
          { read: true }
        );

        console.log('📖 Messages marked as read for conversation:', conversationId);

      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
      
      // Remove user from online users
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
      
      // Broadcast updated online users list
      io.emit('get_users', onlineUsers);
      console.log('👥 Online users after disconnect:', onlineUsers.length);
    });
  });

  return onlineUsers;
};

module.exports = socketHandler;