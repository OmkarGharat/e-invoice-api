const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const EInvoiceDataGenerator = require('./utils/dataGenerator');

const app = express();
const dataGenerator = new EInvoiceDataGenerator();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory storage
let generatedInvoices = [];
let invoiceCounter = 1;

// Generate initial sample data
function initializeSampleData() {
  const sampleInvoices = dataGenerator.generateMultipleInvoices(10);
  sampleInvoices.forEach((invoice, index) => {
    generatedInvoices.push({
      id: index + 1,
      irn: `IRN${Date.now()}${index}`.toUpperCase(),
      invoiceData: invoice,
      status: Math.random() > 0.8 ? 'Cancelled' : 'Generated',
      generatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...(Math.random() > 0.8 ? {
        cancelledAt: new Date().toISOString(),
        cancelReason: ['Order cancelled', 'Price dispute', 'Duplicate invoice'][Math.floor(Math.random() * 3)]
      } : {})
    });
  });
  invoiceCounter = generatedInvoices.length + 1;
}

// Initialize sample data
initializeSampleData();

// Helper functions
function generateIRN() {
  return `IRN${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
}

function validateBasicInvoice(data) {
  const errors = [];
  
  if (!data.Version || data.Version !== "1.1") {
    errors.push("Version must be 1.1");
  }
  
  if (!data.DocDtls || !data.DocDtls.Typ || !['INV', 'CRN', 'DBN'].includes(data.DocDtls.Typ)) {
    errors.push("Invalid document type");
  }
  
  if (!data.SellerDtls || !data.SellerDtls.Gstin) {
    errors.push("Seller GSTIN is required");
  }
  
  if (!data.BuyerDtls || !data.BuyerDtls.Gstin) {
    errors.push("Buyer GSTIN is required");
  }
  
  if (!data.ItemList || data.ItemList.length === 0) {
    errors.push("At least one item is required");
  }
  
  return errors;
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 E-Invoice Test API - Free Hosted Version',
    description: 'Complete E-Invoice validation API with DYNAMIC data generation',
    version: '2.0.0',
    important_notice: '⚠️ THIS IS A TESTING API ONLY - NOT FOR PRODUCTION USE',
    endpoints: {
      // Original endpoints
      generate: 'POST /api/e-invoice/generate',
      validate: 'POST /api/e-invoice/validate', 
      cancel: 'POST /api/e-invoice/cancel',
      invoices: 'GET /api/e-invoice/invoices',
      sample: 'GET /api/e-invoice/sample',
      validationRules: 'GET /api/e-invoice/validation-rules',
      health: 'GET /health',
      
      // NEW DYNAMIC ENDPOINTS
      generateDynamic: 'POST /api/e-invoice/generate-dynamic',
      bulkGenerate: 'POST /api/e-invoice/bulk-generate',
      resetData: 'POST /api/e-invoice/reset-data',
      scenarios: 'GET /api/e-invoice/scenarios',
      stats: 'GET /api/e-invoice/stats'
    },
    features: [
      'Dynamic invoice generation',
      'Multiple supply types (B2B, Export, SEZ)',
      'Realistic company names and GSTINs',
      'Automatic tax calculations',
      'Filtering and pagination'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running',
    timestamp: new Date().toISOString(),
    totalInvoices: generatedInvoices.length
  });
});

// ==================== DYNAMIC GENERATION ENDPOINTS ====================

// Generate dynamic invoice
app.post('/api/e-invoice/generate-dynamic', (req, res) => {
  try {
    const { supplyType = "B2B", scenario, count = 1 } = req.body;
    
    let invoices = [];
    
    if (scenario) {
      invoices.push(dataGenerator.generateScenario(scenario));
    } else if (count > 1) {
      invoices = dataGenerator.generateMultipleInvoices(count);
    } else {
      invoices.push(dataGenerator.generateInvoice(supplyType));
    }

    const results = invoices.map(invoice => {
      const irn = generateIRN();
      
      const invoiceRecord = {
        id: invoiceCounter++,
        irn: irn,
        invoiceData: invoice,
        status: 'Generated',
        generatedAt: new Date().toISOString()
      };
      
      generatedInvoices.push(invoiceRecord);
      
      return {
        Irn: irn,
        AckNo: `ACK${Date.now()}`,
        AckDt: new Date().toLocaleDateString('en-GB'),
        SignedInvoice: {
          ...invoice,
          IRN: irn
        },
        QRCode: `QR_${irn}`
      };
    });

    res.json({
      success: true,
      data: count === 1 ? results[0] : results,
      count: results.length,
      message: `Successfully generated ${results.length} dynamic invoice(s)`
    });

  } catch (error) {
    console.error('Error generating dynamic invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dynamic invoice',
      error: error.message
    });
  }
});

// Bulk generate invoices
app.post('/api/e-invoice/bulk-generate', (req, res) => {
  try {
    const { count = 10, supplyTypes = ["B2B", "EXPWP", "SEZWP"] } = req.body;
    
    if (count > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot generate more than 100 invoices at once"
      });
    }
    
    const invoices = [];
    
    for (let i = 0; i < count; i++) {
      const supplyType = supplyTypes[Math.floor(Math.random() * supplyTypes.length)];
      const invoice = dataGenerator.generateInvoice(supplyType);
      const irn = generateIRN();
      
      invoices.push({
        id: invoiceCounter++,
        irn: irn,
        invoiceData: invoice,
        status: 'Generated',
        generatedAt: new Date().toISOString()
      });
    }
    
    generatedInvoices.push(...invoices);
    
    res.json({
      success: true,
      data: {
        generated: invoices.length,
        totalInvoices: generatedInvoices.length,
        sampleIrn: invoices[0]?.irn
      },
      message: `Successfully generated ${invoices.length} invoices`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk generation",
      error: error.message
    });
  }
});

// Reset and regenerate data
app.post('/api/e-invoice/reset-data', (req, res) => {
  const { count = 20 } = req.body;
  
  generatedInvoices = [];
  invoiceCounter = 1;
  initializeSampleData();
  
  if (count > 10) {
    const additionalInvoices = dataGenerator.generateMultipleInvoices(count - 10);
    additionalInvoices.forEach((invoice, index) => {
      generatedInvoices.push({
        id: invoiceCounter++,
        irn: generateIRN(),
        invoiceData: invoice,
        status: 'Generated',
        generatedAt: new Date().toISOString()
      });
    });
  }
  
  res.json({
    success: true,
    data: {
      totalInvoices: generatedInvoices.length,
      message: `Data reset with ${generatedInvoices.length} invoices`
    }
  });
});

// Get available scenarios
app.get('/api/e-invoice/scenarios', (req, res) => {
  res.json({
    success: true,
    data: {
      scenarios: [
        {
          name: "b2b_interstate",
          description: "B2B transaction between different states (IGST applicable)",
          endpoint: "POST /api/e-invoice/generate-dynamic",
          body: { "scenario": "b2b_interstate" }
        },
        {
          name: "b2b_intrastate", 
          description: "B2B transaction within same state (CGST+SGST applicable)",
          endpoint: "POST /api/e-invoice/generate-dynamic",
          body: { "scenario": "b2b_intrastate" }
        },
        {
          name: "export",
          description: "Export transaction with zero tax",
          endpoint: "POST /api/e-invoice/generate-dynamic", 
          body: { "scenario": "export" }
        },
        {
          name: "sez",
          description: "Supply to SEZ unit",
          endpoint: "POST /api/e-invoice/generate-dynamic",
          body: { "scenario": "sez" }
        },
        {
          name: "reverse_charge",
          description: "Reverse charge mechanism invoice",
          endpoint: "POST /api/e-invoice/generate-dynamic",
          body: { "scenario": "reverse_charge" }
        }
      ],
      supplyTypes: ["B2B", "EXPWP", "EXPWOP", "SEZWP", "SEZWOP", "DEXP"],
      states: Object.keys(dataGenerator.states)
    }
  });
});

// ==================== ORIGINAL ENDPOINTS (ENHANCED) ====================

app.get('/api/e-invoice/invoices', (req, res) => {
  const { status, supplyType, state, page = 1, limit = 10 } = req.query;
  
  let filteredInvoices = [...generatedInvoices];
  
  // Apply filters
  if (status) {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
  }
  
  if (supplyType) {
    filteredInvoices = filteredInvoices.filter(inv => 
      inv.invoiceData.TranDtls.SupTyp === supplyType
    );
  }
  
  if (state) {
    filteredInvoices = filteredInvoices.filter(inv => 
      inv.invoiceData.SellerDtls.Stcd === state || 
      inv.invoiceData.BuyerDtls.Stcd === state
    );
  }
  
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
      documentType: inv.invoiceData.DocDtls.Typ,
      sellerState: inv.invoiceData.SellerDtls.Stcd,
      buyerState: inv.invoiceData.BuyerDtls.Stcd
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredInvoices.length,
      pages: Math.ceil(filteredInvoices.length / limit)
    },
    count: filteredInvoices.length,
    message: "✅ Dynamically generated test data"
  });
});

app.post('/api/e-invoice/generate', (req, res) => {
  try {
    const invoiceData = req.body;
    
    const errors = validateBasicInvoice(invoiceData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    const irn = generateIRN();
    
    const response = {
      success: true,
      data: {
        Irn: irn,
        AckNo: `ACK${Date.now()}`,
        AckDt: new Date().toLocaleDateString('en-GB'),
        SignedInvoice: {
          ...invoiceData,
          IRN: irn
        },
        QRCode: `QR_${irn}`
      },
      message: 'E-Invoice generated successfully'
    };
    
    generatedInvoices.push({
      id: invoiceCounter++,
      irn: irn,
      invoiceData: invoiceData,
      status: 'Generated',
      generatedAt: new Date().toISOString()
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/api/e-invoice/sample', (req, res) => {
  const sampleInvoice = dataGenerator.generateInvoice("B2B");
  
  res.json({
    success: true,
    data: sampleInvoice,
    message: "Dynamic sample invoice - refresh for new data!"
  });
});

app.get('/api/e-invoice/validation-rules', (req, res) => {
  res.json({
    success: true,
    data: {
      version: "1.1",
      maxItems: 1000,
      maxPayload: "2MB",
      mandatoryFields: ["Version", "TranDtls", "DocDtls", "SellerDtls", "BuyerDtls", "ItemList", "ValDtls"],
      allowedDocTypes: ["INV", "CRN", "DBN"],
      allowedSupplyTypes: ["B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"],
      sampleIRNs: generatedInvoices.slice(0, 3).map(inv => inv.irn)
    }
  });
});

app.post('/api/e-invoice/validate', (req, res) => {
  try {
    const invoiceData = req.body;
    const errors = validateBasicInvoice(invoiceData);
    
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

app.post('/api/e-invoice/cancel', (req, res) => {
  try {
    const { irn, cancelReason } = req.body;
    
    if (!irn) {
      return res.status(400).json({
        success: false,
        message: 'IRN is required'
      });
    }
    
    const invoice = generatedInvoices.find(inv => inv.irn === irn);
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
  const stats = {
    totalInvoices: generatedInvoices.length,
    generated: generatedInvoices.filter(inv => inv.status === 'Generated').length,
    cancelled: generatedInvoices.filter(inv => inv.status === 'Cancelled').length,
    bySupplyType: {},
    byState: {},
    totalValue: generatedInvoices.reduce((sum, inv) => sum + inv.invoiceData.ValDtls.TotInvVal, 0)
  };
  
  generatedInvoices.forEach(inv => {
    const supplyType = inv.invoiceData.TranDtls.SupTyp;
    const state = inv.invoiceData.SellerDtls.Stcd;
    
    stats.bySupplyType[supplyType] = (stats.bySupplyType[supplyType] || 0) + 1;
    stats.byState[state] = (stats.byState[state] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: stats
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`
  });
});

const PORT = process.env.PORT || 3000;

// Export for Vercel
module.exports = app;

// Start server locally if not in Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🚀 E-Invoice API running on port ${PORT}`);
  });
}