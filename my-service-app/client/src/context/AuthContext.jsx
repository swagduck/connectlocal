import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Kiểm tra đăng nhập khi F5
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Lấy lại info mới nhất từ server thay vì tin tưởng localStorage cũ
                    const res = await api.get('/auth/me');
                    const userData = res.data.data;

                    // Cập nhật lại localStorage với data mới nhất từ server
                    localStorage.setItem('userInfo', JSON.stringify(userData));
                    setUser(userData);
                } catch (error) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);

            // Get fresh user data from server to ensure all fields are present
            const userRes = await api.get('/auth/me');
            const userData = userRes.data.data;

            localStorage.setItem('userInfo', JSON.stringify(userData));

            setUser(userData);
            toast.success('Đăng nhập thành công!');

            // Force update to trigger navbar re-render
            setForceUpdate(prev => prev + 1);

            // Redirect to home page using window.location for reliable navigation
            setTimeout(() => {
                window.location.href = '/';
            }, 200);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/auth/register', userData);
            localStorage.setItem('token', res.data.token);

            const newUserData = { ...res.data };
            delete newUserData.success;
            delete newUserData.token;

            localStorage.setItem('userInfo', JSON.stringify(newUserData));
            setUser(newUserData);
            toast.success('Đăng ký thành công!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng ký thất bại');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setUser(null);
        toast.success('Đã đăng xuất');
    };

    // Hàm cập nhật hồ sơ mới
    const updateUser = async (updatedData) => {
        try {
            const res = await api.put('/auth/updatedetails', updatedData);

            // Cập nhật lại localStorage và State
            localStorage.setItem('userInfo', JSON.stringify(res.data.data));
            setUser(res.data.data);

            toast.success('Cập nhật hồ sơ thành công!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật');
            return false;
        }
    };

    // Hàm refresh user data (cập nhật wallet balance)
    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            const userData = res.data.data;

            // Cập nhật lại localStorage và State
            localStorage.setItem('userInfo', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Lỗi refresh user data:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, refreshUser, forceUpdate }}>
            {children}
        </AuthContext.Provider>
    );
};