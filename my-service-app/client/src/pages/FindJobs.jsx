import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, DollarSign, Calendar, Briefcase, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api'; // Sử dụng api config sẵn của bạn
import { AuthContext } from '../context/AuthContext';

const FindJobs = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        minPrice: '',
        maxPrice: ''
    });

    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    const fetchRequests = async () => {
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await api.get(`/requests?${query}`);

            // 👇 QUAN TRỌNG: Sửa lỗi map bằng cách lấy đúng res.data.data
            setRequests(res.data.data || []);

        } catch (error) {
            console.error("Lỗi tải yêu cầu:", error);
            toast.error("Không thể tải danh sách việc làm");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Hàm xử lý ứng tuyển
    const handleApply = async (id) => {
        try {
            await api.put(`/requests/${id}/apply`);
            toast.success("Đã ứng tuyển thành công! Hãy chờ khách hàng liên hệ.");

            // Cập nhật giao diện ngay lập tức (thêm user id vào mảng applicants)
            setRequests(requests.map(req =>
                req._id === id ? { ...req, applicants: [...(req.applicants || []), user._id] } : req
            ));
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi ứng tuyển");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Việc tìm người 🛠️</h1>
                <p className="text-gray-600">Tìm kiếm các yêu cầu công việc mới nhất và ứng tuyển ngay.</p>
            </div>

            {/* --- BỘ LỌC TÌM KIẾM --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        name="search"
                        placeholder="Tìm công việc..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleFilterChange}
                    />
                </div>

                <select
                    name="category"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    onChange={handleFilterChange}
                >
                    <option value="">Tất cả danh mục</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                    <option value="Dọn dẹp">Dọn dẹp</option>
                    <option value="Vận chuyển">Vận chuyển</option>
                    <option value="Điện nước">Điện nước</option>
                </select>

                <input
                    type="number"
                    name="minPrice"
                    placeholder="Giá thấp nhất"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={handleFilterChange}
                />

                <input
                    type="number"
                    name="maxPrice"
                    placeholder="Giá cao nhất"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={handleFilterChange}
                />
            </div>

            {/* --- DANH SÁCH YÊU CẦU --- */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500 text-lg">Chưa có yêu cầu nào phù hợp.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((req) => {
                        // Kiểm tra xem user hiện tại đã ứng tuyển bài này chưa
                        const isApplied = user && req.applicants && req.applicants.includes(user._id);
                        // Kiểm tra xem bài này có phải của chính mình không
                        const isMyRequest = user && req.user?._id === user._id;

                        return (
                            <div key={req._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 flex flex-col">
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {req.category}
                                        </span>
                                        <span className="text-gray-500 text-sm flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{req.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{req.description}</p>

                                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-green-600" />
                                            <span className="font-semibold text-green-700">
                                                {req.budget ? req.budget.toLocaleString() + ' VNĐ' : 'Thỏa thuận'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span>{req.address || 'Hồ Chí Minh'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span>Hạn chót: {req.deadline ? new Date(req.deadline).toLocaleDateString('vi-VN') : 'Sớm nhất có thể'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={req.user?.avatar || "https://ui-avatars.com/api/?background=random&name=" + (req.user?.name || "User")}
                                            alt={req.user?.name}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{req.user?.name || "Người dùng ẩn"}</span>
                                            {/* 👇 ĐÃ SỬA CHÍNH TẢ: KHÁCH */}
                                            <span className="text-xs text-gray-500">
                                                {req.user?.role === 'provider' ? 'Thợ' : 'Khách'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Logic hiển thị nút bấm */}
                                    {user?.role === 'provider' ? (
                                        isApplied ? (
                                            <button disabled className="bg-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed">
                                                Đã ứng tuyển
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(req._id)}
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
                                            >
                                                <Briefcase size={14} /> Ứng tuyển
                                            </button>
                                        )
                                    ) : (
                                        // Nếu là Khách (hoặc chính chủ bài đăng)
                                        isMyRequest ? (
                                            <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded">Bài của bạn</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Dành cho Thợ</span>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FindJobs;