require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// --- ROUTES IMPORTS ---
const chatRoutes = require('./src/routes/chatRoutes');
const paperRoutes = require('./src/routes/paperRoutes');
const synthesisRoutes = require('./src/routes/synthesisRoutes');
const quotaRoutes = require('./src/routes/quotaRoutes'); 
const paymentRoutes = require('./src/routes/paymentRoutes'); 


const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// --- API ROUTES MOUNTING ---
app.use('/api/user', quotaRoutes); 
app.use('/api/papers', paperRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/synthesis', synthesisRoutes);
app.use('/api/payment', paymentRoutes); 


// Root Endpoint
app.get('/', (req, res) => {
  res.send('Research Archive Node.js API is running...');
});

// Port Listing
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;