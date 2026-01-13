const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateDetails,
  getPublicProfile,
  revokeAllTokens,
  getActiveSessions,
  cleanupExpiredTokens,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.post("/logout", protect, logout);

// Token management routes
router.post("/revoke-tokens", protect, revokeAllTokens);
router.get("/active-sessions", protect, getActiveSessions);
router.post("/cleanup-tokens", protect, cleanupExpiredTokens);

// Admin token management
router.post("/revoke-tokens/:id", protect, revokeAllTokens);
router.get("/active-sessions/:id", protect, getActiveSessions);

// Public profile route (must be last to avoid conflicts with /:id)
router.get("/users/:id", getPublicProfile);

module.exports = router;
