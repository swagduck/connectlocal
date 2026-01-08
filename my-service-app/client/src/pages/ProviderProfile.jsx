import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
// 👇 Import MessageCircle
import { Phone, Mail, MapPin, Star, Calendar, Briefcase, CheckCircle, MessageCircle } from 'lucide-react'; 
import ServiceCard from '../components/ServiceCard';
import { AuthContext } from '../context/AuthContext'; // <-- Import AuthContext
import { toast } from 'react-hot-toast';

const ProviderProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // <-- Lấy user

    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get(`/auth/users/${id}`);
                setProvider(userRes.data.data);

                if(userRes.data.data.role === 'provider'){
                    const serviceRes = await api.get(`/services?user=${id}`);
                    setServices(serviceRes.data.data);
                }
            } catch (error) {
                console.error("Lỗi tải hồ sơ");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // --- HÀM XỬ LÝ CHAT ---
    const handleChat = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để nhắn tin");
            navigate('/login');
            return;
        }
        if (user._id === provider._id) {
            toast.error("Bạn không thể tự nhắn tin cho chính mình!");
            return;
        }

        try {
            await api.post('/chat/conversation', { receiverId: provider._id });
            navigate('/chat');
        } catch (error) {
            toast.error("Không thể bắt đầu cuộc trò chuyện");
        }
    };

    if (loading) return <div className="text-center mt-20">Đang tải hồ sơ...</div>;
    if (!provider) return <div className="text-center mt-20">Không tìm thấy người dùng này.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-40"></div>
                
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col items-center -mt-20 mb-6">
                        <img 
                            src={provider.avatar || `https://ui-avatars.com/api/?name=${provider.name}`} 
                            className="w-40 h-40 rounded-full border-4 border-white shadow-lg bg-white object-cover"
                            alt="avatar"
                        />
                        
                        <div className="text-center mt-4">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                                {provider.name}
                                {provider.role === 'provider' && (
                                    <CheckCircle size={24} className="text-blue-500 fill-blue-50" />
                                )}
                            </h1>
                            
                            <p className="text-blue-600 font-medium mb-3 text-lg">
                                {provider.role === 'provider' ? 'Nhà cung cấp dịch vụ' : 'Thành viên'}
                            </p>

                            {/* 👇 NÚT NHẮN TIN MỚI ĐƯỢC THÊM Ở ĐÂY 👇 */}
                            {user?._id !== provider._id && (
                                <button 
                                    onClick={handleChat}
                                    className="mt-2 mb-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md mx-auto"
                                >
                                    <MessageCircle size={20} /> Nhắn tin ngay
                                </button>
                            )}
                            
                            {provider.role === 'provider' && (
                                <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mt-2">
                                    <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-100 font-bold">
                                        <Star size={16} fill="#EAB308" className="text-yellow-500" /> 
                                        {provider.rating || 0} ({provider.reviewCount || 0} đánh giá)
                                    </span>
                                    <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Calendar size={16} className="text-gray-400" /> 
                                        Tham gia: {new Date(provider.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-8">
                        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-3"><Phone size={24} /></div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Điện thoại</p>
                            <p className="font-semibold text-gray-800 text-lg">{provider.phone || 'Chưa cập nhật'}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition">
                            <div className="bg-green-100 text-green-600 p-3 rounded-full mb-3"><Mail size={24} /></div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                            <p className="font-semibold text-gray-800 text-lg">{provider.email}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-full mb-3"><MapPin size={24} /></div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Khu vực</p>
                            <p className="font-semibold text-gray-800 text-lg">{provider.address || 'Toàn quốc'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {provider.role === 'provider' && (
                <div>
                    <div className="flex items-center gap-3 mb-6 border-l-4 border-blue-600 pl-4">
                        <h2 className="text-2xl font-bold text-gray-800">Dịch vụ đang cung cấp ({services.length})</h2>
                    </div>

                    {services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {services.map(service => (
                                <ServiceCard key={service._id} service={service} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                            <p>Thợ này chưa đăng dịch vụ nào.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProviderProfile;