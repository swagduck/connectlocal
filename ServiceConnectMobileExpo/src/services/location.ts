// @ts-nocheck
import * as Location from 'expo-location';

// Request location permissions
export const requestLocationPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return false;
    }

    // Request background permissions if needed
    let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied');
    }

    return true;
};

// Get current location
export const getCurrentLocation = async () => {
    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return null;
    }
};

// Watch location changes
export const watchLocationChanges = (callback: (location: any) => void) => {
    return Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
            callback({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                accuracy: location.coords.accuracy,
                altitudeAccuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: location.timestamp,
            });
        }
    );
};

// Calculate distance between two points (in meters)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// Format distance for display
export const formatDistance = (distance: number) => {
    if (distance < 1000) {
        return `${Math.round(distance)}m`;
    } else {
        return `${(distance / 1000).toFixed(1)}km`;
    }
};

// Get address from coordinates (reverse geocoding)
export const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
        const results = await Location.reverseGeocodeAsyncAsync({ latitude, longitude });
        if (results.length > 0) {
            return {
                street: results[0].street,
                city: results[0].city,
                region: results[0].region,
                country: results[0].country,
                postalCode: results[0].postalCode,
                formattedAddress: results[0].formattedAddress,
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting address:', error);
        return null;
    }
};

// Get coordinates from address (geocoding)
export const getCoordinatesFromAddress = async (address: string) => {
    try {
        const results = await Location.geocodeAsyncAsync(address);
        if (results.length > 0) {
            return {
                latitude: results[0].latitude,
                longitude: results[0].longitude,
                altitude: results[0].altitude,
                accuracy: results[0].accuracy,
                altitudeAccuracy: results[0].altitudeAccuracy,
                heading: results[0].heading,
                speed: results[0].speed,
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
};

// Check if location services are enabled
export const isLocationServicesEnabled = async () => {
    return await Location.hasServicesEnabledAsync();
};

// Open device location settings
export const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
    } else {
        Linking.openSettings();
    }
};

// Location service configuration
export const locationConfig = {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
        notificationTitle: 'Location Tracking',
        notificationBody: 'Your location is being tracked for service requests',
    },
};

export default {
    requestLocationPermissions,
    getCurrentLocation,
    watchLocationChanges,
    calculateDistance,
    formatDistance,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
    isLocationServicesEnabled,
    openLocationSettings,
    locationConfig,
};
