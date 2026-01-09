import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { SocketProvider, SocketContext } from './context/SocketContext';
import { MessageSquare, Wallet as WalletIcon } from 'lucide-react';
import './styles/animations.css';

// Lazy load components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const CreateService = lazy(() => import('./pages/CreateService'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Profile = lazy(() => import('./pages/Profile'));
const PostRequest = lazy(() => import('./pages/PostRequest'));
const FindJobs = lazy(() => import('./pages/FindJobs'));
const ManageRequests = lazy(() => import('./pages/ManageRequests'));
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Chat = lazy(() => import('./pages/ChatNew'));

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
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg p-4 sticky top-0 z-50 border-b border-white/20 transition-all duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 hover:scale-105 transition-transform duration-300">
          ServiceConnect
        </Link>

        <div className="space-x-4 flex items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-500 font-medium hidden sm:block transition-all duration-300 hover:scale-105">Trang chủ</Link>
          <Link to="/find-jobs" className="text-gray-600 hover:text-blue-500 font-medium hidden sm:block transition-all duration-300 hover:scale-105">Việc tìm người</Link>

          {user ? (
            <div className="flex items-center gap-4">

              {/* NÚT VÍ MỚI THÊM VÀO ĐÂY */}
              <Link to="/wallet" className="group text-gray-600 hover:text-green-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105">
                <WalletIcon size={20} className="text-green-600 transition-transform duration-300 group-hover:rotate-12" />
                <span className="hidden lg:inline">Ví: {user.walletBalance ? user.walletBalance.toLocaleString() : 0}đ</span>
              </Link>

              <Link to="/my-bookings" className="text-gray-600 hover:text-blue-600 font-medium hidden md:block transition-all duration-300 hover:scale-105">
                Đơn hàng
              </Link>

              <Link to="/chat" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105">
                <MessageSquare size={20} className="transition-transform duration-300 hover:rotate-12" />
                <span className="hidden md:inline">Tin nhắn</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin" className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg hover:from-red-700 hover:to-red-800 font-bold text-sm shadow-lg flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  Admin
                </Link>
              )}

              {user.role === 'provider' ? (
                <Link to="/create-service" className="group bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-all duration-300 text-sm whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105">
                  + Đăng dịch vụ
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/post-request" className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all duration-300 text-sm whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105">
                    + Đăng yêu cầu
                  </Link>
                  <Link to="/manage-requests" className="text-gray-600 hover:text-blue-600 font-medium hidden lg:block text-sm whitespace-nowrap transition-all duration-300 hover:scale-105">
                    Quản lý bài đăng
                  </Link>
                </div>
              )}

              <div className="hidden md:flex flex-col text-right">
                <Link to="/profile" className="text-gray-800 font-semibold text-sm hover:text-blue-600 transition-all duration-300 hover:scale-105">
                  {user.name}
                </Link>
                <span className="text-gray-500 text-xs">
                  {user.role === 'admin' ? 'Quản trị viên' : (user.role === 'provider' ? 'Thợ' : 'Khách')}
                </span>
              </div>

              <button onClick={handleLogout} className="group bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-all duration-300 text-sm hover:scale-105 hover:shadow-md">
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-500 font-medium transition-all duration-300 hover:scale-105">Đăng nhập</Link>
              <Link to="/register" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">Đăng ký</Link>
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
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans">
            <Navbar />
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
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
                <Route path="/wallet" element={<Wallet />} />
              </Routes>
            </Suspense>
            <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;