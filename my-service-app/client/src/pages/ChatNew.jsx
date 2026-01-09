import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import { Send, MessageCircle, Users, Circle, Phone, Mail, Search, MoreVertical, Smile, Paperclip, Image } from 'lucide-react';

const ChatNew = () => {
    const { user } = useContext(AuthContext);
    const { socket, onlineUsers, notifications, typingUsers, markAsRead, startTyping, stopTyping } = useContext(SocketContext);

    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Update online count
    useEffect(() => {
        setOnlineCount(onlineUsers.length);
    }, [onlineUsers]);

    useEffect(() => {
        if (!socket) return;

        socket.on("get_message", (data) => {
            setMessages(prev => [...prev, {
                _id: data._id,
                sender: data.senderId || data.sender,
                text: typeof data.text === 'string' ? data.text : JSON.stringify(data.text),
                createdAt: new Date(data.createdAt)
            }]);
            markAsRead(data.senderId);
        });
    }, [socket]);

    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await api.get("/chat/conversations");
                setConversations(res.data);
            } catch (err) { console.log(err); }
        };

        if (user?._id) {
            getConversations();
        }
    }, [user?._id]);

    useEffect(() => {
        const getMessages = async () => {
            if (currentChat) {
                try {
                    const res = await api.get("/chat/messages/" + currentChat._id);
                    // Normalize message data
                    const normalizedMessages = res.data.map(msg => ({
                        ...msg,
                        text: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text),
                        sender: msg.senderId || msg.sender
                    }));
                    setMessages(normalizedMessages);
                } catch (err) { console.log(err); }
            }
        };
        getMessages();
    }, [currentChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const receiverId = currentChat.members.find(member => member._id !== user._id)._id;

        // Optimistic update
        const tempId = Date.now();
        setMessages(prev => [...prev, {
            _id: tempId,
            sender: user._id,
            text: newMessage,
            createdAt: new Date(),
            temp: true
        }]);

        try {
            const res = await api.post("/chat/messages", {
                conversationId: currentChat._id,
                sender: user._id,
                text: newMessage
            });

            // Replace temp message with real one
            setMessages(prev => prev.map(msg =>
                msg._id === tempId ? res.data : msg
            ));

            setNewMessage("");
        } catch (err) {
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
            console.log(err);
        }
    };

    const handleTyping = (value) => {
        setNewMessage(value);

        if (currentChat && value.trim()) {
            const friendId = currentChat.members.find(m => m._id !== user._id)?._id;
            if (friendId) {
                startTyping(friendId);

                // Clear existing timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Set new timeout to stop typing
                typingTimeoutRef.current = setTimeout(() => {
                    stopTyping(friendId);
                }, 1000);
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            // TODO: Implement file upload
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getSafeAvatarSrc = (avatar, name, fallback = 'Unknown User') => {
        if (typeof avatar === 'string' && avatar.trim()) {
            return avatar;
        }
        const safeName = typeof name === 'string' && name.trim() ? name : fallback;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=6366f1&color=fff`;
    };

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white/90 backdrop-blur-md border-r border-gray-200/50 flex-shrink-0 flex-col shadow-xl`}>
                <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-500 to-purple-600">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageCircle size={24} />
                            Tin nhắn
                        </h2>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-white/20 rounded-lg md:hidden transition-colors"
                        >
                            <MoreVertical size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder-gray-500 text-gray-700"
                        />
                    </div>
                </div>

                {/* Online users */}
                <div className="p-4 border-b border-gray-100/50 bg-gray-50/30">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Online ({onlineCount})
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {onlineUsers.slice(0, 5).map((onlineUser, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <Circle className="w-2 h-2 fill-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {onlineUser.userId === user._id ? 'Bạn' : onlineUser.userName || 'User ' + onlineUser.userId}
                                    </p>
                                    <p className="text-xs text-green-600 font-medium">Đang hoạt động</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-3">
                        {conversations.map((c, index) => {
                            const friend = c.members.find(m => m._id !== user._id);
                            const isOnline = friend && onlineUsers.some(u => u.userId === friend._id);
                            const unreadCount = friend ? notifications.filter(n => n.senderId === friend._id).length : 0;

                            return (
                                <div
                                    key={c._id}
                                    onClick={() => {
                                        setCurrentChat(c);
                                        if (friend && friend._id) {
                                            markAsRead(friend._id);
                                        }
                                    }}
                                    className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${currentChat?._id === c._id
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0'
                                        : 'bg-white hover:bg-gray-50 border border-gray-200/50 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="relative">
                                                <img
                                                    src={getSafeAvatarSrc(friend?.avatar, friend?.name)}
                                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                                                    alt=""
                                                />
                                                {isOnline && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                                        <Circle className="w-3 h-3 fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-xs font-bold">
                                                        {typeof unreadCount === 'number' ? unreadCount : 0}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`font-semibold truncate ${currentChat?._id === c._id ? 'text-white' : 'text-gray-800'}`}>
                                                    {typeof friend?.name === 'string' ? friend.name : 'Unknown User'}
                                                </p>
                                                <span className={`text-xs ${currentChat?._id === c._id ? 'text-blue-200' : 'text-gray-600'}`}>
                                                    {isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                            <div className={`text-xs ${currentChat?._id === c._id ? 'text-blue-200' : 'text-gray-600'} line-clamp-2`}>
                                                {c.latestMessage ?
                                                    (typeof c.latestMessage === 'string'
                                                        ? (c.latestMessage.length > 30
                                                            ? c.latestMessage.substring(0, 30) + '...'
                                                            : c.latestMessage)
                                                        : (c.latestMessage.text
                                                            ? (c.latestMessage.text.length > 30
                                                                ? c.latestMessage.text.substring(0, 30) + '...'
                                                                : c.latestMessage.text)
                                                            : 'No message'))
                                                    : 'Bắt đầu trò chuyện...'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={getSafeAvatarSrc(currentChat.members.find(m => m._id !== user._id)?.avatar, currentChat.members.find(m => m._id !== user._id)?.name)}
                                            className="w-12 h-12 rounded-2xl object-cover border-3 border-white shadow-lg"
                                            alt=""
                                        />
                                        {onlineUsers.some(u => u.userId === currentChat.members.find(m => m._id !== user._id)?._id) && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                                <Circle className="w-3 h-3 fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {currentChat.members.find(m => m._id !== user._id)?.name || 'Unknown User'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            {onlineUsers.some(u => u.userId === currentChat.members.find(m => m._id !== user._id)?._id) ? (
                                                <>
                                                    <Circle className="w-2 h-2 fill-green-500" />
                                                    <span className="text-green-600 font-medium">Online</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="w-2 h-2 fill-gray-400" />
                                                    <span className="text-gray-600">Offline</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Phone size={18} className="text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Mail size={18} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentChat(null)}
                                        className="p-2 hover:bg-red-50 rounded-xl transition-colors group"
                                    >
                                        <span className="text-gray-600 group-hover:text-red-500 transition-colors">✕</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((message, index) => {
                                const isOwn = typeof message.sender === 'object' ? message.sender._id === user._id : message.sender === user._id;
                                const showTypingIndicator = !isOwn && typingUsers.has(typeof message.sender === 'object' ? message.sender._id : message.sender);

                                return (
                                    <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-6 group`}>
                                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-2' : 'order-1'} flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {!isOwn && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <img
                                                        src={getSafeAvatarSrc(
                                                            typeof message.sender === 'object' ? message.sender?.avatar : null,
                                                            typeof message.sender === 'object' ? message.sender?.name : 'User'
                                                        )}
                                                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                                                        alt=""
                                                    />
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {typeof message.sender === 'object' ? message.sender?.name : 'User'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`relative group-hover:scale-105 transition-transform duration-200 ${isOwn ? 'order-2' : 'order-1'}`}>
                                                <div className={`rounded-2xl px-5 py-3 shadow-xl hover:shadow-2xl transition-shadow duration-200 ${isOwn
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-2xl shadow-blue-500/25'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-2xl shadow-gray-300/50'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed break-words">
                                                        {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
                                                    </p>
                                                    {showTypingIndicator && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-xs mt-2 font-medium ${isOwn ? 'text-blue-400 text-right' : 'text-gray-800 text-left'
                                                    }`}>
                                                    {formatTime(message.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 p-6 shadow-lg">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                    <div className="flex items-center bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-l-2xl transition-all duration-200"
                                        >
                                            <Paperclip size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white transition-all duration-200"
                                        >
                                            <Smile size={18} />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => handleTyping(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder="Nhập tin nhắn..."
                                            className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-600"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                        <div className="text-center max-w-md mx-auto p-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <MessageCircle size={48} className="text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Chọn một cuộc trò chuyện</h3>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                Hãy chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu trò chuyện với người khác
                            </p>
                            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Bắt đầu chat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Kết nối</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatNew;
