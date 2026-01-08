import { useEffect, useState } from 'react';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';
import { Search, Filter } from 'lucide-react';

const Home = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho bộ lọc
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');

    // Hàm gọi API (có tham số)
    const fetchServices = async () => {
        setLoading(true);
        try {
            // Xây dựng query string: /services?keyword=abc&category=xyz
            let query = '/services?';
            if (keyword) query += `keyword=${keyword}&`;
            if (category) query += `category=${category}&`;

            const res = await api.get(query);
            setServices(res.data.data);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    // Gọi lần đầu khi vào trang
    useEffect(() => {
        fetchServices();
    }, []);

    // Xử lý khi bấm nút Tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        fetchServices();
    };

    // Xử lý khi chọn Danh mục (gọi API luôn)
    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        // Lưu ý: State category chưa cập nhật ngay lập tức ở đây, 
        // nên ta gọi fetch thủ công hoặc dùng useEffect riêng cho category.
        // Cách đơn giản nhất để UX mượt là dùng useEffect phụ thuộc [category]:
    };

    // Tự động tìm khi đổi danh mục
    useEffect(() => {
        fetchServices();
    }, [category]); 

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Tìm kiếm */}
            <div className="mb-12 text-center bg-gradient-to-r from-blue-50 to-indigo-50 py-16 rounded-3xl">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    Tìm dịch vụ chuyên nghiệp
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                    Kết nối với hàng ngàn thợ giỏi quanh bạn chỉ trong vài cú click
                </p>
                
                <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4 relative flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            placeholder="Bạn cần tìm gì? (VD: Sửa máy lạnh...)"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="relative min-w-[200px]">
                         <select 
                            className="w-full pl-10 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg appearance-none bg-white cursor-pointer"
                            value={category}
                            onChange={handleCategoryChange}
                        >
                            <option value="">Tất cả danh mục</option>
                            <option value="Điện nước">Điện nước</option>
                            <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                            <option value="Vệ sinh">Vệ sinh</option>
                            <option value="Gia sư">Gia sư</option>
                            <option value="Làm đẹp">Làm đẹp</option>
                            <option value="Vận chuyển">Vận chuyển</option>
                            <option value="Khác">Khác</option>
                        </select>
                        <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-lg">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* Kết quả tìm kiếm */}
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                    {keyword || category ? 'Kết quả tìm kiếm' : 'Dịch vụ nổi bật'}
                </h2>
                <span className="text-gray-500">{services.length} kết quả</span>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Đang tìm thợ...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {services.length > 0 ? (
                        services.map(service => (
                            <ServiceCard key={service._id} service={service} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-xl text-gray-500 font-medium">Không tìm thấy dịch vụ nào phù hợp 😔</p>
                            <button 
                                onClick={() => {setKeyword(''); setCategory('');}}
                                className="mt-4 text-blue-600 underline hover:text-blue-800"
                            >
                                Xóa bộ lọc để xem tất cả
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;