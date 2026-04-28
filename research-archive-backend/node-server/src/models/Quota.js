const mongoose = require('mongoose');

const quotaSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String },
  name: { type: String },  
  plan: { type: String, default: 'Basic Scholar' },
  searchLimit: { type: Number, default: 20 },
  searchUsed: { type: Number, default: 0 },
  reviewLimit: { type: Number, default: 5 },
  reviewUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }, 
  lastLogin: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Quota', quotaSchema);