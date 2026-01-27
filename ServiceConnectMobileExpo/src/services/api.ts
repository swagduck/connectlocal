import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Real API connection to your server
const api = axios.create({
    baseURL: 'http://192.168.2.22:5000/api/mobile',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config: any) => {
    const token = await SecureStore.getItemAsync('token');
    if (token && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
