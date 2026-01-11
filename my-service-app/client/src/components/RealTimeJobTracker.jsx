import React, { useState, useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RealTimeJobTracker = ({
    bookingId,
    customerId,
    workerId,
    isWorker = false,
    serviceLocation
}) => {
    const [user, setUser] = useState(null);
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]);
    const [routeCoords, setRouteCoords] = useState([]);

    const {
        socket,
        connected,
        jobStatus,
        workerLocation,
        acceptJob,
        startJob,
        completeJob,
        startLocationTracking,
        stopLocationTracking
    } = useSocket(user?.id);

    // Get current user
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Update map center based on locations
    useEffect(() => {
        if (serviceLocation) {
            if (workerLocation?.location) {
                // Center between worker and service
                const centerLat = (serviceLocation.lat + workerLocation.location.lat) / 2;
                const centerLng = (serviceLocation.lng + workerLocation.location.lng) / 2;
                setMapCenter([centerLat, centerLng]);
            } else {
                // Just show service location
                setMapCenter([serviceLocation.lat, serviceLocation.lng]);
            }
        }
    }, [serviceLocation, workerLocation]);

    // Calculate route when worker location updates
    useEffect(() => {
        if (workerLocation?.location && serviceLocation) {
            // Simple route calculation (could use OSRM here too)
            const route = [
                [workerLocation.location.lat, workerLocation.location.lng],
                [serviceLocation.lat, serviceLocation.lng]
            ];
            setRouteCoords(route);
        }
    }, [workerLocation, serviceLocation]);

    // Handle job actions for worker
    const handleAcceptJob = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    acceptJob(bookingId, location);
                    startLocationTracking(bookingId);
                },
                (error) => {
                    console.error('❌ Error getting location:', error);
                    alert('Không thể lấy vị trí của bạn. Vui lòng bật định vị.');
                }
            );
        }
    };

    const handleStartJob = () => {
        startJob(bookingId);
    };

    const handleCompleteJob = () => {
        completeJob(bookingId);
        stopLocationTracking();
    };

    // Custom icons
    const workerIcon = L.divIcon({
        html: '<div style="background-color: #3B82F6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">👨‍🔧</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
        className: 'worker-marker'
    });

    const serviceIcon = L.divIcon({
        html: '<div style="background-color: #EF4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏠</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
        className: 'service-marker'
    });

    return (
        <div className="space-y-4">
            {/* Connection Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">
                            {connected ? 'Đã kết nối' : 'Mất kết nối'}
                        </span>
                    </div>
                    {jobStatus && (
                        <div className="text-xs text-gray-600">
                            Cập nhật: {new Date(jobStatus.timestamp || Date.now()).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Status */}
            {jobStatus && (
                <div className={`border rounded-lg p-4 ${jobStatus.status === 'accepted' ? 'bg-blue-50 border-blue-200' :
                    jobStatus.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
                        jobStatus.status === 'completed' ? 'bg-green-50 border-green-200' :
                            jobStatus.status === 'worker_disconnected' ? 'bg-red-50 border-red-200' :
                                'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">
                            {jobStatus.status === 'accepted' ? '📋 Thợ đã nhận yêu cầu' :
                                jobStatus.status === 'in_progress' ? '🚗 Thợ đang trên đường' :
                                    jobStatus.status === 'completed' ? '✅ Công việc hoàn thành' :
                                        jobStatus.status === 'worker_disconnected' ? '❌ Thợ mất kết nối' :
                                            '⏳ Đang chờ thợ'}
                        </h3>
                        <span className="text-xs text-gray-500">
                            {jobStatus.timestamp && new Date(jobStatus.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm">{jobStatus.message}</p>

                    {/* Worker Actions */}
                    {isWorker && user?.id === workerId && (
                        <div className="mt-4 space-y-2">
                            {jobStatus.status === 'accepted' && (
                                <button
                                    onClick={handleStartJob}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    🚗 Bắt đầu di chuyển
                                </button>
                            )}
                            {jobStatus.status === 'in_progress' && (
                                <button
                                    onClick={handleCompleteJob}
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    ✅ Hoàn thành công việc
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Real-time Map */}
            <div className="relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={workerLocation?.location ? 13 : 11}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Service Location Marker */}
                    {serviceLocation && serviceLocation.coordinates && (
                        <Marker
                            position={Array.isArray(serviceLocation.coordinates) ?
                                [serviceLocation.coordinates[1], serviceLocation.coordinates[0]] :
                                [serviceLocation.coordinates.lat, serviceLocation.coordinates.lng]}
                            icon={serviceIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-semibold">🏠 Địa chỉ dịch vụ</p>
                                    <p className="text-xs text-gray-600">
                                        {Array.isArray(serviceLocation.coordinates) ?
                                            `${serviceLocation.coordinates[1].toFixed(4)}, ${serviceLocation.coordinates[0].toFixed(4)}` :
                                            `${serviceLocation.coordinates.lat?.toFixed(4)}, ${serviceLocation.coordinates.lng?.toFixed(4)}`
                                        }
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Worker Location Marker */}
                    {workerLocation?.location && (
                        <Marker
                            position={[workerLocation.location.lat, workerLocation.location.lng]}
                            icon={workerIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-semibold">👨‍🔧 Vị trí thợ</p>
                                    <p className="text-xs text-gray-600">
                                        {workerLocation.location.lat.toFixed(4)}, {workerLocation.location.lng.toFixed(4)}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Độ chính xác: ±{workerLocation.location.accuracy?.toFixed(0)}m
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Cập nhật: {new Date(workerLocation.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Route Line */}
                    {routeCoords.length > 0 && (
                        <Polyline
                            positions={routeCoords}
                            color="#3B82F6"
                            weight={4}
                            opacity={0.8}
                            dashArray="10, 5"
                        />
                    )}
                </MapContainer>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📱 Hướng dẫn sử dụng:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                    <li>• <strong>Khách hàng:</strong> Xem vị trí thợ real-time</li>
                    <li>• <strong>Thợ:</strong> Nhận job và bắt đầu tracking</li>
                    <li>• <strong>Live tracking:</strong> Tự động cập nhật vị trí</li>
                    <li>• <strong>Notifications:</strong> Nhận thông báo real-time</li>
                </ul>
            </div>
        </div>
    );
};

export default RealTimeJobTracker;
