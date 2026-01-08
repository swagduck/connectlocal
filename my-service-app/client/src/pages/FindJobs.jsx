import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { MapPin, DollarSign, Briefcase } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const FindJobs = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            setRequests(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (id) => {
        try {
            await api.put(`/requests/${id}/apply`);
            toast.success("Đã ứng tuyển! Hãy chờ khách chọn bạn.");
            // Cập nhật giao diện (ẩn nút ứng tuyển đi hoặc disable)
            setRequests(requests.map(r => 
                r._id === id ? { ...r, applicants: [...(r.applicants || []), user._id] } : r
            ));
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi ứng tuyển");
        }
    };

    if (loading) return <div className="text-center mt-20">Đang tải danh sách việc...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Việc đang tìm người ({requests.length})</h1>
            
            <div className="grid gap-6">
                {requests.map((req) => {
                    // Kiểm tra xem mình đã ứng tuyển chưa
                    const isApplied = req.applicants && req.applicants.includes(user?._id);

                    return (
                        <div key={req._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <img src={req.user?.avatar || "https://via.placeholder.com/50"} className="w-12 h-12 rounded-full border" alt="user" />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{req.title}</h3>
                                        <div className="text-sm text-gray-500 mb-2">
                                            <span className="font-semibold text-gray-700">{req.user?.name}</span> • 
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs ml-2">{req.category}</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">{req.description}</p>
                                        <div className="flex gap-4 text-sm font-medium text-gray-600">
                                            <span className="flex items-center"><MapPin size={16} className="mr-1"/> {req.address}</span>
                                            <span className="flex items-center text-green-600"><DollarSign size={16} className="mr-1"/> {req.budget.toLocaleString()} đ</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {user?.role === 'provider' && (
                                    isApplied ? (
                                        <button disabled className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-bold cursor-not-allowed">
                                            Đã ứng tuyển
                                        </button>
                                    ) : (
                                        <button onClick={() => handleApply(req._id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center">
                                            <Briefcase size={18} className="mr-2" /> Ứng tuyển ngay
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
                {requests.length === 0 && <p className="text-center text-gray-500">Chưa có công việc nào.</p>}
            </div>
        </div>
    );
};

export default FindJobs;