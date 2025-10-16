const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory storage
let generatedInvoices = [];
let invoiceCounter = 1;

// Simple data generator
function generateSimpleInvoice() {
  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: `INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000) + 1}`,
      Dt: new Date().toLocaleDateString('en-GB')
    },
    SellerDtls: {
      Gstin: "29AABCT1332L000",
      LglNm: "Test Seller Company",
      Addr1: "Test Address 1",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "Test Buyer Company",
      Pos: "29",
      Addr1: "Buyer Address 1",
      Loc: "BANGALORE", 
      Pin: 560004,
      Stcd: "29"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Test Product",
        HsnCd: "8471",
        Qty: 10,
        Unit: "NOS",
        UnitPrice: 1000,
        TotAmt: 10000,
        AssAmt: 10000,
        GstRt: 18,
        IgstAmt: 0,
        CgstAmt: 900,
        SgstAmt: 900,
        TotItemVal: 11800
      }
    ],
    ValDtls: {
      AssVal: 10000,
      CgstVal: 900,
      SgstVal: 900,
      IgstVal: 0,
      TotInvVal: 11800
    }
  };
}

// Generate some sample data
for (let i = 0; i < 5; i++) {
  generatedInvoices.push({
    id: i + 1,
    irn: `IRN${Date.now()}${i}`,
    invoiceData: generateSimpleInvoice(),
    status: 'Generated',
    generatedAt: new Date().toISOString()
  });
  invoiceCounter++;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 E-Invoice Test API - Free Hosted Version',
    description: 'Complete E-Invoice validation API for testing Indian GST invoices',
    version: '1.0.0',
    important_notice: '⚠️ THIS IS A TESTING API ONLY - NOT FOR PRODUCTION USE',
    endpoints: {
      generate: 'POST /api/e-invoice/generate',
      validate: 'POST /api/e-invoice/validate', 
      cancel: 'POST /api/e-invoice/cancel',
      invoices: 'GET /api/e-invoice/invoices',
      sample: 'GET /api/e-invoice/sample',
      validationRules: 'GET /api/e-invoice/validation-rules',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running',
    timestamp: new Date().toISOString()
  });
});

// E-Invoice routes
app.post('/api/e-invoice/generate', (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Basic validation
    if (!invoiceData.Version || invoiceData.Version !== "1.1") {
      return res.status(400).json({
        success: false,
        message: 'Version must be 1.1'
      });
    }
    
    const irn = `IRN${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    
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
    
    // Store invoice
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

app.get('/api/e-invoice/invoices', (req, res) => {
  res.json({
    success: true,
    data: generatedInvoices.map(inv => ({
      id: inv.id,
      irn: inv.irn,
      invoiceNo: inv.invoiceData.DocDtls?.No,
      sellerGstin: inv.invoiceData.SellerDtls?.Gstin,
      buyerGstin: inv.invoiceData.BuyerDtls?.Gstin,
      totalValue: inv.invoiceData.ValDtls?.TotInvVal,
      status: inv.status,
      generatedAt: inv.generatedAt
    })),
    count: generatedInvoices.length,
    message: "✅ Test data loaded successfully"
  });
});

app.get('/api/e-invoice/sample', (req, res) => {
  res.json({
    success: true,
    data: generateSimpleInvoice(),
    message: "Sample invoice for testing"
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
      allowedSupplyTypes: ["B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"]
    }
  });
});

app.post('/api/e-invoice/validate', (req, res) => {
  try {
    const invoiceData = req.body;
    const errors = [];
    
    if (!invoiceData.Version || invoiceData.Version !== "1.1") {
      errors.push("Version must be 1.1");
    }
    
    if (!invoiceData.DocDtls || !invoiceData.DocDtls.Typ) {
      errors.push("Document type is required");
    }
    
    if (errors.length > 0) {
      return res.json({
        isValid: false,
        errors: errors
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