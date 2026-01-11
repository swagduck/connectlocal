import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { MessageSquare, Users, UserCheck, Clock, X, Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Notifications = () => {
    const { notifications, markAsRead, clearFriendRequestNotifications, testNotification } = useContext(SocketContext);
    const [filter, setFilter] = useState('all');

    console.log('🔔 Notifications page - Current notifications:', notifications);
    console.log('🔔 Notifications page - Filter:', filter);

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        return notification.type === filter;
    });

    console.log('🔔 Notifications page - Filtered notifications:', filteredNotifications);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'message':
                return <MessageSquare size={20} className="text-blue-500" />;
            case 'friend_request':
                return <Users size={20} className="text-orange-500" />;
            case 'friend_accepted':
                return <UserCheck size={20} className="text-green-500" />;
            case 'new_booking':
                return <Calendar size={20} className="text-purple-500" />;
            case 'booking_accepted':
                return <CheckCircle size={20} className="text-green-500" />;
            case 'booking_in_progress':
                return <AlertCircle size={20} className="text-yellow-500" />;
            case 'booking_completed':
                return <CheckCircle size={20} className="text-green-600" />;
            case 'booking_cancelled':
                return <XCircle size={20} className="text-red-500" />;
            default:
                return <Clock size={20} className="text-gray-500" />;
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case 'message':
                return `Tin nhắn mới từ ${notification.senderName || 'Người dùng'}`;
            case 'friend_request':
                return `${notification.requester?.name || 'Người dùng'} muốn kết bạn với bạn!`;
            case 'friend_accepted':
                return `${notification.newFriend?.name || 'Người dùng'} đã chấp nhận lời mời kết bạn!`;
            case 'new_booking':
                return `${notification.customer?.name || 'Khách hàng'} vừa đặt dịch vụ "${notification.service?.title || 'dịch vụ'}"!`;
            case 'booking_accepted':
                return `Thợ đã nhận đơn "${notification.service?.title || 'dịch vụ'}"!`;
            case 'booking_in_progress':
                return `Thợ đang thực hiện "${notification.service?.title || 'dịch vụ'}"!`;
            case 'booking_completed':
                return `Đơn "${notification.service?.title || 'dịch vụ'}" đã hoàn thành!`;
            case 'booking_cancelled':
                return `Đơn "${notification.service?.title || 'dịch vụ'}" đã bị hủy!`;
            default:
                return notification.message || 'Thông báo mới';
        }
    };

    const getNotificationLink = (notification) => {
        switch (notification.type) {
            case 'message':
                return `/chat?user=${notification.senderId}`;
            case 'friend_request':
                return '/friends/requests';
            case 'friend_accepted':
                return '/friends';
            case 'new_booking':
            case 'booking_accepted':
            case 'booking_in_progress':
            case 'booking_completed':
            case 'booking_cancelled':
                return '/my-bookings';
            default:
                return '#';
        }
    };

    const handleMarkAsRead = (notification) => {
        if (notification._id) {
            markAsRead(notification._id);
        }
    };

    const handleClearFriendRequests = () => {
        clearFriendRequestNotifications();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Thông báo</h1>
                                <p className="text-blue-100">
                                    {notifications.length} thông báo{notifications.length !== 1 ? '' : ''}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={testNotification}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                                >
                                    🧪 Test Thông Báo
                                </button>
                                <button
                                    onClick={handleClearFriendRequests}
                                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Xóa lời mời đã đọc
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex flex-wrap gap-2 p-2">
                            {[
                                'all',
                                'message',
                                'friend_request',
                                'friend_accepted',
                                'new_booking',
                                'booking_accepted',
                                'booking_completed'
                            ].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${filter === type
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {type === 'all' && 'Tất cả'}
                                    {type === 'message' && 'Tin nhắn'}
                                    {type === 'friend_request' && 'Lời mời kết bạn'}
                                    {type === 'friend_accepted' && 'Kết bạn thành công'}
                                    {type === 'new_booking' && 'Đơn mới'}
                                    {type === 'booking_accepted' && 'Đã nhận'}
                                    {type === 'booking_completed' && 'Đã hoàn thành'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="p-6">
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                    <Clock size={40} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    {filter === 'all' ? 'Chưa có thông báo nào' : `Chưa có thông báo ${filter} nào`}
                                </h3>
                                <p className="text-gray-500">
                                    {filter === 'all'
                                        ? 'Bạn sẽ nhận được thông báo khi có tin nhắn mới hoặc lời mời kết bạn.'
                                        : 'Chọn tab khác để xem các loại thông báo khác.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={`${notification._id}-${notification.type}-${notification.timestamp}`}
                                        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={getNotificationLink(notification)}
                                                    onClick={() => handleMarkAsRead(notification)}
                                                    className="block hover:text-blue-600 transition-colors duration-200"
                                                >
                                                    <p className="font-medium text-gray-900 mb-1">
                                                        {getNotificationText(notification)}
                                                    </p>
                                                    {notification.message && (
                                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        {notification.timestamp &&
                                                            formatDistanceToNow(new Date(notification.timestamp), {
                                                                addSuffix: true,
                                                                locale: vi
                                                            })
                                                        }
                                                    </p>
                                                </Link>
                                            </div>

                                            <button
                                                onClick={() => handleMarkAsRead(notification)}
                                                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                                                title="Đánh dấu đã đọc"
                                            >
                                                <X size={16} className="text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
