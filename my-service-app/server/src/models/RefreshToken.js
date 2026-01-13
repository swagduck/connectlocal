const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  revokedAt: {
    type: Date,
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ user: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });
RefreshTokenSchema.index({ isRevoked: 1 });

// Method to check if token is expired
RefreshTokenSchema.methods.isExpired = function() {
  return Date.now() >= this.expiresAt.getTime();
};

// Method to check if token is valid
RefreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && !this.isExpired();
};

// Method to revoke token
RefreshTokenSchema.methods.revoke = function(revokedBy = null) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  return this.save();
};

// Static method to clean up expired tokens
RefreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true }
    ]
  });
};

// Static method to find valid token by user
RefreshTokenSchema.statics.findValidByUser = function(userId) {
  return this.findOne({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to revoke all user tokens
RefreshTokenSchema.statics.revokeAllUserTokens = function(userId, revokedBy = null) {
  return this.updateMany(
    { 
      user: userId, 
      isRevoked: false 
    },
    { 
      $set: { 
        isRevoked: true, 
        revokedAt: new Date(), 
        revokedBy: revokedBy 
      } 
    }
  );
};

// Pre-save middleware to update lastUsedAt
RefreshTokenSchema.pre('save', function(next) {
  if (this.isModified('lastUsedAt')) {
    this.lastUsedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
