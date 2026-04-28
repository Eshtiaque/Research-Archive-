const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  sourceUrl: {
    type: String
  },
  linkedPapers: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Paper'
  }],
  clerkId: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Dataset', datasetSchema);