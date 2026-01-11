import React from 'react';
import { Link } from 'react-router-dom';

const FriendRequestsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Quản lý bạn bè</h1>
                    <div className="space-y-4">
                        <Link
                            to="/friends"
                            className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                        >
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">👥 Danh sách bạn bè</h3>
                            <p className="text-blue-700">Xem và quản lý danh sách bạn bè của bạn</p>
                        </Link>

                        <Link
                            to="/friends/requests"
                            className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
                        >
                            <h3 className="text-lg font-semibold text-green-900 mb-2">📨 Lời mời kết bạn</h3>
                            <p className="text-green-700">Xem và xử lý lời mời kết bạn</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendRequestsPage;
