const mongoose = require('mongoose');

const savedPaperSchema = new mongoose.Schema({
  paperId: { type: String, required: true }, 
  title: { type: String, required: true },
  authors: { type: String },
  year: { type: Number },
  similarity: { type: Number },
  dataset: { type: String },
  hasDataset: { type: Boolean },
  
  clerkId: { type: String, required: true },
  
  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SavedPaper', savedPaperSchema);