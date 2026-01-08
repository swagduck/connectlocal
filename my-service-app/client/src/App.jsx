import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { SocketProvider, SocketContext } from './context/SocketContext'; 
import Chat from './pages/Chat';
import { MessageSquare, Wallet as WalletIcon } from 'lucide-react'; // 👇 Import thêm icon Wallet

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateService from './pages/CreateService';
import ServiceDetail from './pages/ServiceDetail';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import PostRequest from './pages/PostRequest';
import FindJobs from './pages/FindJobs';
import ManageRequests from './pages/ManageRequests';
import ProviderProfile from './pages/ProviderProfile';
import AdminDashboard from './pages/AdminDashboard';
import Wallet from './pages/Wallet'; // 👈 IMPORT TRANG VÍ

// --- COMPONENT NAVBAR RIÊNG BIỆT ---
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications } = useContext(SocketContext); 
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <nav className="bg-white shadow p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
           🛠️ ServiceConnect
        </Link>

        <div className="space-x-4 flex items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-500 font-medium hidden sm:block">Trang chủ</Link>
          <Link to="/find-jobs" className="text-gray-600 hover:text-blue-500 font-medium hidden sm:block">Việc tìm người</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* 👇 NÚT VÍ MỚI THÊM VÀO ĐÂY 👇 */}
              <Link to="/wallet" className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1">
                  <WalletIcon size={20} className="text-green-600"/>
                  <span className="hidden lg:inline">Ví: {user.walletBalance ? user.walletBalance.toLocaleString() : 0}đ</span>
              </Link>

              <Link to="/my-bookings" className="text-gray-600 hover:text-blue-600 font-medium hidden md:block">
                  📅 Đơn hàng
              </Link>

              <Link to="/chat" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
                  <MessageSquare size={20} />
                  <span className="hidden md:inline">Tin nhắn</span>
                  {notifications.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                          {notifications.length}
                      </span>
                  )}
              </Link>

              {user.role === 'admin' && (
                  <Link to="/admin" className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 font-bold text-sm shadow-md flex items-center gap-1">
                      🛡️ Admin
                  </Link>
              )}

              {user.role === 'provider' ? (
                  <Link to="/create-service" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition text-sm whitespace-nowrap">
                      + Đăng dịch vụ
                  </Link>
              ) : (
                  <div className="flex items-center gap-3">
                      <Link to="/post-request" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition text-sm whitespace-nowrap">
                          + Đăng yêu cầu
                      </Link>
                      <Link to="/manage-requests" className="text-gray-600 hover:text-blue-600 font-medium hidden lg:block text-sm whitespace-nowrap">
                          📋 Quản lý bài đăng
                      </Link>
                  </div>
              )}

              <div className="hidden md:flex flex-col text-right">
                  <Link to="/profile" className="text-gray-800 font-semibold text-sm hover:text-blue-600 transition">
                      {user.name}
                  </Link>
                  <span className="text-gray-500 text-xs">
                      {user.role === 'admin' ? 'Quản trị viên' : (user.role === 'provider' ? 'Thợ' : 'Khách')}
                  </span>
              </div>
              
              <button onClick={handleLogout} className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition text-sm">
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-500 font-medium">Đăng nhập</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-md">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/u/:id" element={<ProviderProfile />} />
              <Route path="/find-jobs" element={<FindJobs />} />
              <Route path="/create-service" element={<CreateService />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/post-request" element={<PostRequest />} />
              <Route path="/manage-requests" element={<ManageRequests />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/chat" element={<Chat />} />
              
              {/* 👇 ROUTE VÍ ĐƯỢC THÊM Ở ĐÂY */}
              <Route path="/wallet" element={<Wallet />} />
              
            </Routes>
            <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;