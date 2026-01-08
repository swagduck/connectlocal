import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const CreateService = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Điện nước', // Giá trị mặc định
        imageUrl: '', // Tạm thời dùng link ảnh online cho đơn giản
        address: ''
    });

    // Nếu không phải là Provider (Thợ) thì đuổi về trang chủ
    if (user && user.role !== 'provider') {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-red-600">Bạn không có quyền truy cập trang này!</h2>
                <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Về trang chủ</button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Chuẩn bị dữ liệu gửi lên server
            const payload = {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                category: formData.category,
                images: [formData.imageUrl], // Server nhận mảng ảnh
                location: {
                    address: formData.address || "Hồ Chí Minh" // Tạm thời hardcode nếu user lười nhập
                }
            };

            await api.post('/services', payload);
            toast.success('Đăng dịch vụ thành công!');
            navigate('/'); // Về trang chủ để xem kết quả
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Đăng Dịch Vụ Mới</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tên dịch vụ */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Tên dịch vụ</label>
                    <input 
                        type="text" name="title" required
                        placeholder="VD: Sửa máy lạnh tại nhà..."
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange}
                    />
                </div>

                {/* Danh mục */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Danh mục</label>
                    <select 
                        name="category" 
                        className="w-full border p-3 rounded-lg bg-white"
                        onChange={handleChange}
                    >
                        <option value="Điện nước">Điện nước</option>
                        <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                        <option value="Vệ sinh">Vệ sinh</option>
                        <option value="Gia sư">Gia sư</option>
                        <option value="Làm đẹp">Làm đẹp</option>
                        <option value="Vận chuyển">Vận chuyển</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>

                {/* Giá tiền */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Giá dự kiến (VNĐ)</label>
                    <input 
                        type="number" name="price" required
                        placeholder="VD: 150000"
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange}
                    />
                </div>

                {/* Địa chỉ */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Khu vực làm việc</label>
                    <input 
                        type="text" name="address" required
                        placeholder="VD: Quận 1, TP.HCM"
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange}
                    />
                </div>

                {/* Link ảnh */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Link hình ảnh mô tả</label>
                    <input 
                        type="text" name="imageUrl" required
                        placeholder="Dán link ảnh từ internet vào đây..."
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">Mẹo: Lấy tạm link ảnh trên Google để test cho nhanh.</p>
                </div>

                {/* Mô tả */}
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
                    <textarea 
                        name="description" rows="4" required
                        placeholder="Mô tả kinh nghiệm, quy trình làm việc..."
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange}
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Đăng Bài Ngay
                </button>
            </form>
        </div>
    );
};

export default CreateService;