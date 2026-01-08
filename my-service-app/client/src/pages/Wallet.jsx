import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Wallet as WalletIcon, History, CreditCard, Plus } from 'lucide-react';

const Wallet = () => {
  const { user, setUser } = useContext(AuthContext); // Cần update context để cập nhật số dư realtime sau này
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchBalance(); // Hàm này để reload lại user lấy balance mới nhất
  }, []);

  const fetchBalance = async () => {
      // Gọi API get profile để cập nhật số dư mới nhất vào context
      // (Giả sử bạn đã có api /auth/me)
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payment/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeposit = async () => {
    if (!amount || amount < 10000) {
        return toast.error("Số tiền tối thiểu là 10.000 VNĐ");
    }

    try {
        setLoading(true);
        const res = await axios.post('http://localhost:5000/api/payment/create-payment', 
            { amount: Number(amount) },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        // Chuyển hướng sang trang MoMo
        if (res.data.payUrl) {
            window.location.href = res.data.payUrl;
        }
    } catch (error) {
        toast.error("Lỗi tạo giao dịch");
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Card Số dư */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-blue-100 mb-1">Số dư hiện tại</p>
                    <h2 className="text-4xl font-bold">
                        {user?.walletBalance?.toLocaleString()} VNĐ
                    </h2>
                </div>
                <div className="bg-white/20 p-4 rounded-full">
                    <WalletIcon size={40} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form Nạp tiền */}
            <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" /> Nạp tiền vào ví
                    </h3>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Số tiền (VNĐ)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="Nhập số tiền..."
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleDeposit}
                        disabled={loading}
                        className="w-full bg-[#A50064] hover:bg-[#8d0256] text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2"
                    >
                        {loading ? 'Đang xử lý...' : (
                            <>
                                <CreditCard size={18} /> Nạp qua MoMo
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        An toàn & Bảo mật bởi MoMo Payment
                    </p>
                </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <History size={20} className="text-gray-600" /> Lịch sử giao dịch
                    </h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-500 text-sm border-b">
                                    <th className="pb-3">Loại</th>
                                    <th className="pb-3">Số tiền</th>
                                    <th className="pb-3">Trạng thái</th>
                                    <th className="pb-3 text-right">Ngày</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">Chưa có giao dịch nào</td>
                                    </tr>
                                ) : transactions.map(tx => (
                                    <tr key={tx._id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold
                                                ${tx.type === 'deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                            `}>
                                                {tx.type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'}
                                            </span>
                                        </td>
                                        <td className="py-3 font-medium">
                                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} đ
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-sm 
                                                ${tx.status === 'completed' ? 'text-green-600' : 
                                                  tx.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}
                                            `}>
                                                {tx.status === 'completed' ? 'Thành công' : 
                                                 tx.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;