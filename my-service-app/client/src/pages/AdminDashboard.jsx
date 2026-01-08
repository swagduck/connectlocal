import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, ShoppingBag, Calendar, Trash2, Search, Shield, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview'); 
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Ảnh mặc định khi không có hình ảnh hoặc link rỗng
    const placeholderImg = "https://placehold.co/150x150?text=No+Image";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, servicesRes, bookingsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/services'),
                api.get('/admin/bookings')
            ]);
            
            // Hàm xử lý thông minh: lấy mảng dữ liệu bất kể Backend trả về cấu trúc nào
            const getArray = (res) => {
                const raw = res.data;
                if (Array.isArray(raw)) return raw; // Nếu là [ ]
                if (raw.data && Array.isArray(raw.data)) return raw.data; // Nếu là { data: [ ] }
                if (raw.services && Array.isArray(raw.services)) return raw.services; // Nếu là { services: [ ] }
                if (raw.bookings && Array.isArray(raw.bookings)) return raw.bookings; // Nếu là { bookings: [ ] }
                return [];
            };

            setStats(statsRes.data?.data || statsRes.data);
            setUsers(getArray(usersRes));
            setServices(getArray(servicesRes));
            setBookings(getArray(bookingsRes));

            // LOG ĐỂ KIỂM TRA (F12 xem cái này)
            console.log("Services sau khi xử lý:", getArray(servicesRes));
            console.log("Bookings sau khi xử lý:", getArray(bookingsRes));

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
            await api.put(`/bookings/${id}`, { status });
            toast.success(`Đã cập nhật đơn hàng thành: ${status}`);
            setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
        } catch (error) { toast.error("Lỗi cập nhật đơn hàng"); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            confirmed: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800"
        };
        const labels = {
            pending: "Chờ xác nhận", confirmed: "Đang làm", completed: "Hoàn thành", cancelled: "Đã hủy"
        };
        return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
    };

    if (loading) return <div className="text-center mt-20 p-10 bg-white shadow-sm rounded-lg mx-auto max-w-sm">Đang tải dữ liệu hệ thống...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Shield className="text-red-600" /> Trang Quản Trị Viên
            </h1>

            {/* --- MENU TABS --- */}
            <div className="flex gap-2 mb-8 border-b overflow-x-auto">
                {['overview', 'users', 'services', 'bookings'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        {tab === 'overview' ? 'Tổng quan' : tab === 'users' ? 'Người dùng' : tab === 'services' ? 'Dịch vụ' : 'Đơn hàng'}
                    </button>
                ))}
            </div>

            {/* --- TAB 1: OVERVIEW --- */}
            {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow border border-blue-100">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 font-medium">Thành viên</h3><Users className="text-blue-500" /></div>
                        <p className="text-3xl font-bold text-gray-800">{stats.users || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-green-100">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 font-medium">Dịch vụ</h3><ShoppingBag className="text-green-500" /></div>
                        <p className="text-3xl font-bold text-gray-800">{stats.services || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-purple-100">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 font-medium">Đơn hàng</h3><Calendar className="text-purple-500" /></div>
                        <p className="text-3xl font-bold text-gray-800">{stats.bookings || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-yellow-100">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 font-medium">Tìm thợ</h3><Search className="text-yellow-500" /></div>
                        <p className="text-3xl font-bold text-gray-800">{stats.requests || 0}</p>
                    </div>
                </div>
            )}

            {/* --- TAB 2: USERS --- */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Danh sách Users ({users.length})</h3>
                        <input type="text" placeholder="Tìm user..." className="border p-2 rounded w-64 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                <tr><th className="p-4">Info</th><th className="p-4">Role</th><th className="p-4">Ngày tham gia</th><th className="p-4">Hành động</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50">
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={u.avatar || placeholderImg} className="w-8 h-8 rounded-full object-cover bg-gray-200" alt="avt" />
                                            <div><p className="font-bold">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                        </td>
                                        <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role==='admin'?'bg-red-100 text-red-600':u.role==='provider'?'bg-green-100 text-green-600':'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                                        <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {u.role !== 'admin' && <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>}
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
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-700">Tất cả Dịch vụ ({services.length})</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                <tr><th className="p-4">Dịch vụ</th><th className="p-4">Người đăng</th><th className="p-4">Giá</th><th className="p-4">Hành động</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {services.map(s => (
                                    <tr key={s._id} className="hover:bg-gray-50">
                                        <td className="p-4 flex items-center gap-3">
                                            {/* FIX LỖI SRC="" TẠI ĐÂY */}
                                            <img 
                                                src={(s.images && s.images.length > 0 && s.images[0] !== "") ? s.images[0] : placeholderImg} 
                                                className="w-12 h-12 rounded object-cover border" 
                                                alt="service" 
                                            />
                                            <div><p className="font-bold line-clamp-1">{s.title}</p><span className="text-xs bg-blue-50 text-blue-600 px-1 rounded">{s.category}</span></div>
                                        </td>
                                        <td className="p-4"><Link to={`/u/${s.user?._id}`} className="hover:text-blue-600 hover:underline">{s.user?.name || 'N/A'}</Link></td>
                                        <td className="p-4 font-medium text-blue-600">{s.price?.toLocaleString()}đ</td>
                                        <td className="p-4 flex gap-2">
                                            <Link to={`/services/${s._id}`} target="_blank" className="text-gray-500 hover:bg-gray-100 p-2 rounded"><Eye size={18}/></Link>
                                            <button onClick={() => handleDeleteService(s._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
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
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-700">Tất cả Đơn hàng ({bookings.length})</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                                <tr><th className="p-4">Đơn hàng</th><th className="p-4">Các bên</th><th className="p-4">Trạng thái</th><th className="p-4">Can thiệp Admin</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {bookings.map(b => (
                                    <tr key={b._id} className="hover:bg-gray-50">
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
                                                    <button onClick={() => handleAdminUpdateBooking(b._id, 'cancelled')} className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1"><XCircle size={14} /> Hủy</button>
                                                    <button onClick={() => handleAdminUpdateBooking(b._id, 'completed')} className="bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1"><CheckCircle size={14} /> Duyệt</button>
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
        </div>
    );
};

export default AdminDashboard;