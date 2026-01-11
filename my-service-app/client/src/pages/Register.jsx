import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useHistory, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'user' // Mặc định là khách hàng
    });

    const { register } = useContext(AuthContext);
    const history = useHistory();

    const { name, email, password, phone, role } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Gọi hàm register từ AuthContext
        const success = await register(formData);
        if (success) {
            history.push('/'); // Đăng ký xong chuyển về trang chủ
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Đăng Ký Tài Khoản</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tên hiển thị */}
                    <div>
                        <label className="block text-gray-700 mb-1">Họ và Tên</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="email@vidu.com"
                            required
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="text"
                            name="phone"
                            value={phone}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="0987..."
                            required
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="block text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="******"
                            required
                        />
                    </div>

                    {/* Chọn vai trò (Role) */}
                    <div>
                        <label className="block text-gray-700 mb-1">Bạn muốn đăng ký làm?</label>
                        <select
                            name="role"
                            value={role}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="user">Khách hàng (Tìm dịch vụ)</option>
                            <option value="provider">Thợ / Nhà cung cấp (Đăng dịch vụ)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-bold mt-4"
                    >
                        Đăng Ký Ngay
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;