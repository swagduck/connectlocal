import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState(new Set()); // Track who's typing

    // 👇 Thêm state quản lý thông báo chưa đọc
    const [notifications, setNotifications] = useState([]);
    const [friendRequestCount, setFriendRequestCount] = useState(0);

    console.log('🔧 SocketProvider - User:', user);
    console.log('🔧 SocketProvider - Notifications:', notifications);

    useEffect(() => {
        console.log('🔄 SocketContext useEffect triggered, user:', !!user);
        if (user) {
            const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5001";
            console.log('🔌 Connecting to socket at:', socketUrl);

            const newSocket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected successfully');
                console.log('👤 User ID for socket:', user._id);
                newSocket.emit("add_user", user._id);
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
            });

            // Test connection with a simple event
            newSocket.on('test_connection', (data) => {
                console.log('🧪 Test connection received:', data);
            });

            setSocket(newSocket);

            newSocket.on("get_users", (users) => {
                console.log('👥 Online users updated:', users.length, 'users');
                setOnlineUsers(users);
            });

            // Thêm log để kiểm tra tất cả các events
            newSocket.onAny((eventName, ...args) => {
                if (eventName !== 'get_users') { // Reduce noise
                    console.log('📡 Socket event received:', eventName, args);
                }
            });

            // 👇 LẮNG NGHE TIN NHẮN ĐẾN TOÀN CỤC (GLOBAL LISTENER)
            newSocket.on("get_message", (res) => {
                console.log('📨 Received message:', res);
                console.log('📨 Message sender:', res.sender);
                console.log('📨 Message sender ID:', res.sender?._id || res.sender);
                console.log('📨 Current user ID:', user._id);
                console.log('📨 Message data structure:', JSON.stringify(res, null, 2));

                // Chỉ xử lý nếu tin nhắn không phải từ chính mình
                const senderId = res.sender?._id || res.sender;
                if (senderId && senderId !== user._id) {
                    console.log('🔔 Processing message notification...');

                    // 1. Phát âm thanh "Ting"
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                    // 2. Hiển thị toast notification
                    const senderName = res.senderName || res.sender?.name || 'Người dùng';
                    console.log('🔔 Showing message toast from:', senderName);
                    toast.success(`Tin nhắn mới từ ${senderName}: ${res.message}`, {
                        icon: '💬',
                        duration: 5000,
                        onClick: () => {
                            // Navigate to chat when clicked
                            window.location.href = `/chat?user=${senderId}`;
                        }
                    });

                    // 3. Thêm vào danh sách thông báo với type 'message' và unique ID
                    setNotifications((prev) => {
                        console.log('📝 Previous notifications:', prev.length);
                        const newNotifications = [{
                            _id: res._id || `message-${Date.now()}`, // Unique ID
                            type: 'message',
                            senderId: senderId,
                            senderName: senderName,
                            message: res.message,
                            timestamp: new Date(res.createdAt),
                            ...res
                        }, ...prev];
                        console.log('📝 New notifications count:', newNotifications.length);
                        return newNotifications;
                    });

                    console.log('✅ Message notification processed successfully');
                } else {
                    console.log('🚫 Ignoring message from self or invalid sender');
                    console.log('🚫 Comparison:', senderId, 'vs', user._id);
                }
            });

            // 👇 LẮNG NGHE TYPING INDICATORS
            newSocket.on("user_typing", (data) => {
                const { userId, isTyping } = data;
                if (isTyping) {
                    setTypingUsers(prev => new Set(prev).add(userId));
                } else {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userId);
                        return newSet;
                    });
                }
            });

            // 👇 LẮNG NGHE FRIEND REQUEST NOTIFICATIONS
            newSocket.on("friend_request_sent", (data) => {
                console.log('📋 Friend request notification received:', data);
                console.log('📋 Current notifications count:', notifications.length);

                // Safety check
                if (!data || !data.requester) {
                    console.log('❌ Invalid friend request data:', data);
                    return;
                }

                console.log('✅ Friend request data valid, processing...');

                // Phát âm thanh thông báo
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // Hiển thị toast notification
                const requesterName = data.requester.name || 'Người dùng';
                console.log('🔔 Showing toast for:', requesterName);
                toast.success(`${requesterName} muốn kết bạn với bạn!`, {
                    icon: '👋',
                    duration: 5000,
                    onClick: () => {
                        // Navigate to friend requests page when clicked
                        window.location.href = '/friends/requests';
                    }
                });

                // Thêm vào danh sách thông báo
                console.log('📝 Adding to notifications list...');
                setNotifications((prev) => {
                    console.log('📝 Previous notifications:', prev.length);
                    const newNotifications = [{
                        type: 'friend_request',
                        ...data,
                        timestamp: new Date()
                    }, ...prev];
                    console.log('📝 New notifications count:', newNotifications.length);
                    return newNotifications;
                });

                // Tăng số lượng friend request
                setFriendRequestCount(prev => {
                    console.log('🔢 Friend request count:', prev, '->', prev + 1);
                    return prev + 1;
                });
            });

            // 👇 LẮNG NGHE BOOKING NOTIFICATIONS
            newSocket.on("new_booking_notification", (data) => {
                // Safety check
                if (!data || !data.customer || !data.service) {
                    console.log('Invalid booking notification data:', data);
                    return;
                }

                // Phát âm thanh thông báo
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // Hiển thị toast notification
                toast.success(data.message, {
                    icon: '🎉',
                    duration: 5000,
                    onClick: () => {
                        // Navigate to my bookings page when clicked
                        window.location.href = '/my-bookings';
                    }
                });

                // Thêm vào danh sách thông báo
                setNotifications((prev) => [{
                    type: 'new_booking',
                    ...data,
                    timestamp: new Date()
                }, ...prev]);
            });

            newSocket.on("booking_status_notification", (data) => {
                // Safety check
                if (!data || !data.message) {
                    console.log('Invalid booking status notification data:', data);
                    return;
                }

                // Phát âm thanh thông báo
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // Hiển thị toast notification
                toast.success(data.message, {
                    icon: data.type === 'booking_completed' ? '✅' :
                        data.type === 'booking_cancelled' ? '❌' : '📝',
                    duration: 5000,
                    onClick: () => {
                        // Navigate to my bookings page when clicked
                        window.location.href = '/my-bookings';
                    }
                });

                // Thêm vào danh sách thông báo
                setNotifications((prev) => [{
                    type: data.type,
                    ...data,
                    timestamp: new Date()
                }, ...prev]);
            });

            newSocket.on("friend_request_accepted", (data) => {
                console.log('✅ Friend request accepted notification received:', data);

                // Safety check
                if (!data || !data.newFriend) {
                    console.log('Invalid friend accepted data:', data);
                    return;
                }

                // Phát âm thanh thông báo
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // Hiển thị toast notification
                const friendName = data.newFriend.name || 'Người dùng';
                toast.success(`${friendName} đã chấp nhận lời mời kết bạn!`, {
                    icon: '🎉',
                    duration: 5000,
                    onClick: () => {
                        // Navigate to friends list when clicked
                        window.location.href = '/friends';
                    }
                });

                // Thêm vào danh sách thông báo
                setNotifications((prev) => [{
                    type: 'friend_accepted',
                    ...data,
                    timestamp: new Date()
                }, ...prev]);
            });

            // 👇 LẮNG NGHE NOTIFICATION REMOVAL EVENTS
            newSocket.on("notification_removed", (data) => {
                console.log('🗑️ Notification removal event received:', data);
                const { notificationId } = data;

                setNotifications((prev) => {
                    const newNotifications = prev.filter((n) => n._id !== notificationId);
                    console.log('🗑️ Notifications after removal:', newNotifications.length);
                    return newNotifications;
                });
            });

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    // 👇 Fetch initial friend request count
    useEffect(() => {
        if (user) {
            const fetchFriendRequestCount = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        console.log('No token found, skipping friend request count fetch');
                        return;
                    }

                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/requests/count`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setFriendRequestCount(response.data.count || 0);
                    console.log('Friend request count fetched:', response.data.count);
                } catch (error) {
                    console.error('Error fetching friend request count:', error);
                    // Don't set error state, just log it
                    if (error.response?.status === 401) {
                        console.log('Unauthorized - token may be expired');
                    }
                }
            };

            fetchFriendRequestCount();
        }
    }, [user]);

    // 👇 Hàm hỗ trợ xóa thông báo khi đã đọc
    const markAsRead = (notificationId) => {
        console.log('🗑️ Marking notification as read:', notificationId);

        // Remove from local state immediately for instant feedback
        setNotifications((prev) => {
            const newNotifications = prev.filter((n) => n._id !== notificationId);
            console.log('🗑️ Notifications after removal:', newNotifications.length);
            return newNotifications;
        });

        // Emit socket event to sync across all user's connected devices
        if (socket && user) {
            socket.emit('remove_notification', {
                notificationId,
                userId: user._id
            });
            console.log('📤 Emitted notification removal event:', { notificationId, userId: user._id });
        }
    };

    // 👇 Hàm quản lý friend request count
    const clearFriendRequestNotifications = () => {
        setFriendRequestCount(0);
    };

    const getNotificationCount = (type) => {
        console.log('🔢 Getting notification count for type:', type);
        console.log('🔢 Current notifications:', notifications);
        console.log('🔢 Friend request count:', friendRequestCount);

        let count = 0;
        if (type === 'friend_request') {
            count = friendRequestCount;
        } else if (type === 'message') {
            count = notifications.filter(n => n.type === 'message').length;
        } else if (type === 'new_booking') {
            count = notifications.filter(n => n.type === 'new_booking').length;
        } else if (type === 'booking_accepted') {
            count = notifications.filter(n => n.type === 'booking_accepted').length;
        } else if (type === 'booking_in_progress') {
            count = notifications.filter(n => n.type === 'booking_in_progress').length;
        } else if (type === 'booking_completed') {
            count = notifications.filter(n => n.type === 'booking_completed').length;
        } else if (type === 'booking_cancelled') {
            count = notifications.filter(n => n.type === 'booking_cancelled').length;
        } else if (type === 'friend_accepted') {
            count = notifications.filter(n => n.type === 'friend_accepted').length;
        } else {
            count = notifications.filter(n => n.type === type).length;
        }

        console.log('🔢 Final count for', type, ':', count);
        return count;
    };

    // 👇 Hàm typing indicators
    const startTyping = (targetUserId) => {
        if (socket && user && targetUserId !== user._id) {
            socket.emit('typing_start', {
                userId: user._id,
                targetUserId
            });
        }
    };

    const stopTyping = (targetUserId) => {
        if (socket && user && targetUserId !== user._id) {
            socket.emit('typing_stop', {
                userId: user._id,
                targetUserId
            });
        }
    };

    // 👇 Hàm test để gửi thông báo thủ công
    const testNotification = () => {
        console.log('🧪 Testing notification manually...');
        setNotifications((prev) => [{
            type: 'message',
            senderId: 'test-user',
            senderName: 'Test User',
            message: 'This is a test notification',
            timestamp: new Date()
        }, ...prev]);

        toast.success('Test notification sent!', {
            icon: '🧪',
            duration: 3000
        });
    };

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers,
            notifications,
            typingUsers,
            friendRequestCount,
            markAsRead,
            clearFriendRequestNotifications,
            getNotificationCount,
            startTyping,
            stopTyping,
            testNotification // Thêm hàm test
        }}>
            {children}
        </SocketContext.Provider>
    );
};