import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
// 👇 Import thêm MessageCircle
import { MapPin, Clock, Star, MessageCircle, ShieldCheck, X, Trash2 } from 'lucide-react'; 
import { toast } from 'react-hot-toast';
import ReviewSection from '../components/ReviewSection';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingNote, setBookingNote] = useState('');

    const fetchService = async () => {
        try {
            const res = await api.get(`/services/${id}`);
            setService(res.data.data);
        } catch (error) {
            toast.error("Không tìm thấy dịch vụ");
            navigate('/');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchService(); }, [id]);

    const handleDeleteService = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
            try {
                await api.delete(`/services/${id}`);
                toast.success('Đã xóa dịch vụ!');
                navigate('/');
            } catch (error) { toast.error('Không thể xóa'); }
        }
    };

    const handleOpenBooking = () => {
        if (!user) { toast.error("Vui lòng đăng nhập"); navigate('/login'); return; }
        setShowModal(true);
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bookings', { serviceId: service._id, date: bookingDate, note: bookingNote });
            setShowModal(false);
            toast.success("🎉 Đặt lịch thành công!");
        } catch (error) { toast.error(error.response?.data?.message || "Đặt lịch thất bại"); }
    };

    // --- 👇 HÀM XỬ LÝ CHAT (QUAN TRỌNG) ---
    const handleChat = async () => {
        // 1. Kiểm tra đăng nhập
        if (!user) { 
            toast.error("Vui lòng đăng nhập để nhắn tin"); 
            navigate('/login'); 
            return; 
        }
        
        // 2. Không cho tự chat với mình
        if (user._id === service.user._id) { 
            toast.error("Đây là dịch vụ của bạn mà!"); 
            return; 
        }

        try {
            // 3. Tạo phòng chat và chuyển hướng
            await api.post('/chat/conversation', { receiverId: service.user._id });
            navigate('/chat');
        } catch (error) { 
            toast.error("Lỗi kết nối chat"); 
        }
    };

    if (loading) return <div className="text-center mt-20">Đang tải...</div>;
    if (!service) return null;

    const isOwner = user && service.user && (user._id === service.user._id || user._id === service.user);

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 relative">
                
                {isOwner && (
                    <button onClick={handleDeleteService} className="absolute top-4 right-4 z-10 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition">
                        <Trash2 size={24} />
                    </button>
                )}

                <div className="p-0 md:p-6 pb-0">
                    <img src={service.images[0]} alt={service.title} className="w-full h-64 md:h-96 object-cover md:rounded-lg" />
                    {service.images.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto p-4 md:p-0">
                            {service.images.map((img, idx) => (
                                <img key={idx} src={img} className="w-20 h-20 object-cover rounded border" alt="thumb" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                         <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">{service.category}</span>
                        <div className="flex items-center text-yellow-500 text-sm font-bold">
                            <Star size={16} fill="currentColor" className="mr-1" />
                            {service.averageRating || 0} ({service.reviewCount || 0} đánh giá)
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
                    <div className="text-3xl font-bold text-blue-600 mb-6">
                        {service.price?.toLocaleString('vi-VN')} đ
                        <span className="text-gray-500 text-lg font-normal">/{service.priceUnit || 'lần'}</span>
                    </div>

                    <div className="space-y-3 mb-8 text-gray-600">
                        <div className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-gray-400" /><span>{service.location?.address}</span></div>
                        <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-gray-400" /><span>Phản hồi: Rất nhanh</span></div>
                        <div className="flex items-center"><ShieldCheck className="w-5 h-5 mr-3 text-green-500" /><span className="text-green-600 font-medium">Đối tác tin cậy</span></div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-8 border">
                        <Link to={`/u/${service.user?._id}`}>
                            <img src={service.user?.avatar || `https://ui-avatars.com/api/?name=${service.user?.name}`} className="w-12 h-12 rounded-full hover:opacity-80 transition" alt="provider" />
                        </Link>
                        <div>
                            <Link to={`/u/${service.user?._id}`} className="font-bold text-gray-900 hover:text-blue-600 hover:underline">
                                {service.user?.name}
                            </Link>
                            <p className="text-sm text-gray-500">Nhà cung cấp</p>
                        </div>
                    </div>

                    {!isOwner ? (
                        <div className="flex gap-4">
                            <button onClick={handleOpenBooking} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">Đặt Lịch Ngay</button>
                            
                            {/* 👇 NÚT NHẮN TIN ĐÃ ĐƯỢC THÊM VÀO ĐÂY 👇 */}
                            <button 
                                onClick={handleChat} 
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 flex justify-center items-center hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition"
                            >
                                <MessageCircle size={20} className="mr-2" /> Nhắn tin
                            </button>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center font-medium">Đây là dịch vụ của bạn</div>
                    )}

                     <div className="mt-8 pt-6 border-t">
                        <h3 className="text-lg font-bold mb-3">Mô tả chi tiết</h3>
                        <p className="text-gray-600 whitespace-pre-line">{service.description}</p>
                    </div>

                    <ReviewSection serviceId={id} triggerRefresh={fetchService} />
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Xác nhận đặt lịch</h2>
                        <form onSubmit={submitBooking}>
                            <div className="mb-4"><label className="block text-gray-700 font-medium mb-2">Chọn ngày giờ</label><input type="datetime-local" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} /></div>
                            <div className="mb-6"><label className="block text-gray-700 font-medium mb-2">Ghi chú</label><textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" rows="3" value={bookingNote} onChange={(e) => setBookingNote(e.target.value)}></textarea></div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Xác nhận</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceDetail;