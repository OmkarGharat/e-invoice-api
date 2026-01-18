// api/index.js - UPDATED WITH ERROR HANDLING
console.log('⏳ API Function is starting...');

try {
  const express = require('express');
  const app = express();
  
  // Try to load the routes
  console.log('⏳ Attempting to require routes/eInvoice...');
  const eInvoiceRoutes = require('../routes/eInvoice');
  console.log('✅ Routes loaded successfully');
  
  app.use(express.json());
  app.use('/api/e-invoice', eInvoiceRoutes);
  
  // Health endpoint
  app.get('/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
      status: 'OK', 
      totalInvoices: 0,
      timestamp: new Date().toISOString() 
    });
  });
  
  // Export the app
  console.log('✅ API Function setup complete');
  module.exports = app;
  
} catch (error) {
  // This will log the exact error to Vercel's logs
  console.error('❌ FATAL ERROR during API setup:', error);
  console.error('Error stack:', error.stack);
  
  // Export a simple app that shows the error
  const express = require('express');
  const errorApp = express();
  errorApp.get('*', (req, res) => {
    res.status(500).json({
      error: 'Server setup failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
  module.exports = errorApp;
}