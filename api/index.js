// api/index.js - UPDATED VERSION
const express = require('express');
const app = express();
const eInvoiceRoutes = require('../routes/eInvoice'); // Path is CORRECT for your structure

app.use(express.json());

// Mount routes
app.use('/api/e-invoice', eInvoiceRoutes);

// Health endpoint (MUST match frontend call)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalInvoices: 20, // Hardcoded for now to test
    timestamp: new Date().toISOString() 
  });
});

// Export for Vercel
module.exports = app;