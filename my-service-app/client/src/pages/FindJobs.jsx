import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Sử dụng api instance chuẩn
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, DollarSign, Calendar, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const FindJobs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Bộ lọc
  const [filters, setFilters] = useState({
    search: '', category: '', minPrice: '', maxPrice: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      // Tạo query string từ object filters
      const params = new URLSearchParams();
      if(filters.search) params.append('search', filters.search);
      if(filters.category) params.append('category', filters.category);
      if(filters.minPrice) params.append('minPrice', filters.minPrice);
      if(filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const res = await api.get(`/requests?${params.toString()}`);
      setRequests(res.data.data);
    } catch (error) {
      console.error("Lỗi tải yêu cầu:", error);
      toast.error("Không thể tải danh sách việc làm");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 👇 HÀM XỬ LÝ KHI BẤM "TRAO ĐỔI NGAY"
  const handleStartChat = async (targetUserId) => {
      if (!user) {
          toast.error("Vui lòng đăng nhập để chat!");
          return navigate('/login');
      }
      try {
          // Gọi API tạo/lấy phòng chat
          const res = await api.post('/chat', { userId: targetUserId });
          // Chuyển hướng sang trang Chat (có thể truyền state để mở đúng tab chat)
          navigate('/chat', { state: { conversation: res.data } });
      } catch (error) {
          toast.error("Lỗi kết nối chat");
      }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">💼 Việc Tìm Người</h1>
        <p className="text-gray-600 text-lg">Hàng trăm cơ hội việc làm mới mỗi ngày dành cho bạn</p>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                    type="text" name="search"
                    placeholder="Tìm theo tên công việc..."
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={handleFilterChange}
                />
            </div>
            
            <select
                name="category"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                onChange={handleFilterChange}
            >
                <option value="">Tất cả danh mục</option>
                <option value="Điện nước">Điện nước</option>
                <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                <option value="Vệ sinh">Vệ sinh</option>
                <option value="Vận chuyển">Vận chuyển</option>
                <option value="Gia sư">Gia sư</option>
            </select>

            <div className="flex gap-2">
                <input type="number" name="minPrice" placeholder="Min Giá" className="w-1/2 p-3 border rounded-xl outline-none" onChange={handleFilterChange}/>
                <input type="number" name="maxPrice" placeholder="Max Giá" className="w-1/2 p-3 border rounded-xl outline-none" onChange={handleFilterChange}/>
            </div>
          </div>
      </div>

      {/* Danh sách yêu cầu */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
            <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" className="w-48 mx-auto opacity-50"/>
            <p className="text-gray-500 mt-4 text-lg">Chưa có yêu cầu nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 flex flex-col group">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {req.category}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock size={12} /> {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {req.title}
                </h3>
                
                {/* Ngân sách nổi bật */}
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-green-600" />
                    <span className="text-xl font-bold text-green-700">
                        {req.budget ? req.budget.toLocaleString() : 'Thỏa thuận'} <span className="text-sm font-normal text-gray-500">VNĐ</span>
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-6 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {req.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-red-400"/>
                    <span className="truncate">{req.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-orange-400"/>
                    <span className="font-medium text-orange-600">
                        Hạn chót: {new Date(req.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Card */}
              <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={req.user?.avatar || "https://ui-avatars.com/api/?background=random&name=" + req.user?.name} 
                    alt={req.user?.name}
                    className="w-9 h-9 rounded-full border border-white shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{req.user?.name}</span>
                    <span className="text-xs text-gray-500">Khách hàng</span>
                  </div>
                </div>
                
                {/* NÚT CHAT VỚI KHÁCH */}
                {user?._id !== req.user?._id && (
                    <button 
                        onClick={() => handleStartChat(req.user?._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2"
                    >
                        <MessageCircle size={16} /> Trao đổi
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindJobs;