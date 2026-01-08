import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';

const PostRequest = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        category: 'Điện nước',
        budget: '',
        address: '',
        description: ''
    });

    // Nếu là Provider thì chặn, hoặc cho phép cả hai đều được đăng (tùy logic của bạn)
    // Ở đây tôi để ai cũng đăng được, miễn là đã login

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/requests', formData);
            toast.success('Đăng yêu cầu thành công! Thợ sẽ liên hệ bạn.');
            navigate('/find-jobs'); // Chuyển qua trang danh sách việc để xem bài vừa đăng
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Đăng Yêu Cầu Tìm Thợ</h1>
            <p className="text-center text-gray-500 mb-8">Mô tả vấn đề của bạn để các thợ chuyên nghiệp ứng tuyển</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block font-medium text-gray-700 mb-1">Tiêu đề (Cần làm gì?)</label>
                    <input type="text" name="title" required placeholder="VD: Cần sửa ống nước bị rò rỉ..." 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Danh mục</label>
                        <select name="category" className="w-full border p-3 rounded-lg bg-white" onChange={handleChange}>
                            <option value="Điện nước">Điện nước</option>
                            <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                            <option value="Vệ sinh">Vệ sinh</option>
                            <option value="Vận chuyển">Vận chuyển</option>
                            <option value="Gia sư">Gia sư</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Ngân sách (VNĐ)</label>
                        <input type="number" name="budget" required placeholder="VD: 200000" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
                    </div>
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input type="text" name="address" required placeholder="VD: Quận 1, TP.HCM" 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                    <textarea name="description" rows="4" required placeholder="Mô tả kỹ hơn về tình trạng..." 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange}></textarea>
                </div>

                <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2">
                    <Save size={20} /> Đăng Yêu Cầu
                </button>
            </form>
        </div>
    );
};

export default PostRequest;