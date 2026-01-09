import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState(new Set()); // Track who's typing

    // 👇 Thêm state quản lý thông báo chưa đọc
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (user) {
            const newSocket = io("http://localhost:5000");
            setSocket(newSocket);

            newSocket.emit("add_user", user._id);

            newSocket.on("get_users", (users) => {
                setOnlineUsers(users);
            });

            // 👇 LẮNG NGHE TIN NHẮN ĐẾN TOÀN CỤC (GLOBAL LISTENER)
            newSocket.on("get_message", (res) => {
                // 1. Phát âm thanh "Ting" (chỉ khi nhận tin nhắn mới)
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // 2. Thêm vào danh sách thông báo
                // (Chỉ thêm nếu người gửi KHÁC người nhận - logic cơ bản)
                setNotifications((prev) => [res, ...prev]);
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

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    // 👇 Hàm hỗ trợ xóa thông báo khi đã đọc
    const markAsRead = (senderId) => {
        setNotifications((prev) => prev.filter((n) => n.senderId !== senderId));
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

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, notifications, typingUsers, markAsRead, startTyping, stopTyping }}>
            {children}
        </SocketContext.Provider>
    );
};