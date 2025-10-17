const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Import data generator
const EInvoiceDataGenerator = require('./utils/dataGenerator');
const dataGenerator = new EInvoiceDataGenerator();

// Simple storage for generated invoices
let invoices = [];
let counter = 1;

// Initialize with some samples
const TEST_SAMPLES = dataGenerator.getTestSamples();
Object.values(TEST_SAMPLES).forEach((sample, index) => {
  invoices.push({
    id: counter++,
    irn: `IRNSAMPLE${index + 1}`,
    invoiceData: sample,
    status: 'Generated',
    generatedAt: new Date().toISOString()
  });
});

// ==================== API ENDPOINTS ====================

// Root endpoint - serves the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running smoothly',
    timestamp: new Date().toISOString(),
    totalInvoices: invoices.length,
    version: '2.0.0'
  });
});

// Get all invoices
app.get('/api/e-invoice/invoices', (req, res) => {
  try {
    const { status, supplyType, state, page = 1, limit = 10 } = req.query;
    
    let filteredInvoices = [...invoices];
    
    // Apply filters
    if (status) filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    if (supplyType) filteredInvoices = filteredInvoices.filter(inv => inv.invoiceData.TranDtls.SupTyp === supplyType);
    if (state) filteredInvoices = filteredInvoices.filter(inv => 
      inv.invoiceData.SellerDtls.Stcd === state || 
      inv.invoiceData.BuyerDtls.Stcd === state
    );
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedInvoices.map(inv => ({
        id: inv.id,
        irn: inv.irn,
        invoiceNo: inv.invoiceData.DocDtls.No,
        sellerGstin: inv.invoiceData.SellerDtls.Gstin,
        buyerGstin: inv.invoiceData.BuyerDtls.Gstin,
        supplyType: inv.invoiceData.TranDtls.SupTyp,
        totalValue: inv.invoiceData.ValDtls.TotInvVal,
        status: inv.status,
        generatedAt: inv.generatedAt,
        sellerState: inv.invoiceData.SellerDtls.Stcd,
        buyerState: inv.invoiceData.BuyerDtls.Stcd
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredInvoices.length,
        pages: Math.ceil(filteredInvoices.length / limit)
      },
      count: filteredInvoices.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific sample by ID
app.get('/api/e-invoice/sample/:id', (req, res) => {
  try {
    const id = req.params.id;
    const samples = dataGenerator.getTestSamples();
    
    if (samples[id]) {
      res.json({
        success: true,
        data: samples[id],
        sampleId: parseInt(id),
        description: dataGenerator.getSampleDescription(id),
        type: samples[id].TranDtls.SupTyp
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Sample ${id} not found. Available samples: 1-${Object.keys(samples).length}`,
        availableSamples: Object.keys(samples).map(id => ({
          id: parseInt(id),
          type: samples[id].TranDtls.SupTyp,
          description: dataGenerator.getSampleDescription(id)
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available samples
app.get('/api/e-invoice/samples', (req, res) => {
  try {
    const samples = dataGenerator.getTestSamples();
    const samplesList = Object.keys(samples).map(id => ({
      id: parseInt(id),
      type: samples[id].TranDtls.SupTyp,
      description: dataGenerator.getSampleDescription(id),
      invoiceNo: samples[id].DocDtls.No,
      totalValue: samples[id].ValDtls.TotInvVal,
      endpoint: `/api/e-invoice/sample/${id}`
    }));
    
    res.json({
      success: true,
      data: samplesList,
      count: samplesList.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random sample
app.get('/api/e-invoice/sample', (req, res) => {
  try {
    const samples = dataGenerator.getTestSamples();
    const randomId = Math.floor(Math.random() * Object.keys(samples).length) + 1;
    
    res.json({
      success: true,
      data: samples[randomId],
      sampleId: randomId,
      description: dataGenerator.getSampleDescription(randomId.toString()),
      note: "This is a random sample. Use /api/e-invoice/sample/:id for specific samples"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic invoice
app.post('/api/e-invoice/generate-dynamic', (req, res) => {
  try {
    const { count = 1, sampleId } = req.body;
    const samples = dataGenerator.getTestSamples();
    const newInvoices = [];
    
    for (let i = 0; i < count; i++) {
      let invoiceData;
      
      if (sampleId && samples[sampleId]) {
        invoiceData = JSON.parse(JSON.stringify(samples[sampleId]));
        invoiceData.DocDtls.No = `GEN/${new Date().getFullYear()}/${counter}`;
      } else {
        const randomId = Math.floor(Math.random() * Object.keys(samples).length) + 1;
        invoiceData = dataGenerator.generateInvoice(samples[randomId].TranDtls.SupTyp);
      }
      
      const irn = `IRN${Date.now()}${counter}`;
      
      const invoice = {
        id: counter++,
        irn: irn,
        invoiceData: invoiceData,
        status: 'Generated',
        generatedAt: new Date().toISOString()
      };
      
      invoices.push(invoice);
      newInvoices.push({
        Irn: irn,
        AckNo: `ACK${Date.now()}`,
        SignedInvoice: invoiceData,
        templateUsed: sampleId || 'random'
      });
    }
    
    res.json({
      success: true,
      data: count === 1 ? newInvoices[0] : newInvoices,
      message: `Generated ${count} invoice(s)`
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Original generate endpoint
app.post('/api/e-invoice/generate', (req, res) => {
  try {
    const invoiceData = req.body;
    const irn = `IRN${Date.now()}${counter}`;
    
    const invoice = {
      id: counter++,
      irn: irn,
      invoiceData: invoiceData,
      status: 'Generated',
      generatedAt: new Date().toISOString()
    };
    
    invoices.push(invoice);
    
    res.json({
      success: true,
      data: {
        Irn: irn,
        AckNo: `ACK${Date.now()}`,
        SignedInvoice: invoiceData
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate invoice
app.post('/api/e-invoice/validate', (req, res) => {
  try {
    const invoiceData = req.body;
    const errors = dataGenerator.validateBasicInvoice(invoiceData);
    
    if (errors.length > 0) {
      return res.json({
        isValid: false,
        errors: errors.map(error => ({ message: error }))
      });
    }
    
    res.json({
      isValid: true,
      message: 'E-Invoice data is valid for basic checks'
    });
    
  } catch (error) {
    res.status(500).json({
      isValid: false,
      message: 'Validation error',
      error: error.message
    });
  }
});

// Cancel invoice
app.post('/api/e-invoice/cancel', (req, res) => {
  try {
    const { irn, cancelReason } = req.body;
    
    if (!irn) {
      return res.status(400).json({
        success: false,
        message: 'IRN is required'
      });
    }
    
    const invoice = invoices.find(inv => inv.irn === irn);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    invoice.status = 'Cancelled';
    invoice.cancelledAt = new Date().toISOString();
    invoice.cancelReason = cancelReason;
    
    res.json({
      success: true,
      message: 'Invoice cancelled successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling invoice'
    });
  }
});

// Get statistics
app.get('/api/e-invoice/stats', (req, res) => {
  try {
    const stats = {
      totalInvoices: invoices.length,
      generated: invoices.filter(inv => inv.status === 'Generated').length,
      cancelled: invoices.filter(inv => inv.status === 'Cancelled').length,
      bySupplyType: {},
      byState: {},
      totalValue: invoices.reduce((sum, inv) => sum + inv.invoiceData.ValDtls.TotInvVal, 0)
    };
    
    invoices.forEach(inv => {
      const supplyType = inv.invoiceData.TranDtls.SupTyp;
      const state = inv.invoiceData.SellerDtls.Stcd;
      
      stats.bySupplyType[supplyType] = (stats.bySupplyType[supplyType] || 0) + 1;
      stats.byState[state] = (stats.byState[state] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 Documentation: http://localhost:${PORT}`);
  });
}