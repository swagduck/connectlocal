import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, ShoppingBag, Calendar, Trash2, Search, Shield, Eye, CheckCircle, XCircle, MessageSquare, AlertTriangle, TrendingUp, Clock, DollarSign, FileText, Settings, Ban, UserCheck, Star, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Ảnh mặc định khi không có hình ảnh hoặc link rỗng
    const placeholderImg = "https://placehold.co/150x150?text=No+Image";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, servicesRes, bookingsRes, requestsRes, transactionsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/services'),
                api.get('/admin/bookings'),
                api.get('/admin/requests'),
                api.get('/admin/transactions')
            ]);

            // Hàm xử lý thông minh: lấy mảng dữ liệu bất kể Backend trả về cấu trúc nào
            const getArray = (res) => {
                const raw = res.data;
                if (Array.isArray(raw)) return raw; // Nếu là [ ]
                if (raw.data && Array.isArray(raw.data)) return raw.data; // Nếu là { data: [ ] }
                if (raw.services && Array.isArray(raw.services)) return raw.services; // Nếu là { services: [ ] }
                if (raw.bookings && Array.isArray(raw.bookings)) return raw.bookings; // Nếu là { bookings: [ ] }
                if (raw.requests && Array.isArray(raw.requests)) return raw.requests; // Nếu là { requests: [ ] }
                if (raw.transactions && Array.isArray(raw.transactions)) return raw.transactions; // Nếu là { transactions: [ ] }
                return [];
            };

            setStats(statsRes.data?.data || statsRes.data);
            setUsers(getArray(usersRes));
            setServices(getArray(servicesRes));
            setBookings(getArray(bookingsRes));
            setRequests(getArray(requestsRes));
            setTransactions(getArray(transactionsRes));

        } catch (error) {
            console.error("Lỗi API Admin:", error.response || error);
            toast.error("Không thể tải dữ liệu Admin. Kiểm tra quyền truy cập.");
        } finally {
            setLoading(false);
        }
    };

    // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG ---
    const handleDeleteUser = async (id) => {
        if (!window.confirm("CẢNH BÁO: Xóa user sẽ xóa hết dữ liệu liên quan. Tiếp tục?")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success("Đã xóa User");
            setUsers(users.filter(u => u._id !== id));
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data?.data || statsRes.data);
        } catch (error) { toast.error("Lỗi xóa user"); }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm("Xóa dịch vụ này vì vi phạm quy định?")) return;
        try {
            await api.delete(`/services/${id}`);
            toast.success("Đã xóa dịch vụ vi phạm");
            setServices(services.filter(s => s._id !== id));
        } catch (error) { toast.error("Lỗi xóa dịch vụ"); }
    };

    const handleAdminUpdateBooking = async (id, status) => {
        const actionText = status === 'cancelled' ? 'HỦY & HOÀN TIỀN' : 'HOÀN THÀNH';
        if (!window.confirm(`Bạn muốn cưỡng chế chuyển trạng thái đơn này sang: ${actionText}?`)) return;
        try {
            await api.put(`/admin/bookings/${id}`, { status });
            toast.success(`Đã cập nhật đơn hàng thành: ${status}`);
            setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
        } catch (error) { toast.error("Lỗi cập nhật đơn hàng"); }
    };

    const handleUpdateRequest = async (id, status) => {
        const actionText = status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI';
        if (!window.confirm(`Bạn muốn ${actionText} yêu cầu này?`)) return;
        try {
            await api.put(`/admin/requests/${id}`, { status });
            toast.success(`Đã ${actionText} yêu cầu`);
            setRequests(requests.map(r => r._id === id ? { ...r, status } : r));
        } catch (error) { toast.error("Lỗi cập nhật yêu cầu"); }
    };

    const handleBanUser = async (id) => {
        if (!window.confirm("CẢNH BÁO: Ban user này sẽ khóa tài khoản vĩnh viễn. Tiếp tục?")) return;
        try {
            await api.put(`/admin/users/${id}/ban`);
            toast.success("Đã ban user");
            setUsers(users.map(u => u._id === id ? { ...u, banned: true } : u));
        } catch (error) { toast.error("Lỗi ban user"); }
    };

    const handleUnbanUser = async (id) => {
        if (!window.confirm("Mở khóa tài khoản user này?")) return;
        try {
            await api.put(`/admin/users/${id}/unban`);
            toast.success("Đã mở khóa user");
            setUsers(users.map(u => u._id === id ? { ...u, banned: false } : u));
        } catch (error) { toast.error("Lỗi mở khóa user"); }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm("Xóa yêu cầu này? Hành động này không thể hoàn tác!")) return;
        try {
            await api.delete(`/admin/requests/${id}`);
            toast.success("Đã xóa yêu cầu");
            setRequests(requests.filter(r => r._id !== id));
        } catch (error) { toast.error("Lỗi xóa yêu cầu"); }
    };

    const handleUpdateTransactionStatus = async (id, status) => {
        const actionText = status === 'completed' ? 'DUYỆT' : 'HỦY';
        if (!window.confirm(`Bạn muốn ${actionText} giao dịch nạp tiền này?`)) return;
        try {
            await api.put(`/admin/transactions/${id}`, { status });
            toast.success(`Đã ${actionText} giao dịch`);
            setTransactions(transactions.map(t => t._id === id ? { ...t, status } : t));
        } catch (error) { toast.error("Lỗi cập nhật giao dịch"); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            confirmed: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800"
        };
        const labels = {
            pending: "Chờ xác nhận", confirmed: "Đang làm", completed: "Hoàn thành", cancelled: "Đã hủy",
            approved: "Đã duyệt", rejected: "Đã từ chối"
        };
        return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <p className="mt-4 text-gray-600 font-medium animate-pulse">Đang tải dữ liệu quản trị...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 animate-fade-in">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                        <div className="relative">
                            <Shield className="text-red-600" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        </div>
                        Trang Quản Trị Viên
                    </h1>

                    {/* --- MENU TABS --- */}
                    <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: TrendingUp },
                            { id: 'users', label: 'Người dùng', icon: Users },
                            { id: 'services', label: 'Dịch vụ', icon: ShoppingBag },
                            { id: 'bookings', label: 'Đơn hàng', icon: Calendar },
                            { id: 'requests', label: 'Yêu cầu', icon: FileText },
                            { id: 'transactions', label: 'Giao dịch', icon: DollarSign }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group pb-3 px-4 font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-blue-500 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                {tab.label}
                                {tab.id === 'requests' && requests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-bounce">
                                        {requests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* --- TAB 1: OVERVIEW --- */}
                    {activeTab === 'overview' && stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in-up">
                            <div className="group bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-500 font-medium">Thành viên</h3>
                                    <Users className="text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{stats.users || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Tổng số người dùng</p>
                            </div>
                            <div className="group bg-white p-6 rounded-xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-500 font-medium">Dịch vụ</h3>
                                    <ShoppingBag className="text-green-500 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{stats.services || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Dịch vụ đăng ký</p>
                            </div>
                            <div className="group bg-white p-6 rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-500 font-medium">Đơn hàng</h3>
                                    <Calendar className="text-purple-500 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{stats.bookings || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Giao dịch thành công</p>
                            </div>
                            <div className="group bg-white p-6 rounded-xl shadow-lg border border-yellow-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-500 font-medium">Yêu cầu</h3>
                                    <FileText className="text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{stats.requests || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Yêu cầu tìm thợ</p>
                            </div>
                            <div className="group bg-white p-6 rounded-xl shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-500 font-medium">Doanh thu</h3>
                                    <DollarSign className="text-red-500 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{(stats.revenue || 0).toLocaleString()}đ</p>
                                <p className="text-sm text-gray-500 mt-1">Tổng doanh thu</p>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: USERS --- */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Users size={20} />
                                    Danh sách Users ({users.length})
                                </h3>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm user..."
                                        className="border pl-10 pr-4 py-2 rounded-lg w-64 outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                        <tr>
                                            <th className="p-4">Info</th>
                                            <th className="p-4">Role</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Ngày tham gia</th>
                                            <th className="p-4">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((u, index) => (
                                            <tr key={u._id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img src={u.avatar || placeholderImg} className="w-10 h-10 rounded-full object-cover bg-gray-200 border-2 border-white shadow-sm" alt="avt" />
                                                            {u.banned && (
                                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs p-0.5 rounded-full">
                                                                    <Ban size={10} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{u.name}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-600' :
                                                        u.role === 'provider' ? 'bg-green-100 text-green-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {u.banned ? (
                                                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">Đã khóa</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">Hoạt động</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        {u.role !== 'admin' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleDeleteUser(u._id)}
                                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors group"
                                                                    title="Xóa user"
                                                                >
                                                                    <Trash2 size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                                </button>
                                                                {!u.banned ? (
                                                                    <button
                                                                        onClick={() => handleBanUser(u._id)}
                                                                        className="text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors group"
                                                                        title="Khóa user"
                                                                    >
                                                                        <Ban size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleUnbanUser(u._id)}
                                                                        className="text-green-500 hover:bg-green-50 p-2 rounded-lg transition-colors group"
                                                                        title="Mở khóa"
                                                                    >
                                                                        <UserCheck size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 3: SERVICES --- */}
                    {activeTab === 'services' && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <ShoppingBag size={20} />
                                    Tất cả Dịch vụ ({services.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                        <tr>
                                            <th className="p-4">Dịch vụ</th>
                                            <th className="p-4">Người đăng</th>
                                            <th className="p-4">Giá</th>
                                            <th className="p-4">Đánh giá</th>
                                            <th className="p-4">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {services.map((s, index) => (
                                            <tr key={s._id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={(s.images && s.images.length > 0 && s.images[0] !== "") ? s.images[0] : placeholderImg}
                                                            className="w-12 h-12 rounded object-cover border shadow-sm"
                                                            alt="service"
                                                        />
                                                        <div>
                                                            <p className="font-bold line-clamp-1">{s.title}</p>
                                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s.category}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Link to={`/u/${s.user?._id}`} className="hover:text-blue-600 hover:underline transition-colors">
                                                        {s.user?.name || 'N/A'}
                                                    </Link>
                                                </td>
                                                <td className="p-4 font-medium text-blue-600">{s.price?.toLocaleString()}đ</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <Star size={14} fill="currentColor" />
                                                        <span className="text-gray-600 text-sm">{s.averageRating || 0}</span>
                                                        <span className="text-gray-400 text-xs">({s.reviewCount || 0})</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/services/${s._id}`}
                                                            target="_blank"
                                                            className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors group"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteService(s._id)}
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors group"
                                                            title="Xóa dịch vụ"
                                                        >
                                                            <Trash2 size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 4: BOOKINGS --- */}
                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar size={20} />
                                    Tất cả Đơn hàng ({bookings.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                        <tr>
                                            <th className="p-4">Đơn hàng</th>
                                            <th className="p-4">Các bên</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Can thiệp Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {bookings.map((b, index) => (
                                            <tr key={b._id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <td className="p-4">
                                                    <p className="font-bold text-xs text-gray-400">#{b._id?.slice(-6)}</p>
                                                    <p className="font-medium truncate max-w-[150px]">{b.service?.title || "Dịch vụ đã xóa"}</p>
                                                    <p className="text-xs text-gray-500">{new Date(b.createdAt || b.date).toLocaleDateString('vi-VN')}</p>
                                                </td>
                                                <td className="p-4 text-xs">
                                                    <p>👤 Khách: <b>{b.user?.name || 'Ẩn danh'}</b></p>
                                                    <p>🛠️ Thợ: <b>{b.provider?.name || 'N/A'}</b></p>
                                                </td>
                                                <td className="p-4">{getStatusBadge(b.status)}</td>
                                                <td className="p-4">
                                                    {(b.status !== 'completed' && b.status !== 'cancelled') ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAdminUpdateBooking(b._id, 'cancelled')}
                                                                className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1 transition-colors"
                                                            >
                                                                <XCircle size={14} /> Hủy
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdminUpdateBooking(b._id, 'completed')}
                                                                className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1 transition-colors"
                                                            >
                                                                <CheckCircle size={14} /> Duyệt
                                                            </button>
                                                        </div>
                                                    ) : <span className="text-gray-400 italic text-xs">Đã kết thúc</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 5: REQUESTS (MỚI THÊM) --- */}
                    {activeTab === 'requests' && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <FileText size={20} />
                                    Yêu cầu tìm thợ ({requests.length})
                                    {requests.filter(r => r.status === 'pending').length > 0 && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                            {requests.filter(r => r.status === 'pending').length} chờ duyệt
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                        <tr>
                                            <th className="p-4">Yêu cầu</th>
                                            <th className="p-4">Người đăng</th>
                                            <th className="p-4">Danh mục</th>
                                            <th className="p-4">Ngày đăng</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {requests.map((r, index) => (
                                            <tr key={r._id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <td className="p-4">
                                                    <div className="max-w-[200px]">
                                                        <p className="font-medium line-clamp-2">{r.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{r.description}</p>
                                                        {r.budget && (
                                                            <p className="text-sm text-blue-600 font-medium mt-1">Ngân sách: {r.budget.toLocaleString()}đ</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <img src={r.user?.avatar || placeholderImg} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                                        <div>
                                                            <p className="font-medium text-sm">{r.user?.name || 'Ẩn danh'}</p>
                                                            <p className="text-xs text-gray-500">{r.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs font-medium">
                                                        {r.category || 'Khác'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs">
                                                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="p-4">{getStatusBadge(r.status)}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        {r.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateRequest(r._id, 'approved')}
                                                                    className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1 transition-colors"
                                                                >
                                                                    <CheckCircle size={14} /> Duyệt
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateRequest(r._id, 'rejected')}
                                                                    className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1 transition-colors"
                                                                >
                                                                    <XCircle size={14} /> Từ chối
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors group"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequest(r._id)}
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors group"
                                                            title="Xóa yêu cầu"
                                                        >
                                                            <Trash2 size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 6: TRANSACTIONS (MỚI THÊM) --- */}
                    {activeTab === 'transactions' && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <CreditCard size={20} />
                                    Giao dịch ({transactions.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                        <tr>
                                            <th className="p-4">Người dùng</th>
                                            <th className="p-4">Số tiền</th>
                                            <th className="p-4">Loại</th>
                                            <th className="p-4">Phương thức</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Ngày tạo</th>
                                            <th className="p-4">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {transactions.map((t, index) => (
                                            <tr key={t._id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <img src={t.user?.avatar || placeholderImg} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                                        <div>
                                                            <p className="font-medium text-sm">{t.user?.name || 'Ẩn danh'}</p>
                                                            <p className="text-xs text-gray-500">{t.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`font-bold text-lg ${t.type === 'deposit' ? 'text-green-600' : t.type === 'refund' ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {t.type === 'deposit' ? '+' : t.type === 'refund' ? '-' : ''}
                                                        {t.amount?.toLocaleString()}đ
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${t.type === 'deposit' ? 'bg-green-100 text-green-700' :
                                                        t.type === 'refund' ? 'bg-blue-100 text-blue-700' :
                                                            t.type === 'payment' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {t.type === 'deposit' ? 'Nạp tiền' :
                                                            t.type === 'refund' ? 'Hoàn tiền' :
                                                                t.type === 'payment' ? 'Thanh toán' : 'Rút tiền'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-gray-500 uppercase">{t.paymentMethod || 'momo'}</span>
                                                </td>
                                                <td className="p-4">{getStatusBadge(t.status)}</td>
                                                <td className="p-4 text-gray-500 text-xs">
                                                    {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        {t.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateTransactionStatus(t._id, 'cancelled')}
                                                                className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1 transition-colors"
                                                            >
                                                                <XCircle size={14} /> Hủy
                                                            </button>
                                                        )}
                                                        {t.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateTransactionStatus(t._id, 'completed')}
                                                                className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1 transition-colors ml-2"
                                                            >
                                                                <CheckCircle size={14} /> Duyệt
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
