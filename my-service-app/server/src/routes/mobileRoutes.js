const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// Auth routes for mobile app
router.get("/auth/me", async (req, res) => {
  try {
    // For testing, return first user with proper structure
    const users = await User.find().sort("-createdAt");
    if (users.length > 0) {
      const user = users[0];
      res.status(200).json({ 
        success: true, 
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'customer',
          walletBalance: user.walletBalance || 0
        }
      });
    } else {
      res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Email không tồn tại" });
    }
    
    // For testing, accept any password
    res.status(200).json({
      success: true,
      token: "mock-token-" + Date.now(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'customer',
        walletBalance: user.walletBalance || 0
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Public routes for mobile app (no auth middleware)
router.get("/services", async (req, res) => {
  try {
    const services = await Service.find().sort("-createdAt").populate("user", "name email");
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/services/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("user", "name email");
    if (!service) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/services", async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/services/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Transaction routes for mobile app
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort("-createdAt").populate("user", "name email");
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/transactions/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate("user", "name email");
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/transactions/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// User services (get services by user ID)
router.get("/services/user/:userId", async (req, res) => {
  try {
    const Service = require("../models/Service");
    const services = await Service.find({ user: req.params.userId })
      .sort("-createdAt")
      .populate("user", "name email");
    
    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Toggle service availability
router.patch("/services/:id/availability", async (req, res) => {
  try {
    const Service = require("../models/Service");
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ"
      });
    }
    
    service.availability = !service.availability;
    await service.save();
    
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Nearby workers
router.get("/workers/nearby", async (req, res) => {
  try {
    const Service = require("../models/Service");
    const User = require("../models/User");
    
    // Get all services with user info
    const services = await Service.find({ availability: true })
      .populate("user", "name email phone avatar")
      .sort("-createdAt");
    
    // Transform to worker format
    const workers = services.map(service => ({
      id: service._id,
      name: service.user.name,
      profession: service.category,
      rating: service.rating || 4.5,
      distance: "1.5 km", // Mock distance for now
      avatar: service.user.avatar || null,
      phone: service.user.phone || null,
      serviceId: service._id,
      serviceName: service.title,
      price: service.price,
      location: service.location.address,
    }));
    
    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Wallet transactions by user
router.get("/wallet/transactions", async (req, res) => {
  try {
    const Transaction = require("../models/Transaction");
    const transactions = await Transaction.find()
      .sort("-createdAt")
      .populate("user", "name email");
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Add money to wallet
router.post("/wallet/add", async (req, res) => {
  try {
    const Transaction = require("../models/Transaction");
    const User = require("../models/User");
    
    const { amount, userId } = req.body;
    
    if (!amount || !userId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số tiền và ID người dùng"
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      type: "deposit",
      amount: Number(amount),
      description: `Nạp tiền vào ví`,
      status: "completed",
    });
    
    // Update user wallet balance
    await User.findByIdAndUpdate(userId, {
      $inc: { walletBalance: Number(amount) }
    });
    
    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Withdraw money from wallet
router.post("/wallet/withdraw", async (req, res) => {
  try {
    const Transaction = require("../models/Transaction");
    const User = require("../models/User");
    
    const { amount, userId } = req.body;
    
    if (!amount || !userId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số tiền và ID người dùng"
      });
    }
    
    // Check user balance
    const user = await User.findById(userId);
    if (user.walletBalance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Số dư không đủ"
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      type: "withdrawal",
      amount: Number(amount),
      description: `Rút tiền từ ví`,
      status: "pending",
    });
    
    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
