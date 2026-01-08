import React from 'react';
import { MapPin, Star } from 'lucide-react';
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
    <Link to={`/services/${service._id}`} className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 border border-gray-100 h-full flex flex-col group">
      <img 
        src={service.images[0] || "https://via.placeholder.com/400x300"} 
        alt={service.title} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">{service.category}</span>
          <div className="flex items-center text-yellow-500 text-sm font-bold">
            <Star size={16} fill="currentColor" className="mr-1" />
            {service.averageRating || 0} ({service.reviewCount || 0})
          </div>
        </div>

        <h3 className="mt-3 text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">{service.title}</h3>
        
        <div className="flex items-center mt-2 text-gray-500 text-sm">
            <MapPin size={16} className="mr-1" />
            <span className="truncate">{service.location?.address || "Hồ Chí Minh"}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-bold text-blue-600">
            {service.price?.toLocaleString('vi-VN')} đ
            <span className="text-gray-500 text-sm font-normal">/{service.priceUnit || 'lần'}</span>
          </div>
        </div>

        {/* Thông tin người đăng (Clickable) */}
        <div className="mt-auto pt-4 border-t flex items-center gap-3">
            <div onClick={handleProfileClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition z-10">
                <img 
                    src={service.user?.avatar || `https://ui-avatars.com/api/?name=${service.user?.name}`} 
                    className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                    alt="Avatar"
                />
                <span className="text-sm font-medium text-gray-700 truncate hover:text-blue-600 hover:underline max-w-[120px]">{service.user?.name}</span>
            </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;