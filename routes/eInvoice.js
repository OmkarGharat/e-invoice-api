const express = require('express');
const router = express.Router();

// Simple in-memory storage
let generatedInvoices = [];
let invoiceCounter = 1;

// Helper functions
function generateIRN() {
  return `IRN${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
}

function validateBasicInvoice(data) {
  const errors = [];
  
  // Basic validations
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
  
  if (data.ItemList && data.ItemList.length > 1000) {
    errors.push("Maximum 1000 items allowed");
  }
  
  return errors;
}

// Generate E-Invoice
router.post('/generate', (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Basic validation
    const errors = validateBasicInvoice(invoiceData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Check payload size
    const payloadSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (payloadSize > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Payload size exceeds 2MB limit'
      });
    }
    
    // Generate IRN
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

// Validate E-Invoice
router.post('/validate', (req, res) => {
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

// Get all invoices
router.get('/invoices', (req, res) => {
  res.json({
    success: true,
    data: generatedInvoices.map(inv => ({
      id: inv.id,
      irn: inv.irn,
      invoiceNo: inv.invoiceData.DocDtls?.No,
      status: inv.status,
      generatedAt: inv.generatedAt,
      totalValue: inv.invoiceData.ValDtls?.TotInvVal
    })),
    count: generatedInvoices.length
  });
});

// Cancel invoice
router.post('/cancel', (req, res) => {
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
      message: 'Invoice cancelled successfully',
      data: {
        irn: irn,
        status: 'Cancelled'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling invoice',
      error: error.message
    });
  }
});

// Get sample invoice
router.get('/sample', (req, res) => {
  const sampleInvoice = {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "INV/2024/001",
      Dt: "20/05/2024"
    },
    SellerDtls: {
      Gstin: "29AABCT1332L000",
      LglNm: "ABC Company Pvt Ltd",
      Addr1: "5th block, Kuvempu Layout",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "XYZ Company Pvt Ltd",
      Pos: "29",
      Addr1: "7th block, Kuvempu Layout", 
      Loc: "BANGALORE",
      Pin: 560004,
      Stcd: "29"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Laptop",
        HsnCd: "8471",
        Qty: 2,
        Unit: "NOS",
        UnitPrice: 50000,
        TotAmt: 100000,
        AssAmt: 100000,
        GstRt: 18,
        IgstAmt: 18000,
        CgstAmt: 0,
        SgstAmt: 0,
        TotItemVal: 118000
      }
    ],
    ValDtls: {
      AssVal: 100000,
      IgstVal: 18000,
      CgstVal: 0,
      SgstVal: 0,
      TotInvVal: 118000
    }
  };
  
  res.json({
    success: true,
    data: sampleInvoice
  });
});

// Get validation rules
router.get('/validation-rules', (req, res) => {
  res.json({
    success: true,
    data: {
      version: "1.1",
      maxItems: 1000,
      maxPayload: "2MB",
      mandatoryFields: [
        "Version", "TranDtls", "DocDtls", "SellerDtls", "BuyerDtls", "ItemList", "ValDtls"
      ],
      allowedDocTypes: ["INV", "CRN", "DBN"],
      allowedSupplyTypes: ["B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"]
    }
  });
});

module.exports = router;
