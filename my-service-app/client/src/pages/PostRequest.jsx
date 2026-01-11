import { useState, useContext } from 'react';
import api from '../services/api';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { MapPin, DollarSign, Calendar, Briefcase, AlertCircle } from 'lucide-react';

const PostRequest = () => {
  const { user } = useContext(AuthContext);
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Điện nước',
    budget: '',
    deadline: '',
    address: user?.address || '', // Tự động điền địa chỉ user nếu có
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/requests', formData);
      toast.success('🎉 Đăng yêu cầu thành công!');
      history.push('/manage-requests'); // Chuyển về trang quản lý bài đăng
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
      
      // Logic: Nếu lỗi chứa từ "Số dư" -> Chuyển hướng nạp tiền
      if (msg.includes('Số dư') || msg.includes('ví')) {
          setTimeout(() => history.push('/wallet'), 2500); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Briefcase className="text-orange-600"/> Đăng Yêu Cầu Tìm Thợ
        </h1>
        
        {/* Cảnh báo tiền nong */}
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl mb-6 flex gap-3">
            <AlertCircle className="flex-shrink-0" size={24} />
            <div className="text-sm">
                <strong>Lưu ý quan trọng:</strong> Hệ thống yêu cầu bạn phải có số dư ví lớn hơn hoặc bằng ngân sách dự kiến. 
                Tiền này dùng để đảm bảo khả năng thanh toán, chưa bị trừ ngay.
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hàng 1: Tiêu đề & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Tiêu đề công việc</label>
                <input 
                    type="text" name="title" required
                    placeholder="VD: Cần sửa ống nước gấp..."
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.title} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Danh mục</label>
                <select 
                    name="category" 
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    value={formData.category} onChange={handleChange}
                >
                    <option value="Điện nước">Điện nước</option>
                    <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                    <option value="Vệ sinh">Vệ sinh</option>
                    <option value="Vận chuyển">Vận chuyển</option>
                    <option value="Gia sư">Gia sư</option>
                    <option value="Làm đẹp">Làm đẹp</option>
                    <option value="Khác">Khác</option>
                </select>
              </div>
          </div>

          {/* Hàng 2: Ngân sách & Hạn chót */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Ngân sách dự kiến (VNĐ)</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                    <input 
                        type="number" name="budget" required
                        placeholder="VD: 500000"
                        className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formData.budget} onChange={handleChange}
                    />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Hạn chót (Deadline)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                    <input 
                        type="datetime-local" name="deadline" required
                        className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formData.deadline} onChange={handleChange}
                    />
                </div>
              </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Địa chỉ thực hiện</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                <input 
                    type="text" name="address" required
                    placeholder="Số nhà, đường, phường, quận..."
                    className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.address} onChange={handleChange}
                />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Mô tả chi tiết</label>
            <textarea 
                name="description" required rows="4"
                placeholder="Mô tả kỹ tình trạng hư hỏng, yêu cầu cụ thể để thợ dễ hình dung..."
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.description} onChange={handleChange}
            ></textarea>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? 'Đang kiểm tra ví...' : 'Đăng yêu cầu ngay'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostRequest;