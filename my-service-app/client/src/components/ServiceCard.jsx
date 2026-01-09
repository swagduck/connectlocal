import React from 'react';
import { MapPin, Star, Clock, Award, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ServiceCard = ({ service }) => {
    const navigate = useNavigate();

    // Hàm xử lý khi bấm vào Avatar/Tên thợ
    const handleProfileClick = (e) => {
        e.preventDefault(); // Chặn hành vi Link mặc định
        e.stopPropagation(); // Chặn sự kiện nổi bọt lên thẻ cha
        navigate(`/u/${service.user?._id}`);
    };

    return (
        <Link
            to={`/services/${service._id}`}
            className="group block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-white/20 h-full flex flex-col transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
        >
            {/* Image container with overlay */}
            <div className="relative overflow-hidden h-48">
                <img
                    src={service.images[0] || "https://via.placeholder.com/400x300"}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Badge for featured services */}
                {service.isFeatured && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-bounce">
                        <Award size={12} />
                        Nổi bật
                    </div>
                )}

                {/* Quick view indicator */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12">
                    <Sparkles size={16} />
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow relative">
                {/* Category and rating */}
                <div className="flex justify-between items-start">
                    <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-300 shadow-sm">
                        {service.category}
                    </span>
                    <div className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded-full">
                        <Star size={14} fill="currentColor" className="mr-1 transition-transform duration-300 group-hover:rotate-12" />
                        {service.averageRating || 0}
                        <span className="text-yellow-600 text-xs ml-1">({service.reviewCount || 0})</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                    {service.title}
                </h3>

                {/* Location */}
                <div className="flex items-center mt-2 text-gray-500 text-sm group-hover:text-blue-500 transition-colors">
                    <MapPin size={14} className="mr-1 transition-transform duration-300 group-hover:rotate-12" />
                    <span className="truncate">{service.location?.address || "Hồ Chí Minh"}</span>
                </div>

                {/* Description snippet */}
                <p className="mt-2 text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {service.description || "Chất lượng đảm bảo, giá cả hợp lý"}
                </p>

                {/* Price */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {service.price?.toLocaleString('vi-VN')} đ
                        <span className="text-gray-500 text-sm font-normal">/{service.priceUnit || 'lần'}</span>
                    </div>

                    {/* Response time indicator */}
                    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock size={10} className="mr-1" />
                        {service.responseTime || 'Nhanh'}
                    </div>
                </div>

                {/* Thông tin người đăng (Clickable) */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div
                        onClick={handleProfileClick}
                        className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-lg transition-all duration-300 group/user"
                    >
                        <div className="relative">
                            <img
                                src={service.user?.avatar || `https://ui-avatars.com/api/?name=${service.user?.name}&background=6366f1&color=fff`}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-300 group-hover/user:scale-110"
                                alt="Avatar"
                            />
                            {/* Online indicator */}
                            {service.user?.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-700 truncate group-hover/user:text-blue-600 transition-colors max-w-[120px]">
                                {service.user?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {service.user?.completedJobs || 0} jobs
                            </span>
                        </div>
                    </div>

                    {/* Quick action button */}
                    <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 hover:shadow-lg">
                        <Sparkles size={14} />
                    </button>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
            </div>
        </Link>
    );
};

export default ServiceCard;
