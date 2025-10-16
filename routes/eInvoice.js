const express = require('express');
const router = express.Router();
const EInvoiceDataGenerator = require('../utils/dataGenerator');

const dataGenerator = new EInvoiceDataGenerator();

// Dynamic storage with auto-generated data
let generatedInvoices = [];

// Auto-generate 20 sample invoices on startup
function initializeSampleData() {
  if (generatedInvoices.length === 0) {
    const sampleInvoices = dataGenerator.generateMultipleInvoices(20);
    sampleInvoices.forEach((invoice, index) => {
      generatedInvoices.push({
        id: index + 1,
        irn: `IRN${Date.now()}${index}${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
        invoiceData: invoice,
        status: Math.random() > 0.8 ? 'Cancelled' : 'Generated',
        generatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        ...(Math.random() > 0.8 ? {
          cancelledAt: new Date().toISOString(),
          cancelReason: ['Order cancelled', 'Price dispute', 'Duplicate invoice'][Math.floor(Math.random() * 3)]
        } : {})
      });
    });
  }
}

// Initialize sample data
initializeSampleData();
let invoiceCounter = generatedInvoices.length + 1;

// Generate dynamic invoice
router.post('/generate-dynamic', (req, res) => {
  try {
    const { supplyType = "B2B", scenario, count = 1 } = req.body;
    
    let invoices = [];
    
    if (scenario) {
      // Generate specific scenario
      invoices.push(dataGenerator.generateScenario(scenario));
    } else if (count > 1) {
      // Generate multiple invoices
      invoices = dataGenerator.generateMultipleInvoices(count);
    } else {
      // Generate single invoice
      invoices.push(dataGenerator.generateInvoice(supplyType));
    }

    const results = invoices.map(invoice => {
      const irn = `IRN${Date.now()}${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
      
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
        AckNo: `ACK${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase(),
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

// Get all invoices with filtering
router.get('/invoices', (req, res) => {
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

// Get available scenarios
router.get('/scenarios', (req, res) => {
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
        },
        {
          name: "credit_note",
          description: "Credit note for returns",
          endpoint: "POST /api/e-invoice/generate-dynamic",
          body: { "scenario": "credit_note" }
        }
      ],
      supplyTypes: ["B2B", "EXPWP", "EXPWOP", "SEZWP", "SEZWOP", "DEXP"],
      states: Object.keys(dataGenerator.states)
    }
  });
});

// Bulk generate invoices
router.post('/bulk-generate', (req, res) => {
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
      const irn = `IRN${Date.now()}${i}${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
      
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
router.post('/reset-data', (req, res) => {
  const { count = 20 } = req.body;
  
  generatedInvoices = [];
  invoiceCounter = 1;
  initializeSampleData();
  
  // Generate additional data if requested
  if (count > 20) {
    const additionalInvoices = dataGenerator.generateMultipleInvoices(count - 20);
    additionalInvoices.forEach((invoice, index) => {
      generatedInvoices.push({
        id: invoiceCounter++,
        irn: `IRN${Date.now()}${index}${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
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

// Keep your existing endpoints (generate, validate, cancel, etc.)
// ... [your existing endpoints here]

module.exports = router;