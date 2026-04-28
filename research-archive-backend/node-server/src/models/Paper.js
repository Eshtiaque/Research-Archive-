const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  authors: [{ 
    type: String 
  }],
  abstract: { 
    type: String 
  },
  sourceUrl: { 
    type: String 
  },
  publishedYear: { 
    type: String 
  },
  datasetsUsed: [{ 
    type: String 
  }],
  
  clerkId: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema);