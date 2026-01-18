// api/index.js
const express = require('express');
const app = express();
const eInvoiceRoutes = require('../routes/eInvoice');

// Middleware to parse JSON
app.use(express.json());

// Use your e-invoice routes
app.use('/api/e-invoice', eInvoiceRoutes);

// A health check endpoint (your frontend calls this)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    totalInvoices: 0, // This should be connected to your actual data later
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Export the app as a serverless function
module.exports = app;