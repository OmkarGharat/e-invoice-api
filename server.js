const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const eInvoiceRoutes = require('./routes/eInvoice');
app.use('/api/e-invoice', eInvoiceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 E-Invoice Test API - Free Hosted Version',
    description: 'Complete E-Invoice validation API for testing Indian GST invoices',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /api/e-invoice/generate',
      validate: 'POST /api/e-invoice/validate',
      cancel: 'POST /api/e-invoice/cancel',
      invoices: 'GET /api/e-invoice/invoices',
      sample: 'GET /api/e-invoice/sample',
      validationRules: 'GET /api/e-invoice/validation-rules',
      health: 'GET /health'
    },
    usage: {
      generate: 'Send POST request with invoice JSON to generate IRN',
      validate: 'Send POST request to validate invoice data without generating IRN'
    }
  });
});

// Export for Vercel
module.exports = app;

// Start server locally if not in Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🚀 E-Invoice API running on port ${PORT}`);
  });
}
