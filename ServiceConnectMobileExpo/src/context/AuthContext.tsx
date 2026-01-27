// @ts-nocheck
import React, { createContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import Toast from 'react-native-toast-notifications';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const toastRef = useRef(null);

    // Debug: Log user data changes
    useEffect(() => {
        console.log('AuthContext: User state changed:', user);
    }, [user]);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    const userData = res.data.data;

                    if (userData) {
                        await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));
                        setUser(userData);
                    }
                } catch (error) {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('userInfo');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('AuthContext: Starting login with', { email, password });

            const res = await api.post('/auth/login', { email, password });
            console.log('AuthContext: API response', res);

            const token = res.data.token;

            if (token) {
                await SecureStore.setItemAsync('token', token);
                console.log('AuthContext: Token saved');
            }

            const userData = {
                id: res.data.user.id || '',
                name: res.data.user.name || '',
                email: res.data.user.email || '',
                role: res.data.user.role || 'customer',
                walletBalance: res.data.user.walletBalance || 0
            };

            console.log('AuthContext: User data', userData);

            await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));
            setUser(userData);
            console.log('AuthContext: User set in state');

            if (toastRef.current) {
                toastRef.current.show('Đăng nhập thành công!', { type: 'success' });
            }
            return true;
        } catch (error) {
            console.error('AuthContext: Login error', error);

            if (toastRef.current) {
                toastRef.current.show(error.response?.data?.message || 'Đăng nhập thất bại', { type: 'danger' });
            }
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/auth/register', userData);
            const token = res.data.token;

            if (token) {
                await SecureStore.setItemAsync('token', token);
            }

            const newUser = {
                id: res.data.id || '',
                name: res.data.name || userData.name,
                email: res.data.email || userData.email,
                role: res.data.role || userData.role || 'customer',
                walletBalance: res.data.walletBalance || 0
            };

            await SecureStore.setItemAsync('userInfo', JSON.stringify(newUser));
            setUser(newUser);

            if (toastRef.current) {
                toastRef.current.show('Đăng ký thành công!', { type: 'success' });
            }
            return true;
        } catch (error) {
            if (toastRef.current) {
                toastRef.current.show(error.response?.data?.message || 'Đăng ký thất bại', { type: 'danger' });
            }
            return false;
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('userInfo');
        setUser(null);
        if (toastRef.current) {
            toastRef.current.show('Đã đăng xuất', { type: 'success' });
        }
    };

    const updateUser = async (updatedData) => {
        try {
            const res = await api.put('/auth/updatedetails', updatedData);
            const userData = res.data.data;

            if (userData) {
                await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));
                setUser(userData);
            }

            if (toastRef.current) {
                toastRef.current.show('Cập nhật hồ sơ thành công!', { type: 'success' });
            }
            return true;
        } catch (error) {
            if (toastRef.current) {
                toastRef.current.show(error.response?.data?.message || 'Lỗi cập nhật', { type: 'danger' });
            }
            return false;
        }
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            const userData = res.data.data;

            if (userData) {
                await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));
                setUser(userData);
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Lỗi refresh user data:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, refreshUser }}>
            <Toast ref={toastRef} />
            {children}
        </AuthContext.Provider>
    );
};

// Debug: Log user data changes
if (process.env.NODE_ENV === 'development') {
    console.log('AuthContext: Debug mode enabled');
}
