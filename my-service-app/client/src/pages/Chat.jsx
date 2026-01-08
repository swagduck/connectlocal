import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import { Send } from 'lucide-react';

const Chat = () => {
    const { user } = useContext(AuthContext);
    const { socket, onlineUsers, notifications, markAsRead } = useContext(SocketContext);
    
    // Khởi tạo là mảng rỗng để tránh lỗi map khi chưa có data
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const scrollRef = useRef();

    useEffect(() => {
        if(!socket) return;
        socket.on("get_message", (data) => {
            setArrivalMessage({
                sender: data.senderId,
                text: data.text,
                createdAt: Date.now(),
            });
        });
    }, [socket]);

    useEffect(() => {
        if (arrivalMessage && currentChat?.members.some(m => m._id === arrivalMessage.sender)) {
            setMessages((prev) => [...prev, arrivalMessage]);
            markAsRead(arrivalMessage.sender);
        }
    }, [arrivalMessage, currentChat]);

    // 👇 SỬA LỖI 1: Lấy conversations
    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await api.get("/chat/conversations");
                // Backend trả về mảng trực tiếp -> res.data
                setConversations(res.data); 
            } catch (err) { console.log(err); }
        };
        // Chỉ gọi khi user đã có id
        if (user?._id) {
            getConversations();
        }
    }, [user?._id]);

    // 👇 SỬA LỖI 2: Lấy messages
    useEffect(() => {
        const getMessages = async () => {
            if (currentChat) {
                try {
                    const res = await api.get("/chat/messages/" + currentChat._id);
                    // Backend trả về mảng trực tiếp -> res.data
                    setMessages(res.data);
                } catch (err) { console.log(err); }
            }
        };
        getMessages();
    }, [currentChat]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!newMessage.trim()) return;
        const receiverId = currentChat.members.find(member => member._id !== user._id)._id;

        socket.emit("send_message", {
            senderId: user._id,
            receiverId,
            text: newMessage,
            conversationId: currentChat._id
        });

        try {
            const res = await api.post("/chat/messages", {
                conversationId: currentChat._id,
                sender: user._id,
                text: newMessage,
            });
            // 👇 SỬA LỖI 3: Thêm tin nhắn mới
            setMessages([...messages, res.data]); 
            setNewMessage("");
        } catch (err) { console.log(err); }
    };

    const checkOnline = (chat) => {
        const chatMember = chat.members.find((member) => member._id !== user._id);
        return onlineUsers.some((u) => u.userId === chatMember?._id);
    };

    const handleChooseChat = (c, friendId) => {
        setCurrentChat(c);
        markAsRead(friendId);
    };

    return (
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)]">
            <div className="flex h-full bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                    <div className="p-4 border-b bg-white font-bold text-gray-700">Tin nhắn của bạn</div>
                    <div className="overflow-y-auto flex-1">
                        {/* Thêm kiểm tra optional chaining (?.) để an toàn */}
                        {conversations?.map((c) => {
                            const friend = c.members.find((m) => m._id !== user._id);
                            const isOnline = checkOnline(c);
                            const unreadCount = notifications.filter(n => n.senderId === friend._id).length;

                            return (
                                <div 
                                    key={c._id} 
                                    onClick={() => handleChooseChat(c, friend._id)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition ${currentChat?._id === c._id ? "bg-blue-100" : ""}`}
                                >
                                    <div className="relative">
                                        <img src={friend?.avatar || `https://ui-avatars.com/api/?name=${friend?.name}`} className="w-10 h-10 rounded-full object-cover border" alt="" />
                                        {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-800 truncate">{friend?.name}</p>
                                            
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${unreadCount > 0 ? "font-bold text-black" : "text-gray-500"}`}>
                                            {unreadCount > 0 ? "Tin nhắn mới..." : (c.latestMessage ? "Tin nhắn hình ảnh/văn bản" : "Bắt đầu trò chuyện...")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="w-2/3 flex flex-col bg-white">
                    {currentChat ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
                                <span className="font-bold text-lg text-gray-800">
                                    {currentChat.members.find((m) => m._id !== user._id)?.name}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((m, index) => (
                                    <div key={index} ref={scrollRef} className={`flex ${m.sender === user._id || m.sender._id === user._id ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                                            (m.sender === user._id || m.sender._id === user._id)
                                                ? "bg-blue-600 text-white rounded-br-none" 
                                                : "bg-white text-gray-800 border rounded-bl-none"
                                        }`}>
                                            <p>{m.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${(m.sender === user._id || m.sender._id === user._id) ? "text-blue-200" : "text-gray-400"}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 bg-white">
                                <input 
                                    type="text" 
                                    className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                                    placeholder="Nhập tin nhắn..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-md">
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Send size={48} className="text-gray-300" />
                            </div>
                            <p className="text-lg font-medium">Chọn một người để bắt đầu trò chuyện</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;