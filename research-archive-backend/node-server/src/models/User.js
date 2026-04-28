const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  fullName: { 
    type: String 
  },
  role: { 
    type: String, 
    default: 'Scholar'
  },
  searchLimit: { 
    type: Number, 
    default: 100 
  },
  searchUsed: { 
    type: Number, 
    default: 0 
  },
  savedPapers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Paper' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);