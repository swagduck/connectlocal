import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Get auth token from localStorage
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Friend service functions
export const friendService = {
  // Send friend request
  sendRequest: async (recipientId) => {
    try {
      const response = await axios.post(
        `${API_URL}/friends/request`,
        { recipientId },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi gửi lời mời kết bạn' };
    }
  },

  // Accept friend request
  acceptRequest: async (requestId) => {
    try {
      const response = await axios.put(
        `${API_URL}/friends/accept/${requestId}`,
        {},
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi chấp nhận lời mời' };
    }
  },

  // Reject friend request
  rejectRequest: async (requestId) => {
    try {
      const response = await axios.put(
        `${API_URL}/friends/reject/${requestId}`,
        {},
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi từ chối lời mời' };
    }
  },

  // Cancel friend request
  cancelRequest: async (requestId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/friends/cancel/${requestId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi hủy lời mời' };
    }
  },

  // Unfriend
  unfriend: async (friendId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/friends/unfriend/${friendId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi hủy kết bạn' };
    }
  },

  // Get friends list
  getFriends: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${API_URL}/friends?page=${page}&limit=${limit}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi lấy danh sách bạn bè' };
    }
  },

  // Get pending requests (received)
  getPendingRequests: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${API_URL}/friends/pending?page=${page}&limit=${limit}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi lấy lời mời đang chờ' };
    }
  },

  // Get sent requests
  getSentRequests: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${API_URL}/friends/sent?page=${page}&limit=${limit}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi lấy lời mời đã gửi' };
    }
  },

  // Check friend status
  checkStatus: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/friends/status/${userId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi kiểm tra trạng thái kết bạn' };
    }
  }
};
