import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, Camera, Save, Briefcase, Edit, X, MapPin } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import ServiceCard from '../components/ServiceCard';

const Profile = () => {
    const { user, updateUser } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
        address: ''
    });

    const [uploading, setUploading] = useState(false);
    const [myServices, setMyServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    useEffect(() => {
        if (user) {
            resetForm();
            if (user.role === 'provider') {
                fetchMyServices(user._id);
            }
        }
    }, [user]);

    const resetForm = () => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            avatar: user.avatar || '',
            address: user.address || ''
        });
    };

    const fetchMyServices = async (userId) => {
        setLoadingServices(true);
        try {
            const res = await api.get(`/services?user=${userId}`);
            setMyServices(res.data.data);
        } catch (error) {
            console.error("Lỗi tải dịch vụ:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
        } finally {
            setLoadingServices(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 👇 Hàm này đã được sửa để hoạt động với Cloudinary
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        setUploading(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            // Gọi API upload
            const { data } = await api.post('/upload', formDataUpload, config);

            // Backend trả về: { success: true, url: "https://res.cloudinary..." }
            // Lấy trực tiếp url từ data, KHÔNG nối thêm localhost
            const fullUrl = data.url;

            setFormData((prev) => ({ ...prev, avatar: fullUrl }));
            toast.success('Tải ảnh xong! Bấm Lưu để hoàn tất.');
        } catch (error) {
            console.error("Lỗi upload:", error);
            toast.error(error.response?.data?.message || 'Lỗi upload ảnh. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateUser(formData);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setIsEditing(false);
    };

    const getRoleLabel = (role) => {
        if (role === 'admin') return 'Quản trị viên hệ thống';
        if (role === 'provider') return 'Nhà cung cấp dịch vụ';
        return 'Khách hàng thân thiết';
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-10">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32 relative">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg flex items-center gap-2 transition backdrop-blur-sm"
                        >
                            <Edit size={18} /> <span className="text-sm font-medium">Chỉnh sửa</span>
                        </button>
                    )}
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-center">
                        <div className="relative group">
                            {/* Hiển thị Avatar hoặc Avatar mặc định nếu chưa có */}
                            <img
                                src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}`}
                                alt="Profile"
                                className={`w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white ${isEditing ? 'ring-2 ring-blue-400' : ''}`}
                            />
                            {isEditing && (
                                <>
                                    <label htmlFor="file-upload" className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full border-2 border-white cursor-pointer hover:bg-gray-700 transition z-10">
                                        {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Camera size={16} />}
                                    </label>
                                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-1">{user?.name}</h1>

                    <p className="text-center text-gray-500 mb-8 uppercase font-bold tracking-wide text-xs">
                        {getRoleLabel(user?.role)}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className={isEditing ? "text-blue-500" : "text-gray-400"} />
                                </div>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition ${isEditing ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input type="email" name="email" value={formData.email} disabled className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone size={18} className={isEditing ? "text-blue-500" : "text-gray-400"} />
                                </div>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition ${isEditing ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ / Khu vực</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={18} className={isEditing ? "text-blue-500" : "text-gray-400"} />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Ví dụ: Quận 1, TP.HCM"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition ${isEditing ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-4 pt-4 animate-fade-in-up">
                                <button type="button" onClick={handleCancel} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                    <X size={20} /> Hủy bỏ
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                    <Save size={20} /> Lưu thay đổi
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* DỊCH VỤ CỦA TÔI (Chỉ hiện nếu là Provider) */}
            {user?.role === 'provider' && (
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <Briefcase className="text-blue-600" size={28} />
                        <h2 className="text-2xl font-bold text-gray-800">Dịch vụ bạn đang cung cấp ({myServices.length})</h2>
                    </div>
                    {loadingServices ? (
                        <div className="text-center py-10">Đang tải danh sách dịch vụ...</div>
                    ) : myServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {myServices.map(service => (
                                <ServiceCard key={service._id} service={service} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
                            <p className="text-gray-500 mb-4">Bạn chưa đăng dịch vụ nào.</p>
                            <a href="/create-service" className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition">+ Đăng dịch vụ đầu tiên</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;