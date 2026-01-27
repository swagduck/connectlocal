const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Booking = require('../models/Booking');
const Friend = require('../models/Friend');

const socketHandler = (io) => {
  let onlineUsers = [];
  let activeJobs = new Map(); // jobId -> {workerId, customerId, status, workerLocation}

  // Helper function to send notification to specific user
  const sendToUser = (userId, event, data) => {
    const userSocket = onlineUsers.find(user => user.userId === userId);
    if (userSocket) {
      io.to(userSocket.socketId).emit(event, data);
      return true;
    } else {
      return false;
    }
  };

  io.on('connection', (socket) => {
    // Add user to online users
    socket.on('add_user', (userId) => {
      
      // Remove existing user if already exists (handle reconnect)
      onlineUsers = onlineUsers.filter(user => user.userId !== userId);
      
      onlineUsers.push({
        socketId: socket.id,
        userId: userId,
        lastSeen: new Date()
      });
      
      // Broadcast updated online users list
      io.emit('get_users', onlineUsers);
    });

    // Worker accepts job
    socket.on('job_accepted', async (data) => {
      try {
        const { jobId, workerId, customerId, workerLocation } = data;
        
        // Update job status in database
        await Booking.findByIdAndUpdate(jobId, {
          status: 'accepted',
          worker: workerId,
          acceptedAt: new Date()
        });

        // Add to active jobs
        activeJobs.set(jobId, {
          workerId,
          customerId,
          status: 'accepted',
          workerLocation,
          acceptedAt: new Date()
        });

        // Notify customer
        const customerSocket = onlineUsers.find(user => user.userId === customerId);
        if (customerSocket) {
          io.to(customerSocket.socketId).emit('job_status_update', {
            jobId,
            status: 'accepted',
            message: 'Thợ đã nhận yêu cầu của bạn!',
            workerLocation,
            acceptedAt: new Date()
          });
        }

        // Broadcast to all workers that this job is taken
        io.emit('job_taken', { jobId, workerId });

      } catch (error) {
        console.error('❌ Error accepting job:', error);
        socket.emit('error', { message: 'Không thể nhận công việc' });
      }
    });

    // Worker updates location
    socket.on('worker_location_update', (data) => {
      try {
        const { jobId, workerId, location } = data;
        
        // Update active job with new location
        const activeJob = activeJobs.get(jobId);
        if (activeJob && activeJob.workerId === workerId) {
          activeJob.workerLocation = location;
          activeJob.lastLocationUpdate = new Date();
        }

        // Notify customer with new location
        const customerSocket = onlineUsers.find(user => user.userId === activeJob?.customerId);
        if (customerSocket) {
          io.to(customerSocket.socketId).emit('worker_location_update', {
            jobId,
            workerId,
            location,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('❌ Error updating worker location:', error);
      }
    });

    // Worker starts job
    socket.on('job_started', async (data) => {
      try {
        const { jobId, workerId } = data;
        
        // Update job status
        await Booking.findByIdAndUpdate(jobId, {
          status: 'in_progress',
          startedAt: new Date()
        });

        // Update active job
        const activeJob = activeJobs.get(jobId);
        if (activeJob) {
          activeJob.status = 'in_progress';
          activeJob.startedAt = new Date();
        }

        // Notify customer
        const customerSocket = onlineUsers.find(user => user.userId === activeJob?.customerId);
        if (customerSocket) {
          io.to(customerSocket.socketId).emit('job_status_update', {
            jobId,
            status: 'in_progress',
            message: 'Thợ đang trên đường đến!',
            startedAt: new Date()
          });
        }

      } catch (error) {
        console.error('❌ Error starting job:', error);
        socket.emit('error', { message: 'Không thể bắt đầu công việc' });
      }
    });

    // Worker completes job
    socket.on('job_completed', async (data) => {
      try {
        const { jobId, workerId } = data;
        
        // Update job status
        await Booking.findByIdAndUpdate(jobId, {
          status: 'completed',
          completedAt: new Date()
        });

        // Remove from active jobs
        activeJobs.delete(jobId);

        // Notify customer
        const activeJob = activeJobs.get(jobId);
        const customerSocket = onlineUsers.find(user => user.userId === activeJob?.customerId);
        if (customerSocket) {
          io.to(customerSocket.socketId).emit('job_status_update', {
            jobId,
            status: 'completed',
            message: 'Công việc đã hoàn thành!',
            completedAt: new Date()
          });
        }

      } catch (error) {
        console.error('❌ Error completing job:', error);
        socket.emit('error', { message: 'Không thể hoàn thành công việc' });
      }
    });

    // Customer requests job status
    socket.on('get_job_status', (data) => {
      const { jobId } = data;
      const activeJob = activeJobs.get(jobId);
      
      socket.emit('job_status_response', {
        jobId,
        status: activeJob?.status || 'not_found',
        workerLocation: activeJob?.workerLocation,
        lastUpdate: activeJob?.lastLocationUpdate
      });
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
          const messageData = {
            _id: newMessage._id,
            conversation: conversation._id,
            sender: newMessage.sender,
            message: message,
            createdAt: newMessage.createdAt
          };
          
          io.to(receiverSocket.socketId).emit('get_message', messageData);
        }

        // Send confirmation to sender
        socket.emit('message_sent', {
          tempId: data.tempId,
          messageId: newMessage._id
        });

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

      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // Handle notification removal
    socket.on('remove_notification', (data) => {
      try {
        const { notificationId, userId } = data;
        
        // Broadcast to all user's connected devices that a notification was removed
        const userSockets = onlineUsers.filter(user => user.userId === userId);
        userSockets.forEach(userSocket => {
          io.to(userSocket.socketId).emit('notification_removed', {
            notificationId,
            userId,
            timestamp: new Date()
          });
        });

      } catch (error) {
        console.error('❌ Error removing notification:', error);
        socket.emit('error', { message: 'Không thể xóa thông báo' });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      // Remove user from online users
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
      
      // Clean up any active jobs for this user
      for (const [jobId, job] of activeJobs.entries()) {
        if (job.workerId === socket.userId) {
          // Mark job as disconnected
          activeJobs.delete(jobId);
          
          // Notify customer
          const customerSocket = onlineUsers.find(user => user.userId === job.customerId);
          if (customerSocket) {
            io.to(customerSocket.socketId).emit('job_status_update', {
              jobId,
              status: 'worker_disconnected',
              message: 'Thợ đã mất kết nối'
            });
          }
        }
      }
      
      // Broadcast updated online users list
      io.emit('get_users', onlineUsers);
    });
  });

  return { onlineUsers, activeJobs, sendToUser };
};

module.exports = socketHandler;