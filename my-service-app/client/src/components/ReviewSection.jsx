import { useState, useEffect, useContext } from 'react';
import { Star, Send } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ReviewSection = ({ serviceId, triggerRefresh }) => {
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [hover, setHover] = useState(0);

    useEffect(() => {
        if(serviceId) fetchReviews();
    }, [serviceId]);

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/services/${serviceId}/reviews`);
            setReviews(res.data.data);
        } catch (error) {
            console.error("Lỗi tải review");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Vui lòng đăng nhập");
            return;
        }

        try {
            await api.post(`/services/${serviceId}/reviews`, {
                title,
                text,
                rating
            });
            
            toast.success("Cảm ơn bạn đã đánh giá!");
            setTitle('');
            setText('');
            fetchReviews(); // Tải lại danh sách review
            
            // Gọi hàm từ trang cha để cập nhật lại điểm số trên đầu trang
            if(triggerRefresh) triggerRefresh();
            
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi: Có thể bạn chưa hoàn thành dịch vụ này");
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá từ khách hàng ({reviews.length})</h2>

            {/* FORM REVIEW */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                <h3 className="font-bold text-lg mb-4">Viết đánh giá của bạn</h3>
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition transform hover:scale-110"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(rating)}
                            >
                                <Star 
                                    size={28} 
                                    fill={star <= (hover || rating) ? "#FBBF24" : "none"} 
                                    color={star <= (hover || rating) ? "#FBBF24" : "#D1D5DB"}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-gray-600 font-medium pt-1">
                            {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : 'Tệ'}
                        </span>
                    </div>

                    <input 
                        type="text" 
                        placeholder="Tiêu đề (Ví dụ: Thợ làm rất kỹ...)"
                        className="w-full border p-3 rounded-lg mb-3 focus:outline-blue-500"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <textarea 
                        placeholder="Chia sẻ trải nghiệm của bạn (bắt buộc)..."
                        rows="3"
                        className="w-full border p-3 rounded-lg mb-3 focus:outline-blue-500"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    ></textarea>

                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                        <Send size={18} /> Gửi đánh giá
                    </button>
                </form>
            </div>

            {/* LIST REVIEWS */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="border-b pb-6 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                                <img 
                                    src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}`} 
                                    className="w-10 h-10 rounded-full bg-gray-200"
                                    alt="avatar"
                                />
                                <div>
                                    <p className="font-bold text-gray-900">{review.user?.name}</p>
                                    <div className="flex text-yellow-400 text-xs">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} color={i < review.rating ? "currentColor" : "#D1D5DB"} />
                                        ))}
                                    </div>
                                </div>
                                <span className="ml-auto text-xs text-gray-400">
                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-800 ml-14">{review.title}</h4>
                            <p className="text-gray-600 ml-14 mt-1">{review.text}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection;