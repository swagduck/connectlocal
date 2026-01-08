import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Star, MessageCircle, Reply, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReviewSection = ({ serviceId, providerId }) => {
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [replyText, setReplyText] = useState({});

    // State kiểm tra quyền đánh giá
    const [canReview, setCanReview] = useState(false);

    useEffect(() => {
        fetchReviews();
        // Nếu là khách hàng thì kiểm tra xem đã mua đơn này chưa
        if (user && user.role === 'customer') {
            checkReviewPermission();
        }
    }, [serviceId, user]);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/reviews/service/${serviceId}`);
            setReviews(data);
        } catch (error) {
            console.error("Lỗi tải review");
        }
    };

    const checkReviewPermission = async () => {
        try {
            const { data } = await api.get(`/reviews/check/${serviceId}`);
            setCanReview(data.canReview);
        } catch (error) {
            console.error("Lỗi check quyền");
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            // Backend tự xử lý việc Tạo mới hay Cập nhật
            await api.post('/reviews', { rating, comment, serviceId });
            toast.success('Đánh giá thành công!');
            setComment('');
            fetchReviews(); // Load lại danh sách để thấy review mới
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi gửi đánh giá');
        }
    };

    const handleReply = async (reviewId) => {
        try {
            if (!replyText[reviewId]) return;
            await api.put(`/reviews/${reviewId}/reply`, { reply: replyText[reviewId] });
            toast.success('Đã gửi phản hồi');
            fetchReviews();
        } catch (error) {
            toast.error('Không thể gửi phản hồi');
        }
    };

    return (
        <div className="mt-10 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="text-blue-600" /> Đánh giá từ khách hàng
            </h3>

            {/* --- PHẦN FORM ĐÁNH GIÁ (LOGIC ẨN/HIỆN) --- */}
            {user && user.role === 'customer' ? (
                canReview ? (
                    // 1. ĐƯỢC PHÉP ĐÁNH GIÁ (Đã hoàn thành đơn)
                    <form onSubmit={submitReview} className="mb-10 bg-blue-50 p-4 rounded-lg animate-fade-in-up">
                        <p className="font-semibold mb-2 text-blue-800">Chia sẻ trải nghiệm của bạn:</p>
                        <div className="flex mb-4">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <Star
                                    key={num}
                                    size={28}
                                    className={`cursor-pointer transition ${num <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                                    onClick={() => setRating(num)}
                                />
                            ))}
                        </div>
                        <textarea
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            placeholder="Dịch vụ thế nào? Thợ có nhiệt tình không?..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                        <button className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                            Gửi / Cập nhật đánh giá
                        </button>
                    </form>
                ) : (
                    // 2. CHƯA ĐỦ ĐIỀU KIỆN
                    <div className="mb-10 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-gray-500">
                        <Lock className="mx-auto mb-2 text-gray-400" size={24} />
                        <p>Bạn cần sử dụng và <b>hoàn thành</b> dịch vụ này để viết đánh giá.</p>
                    </div>
                )
            ) : null}

            {/* --- DANH SÁCH REVIEW --- */}
            <div className="space-y-6">
                {reviews.length === 0 && <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>}

                {reviews.map((rev) => (
                    <div key={rev._id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                {/* Avatar người dùng hoặc mặc định */}
                                <img
                                    src={rev.user?.avatar || `https://ui-avatars.com/api/?name=${rev.user?.name || 'User'}`}
                                    className="w-10 h-10 rounded-full border object-cover"
                                    alt="avatar"
                                />
                                <div>
                                    <p className="font-bold text-gray-800">{rev.user?.name || "Người dùng ẩn danh"}</p>
                                    <div className="flex text-yellow-400">
                                        {[...Array(rev.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    </div>
                                </div>
                            </div>
                            <span className="text-gray-400 text-sm">{new Date(rev.updatedAt || rev.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-gray-600 ml-14 whitespace-pre-line">{rev.comment}</p>

                        {/* --- PHẦN PHẢN HỒI CỦA THỢ --- */}
                        {rev.reply ? (
                            // Nếu đã có phản hồi -> Hiển thị
                            <div className="ml-14 mt-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
                                <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                                    <Reply size={12} /> Phản hồi từ người bán
                                </p>
                                <p className="text-gray-700 text-sm italic">"{rev.reply}"</p>
                            </div>
                        ) : (
                            // Nếu chưa có phản hồi VÀ người xem là chủ dịch vụ -> Hiện ô nhập
                            user?._id === providerId && (
                                <div className="ml-14 mt-3 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="Nhập phản hồi cho khách..."
                                        className="text-sm border rounded px-3 py-2 focus:border-blue-500 outline-none flex-1"
                                        onChange={(e) => setReplyText({ ...replyText, [rev._id]: e.target.value })}
                                    />
                                    <button
                                        onClick={() => handleReply(rev._id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold transition"
                                    >
                                        Gửi
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewSection;