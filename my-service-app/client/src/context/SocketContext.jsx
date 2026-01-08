import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
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
                // 1. Phát âm thanh "Ting"
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Chưa tương tác trang web nên không phát nhạc được"));

                // 2. Thêm vào danh sách thông báo
                // (Chỉ thêm nếu người gửi KHÁC người nhận - logic cơ bản)
                setNotifications((prev) => [res, ...prev]);
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

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, notifications, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};