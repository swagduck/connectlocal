import React, { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import toast from 'react-hot-toast';

const FriendButton = ({ userId, requestId, onStatusChange }) => {
    const [status, setStatus] = useState('none');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Validate userId prop
    if (!userId) {
        console.error('FriendButton: userId prop is required');
        return (
            <button className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
                Invalid User
            </button>
        );
    }

    // Fetch friend status on component mount
    useEffect(() => {
        fetchFriendStatus();
    }, [userId]);

    const fetchFriendStatus = async () => {
        try {
            setLoading(true);
            const response = await friendService.checkStatus(userId);
            setStatus(response.status);
        } catch (error) {
            console.error('Error fetching friend status:', error);
            toast.error('Không thể kiểm tra trạng thái kết bạn');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        try {
            setActionLoading(true);
            await friendService.sendRequest(userId);
            setStatus('sent');
            toast.success('Đã gửi lời mời kết bạn!');
            onStatusChange?.('sent');
        } catch (error) {
            toast.error(error.message || 'Gửi lời mời thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            setActionLoading(true);
            await friendService.acceptRequest(requestId);
            setStatus('accepted');
            toast.success('Đã chấp nhận lời mời kết bạn!');
            onStatusChange?.('accepted');
        } catch (error) {
            toast.error(error.message || 'Chấp nhận lời mời thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            setActionLoading(true);
            await friendService.rejectRequest(requestId);
            setStatus('none');
            toast.success('Đã từ chối lời mời kết bạn');
            onStatusChange?.('none');
        } catch (error) {
            toast.error(error.message || 'Từ chối lời mời thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            setActionLoading(true);
            await friendService.cancelRequest(requestId);
            setStatus('none');
            toast.success('Đã hủy lời mời kết bạn');
            onStatusChange?.('none');
        } catch (error) {
            toast.error(error.message || 'Hủy lời mời thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnfriend = async (friendId) => {
        const confirmDialog = window.confirm(
            `⚠️ CẢNH BÁO ⚠️\n\n` +
            `Bạn có chắc chắn muốn hủy kết bạn?\n\n` +
            `Hành động này không thể hoàn tác!`
        );

        if (!confirmDialog) {
            return;
        }

        try {
            setActionLoading(true);
            await friendService.unfriend(friendId);
            setStatus('none');
            toast.success('Đã hủy kết bạn');
            onStatusChange?.('none');
        } catch (error) {
            toast.error(error.message || 'Hủy kết bạn thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <button className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
                Đang tải...
            </button>
        );
    }

    // Render based on status
    switch (status) {
        case 'none':
            return (
                <button
                    onClick={handleSendRequest}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {actionLoading ? 'Đang gửi...' : 'Kết bạn'}
                </button>
            );

        case 'sent':
            return (
                <button
                    onClick={() => handleCancelRequest(requestId)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {actionLoading ? 'Đang hủy...' : 'Hủy lời mời'}
                </button>
            );

        case 'received':
            return (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAcceptRequest(requestId)}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        {actionLoading ? 'Đang xử lý...' : 'Chấp nhận'}
                    </button>
                    <button
                        onClick={() => handleRejectRequest(requestId)}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                </div>
            );

        case 'accepted':
            return (
                <button
                    onClick={() => handleUnfriend(userId)}
                    disabled={actionLoading}
                    className="group px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 hover:px-4 hover:py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-in-out text-xs hover:text-sm flex items-center gap-1"
                    title="Hủy kết bạn"
                >
                    <span className="group-hover:hidden">{actionLoading ? '...' : '❌'}</span>
                    <span className="hidden group-hover:inline">{actionLoading ? 'Đang hủy...' : '❌ Hủy kết bạn'}</span>
                </button>
            );

        case 'self':
            return (
                <button className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
                    Profile của bạn
                </button>
            );

        default:
            return null;
    }
};

export default FriendButton;
