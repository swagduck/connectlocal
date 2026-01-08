import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Dùng api instance đã cấu hình sẵn thay vì axios trần
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Wallet as WalletIcon, History, CreditCard, Plus, Trash2 } from 'lucide-react'; // Import Trash2

const Wallet = () => {
  const { user } = useContext(AuthContext); 
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/payment/history');
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
        const res = await api.post('/payment/create-payment', { amount: Number(amount) });
        
        if (res.data.payUrl) {
            window.location.href = res.data.payUrl;
        }
    } catch (error) {
        toast.error("Lỗi tạo giao dịch");
        setLoading(false);
    }
  };

  // 👇 Hàm xóa giao dịch
  const handleDeleteTransaction = async (id) => {
      if(!window.confirm("Bạn có chắc muốn xóa lịch sử này không?")) return;
      
      try {
          await api.delete(`/payment/${id}`);
          toast.success("Đã xóa lịch sử");
          // Cập nhật lại danh sách (xóa dòng tương ứng khỏi state)
          setTransactions(transactions.filter(t => t._id !== id));
      } catch (error) {
          toast.error("Không thể xóa giao dịch này");
      }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Card Số dư */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <WalletIcon size={100} />
            </div>
            <div className="relative z-10">
                <p className="text-green-100 mb-2 font-medium">Số dư khả dụng</p>
                <h2 className="text-5xl font-bold tracking-tight">
                    {user?.walletBalance?.toLocaleString()} <span className="text-2xl font-normal">VNĐ</span>
                </h2>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form Nạp tiền */}
            <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                        <Plus size={20} className="text-blue-600" /> Nạp tiền
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-600 text-sm font-bold mb-2">Nhập số tiền</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-gray-700"
                                    placeholder="50.000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <span className="absolute right-4 top-3 text-gray-400 font-bold">đ</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {[20000, 50000, 100000].map(val => (
                                <button 
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className="border border-gray-200 py-1 rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-600"
                                >
                                    {val/1000}k
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleDeposit}
                            disabled={loading}
                            className="w-full bg-[#A50064] hover:bg-[#8d0256] text-white py-3.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-pink-200"
                        >
                            {loading ? 'Đang xử lý...' : (
                                <>
                                    <CreditCard size={18} /> Nạp MoMo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                        <History size={20} className="text-gray-600" /> Biến động số dư
                    </h3>
                    
                    <div className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b">
                                        <th className="pb-3 pl-2">Loại GD</th>
                                        <th className="pb-3">Số tiền</th>
                                        <th className="pb-3">Trạng thái</th>
                                        <th className="pb-3">Thời gian</th>
                                        <th className="pb-3 text-right pr-2">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-400 italic">
                                                Chưa có giao dịch nào
                                            </td>
                                        </tr>
                                    ) : transactions.map(tx => (
                                        <tr key={tx._id} className="border-b last:border-0 hover:bg-gray-50 transition group">
                                            <td className="py-4 pl-2">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : tx.type === 'refund' ? 'text-blue-600' : 'text-gray-700'}`}>
                                                        {tx.type === 'deposit' ? 'Nạp tiền' : tx.type === 'refund' ? 'Hoàn tiền' : 'Thanh toán'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 truncate max-w-[150px]">{tx.description}</span>
                                                </div>
                                            </td>
                                            <td className={`py-4 font-bold ${tx.type === 'payment' ? 'text-red-500' : 'text-green-600'}`}>
                                                {tx.type === 'payment' ? '-' : '+'}{tx.amount.toLocaleString()} đ
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold
                                                    ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                      tx.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                                                `}>
                                                    {tx.status === 'completed' ? 'Thành công' : 
                                                     tx.status === 'failed' ? 'Thất bại' : 'Chờ xử lý'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-500 text-xs">
                                                {new Date(tx.createdAt).toLocaleDateString('vi-VN')} <br/>
                                                {new Date(tx.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="py-4 text-right pr-2">
                                                <button 
                                                    onClick={() => handleDeleteTransaction(tx._id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                                    title="Xóa lịch sử này"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
    </div>
  );
};

export default Wallet;