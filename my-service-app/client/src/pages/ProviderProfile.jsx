import { useEffect, useState, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import api from '../services/api';
// 👇 Import MessageCircle
import { Phone, Mail, MapPin, Star, Calendar, Briefcase, CheckCircle, MessageCircle, Loader2, Sparkles, Award, Map } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import { AuthContext } from '../context/AuthContext'; // <-- Import AuthContext
import { toast } from 'react-hot-toast';
import FriendButton from '../components/FriendButton'; // <-- Import FriendButton

const ProviderProfile = () => {
    const { id } = useParams();
    const history = useHistory();
    const { user } = useContext(AuthContext); // <-- Lấy user

    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [friendRequestId, setFriendRequestId] = useState(null); // <-- Thêm state cho requestId

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get(`/auth/users/${id}`);
                setProvider(userRes.data.data);

                if (userRes.data.data.role === 'provider') {
                    const serviceRes = await api.get(`/services?user=${id}`);
                    setServices(serviceRes.data.data);
                }

                // Lấy friend request status nếu có user
                if (user) {
                    try {
                        const statusRes = await api.get(`/friends/status/${id}`);
                        if (statusRes.data.status === 'sent') {
                            // Tìm requestId của lời mời đã gửi
                            const sentRes = await api.get('/friends/sent?limit=10');
                            const myRequest = sentRes.data.data.find(req => req.recipient._id === id);
                            setFriendRequestId(myRequest ? myRequest._id : null);
                        }
                    } catch (error) {
                        console.log('Không lấy được friend status:', error);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải hồ sơ:", error);
                toast.error(error.response?.data?.message || "Không thể tải hồ sơ. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    // --- HÀM XỬ LÝ CHAT ---
    const handleChat = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để nhắn tin");
            history.push('/login');
            return;
        }
        if (user._id === provider._id) {
            toast.error("Bạn không thể tự nhắn tin cho chính mình!");
            return;
        }

        try {
            // Đi thẳng đến chat với người dùng cụ thể
            history.push(`/chat?user=${provider._id}`);
        } catch (error) {
            toast.error("Không thể bắt đầu cuộc trò chuyện");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                    <p className="mt-4 text-gray-600 font-medium animate-pulse">Đang tải hồ sơ...</p>
                </div>
            </div>
        </div>
    );
    if (!provider) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden p-8 border border-white/20 transition-all duration-500 hover:shadow-3xl">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Map className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg font-medium">Không tìm thấy người dùng này.</p>
                    <button
                        onClick={() => history.push('/')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
                    >
                        Về trang chủ
                    </button>
                </div>
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
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden mb-8 border border-white/20 transition-all duration-500 hover:shadow-3xl">
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 h-48 relative overflow-hidden">
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute inset-0">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/10 animate-pulse"></div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 animate-bounce-slow"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 animate-bounce-slow animation-delay-1000"></div>
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col items-center -mt-24 mb-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                <img
                                    src={provider.avatar || `https://ui-avatars.com/api/?name=${provider.name}&background=6366f1&color=fff`}
                                    className="relative w-40 h-40 rounded-full border-4 border-white shadow-2xl bg-white object-cover transition-transform duration-300 group-hover:scale-105"
                                    alt="avatar"
                                />
                                {/* Animated ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                            </div>

                            <div className="text-center mt-4">
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2 animate-fade-in">
                                    {provider.name}
                                    {provider.role === 'provider' && (
                                        <div className="relative group">
                                            <CheckCircle size={24} className="text-blue-500 fill-blue-50 transition-transform duration-300 group-hover:scale-110" />
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                Đã xác thực
                                            </div>
                                        </div>
                                    )}
                                </h1>

                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-full text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                                        {provider.role === 'provider' ? (
                                            <><Award className="w-4 h-4 mr-1" /> Nhà cung cấp dịch vụ</>
                                        ) : (
                                            'Thành viên'
                                        )}
                                    </span>
                                </div>

                                {/* 👇 NÚT KẾT BẠN THÊM VÀO ĐÂY 👇 */}
                                {user && user._id !== provider._id && (
                                    <div className="mb-4">
                                        <FriendButton
                                            userId={provider._id}
                                            requestId={friendRequestId}
                                            onStatusChange={(status) => {
                                                // Refresh component khi trạng thái thay đổi
                                                if (status === 'accepted') {
                                                    toast.success('Đã kết bạn thành công!');
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* 👇 NÚT NHẮN TIN MỚI ĐƯỢC THÊM Ở ĐÂY 👇 */}
                                {user?._id !== provider._id && (
                                    <button
                                        onClick={handleChat}
                                        className="group relative mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 mx-auto overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <MessageCircle size={20} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="relative z-10">Nhắn tin ngay</span>
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    </button>
                                )}

                                {provider.role === 'provider' && (
                                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm mt-4">
                                        <div className="group flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 px-4 py-2 rounded-full border border-yellow-200 font-bold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                            <Star size={16} fill="#EAB308" className="text-yellow-500 transition-transform duration-300 group-hover:rotate-12" />
                                            <span>{provider.rating || 0}</span>
                                            <span className="text-yellow-600">({provider.reviewCount || 0} đánh giá)</span>
                                        </div>
                                        <div className="group flex items-center gap-2 bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                            <Calendar size={16} className="text-gray-400 transition-transform duration-300 group-hover:rotate-12" />
                                            <span className="text-gray-700">Tham gia: {new Date(provider.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-8">
                            <div className="group flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <Phone size={24} className="transition-transform duration-300 group-hover:rotate-12" />
                                </div>
                                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-1">Điện thoại</p>
                                <p className="font-semibold text-gray-800 text-lg">{provider.phone || 'Chưa cập nhật'}</p>
                            </div>
                            <div className="group flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <Mail size={24} className="transition-transform duration-300 group-hover:rotate-12" />
                                </div>
                                <p className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Email</p>
                                <p className="font-semibold text-gray-800 text-lg break-all">{provider.email}</p>
                            </div>
                            <div className="group flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-full mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <MapPin size={24} className="transition-transform duration-300 group-hover:rotate-12" />
                                </div>
                                <p className="text-xs text-purple-600 uppercase font-bold tracking-wider mb-1">Khu vực</p>
                                <p className="font-semibold text-gray-800 text-lg">{provider.address || 'Toàn quốc'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {provider.role === 'provider' && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6 border-l-4 border-blue-600 pl-4 bg-white/60 backdrop-blur-sm rounded-r-lg p-4">
                            <div className="relative">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Dịch vụ đang cung cấp</h2>
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">{services.length}</span>
                        </div>

                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {services.map((service, index) => (
                                    <div key={service._id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                        <ServiceCard service={service} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 backdrop-blur-sm">
                                <div className="relative">
                                    <Briefcase size={48} className="mx-auto text-gray-300 mb-4 animate-bounce-slow" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 bg-gray-200 rounded-full opacity-20 animate-ping"></div>
                                    </div>
                                </div>
                                <p className="text-lg font-medium">Thợ này chưa đăng dịch vụ nào.</p>
                                <p className="text-sm text-gray-400 mt-2">Hãy quay lại sau nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderProfile;
