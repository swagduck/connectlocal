import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Route } from 'lucide-react';
import FreeMapWithDirections from './FreeMapWithDirections';

const ServiceMap = ({ service, userLocation = null }) => {
    const [showDirections, setShowDirections] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [serviceCoords, setServiceCoords] = useState(null);
    const [directionsInfo, setDirectionsInfo] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Convert service location to coordinates
    useEffect(() => {
        console.log('Service data:', service);
        console.log('Service location:', service?.location);
        console.log('Service coordinates:', service?.location?.coordinates);

        if (service?.location?.coordinates && Array.isArray(service.location.coordinates)) {
            // MongoDB stores as [longitude, latitude], but Google Maps expects {lat, lng}
            const [lng, lat] = service.location.coordinates;
            setServiceCoords({ lat, lng });
            console.log('Service coords set:', { lat, lng });
        } else {
            // Mock data for testing - use HCMC center
            const mockServiceCoords = { lat: 10.8231, lng: 106.6297 };
            setServiceCoords(mockServiceCoords);
            console.log('Using mock service coords:', mockServiceCoords);
        }
    }, [service]);

    // Get user's current location
    const getUserLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị');
            return;
        }

        setLoadingLocation(true);

        // Add timeout and better accuracy settings
        const options = {
            enableHighAccuracy: false, // Start with lower accuracy for faster response
            timeout: 15000, // 15 seconds timeout
            maximumAge: 300000 // 5 minutes cache
        };

        // High accuracy fallback options
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 20000, // 20 seconds timeout for high accuracy
            maximumAge: 60000 // 1 minute cache
        };

        const successCallback = (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lng: longitude });
            setLoadingLocation(false);
            console.log('Location obtained:', { lat: latitude, lng: longitude });
        };

        const errorCallback = (error) => {
            console.error('Geolocation error:', error);

            // If timeout occurred with high accuracy, try without it
            if (error.code === error.TIMEOUT && options.enableHighAccuracy) {
                console.log('High accuracy timed out, trying with lower accuracy...');
                navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                });
                return;
            }

            setLoadingLocation(false);

            let errorMessage = 'Không thể lấy vị trí của bạn.';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép định vị trong trình duyệt.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Thông tin vị trí không có sẵn.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Hết thời gian lấy vị trí. Thử lại với kết nối tốt hơn hoặc sử dụng WiFi.';
                    break;
            }

            alert(errorMessage);
        };

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    };

    const handleDirectionsChange = (info) => {
        setDirectionsInfo(info);
    };

    const openInGoogleMaps = () => {
        if (!serviceCoords) return;

        let url = `https://www.google.com/maps/search/?api=1&query=${serviceCoords.lat},${serviceCoords.lng}`;

        if (showDirections && userCoords) {
            url = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${serviceCoords.lat},${serviceCoords.lng}`;
        }

        window.open(url, '_blank');
    };

    const openInWaze = () => {
        if (!serviceCoords) return;

        let url = `https://waze.com/ul?ll=${serviceCoords.lat},${serviceCoords.lng}&navigate=yes`;

        if (showDirections && userCoords) {
            url = `https://waze.com/ul?ll=${serviceCoords.lat},${serviceCoords.lng}&navigate=yes&from=${userCoords.lat},${userCoords.lng}`;
        }

        window.open(url, '_blank');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bản đồ & Chỉ đường</h3>
                        <p className="text-sm text-gray-600">{service?.location?.address || 'Địa chỉ dịch vụ'}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {!userCoords && (
                        <button
                            onClick={getUserLocation}
                            disabled={loadingLocation}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                            <Navigation className={`w-4 h-4 ${loadingLocation ? 'animate-spin' : ''}`} />
                            <span>{loadingLocation ? 'Đang định vị...' : 'Lấy vị trí của tôi'}</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowDirections(!showDirections)}
                        disabled={!userCoords || !serviceCoords}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <Route className="w-4 h-4" />
                        <span>{showDirections ? 'Ẩn chỉ đường' : 'Xem chỉ đường'}</span>
                    </button>
                </div>
            </div>

            {/* Directions Info */}
            {showDirections && directionsInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Route className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Khoảng cách</p>
                                <p className="text-lg font-semibold text-blue-600">{directionsInfo.distance}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Thời gian di chuyển</p>
                                <p className="text-lg font-semibold text-green-600">{directionsInfo.duration}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={openInGoogleMaps}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span>Mở Google Maps</span>
                        </button>

                        <button
                            onClick={openInWaze}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.36 2.72l1.92 1.92-2.36 2.36-1.92-1.92 2.36-2.36m1.43 4.66l-1.92-1.92-2.36 2.36 1.92 1.92 2.36-2.36M12 2c4.42 0 8 3.58 8 8 0 1.5-.41 2.9-1.13 4.09L12 22l-6.87-7.91C4.41 12.9 4 11.5 4 10c0-4.42 3.58-8 8-8m0 2c-3.31 0-6 2.69-6 6 0 1.11.3 2.14.83 3L12 18.5l5.17-5.5c.53-.86.83-1.89.83-3 0-3.31-2.69-6-6-6m0 2.5c1.93 0 3.5 1.57 3.5 3.5S13.93 11.5 12 11.5 8.5 9.93 8.5 8 10.07 4.5 12 4.5z" />
                            </svg>
                            <span>Mở Waze</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="relative">
                <FreeMapWithDirections
                    origin={userCoords}
                    destination={serviceCoords}
                    showDirections={showDirections && !!userCoords}
                    onDirectionsChange={handleDirectionsChange}
                />

                {/* Loading Overlay */}
                {loadingLocation && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <Navigation className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-gray-700">Đang lấy vị trí của bạn...</p>
                                <p className="text-xs text-gray-500">Vui lòng cho phép truy cập vị trí</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Service Location Info */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">Địa chỉ dịch vụ</p>
                        <p className="text-sm text-gray-600">{service?.location?.address || 'Chưa có địa chỉ'}</p>
                        {service?.location?.city && (
                            <p className="text-xs text-gray-500">{service.location.city}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceMap;
