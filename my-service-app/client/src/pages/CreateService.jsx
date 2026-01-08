import { useState, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { UploadCloud, Clock, Shield, MapPin } from 'lucide-react';

const CreateService = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    category: 'Điện nước',
    price: '', 
    priceUnit: 'lần', 
    duration: '', 
    warranty: '',
    address: user?.address || ''
  });
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setImage(file);
        setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = [];
      
      // 1. Nếu có ảnh -> Upload lên server trước
      if (image) {
          const uploadData = new FormData();
          uploadData.append('image', image);
          
          const uploadRes = await api.post('/upload', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Server trả về { url: '/uploads/abc.png' }
          imageUrls = [uploadRes.data.url]; 
      }

      // 2. Gửi thông tin dịch vụ kèm link ảnh
      await api.post('/services', { ...formData, images: imageUrls });
      
      toast.success('Đăng dịch vụ thành công!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng dịch vụ mới</h1>
        <p className="text-gray-500 mb-8">Cung cấp thông tin chi tiết để thu hút khách hàng</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Thông tin cơ bản */}
          <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 text-blue-800">1. Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên dịch vụ</label>
                    <input type="text" name="title" required placeholder="VD: Vệ sinh máy lạnh tại nhà" 
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select name="category" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" onChange={handleChange}>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả dịch vụ</label>
                <textarea name="description" rows="4" required placeholder="Mô tả quy trình làm việc, thiết bị sử dụng..." 
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={handleChange}></textarea>
              </div>
          </div>

          {/* 2. Báo giá & Cam kết */}
          <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 pt-4 text-blue-800">2. Báo giá & Cam kết</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản</label>
                    <div className="relative">
                        <input type="number" name="price" required placeholder="200000" 
                            className="w-full p-2.5 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange} />
                        <span className="absolute left-3 top-2.5 text-gray-400">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
                    <select name="priceUnit" className="w-full p-2.5 border rounded-lg bg-white" onChange={handleChange}>
                        <option value="lần">/ Lần</option>
                        <option value="giờ">/ Giờ</option>
                        <option value="m2">/ m²</option>
                        <option value="cái">/ Cái</option>
                        <option value="ngày">/ Ngày</option>
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian thực hiện</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                        <input type="text" name="duration" placeholder="VD: 1 - 2 giờ" 
                            className="w-full p-2.5 pl-9 border rounded-lg outline-none" onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bảo hành</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                        <input type="text" name="warranty" placeholder="VD: 3 tháng" 
                            className="w-full p-2.5 pl-9 border rounded-lg outline-none" onChange={handleChange} />
                    </div>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực phục vụ / Địa chỉ</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                    <input type="text" name="address" required placeholder="Quận 1, TP.HCM..." 
                        className="w-full p-2.5 pl-9 border rounded-lg outline-none" value={formData.address} onChange={handleChange} />
                </div>
              </div>
          </div>

          {/* 3. Ảnh minh họa */}
          <div>
            <h3 className="font-bold text-lg border-b pb-2 pt-4 mb-4 text-blue-800">3. Hình ảnh</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative min-h-[150px] flex items-center justify-center">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                {preview ? (
                    <img src={preview} alt="Preview" className="h-40 mx-auto rounded-lg object-contain shadow-md" />
                ) : (
                    <div className="flex flex-col items-center text-gray-500">
                        <UploadCloud size={40} className="mb-2 text-blue-500" />
                        <p>Kéo thả hoặc bấm để tải ảnh lên</p>
                    </div>
                )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-lg">
            {loading ? 'Đang xử lý...' : 'Hoàn tất đăng dịch vụ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateService;