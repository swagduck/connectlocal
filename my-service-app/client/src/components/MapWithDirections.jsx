import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

const center = {
    lat: 10.8231,
    lng: 106.6297
};

const MapWithDirections = ({
    origin,
    destination,
    showDirections = false,
    onDirectionsChange = null
}) => {
    // Demo mode without API key
    const [isLoaded, setIsLoaded] = useState(true);
    const [map, setMap] = useState(null);
    const [directions, setDirections] = useState(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');

    // Mock directions calculation for demo
    const calculateDirections = useCallback(() => {
        if (!origin || !destination) return;

        // Simulate API call
        setTimeout(() => {
            const mockDistance = '5.2 km';
            const mockDuration = '15 phút';

            setDistance(mockDistance);
            setDuration(mockDuration);

            if (onDirectionsChange) {
                onDirectionsChange({
                    distance: mockDistance,
                    duration: mockDuration,
                    distanceValue: 5200,
                    durationValue: 900
                });
            }
        }, 1000);
    }, [origin, destination, onDirectionsChange]);

    // Auto-calculate directions when props change
    React.useEffect(() => {
        if (showDirections && origin && destination) {
            calculateDirections();
        }
    }, [showDirections, origin, destination, calculateDirections]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Distance and Duration Info */}
            {showDirections && distance && duration && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="text-sm font-medium text-blue-900">Khoảng cách: {distance}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-blue-900">Thời gian: {duration}</span>
                            </div>
                        </div>
                        <button
                            onClick={calculateDirections}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Làm mới lộ trình
                        </button>
                    </div>
                </div>
            )}

            {/* Demo Map */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {/* Map Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            🗺️
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-gray-800">Bản Đồ Demo</p>
                            <p className="text-sm text-gray-600 max-w-md">
                                Tính năng bản đồ đang ở chế độ demo.<br />
                                Để sử dụng bản đồ thật, vui lòng cấu hình Google Maps API key.
                            </p>
                            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm">
                                <p className="font-medium text-yellow-800">📝 Hướng dẫn:</p>
                                <p className="text-yellow-700">1. Lấy Google Maps API key</p>
                                <p className="text-yellow-700">2. Thêm vào file .env: VITE_GOOGLE_MAPS_API_KEY=your_key</p>
                                <p className="text-yellow-700">3. Restart app</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mock Markers */}
                {origin && (
                    <div
                        className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{
                            top: '30%',
                            left: '20%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        A
                    </div>
                )}

                {destination && (
                    <div
                        className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{
                            top: '60%',
                            right: '25%',
                            transform: 'translate(50%, -50%)'
                        }}
                    >
                        B
                    </div>
                )}

                {/* Mock Route Line */}
                {showDirections && origin && destination && (
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                            </marker>
                        </defs>
                        <path
                            d="M 64 96 Q 192 144 240 192"
                            stroke="#3B82F6"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray="8,4"
                            markerEnd="url(#arrowhead)"
                        />
                    </svg>
                )}
            </div>

            {/* Map Controls */}
            <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Điểm đi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Điểm đến</span>
                    </div>
                </div>
                {showDirections && (
                    <div className="text-xs text-gray-500">
                        Lộ trình demo (chế độ thử nghiệm)
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapWithDirections;
