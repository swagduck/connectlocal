import React, { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import toast from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const FriendRequests = () => {
    const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const history = useHistory();

    useEffect(() => {
        fetchRequests();
    }, [activeTab, currentPage]);

    // Add refresh on component mount
    useEffect(() => {
        fetchRequests();
    }, []);

    // Add refresh every 5 seconds to check for new requests
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            console.log('Fetching requests for tab:', activeTab);
            const response = activeTab === 'received'
                ? await friendService.getPendingRequests(currentPage, 10)
                : await friendService.getSentRequests(currentPage, 10);

            console.log('Requests response:', response);
            console.log('Requests data:', response.data);
            console.log('Requests data length:', response.data?.length);

            setRequests(response.data || []);
            setTotalPages(response.pagination?.pages || 1);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error(error.message || 'Không thể tải danh sách lời mời');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId, userName) => {
        try {
            await friendService.acceptRequest(requestId);
            toast.success(`Đã chấp nhận lời mời từ ${userName}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error(error.message || 'Chấp nhận lời mời thất bại');
        }
    };

    const handleRejectRequest = async (requestId, userName) => {
        try {
            await friendService.rejectRequest(requestId);
            toast.success(`Đã từ chối lời mời từ ${userName}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error(error.message || 'Từ chối lời mời thất bại');
        }
    };

    const handleCancelRequest = async (requestId, userName) => {
        try {
            await friendService.cancelRequest(requestId);
            toast.success(`Đã hủy lời mời đến ${userName}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error(error.message || 'Hủy lời mời thất bại');
        }
    };

    const handleChat = (userId) => {
        history.push(`/chat?user=${userId}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hôm nay';
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
        }
    };

    const RequestCard = ({ request, type }) => {
        const user = type === 'received' ? request.requester : request.recipient;

        return (
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name || 'User'}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                                {user.phone && (
                                    <span className="text-sm text-gray-500">
                                        📞 {user.phone}
                                    </span>
                                )}
                                <span className="text-sm text-gray-500">
                                    👥 {user.role === 'provider' ? 'Thợ' : 'Người dùng'}
                                </span>
                                {user.rating > 0 && (
                                    <span className="text-sm text-gray-500">
                                        ⭐ {user.rating.toFixed(1)} ({user.reviewCount} đánh giá)
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {formatDate(request.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        {type === 'received' ? (
                            <>
                                <button
                                    onClick={() => handleAcceptRequest(request._id, user.name || 'Unknown')}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                    Chấp nhận
                                </button>
                                <button
                                    onClick={() => handleRejectRequest(request._id, user.name || 'Unknown')}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => handleChat(user._id)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                                >
                                    <MessageCircle size={16} />
                                    Nhắn tin
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleCancelRequest(request._id, user.name || 'Unknown')}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                            >
                                Hủy lời mời
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Lời mời kết bạn</h1>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => {
                                setActiveTab('received');
                                setCurrentPage(1);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'received'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Lời mời nhận được
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('sent');
                                setCurrentPage(1);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'sent'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Lời mời đã gửi
                        </button>
                    </div>
                </div>

                {/* Requests List */}
                {loading && requests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách lời mời...</p>
                    </div>
                ) : requests.length === 0 ? (
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab === 'received' ? 'Không có lời mời nào' : 'Chưa gửi lời mời nào'}
                        </h3>
                        <p className="text-gray-600">
                            {activeTab === 'received'
                                ? 'Khi có người gửi lời mời kết bạn, họ sẽ xuất hiện ở đây'
                                : 'Bắt đầu tìm kiếm và kết bạn với những người dùng khác'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <RequestCard
                                key={request._id}
                                request={request}
                                type={activeTab}
                            />
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

export default FriendRequests;
