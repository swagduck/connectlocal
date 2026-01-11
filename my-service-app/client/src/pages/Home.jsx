import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';
import { toast } from 'react-hot-toast';
import { Search, Filter, Wrench, Zap, Truck, Home as HomeIcon, BookOpen, Smile, Star, ArrowRight, ShieldCheck, Clock, UserCheck, MapPin } from 'lucide-react';

const Home = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ref to track if component is mounted
    const isMounted = useRef(true);

    // State cho bộ lọc
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [radius, setRadius] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [useLocation, setUseLocation] = useState(false);

    // Danh sách danh mục nhanh với Icon
    const quickCategories = [
        { name: "Điện nước", value: "Điện nước", icon: <Zap size={24} className="text-yellow-500" />, color: "bg-yellow-50" },
        { name: "Sửa nhà", value: "Sửa chữa nhà", icon: <HomeIcon size={24} className="text-blue-500" />, color: "bg-blue-50" },
        { name: "Vệ sinh", value: "Vệ sinh", icon: <Smile size={24} className="text-green-500" />, color: "bg-green-50" },
        { name: "Vận chuyển", value: "Vận chuyển", icon: <Truck size={24} className="text-orange-500" />, color: "bg-orange-50" },
        { name: "Làm đẹp", value: "Làm đẹp", icon: <Star size={24} className="text-pink-500" />, color: "bg-pink-50" },
        { name: "Gia sư", value: "Gia sư", icon: <BookOpen size={24} className="text-purple-500" />, color: "bg-purple-50" },
    ];

    // Get user's current location
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (isMounted.current) {
                        const location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        setUserLocation(location);
                        setUseLocation(true);
                        toast.success('Đã lấy vị trí của bạn!');
                    }
                },
                (error) => {
                    if (isMounted.current) {
                        console.error('Error getting location:', error);
                        toast.error('Không thể lấy vị trí của bạn. Vui lòng bật định vị.');
                    }
                }
            );
        } else {
            if (isMounted.current) {
                toast.error('Trình duyệt không hỗ trợ định vị.');
            }
        }
    };

    const fetchServices = async () => {
        if (!isMounted.current) return;

        setLoading(true);
        try {
            let query = '/services?';
            if (keyword) query += `keyword=${keyword}&`;
            if (category) query += `category=${category}&`;

            // Add radius search if location is enabled
            if (useLocation && userLocation && radius) {
                query += `lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}&`;
            }

            const res = await api.get(query);
            if (isMounted.current) {
                setServices(res.data.data);
            }
        } catch (error) {
            if (isMounted.current) {
                console.error("Lỗi lấy dữ liệu:", error);
                toast.error(error.response?.data?.message || "Không thể tải dịch vụ. Vui lòng thử lại.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchServices();

        // Cleanup function to set isMounted to false when component unmounts
        return () => {
            isMounted.current = false;
        };
    }, [category, radius, useLocation]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchServices();
    };

    return (
        <div className="min-h-screen bg-white">

            {/* 1. HERO SECTION: Tìm kiếm & Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4 rounded-b-[50px] shadow-xl mb-12">
                <div className="container mx-auto max-w-5xl text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
                        Tìm thợ giỏi, <br /> Giải quyết mọi vấn đề!
                    </h1>
                    <p className="text-blue-100 mb-10 text-lg md:text-xl max-w-2xl mx-auto">
                        Kết nối với hàng ngàn chuyên gia sửa chữa, vệ sinh, vận chuyển... uy tín ngay khu vực của bạn.
                    </p>

                    {/* Form Tìm kiếm nổi */}
                    <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center transform md:translate-y-10">
                        <div className="relative flex-grow w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Bạn đang gặp vấn đề gì? (VD: Hỏng điều hòa...)"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>

                        <div className="relative w-full md:w-auto min-w-[200px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                className="w-full pl-12 pr-10 py-3 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium appearance-none cursor-pointer"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="">Tất cả danh mục</option>
                                <option value="Điện nước">Điện nước</option>
                                <option value="Sửa chữa nhà">Sửa chữa nhà</option>
                                <option value="Vệ sinh">Vệ sinh</option>
                                <option value="Vận chuyển">Vận chuyển</option>
                                <option value="Gia sư">Gia sư</option>
                                <option value="Làm đẹp">Làm đẹp</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        {/* Location-based search */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={getUserLocation}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition ${useLocation ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <MapPin size={16} />
                                <span className="text-sm font-medium">
                                    {useLocation ? 'Đã định vị' : 'Dùng vị trí'}
                                </span>
                            </button>

                            {useLocation && (
                                <select
                                    className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium appearance-none cursor-pointer"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                >
                                    <option value="">Bán kính</option>
                                    <option value="1">1 km</option>
                                    <option value="3">3 km</option>
                                    <option value="5">5 km</option>
                                    <option value="10">10 km</option>
                                    <option value="20">20 km</option>
                                </select>
                            )}
                        </div>

                        <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg transform hover:scale-105 active:scale-95">
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-20 md:mt-12">

                {/* 2. DANH MỤC NHANH (QUICK CATEGORIES) */}
                {!keyword && !category && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Dịch vụ phổ biến</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {quickCategories.map((cat, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setCategory(cat.value)}
                                    className={`${cat.color} p-6 rounded-2xl cursor-pointer hover:shadow-md transition transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3 border border-transparent hover:border-gray-200`}
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm">
                                        {cat.icon}
                                    </div>
                                    <span className="font-semibold text-gray-700">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. KẾT QUẢ TÌM KIẾM / DANH SÁCH DỊCH VỤ */}
                <div id="services-list" className="mb-16">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            {keyword || category ? '🔍 Kết quả tìm kiếm' : '🌟 Dịch vụ nổi bật'}
                        </h2>
                        {category && (
                            <button onClick={() => { setCategory(''); setKeyword('') }} className="text-red-500 text-sm font-semibold hover:underline">
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {services.length > 0 ? (
                                services.map(service => (
                                    <ServiceCard key={service._id} service={service} />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/search-result-not-found-2130361-1800925.png" alt="Empty" className="w-48 mx-auto opacity-50 mb-4" />
                                    <p className="text-xl text-gray-500">Không tìm thấy dịch vụ nào phù hợp.</p>
                                    <button onClick={() => { setKeyword(''); setCategory(''); }} className="mt-4 text-blue-600 font-bold hover:underline">
                                        Xem tất cả dịch vụ
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. SECTION: TẠI SAO CHỌN CHÚNG TÔI (HOW IT WORKS) */}
                {!keyword && !category && (
                    <div className="mb-20 py-12 bg-gray-50 rounded-3xl px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Quy trình đơn giản</h2>
                            <p className="text-gray-600">Đặt dịch vụ chưa bao giờ dễ dàng đến thế</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">1. Tìm kiếm</h3>
                                <p className="text-gray-500">Chọn dịch vụ bạn cần từ hàng ngàn thợ giỏi đã được xác thực.</p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm text-center relative">
                                <div className="hidden md:block absolute top-1/2 -left-4 transform -translate-y-1/2 text-gray-300">
                                    <ArrowRight size={32} />
                                </div>
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">2. Đặt lịch</h3>
                                <p className="text-gray-500">Chọn giờ phù hợp và đặt lịch nhanh chóng. Hệ thống sẽ kết nối ngay.</p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm text-center relative">
                                <div className="hidden md:block absolute top-1/2 -left-4 transform -translate-y-1/2 text-gray-300">
                                    <ArrowRight size={32} />
                                </div>
                                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">3. An tâm</h3>
                                <p className="text-gray-500">Thợ đến làm việc. Thanh toán an toàn và đánh giá chất lượng.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. CALL TO ACTION (CTA) - CHO THỢ */}
                {!keyword && !category && (
                    <div className="mb-20 bg-blue-900 rounded-3xl overflow-hidden relative shadow-2xl">
                        <div className="absolute inset-0 bg-pattern opacity-10"></div> {/* Placeholder cho pattern */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-center p-8 md:p-16 relative z-10">
                            <div className="text-white mb-8 md:mb-0">
                                <span className="bg-blue-800 text-blue-200 px-4 py-1 rounded-full text-sm font-bold mb-4 inline-block">
                                    Dành cho đối tác
                                </span>
                                <h2 className="text-4xl font-bold mb-4 leading-tight">
                                    Bạn là thợ chuyên nghiệp? <br />
                                    Hãy tham gia cùng chúng tôi!
                                </h2>
                                <p className="text-blue-200 mb-8 text-lg">
                                    Tiếp cận hàng ngàn khách hàng, tăng thu nhập và tự chủ thời gian làm việc. Đăng ký hoàn toàn miễn phí.
                                </p>
                                <div className="flex gap-4">
                                    <Link to="/register" className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center gap-2">
                                        <UserCheck size={20} /> Đăng ký làm Thợ
                                    </Link>
                                    <Link to="/find-jobs" className="border border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition">
                                        Tìm việc ngay
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden md:flex justify-end">
                                {/* Ảnh minh họa (Placeholder SVG) */}
                                <Wrench size={200} className="text-white opacity-20 transform rotate-45" />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Home;