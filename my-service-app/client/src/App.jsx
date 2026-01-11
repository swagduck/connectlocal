import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { SocketProvider, SocketContext } from './context/SocketContext';
import { MessageSquare, Wallet as WalletIcon, Users, Bell } from 'lucide-react';
import './styles/animations.css';
import NotificationBadge from './components/NotificationBadge';

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
const FriendsList = lazy(() => import('./pages/FriendsList'));
const FriendRequests = lazy(() => import('./pages/FriendRequests'));
const FriendRequestsPage = lazy(() => import('./pages/FriendRequestsPage'));
const Notifications = lazy(() => import('./pages/Notifications'));

// --- COMPONENT NAVBAR RIÊNG BIỆT ---
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, friendRequestCount, getNotificationCount, clearFriendRequestNotifications } = useContext(SocketContext);
  const history = useHistory();

  console.log('🔔 Navbar - Notifications:', notifications);
  console.log('🔔 Navbar - Friend request count:', friendRequestCount);
  console.log('🔔 Navbar - Message count:', getNotificationCount('message'));
  console.log('🔔 Navbar - Total notifications count:', notifications.length);

  const handleLogout = () => {
    logout();
    history.push('/login');
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

              {/* NÚT THÔNG BÁO */}
              <Link to="/notifications" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105">
                <Bell size={20} className="transition-transform duration-300 hover:rotate-12" />
                <span className="hidden md:inline">Thông báo</span>
                <NotificationBadge count={notifications.length} />
              </Link>

              <Link to="/my-bookings" className="relative text-gray-600 hover:text-blue-600 font-medium hidden md:block transition-all duration-300 hover:scale-105">
                Đơn hàng
                <NotificationBadge count={getNotificationCount('new_booking') + getNotificationCount('booking_accepted') + getNotificationCount('booking_in_progress') + getNotificationCount('booking_completed') + getNotificationCount('booking_cancelled')} />
              </Link>

              <Link to="/chat" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105">
                <MessageSquare size={20} className="transition-transform duration-300 hover:rotate-12" />
                <span className="hidden md:inline">Tin nhắn</span>
                <NotificationBadge count={getNotificationCount('message')} />
              </Link>

              <Link to="/friends" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105">
                <Users size={20} className="transition-transform duration-300 hover:rotate-12" />
                <span className="hidden md:inline">Bạn bè</span>
                <NotificationBadge count={getNotificationCount('friend_accepted')} />
              </Link>

              <Link
                to="/friends/requests"
                className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105"
                onClick={() => clearFriendRequestNotifications()}
              >
                <svg className="w-5 h-5 transition-transform duration-300 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Lời mời</span>
                <NotificationBadge count={friendRequestCount} />
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
              <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/u/:id" component={ProviderProfile} />
                <Route path="/find-jobs" component={FindJobs} />
                <Route path="/create-service" component={CreateService} />
                <Route path="/services/:id" component={ServiceDetail} />
                <Route path="/my-bookings" component={MyBookings} />
                <Route path="/profile" component={Profile} />
                <Route path="/post-request" component={PostRequest} />
                <Route path="/manage-requests" component={ManageRequests} />
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/chat" component={Chat} />
                <Route path="/wallet" component={Wallet} />
                <Route path="/notifications" component={Notifications} />
                <Route exact path="/friends" component={FriendsList} />
                <Route path="/friends/requests" component={FriendRequests} />
                <Route path="/friends/page" component={FriendRequestsPage} />
              </Switch>
            </Suspense>
            <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;