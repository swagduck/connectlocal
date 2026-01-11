import React, { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import toast from 'react-hot-toast';
import { useHistory } from 'react-router-dom';

const FriendsList = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const history = useHistory();

    useEffect(() => {
        fetchFriends();
    }, [currentPage, searchTerm]);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const response = await friendService.getFriends(currentPage, 20);
            setFriends(response.data);
            setTotalPages(response.pagination.pages);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách bạn bè');
        } finally {
            setLoading(false);
        }
    };

    const handleUnfriend = async (friendId, friendName) => {
        const confirmDialog = window.confirm(
            `⚠️ CẢNH BÁO ⚠️\n\n` +
            `Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?\n\n` +
            `Hành động này không thể hoàn tác!`
        );

        if (!confirmDialog) {
            return;
        }

        try {
            await friendService.unfriend(friendId);
            toast.success(`Đã hủy kết bạn với ${friendName}`);
            fetchFriends(); // Refresh list
        } catch (error) {
            toast.error(error.message || 'Hủy kết bạn thất bại');
        }
    };

    const handleChat = (friendId) => {
        // Navigate to chat with this friend
        history.push(`/chat?user=${friendId}`);
    };

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading && friends.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách bạn bè...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Danh sách bạn bè</h1>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bạn bè theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Friends List */}
                {filteredFriends.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy bạn bè nào' : 'Chưa có bạn bè nào'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Bắt đầu kết bạn với những người dùng khác để thấy họ ở đây!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFriends.map((friend) => (
                            <div key={friend._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {friend.avatar ? (
                                                <img
                                                    src={friend.avatar}
                                                    alt={friend.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-600 font-medium">
                                                        {friend.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Friend Info */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{friend.name}</h3>
                                            <p className="text-sm text-gray-600">{friend.email}</p>
                                            <div className="flex items-center space-x-4 mt-1">
                                                {friend.phone && (
                                                    <span className="text-sm text-gray-500">
                                                        📞 {friend.phone}
                                                    </span>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    👥 {friend.role === 'provider' ? 'Thợ' : 'Người dùng'}
                                                </span>
                                                {friend.rating > 0 && (
                                                    <span className="text-sm text-gray-500">
                                                        ⭐ {friend.rating.toFixed(1)} ({friend.reviewCount} đánh giá)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Kết bạn từ {formatDate(friend.becameFriends)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleChat(friend._id)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                        >
                                            💬 Nhắn tin
                                        </button>
                                        <button
                                            onClick={() => handleUnfriend(friend._id, friend.name)}
                                            className="group px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 hover:px-4 hover:py-2 transition-all duration-700 ease-in-out text-xs hover:text-sm flex items-center gap-1"
                                            title="Hủy kết bạn"
                                        >
                                            <span className="group-hover:hidden">❌</span>
                                            <span className="hidden group-hover:inline">❌ Hủy kết bạn</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang trước
                            </button>

                            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                                Trang {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsList;
