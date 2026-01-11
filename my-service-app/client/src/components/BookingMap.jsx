import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Route, AlertCircle } from 'lucide-react';
import FreeMapWithDirections from './FreeMapWithDirections';

const BookingMap = ({
    service,
    onLocationSelect = null,
    showDirections = true,
    userLocation = null
}) => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [userCoords, setUserCoords] = useState(userLocation);
    const [serviceCoords, setServiceCoords] = useState(null);
    const [directionsInfo, setDirectionsInfo] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Convert service location to coordinates
    useEffect(() => {
        if (service?.location?.coordinates && Array.isArray(service.location.coordinates)) {
            const [lng, lat] = service.location.coordinates;
            setServiceCoords({ lat, lng });
        }
    }, [service]);

    // Get user's current location
    const getUserLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị');
            return;
        }

        setLoadingLocation(true);
        let triedLowAccuracy = false;

        // Optimized settings for better reliability
        const options = {
            enableHighAccuracy: true, // Start with high accuracy
            timeout: 15000, // 15 seconds timeout
            maximumAge: 300000 // 5 minutes cache
        };

        // Try with low accuracy as fallback
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 20000, // 20 seconds timeout for low accuracy
            maximumAge: 60000 // 1 minute cache
        };

        const successCallback = (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { lat: latitude, lng: longitude };
            setUserCoords(coords);
            setSelectedLocation(coords);
            setLoadingLocation(false);

            if (onLocationSelect) {
                onLocationSelect({
                    coordinates: [longitude, latitude],
                    address: 'Vị trí hiện tại của bạn'
                });
            }

            console.log('Location obtained:', coords);
        };

        const errorCallback = (error) => {
            console.error('Geolocation error:', error);

            // If timeout occurred with high accuracy, try without it
            if (error.code === error.TIMEOUT && !triedLowAccuracy) {
                console.log('High accuracy timed out, trying with lower accuracy...');
                triedLowAccuracy = true;
                navigator.geolocation.getCurrentPosition(successCallback, errorCallback, lowAccuracyOptions);
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

    // Search for address suggestions (simplified - in production use Google Places API)
    const searchAddress = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        // This is a mock implementation - in production, use Google Places Autocomplete
        const mockSuggestions = [
            `${query}, Quận 1, Hồ Chí Minh`,
            `${query}, Quận 3, Hồ Chí Minh`,
            `${query}, Quận 7, Hồ Chí Minh`,
            `${query}, Bình Thạnh, Hồ Chí Minh`
        ].filter(addr => addr.length > query.length + 5);

        setSuggestions(mockSuggestions.slice(0, 5));
    };

    const handleAddressSelect = (address) => {
        setAddressInput(address);
        setSuggestions([]);

        // In production, use Google Geocoding API to get coordinates
        // For now, we'll use a simple coordinate assignment
        const mockCoords = { lat: 10.8231 + Math.random() * 0.1, lng: 106.6297 + Math.random() * 0.1 };
        setSelectedLocation(mockCoords);

        if (onLocationSelect) {
            onLocationSelect({
                coordinates: [mockCoords.lng, mockCoords.lat],
                address: address
            });
        }
    };

    const handleDirectionsChange = (info) => {
        setDirectionsInfo(info);
    };

    const handleMapClick = (event) => {
        if (!onLocationSelect) return;

        const coords = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };

        setSelectedLocation(coords);

        // In production, use reverse geocoding to get address
        const mockAddress = `Địa điểm được chọn (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        setAddressInput(mockAddress);

        if (onLocationSelect) {
            onLocationSelect({
                coordinates: [coords.lng, coords.lat],
                address: mockAddress
            });
        }
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
                        <h3 className="text-lg font-semibold text-gray-900">Chọn địa điểm thực hiện dịch vụ</h3>
                        <p className="text-sm text-gray-600">
                            {onLocationSelect ? 'Chọn địa điểm để thợ đến' : 'Xem vị trí dịch vụ'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Location Selection Controls */}
            {onLocationSelect && (
                <div className="space-y-4">
                    {/* Current Location Button */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={getUserLocation}
                            disabled={loadingLocation}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Navigation className="w-5 h-5" />
                            <span>{loadingLocation ? 'Đang định vị...' : 'Sử dụng vị trí hiện tại'}</span>
                        </button>
                    </div>

                    {/* Address Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Nhập địa chỉ của bạn..."
                            value={addressInput}
                            onChange={(e) => {
                                setAddressInput(e.target.value);
                                searchAddress(e.target.value);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />

                        {/* Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAddressSelect(suggestion)}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">{suggestion}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Location Info */}
            {selectedLocation && onLocationSelect && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="p-1 bg-green-100 rounded-full">
                            <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">Địa điểm đã chọn</p>
                            <p className="text-sm text-green-700">{addressInput || 'Vị trí hiện tại'}</p>
                        </div>
                    </div>
                </div>
            )}

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
                </div>
            )}

            {/* Map */}
            <div className="relative">
                <FreeMapWithDirections
                    origin={showDirections ? (selectedLocation || userCoords) : null}
                    destination={serviceCoords}
                    showDirections={showDirections && (selectedLocation || userCoords)}
                    onDirectionsChange={handleDirectionsChange}
                    onMapClick={onLocationSelect ? handleMapClick : null}
                />

                {/* Instructions Overlay */}
                {onLocationSelect && !selectedLocation && !userCoords && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                        <div className="text-center space-y-3">
                            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto" />
                            <p className="text-gray-700 font-medium">Chọn địa điểm thực hiện dịch vụ</p>
                            <p className="text-sm text-gray-500">Sử dụng vị trí hiện tại hoặc nhập địa chỉ</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Service Location Info */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">Địa chỉ nhà cung cấp</p>
                        <p className="text-sm text-gray-600">{service?.location?.address || 'Chưa có địa chỉ'}</p>
                        {service?.location?.city && (
                            <p className="text-xs text-gray-500">{service.location.city}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Text */}
            {onLocationSelect && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Lưu ý:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Bạn có thể chọn vị trí hiện tại hoặc nhập địa chỉ cụ thể</li>
                                <li>• Click vào bản đồ để chọn vị trí chính xác</li>
                                <li>• Thợ sẽ đến địa điểm bạn đã chọn để thực hiện dịch vụ</li>
                                <li>• Khoảng cách và thời gian di chuyển chỉ mang tính tham khảo</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingMap;
