import React, { useCallback, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet - using CDN URLs for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FreeMapWithDirections = ({
    origin,
    destination,
    showDirections = false,
    onDirectionsChange = null
}) => {
    const [directions, setDirections] = useState(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // HCMC center
    const [selectedRoute, setSelectedRoute] = useState('fastest'); // 'fastest', 'shortest', 'scenic'


    // Calculate real directions using OSRM API directly
    const calculateDirections = useCallback(async () => {
        if (!origin || !destination) return;

        // Convert coordinates to [lat, lng] format if needed
        const originCoords = Array.isArray(origin) ? origin : [origin.lat, origin.lng];
        const destCoords = Array.isArray(destination) ? destination : [destination.lat, destination.lng];

        // Validate coordinates
        if (!originCoords[0] || !originCoords[1] || !destCoords[0] || !destCoords[1] ||
            isNaN(originCoords[0]) || isNaN(originCoords[1]) || isNaN(destCoords[0]) || isNaN(destCoords[1])) {
            calculateMockDirections(originCoords, destCoords);
            return;
        }


        try {
            // OSRM API call for real routing - coordinates should be [lng,lat] order
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=false&geometries=geojson&steps=true`;

            const response = await fetch(osrmUrl);
            const data = await response.json();


            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];

                // Handle different coordinate formats
                let coordinates;
                if (route.geometry && route.geometry.coordinates) {
                    // OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
                    coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                } else if (route.geometry) {
                    // Alternative format
                    coordinates = route.geometry;
                } else {
                    // Fallback - direct line
                    coordinates = [originCoords, destCoords];
                }

                // Extract distance and duration
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationMin = Math.round(route.duration / 60);

                const routeData = {
                    coordinates: coordinates,
                    distance: `${distanceKm} km`,
                    duration: `${durationMin} phút`,
                    distanceValue: route.distance,
                    durationValue: route.duration,
                    type: selectedRoute,
                    description: selectedRoute === 'fastest' ? 'Đường nhanh nhất (OSRM)' :
                        selectedRoute === 'shortest' ? 'Đường ngắn nhất (OSRM)' :
                            'Đường thực tế (OSRM)'
                };


                setDirections(routeData);
                setDistance(routeData.distance);
                setDuration(routeData.duration);

                if (onDirectionsChange) {
                    onDirectionsChange(routeData);
                }
            } else {
                throw new Error('No routes found in OSRM response');
            }
        } catch (error) {
            console.error('OSRM API error:', error);
            // Fallback to mock calculation
            calculateMockDirections(originCoords, destCoords);
        }
    }, [origin, destination, selectedRoute, onDirectionsChange]);

    // Fallback mock calculation
    const calculateMockDirections = (originCoords, destCoords) => {
        // Use default coordinates if invalid
        const validOrigin = (originCoords[0] && originCoords[1] && !isNaN(originCoords[0]) && !isNaN(originCoords[1]))
            ? originCoords
            : [10.8231, 106.6297]; // HCMC center

        const validDest = (destCoords[0] && destCoords[1] && !isNaN(destCoords[0]) && !isNaN(destCoords[1]))
            ? destCoords
            : [10.8700, 106.8030]; // HCMC area

        const R = 6371; // Earth's radius in km
        const dLat = (validDest[0] - validOrigin[0]) * Math.PI / 180;
        const dLon = (validDest[1] - validOrigin[1]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(validOrigin[0] * Math.PI / 180) * Math.cos(validDest[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const directDistance = R * c;

        const durationMin = Math.round((directDistance / 30) * 60);

        const routeData = {
            coordinates: [validOrigin, validDest],
            distance: `${directDistance.toFixed(1)} km`,
            duration: `${durationMin} phút`,
            distanceValue: Math.round(directDistance * 1000),
            durationValue: durationMin * 60,
            type: selectedRoute,
            description: 'Mock route (OSRM unavailable)'
        };

        setDirections(routeData);
        setDistance(routeData.distance);
        setDuration(routeData.duration);

        if (onDirectionsChange) {
            onDirectionsChange(routeData);
        }
    };

    // Map reference
    const mapRef = useRef(null);

    // Auto-calculate directions when props change or route type changes
    useEffect(() => {
        if (showDirections && origin && destination) {
            calculateDirections();
            // Convert coordinates to [lat, lng] format for centering
            const originCoords = Array.isArray(origin) ? origin : [origin.lat, origin.lng];
            const destCoords = Array.isArray(destination) ? destination : [destination.lat, destination.lng];

            // Validate coordinates before centering
            if (originCoords[0] && originCoords[1] && destCoords[0] && destCoords[1] &&
                !isNaN(originCoords[0]) && !isNaN(originCoords[1]) && !isNaN(destCoords[0]) && !isNaN(destCoords[1])) {
                // Center map between origin and destination
                const centerLat = (originCoords[0] + destCoords[0]) / 2;
                const centerLng = (originCoords[1] + destCoords[1]) / 2;
                setMapCenter([centerLat, centerLng]);
            }
        } else if (origin && !showDirections) {
            // When we have origin but not showing directions, zoom to origin
            const originCoords = Array.isArray(origin) ? origin : [origin.lat, origin.lng];
            if (originCoords[0] && originCoords[1] && !isNaN(originCoords[0]) && !isNaN(originCoords[1])) {
                setMapCenter(originCoords);
            }
        } else if (destination && !origin) {
            // When we only have destination, center on it
            const destCoords = Array.isArray(destination) ? destination : [destination.lat, destination.lng];
            if (destCoords[0] && destCoords[1] && !isNaN(destCoords[0]) && !isNaN(destCoords[1])) {
                setMapCenter(destCoords);
            }
        }
    }, [showDirections, origin, destination, selectedRoute, calculateDirections]);

    // Custom icons - using simple div markers instead of SVG
    const originIcon = L.divIcon({
        html: '<div style="background-color: #10B981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: 'origin-marker'
    });

    const destinationIcon = L.divIcon({
        html: '<div style="background-color: #EF4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: 'destination-marker'
    });

    return (
        <div className="space-y-4">
            {/* Distance and Duration Info */}
            {showDirections && distance && duration && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">Khoảng cách: {distance}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">Thời gian: {duration}</span>
                            </div>
                        </div>
                        <button
                            onClick={calculateDirections}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                            🔄 Làm mới
                        </button>
                    </div>

                    {/* Route Type Selector */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => setSelectedRoute('fastest')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedRoute === 'fastest'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            🚀 Nhanh nhất
                        </button>
                        <button
                            onClick={() => setSelectedRoute('shortest')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedRoute === 'shortest'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            📏 Ngắn nhất
                        </button>
                        <button
                            onClick={() => setSelectedRoute('scenic')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedRoute === 'scenic'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            🌳 Thư giãn
                        </button>
                    </div>

                    {/* Route Description */}
                    {directions && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">Loại đường: </span>
                                {directions.description}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Free OpenStreetMap */}
            <div className="relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={origin && destination ? 13 : (origin || destination) ? 15 : 11}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={true}
                    whenCreated={map => { mapRef.current = map }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Origin Marker */}
                    {origin && origin.lat && origin.lng && (
                        <Marker
                            position={Array.isArray(origin) ? origin : [origin.lat, origin.lng]}
                            icon={originIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-semibold text-green-600">📍 Điểm đi</p>
                                    <p className="text-xs text-gray-600">Vị trí của bạn</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {destination && destination.lat && destination.lng && (
                        <Marker
                            position={Array.isArray(destination) ? destination : [destination.lat, destination.lng]}
                            icon={destinationIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-semibold text-red-600">🎯 Điểm đến</p>
                                    <p className="text-xs text-gray-600">Vị trí dịch vụ</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Route Line */}
                    {showDirections && directions && (
                        <Polyline
                            positions={directions.coordinates}
                            color={selectedRoute === 'fastest' ? '#3B82F6' : selectedRoute === 'shortest' ? '#10B981' : '#F59E0B'}
                            weight={4}
                            opacity={0.8}
                            dashArray={selectedRoute === 'scenic' ? '15, 5' : '10, 5'}
                        />
                    )}
                </MapContainer>
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
                    <div className="text-xs text-green-600 font-medium">
                        🗺️ OpenStreetMap - Hoàn toàn miễn phí!
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreeMapWithDirections;
