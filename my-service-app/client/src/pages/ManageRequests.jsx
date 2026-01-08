import { useEffect, useState } from 'react';
import api from '../services/api';
import { Star, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ManageRequests = () => {
    const [requests, setRequests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/requests/my-requests');
            // Lọc chỉ lấy những cái còn mở (closed nghĩa là đã chọn thợ rồi)
            setRequests(res.data.data.filter(r => r.status === 'open'));
        } catch (error) {
            console.error(error);
        }
    };

    const handleChooseProvider = async (requestId, providerId) => {
        if(!window.confirm("Bạn chọn thợ này? Hệ thống sẽ tạo đơn hàng ngay lập tức.")) return;
        try {
            await api.put(`/requests/${requestId}/choose`, { providerId });
            toast.success("Đã chọn thợ! Kiểm tra mục Đơn hàng.");
            navigate('/my-bookings'); // Chuyển ngay sang trang đơn hàng
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi chọn");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Xóa yêu cầu này?")) return;
        try {
            await api.delete(`/requests/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            toast.success("Đã xóa");
        } catch (error) {
            toast.error("Lỗi xóa");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Quản lý yêu cầu tìm thợ</h1>

            <div className="grid gap-8">
                {requests.map((req) => (
                    <div key={req._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        {/* Header của Yêu cầu */}
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{req.title}</h3>
                                <p className="text-sm text-gray-500">Ngân sách: {req.budget.toLocaleString()} đ - Đăng lúc: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDelete(req._id)} className="text-red-500 hover:bg-red-100 p-2 rounded">
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Danh sách thợ ứng tuyển */}
                        <div className="p-4">
                            <h4 className="font-semibold text-gray-700 mb-3">
                                Danh sách thợ ứng tuyển ({req.applicants?.length || 0})
                            </h4>
                            
                            {req.applicants && req.applicants.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {req.applicants.map((app) => (
                                        <div key={app._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition">
                                            <div className="flex items-center gap-3">
                                                <img src={app.avatar} className="w-10 h-10 rounded-full" alt="ava" />
                                                <div>
                                                    <p className="font-bold text-sm">{app.name}</p>
                                                    <div className="flex items-center text-xs text-yellow-500">
                                                        <Star size={12} fill="currentColor" /> 
                                                        <span className="ml-1">{app.rating || 0} ({app.reviewCount || 0} đánh giá)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleChooseProvider(req._id, app._id)}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-700 flex items-center"
                                            >
                                                <CheckCircle size={14} className="mr-1" /> Chọn
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Chưa có thợ nào ứng tuyển. Hãy chờ thêm nhé.</p>
                            )}
                        </div>
                    </div>
                ))}

                {requests.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500 mb-4">Bạn không có yêu cầu nào đang tìm thợ.</p>
                        <a href="/post-request" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700">Đăng yêu cầu mới</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageRequests;