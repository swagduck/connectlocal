import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, Trash2, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import FreeMapWithDirections from '../components/FreeMapWithDirections';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(null);
    const { user, refreshUser } = useContext(AuthContext);

    useEffect(() => {
        if (user?._id) {
            fetchBookings();
        }
    }, [user?._id]);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setBookings(res.data.bookings);
        } catch (error) {
            console.error(error);
            toast.error("Không tải được danh sách đơn");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            // Xác nhận trước khi hủy
            const actionText = newStatus === 'cancelled' ? 'HỦY' : getStatusText(newStatus);
            if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đơn hàng này không?`)) return;

            await api.put(`/bookings/${id}`, { status: newStatus });

            if (newStatus === 'cancelled') {
                toast.success("Đã hủy đơn và hoàn tiền cho khách!");
            } else if (newStatus === 'completed') {
                toast.success("🎉 Đã hoàn thành công việc! Tiền đã được chuyển vào ví của bạn.");
            } else {
                toast.success("Cập nhật trạng thái thành công!");
            }

            // Refresh lại user data để cập nhật số dư ví
            await refreshUser();
            // Refresh lại danh sách để cập nhật số dư ví
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };

    // Hàm XÓA ĐƠN HÀNG
    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đơn này khỏi lịch sử không?")) return;

        try {
            await api.delete(`/bookings/${id}`);
            toast.success("Đã xóa đơn hàng!");
            // Xóa khỏi danh sách đang hiển thị
            setBookings(bookings.filter(b => b._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi xóa đơn");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Đang chờ';
            case 'confirmed': return 'Đang thực hiện';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    if (loading || !user?._id) return <div className="text-center mt-20">Đang tải danh sách đơn...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                {user?.role === 'provider' ? '📋 Quản lý công việc' : '📅 Lịch sử đặt dịch vụ'}
            </h1>

            {bookings.length === 0 ? (
                <div className="text-center bg-white p-10 rounded-lg shadow border">
                    <p className="text-gray-500 mb-4">Danh sách trống trơn.</p>
                    <Link to="/" className="text-blue-600 hover:underline font-medium">Về trang chủ</Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition relative group">

                            {/* NÚT XÓA ĐƠN (Nằm góc trên phải) */}
                            <button
                                onClick={() => handleDeleteBooking(booking._id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                                title="Xóa đơn này"
                            >
                                <Trash2 size={20} />
                            </button>

                            {/* Ảnh dịch vụ */}
                            <img
                                src={booking.service?.images[0] || 'https://via.placeholder.com/150'}
                                alt="Service"
                                className="w-full md:w-48 h-32 object-cover rounded-lg border"
                            />

                            {/* Thông tin chính */}
                            <div className="flex-1 pr-10"> {/* pr-10 để tránh đè nút xóa */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-900">{booking.service?.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(booking.status)}`}>
                                        {getStatusText(booking.status)}
                                    </span>
                                </div>

                                <p className="text-blue-600 font-bold mb-4 text-lg">
                                    {booking.service?.price?.toLocaleString('vi-VN')} đ
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center">
                                        <Calendar size={16} className="mr-2 text-blue-500" />
                                        <span className="font-medium">{new Date(booking.date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-2 text-blue-500" />
                                        <span className="font-medium">{new Date(booking.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <div className="flex items-center col-span-1 md:col-span-2 pt-2 border-t mt-2">
                                        <User size={16} className="mr-2 text-gray-500" />
                                        <span className="text-gray-700">
                                            {user?.role === 'provider'
                                                ? <>Khách: <b>{booking.user?.name}</b> - 📞 {booking.user?.phone}</>
                                                : <>Thợ: <b>{booking.provider?.name}</b></>
                                            }
                                        </span>
                                    </div>
                                </div>

                                {booking.note && (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-600 mb-4">
                                        📝 Ghi chú: {booking.note}
                                    </div>
                                )}

                                {/* --- KHU VỰC NÚT BẤM CHO THỢ --- */}
                                {user?.role === 'provider' && (
                                    <div className="flex gap-3 mt-4 pt-4 border-t">
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                                                    className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                                                >
                                                    <CheckCircle size={18} /> Nhận đơn
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                                                    className="flex items-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
                                                >
                                                    <XCircle size={18} /> Từ chối
                                                </button>
                                            </>
                                        )}

                                        {booking.status === 'confirmed' && (
                                            <>
                                                <button
                                                    onClick={() => setShowMap(showMap === booking._id ? null : booking._id)}
                                                    className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                                                >
                                                    <Navigation size={18} /> Theo dõi
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking._id, 'completed')}
                                                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                                                >
                                                    <CheckCircle size={18} /> Xác nhận đã làm xong
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* BẢN ĐỒ THEO DÕI */}
                            {showMap === booking._id && (
                                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Navigation size={20} className="text-green-600" />
                                        Bản đồ chỉ đường đến khách hàng
                                    </h4>
                                    <FreeMapWithDirections
                                        origin={user?.location?.lat && user?.location?.lng ? user.location : { lat: 10.8231, lng: 106.6297 }}
                                        destination={booking.user?.location?.lat && booking.user?.location?.lng ? booking.user.location : { lat: 10.8700, lng: 106.8030 }}
                                        showDirections={true}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
