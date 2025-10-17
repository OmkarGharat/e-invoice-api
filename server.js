const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==================== PREDICTABLE TEST DATA ====================

const TEST_SAMPLES = {
  // Basic B2B Intrastate (CGST + SGST)
  1: {
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
      Dt: "01/01/2024"
    },
    SellerDtls: {
      Gstin: "29AABCT1332L000",
      LglNm: "ABC Electronics Pvt Ltd",
      TrdNm: "ABC Electronics",
      Addr1: "Electronics City",
      Addr2: "Phase 1",
      Loc: "BANGALORE",
      Pin: 560100,
      Stcd: "29",
      Ph: "9876543210",
      Em: "sales@abcelectronics.com"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "XYZ Traders Bangalore",
      TrdNm: "XYZ Traders",
      Pos: "29",
      Addr1: "Commercial Street",
      Addr2: "Block A",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543211",
      Em: "purchase@xyztraders.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Laptop Computer",
        HsnCd: "84713000",
        BchDtls: { Nm: "BATCH001" },
        Qty: 5,
        Unit: "NOS",
        UnitPrice: 75000,
        TotAmt: 375000,
        AssAmt: 375000,
        GstRt: 18,
        IgstAmt: 0,
        CgstAmt: 33750,
        SgstAmt: 33750,
        TotItemVal: 442500
      }
    ],
    ValDtls: {
      AssVal: 375000,
      CgstVal: 33750,
      SgstVal: 33750,
      IgstVal: 0,
      TotInvVal: 442500
    }
  },

  // B2B Interstate (IGST)
  2: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "INV/2024/002",
      Dt: "15/01/2024"
    },
    SellerDtls: {
      Gstin: "27AABCU9603R1ZM",
      LglNm: "Mumbai Textiles Ltd",
      TrdNm: "Mumbai Textiles",
      Addr1: "Textile Market",
      Loc: "MUMBAI",
      Pin: 400001,
      Stcd: "27",
      Ph: "9876543212",
      Em: "info@mumbaitextiles.com"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "Bangalore Retailers",
      TrdNm: "Bangalore Retail",
      Pos: "29",
      Addr1: "MG Road",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543213",
      Em: "orders@bangaloreretail.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Cotton Shirts",
        HsnCd: "62052000",
        BchDtls: { Nm: "BATCH002" },
        Qty: 100,
        Unit: "NOS",
        UnitPrice: 800,
        TotAmt: 80000,
        AssAmt: 80000,
        GstRt: 12,
        IgstAmt: 9600,
        CgstAmt: 0,
        SgstAmt: 0,
        TotItemVal: 89600
      }
    ],
    ValDtls: {
      AssVal: 80000,
      CgstVal: 0,
      SgstVal: 0,
      IgstVal: 9600,
      TotInvVal: 89600
    }
  },

  // Export Invoice (Zero Tax)
  3: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "EXPWP",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "EXP/2024/001",
      Dt: "20/02/2024"
    },
    SellerDtls: {
      Gstin: "06AABCT1332L000",
      LglNm: "Export Goods India",
      Addr1: "Industrial Area",
      Loc: "GURGAON",
      Pin: 122001,
      Stcd: "06",
      Ph: "9876543214",
      Em: "export@exportgoods.com"
    },
    BuyerDtls: {
      Gstin: "URP",
      LglNm: "International Buyer Inc",
      Pos: "96",
      Addr1: "123 International Street",
      Loc: "SINGAPORE",
      Pin: 999999,
      Stcd: "96",
      Ph: "6561234567",
      Em: "buyer@international.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Handicraft Items",
        HsnCd: "44219090",
        Qty: 500,
        Unit: "NOS",
        UnitPrice: 500,
        TotAmt: 250000,
        AssAmt: 250000,
        GstRt: 0,
        IgstAmt: 0,
        CgstAmt: 0,
        SgstAmt: 0,
        TotItemVal: 250000
      }
    ],
    ValDtls: {
      AssVal: 250000,
      CgstVal: 0,
      SgstVal: 0,
      IgstVal: 0,
      TotInvVal: 250000
    }
  },

  // SEZ Supply
  4: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "SEZWP",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "SEZ/2024/001",
      Dt: "10/03/2024"
    },
    SellerDtls: {
      Gstin: "27AABCU9603R1ZM",
      LglNm: "Domestic Supplier Ltd",
      Addr1: "Commercial Street",
      Loc: "MUMBAI",
      Pin: 400001,
      Stcd: "27",
      Ph: "9876543215",
      Em: "contact@domesticsupplier.com"
    },
    BuyerDtls: {
      Gstin: "27SEZ12345678901",
      LglNm: "SEZ Unit Mumbai",
      Pos: "96",
      Addr1: "SEZ Area",
      Loc: "MUMBAI",
      Pin: 400001,
      Stcd: "27",
      Ph: "9876543216",
      Em: "sez@sezunit.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Electronic Components",
        HsnCd: "85429000",
        Qty: 1000,
        Unit: "NOS",
        UnitPrice: 100,
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
      CgstVal: 0,
      SgstVal: 0,
      IgstVal: 18000,
      TotInvVal: 118000
    }
  },

  // Reverse Charge
  5: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "Y",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "INV/2024/005",
      Dt: "25/03/2024"
    },
    SellerDtls: {
      Gstin: "29AABCT1332L000",
      LglNm: "Small Service Provider",
      Addr1: "Service Road",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543217",
      Em: "service@smallprovider.com"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "Large Manufacturing Co",
      Pos: "29",
      Addr1: "Industrial Area",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543218",
      Em: "accounts@manufacturing.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "Y",
        PrdDesc: "Consulting Services",
        HsnCd: "998599",
        Qty: 1,
        Unit: "NOS",
        UnitPrice: 50000,
        TotAmt: 50000,
        AssAmt: 50000,
        GstRt: 18,
        IgstAmt: 0,
        CgstAmt: 4500,
        SgstAmt: 4500,
        TotItemVal: 59000
      }
    ],
    ValDtls: {
      AssVal: 50000,
      CgstVal: 4500,
      SgstVal: 4500,
      IgstVal: 0,
      TotInvVal: 59000
    }
  },

  // Credit Note
  6: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "CRN",
      No: "CRN/2024/001",
      Dt: "30/03/2024"
    },
    SellerDtls: {
      Gstin: "29AABCT1332L000",
      LglNm: "Original Seller Ltd",
      Addr1: "Main Road",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543219",
      Em: "sales@originalseller.com"
    },
    BuyerDtls: {
      Gstin: "29AWGPV7107B1Z1",
      LglNm: "Original Buyer Corp",
      Pos: "29",
      Addr1: "Trade Center",
      Loc: "BANGALORE",
      Pin: 560001,
      Stcd: "29",
      Ph: "9876543220",
      Em: "purchase@buyercorp.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Defective Laptop - Return",
        HsnCd: "84713000",
        Qty: 1,
        Unit: "NOS",
        UnitPrice: -75000,
        TotAmt: -75000,
        AssAmt: -75000,
        GstRt: 18,
        IgstAmt: 0,
        CgstAmt: -6750,
        SgstAmt: -6750,
        TotItemVal: -88500
      }
    ],
    ValDtls: {
      AssVal: -75000,
      CgstVal: -6750,
      SgstVal: -6750,
      IgstVal: 0,
      TotInvVal: -88500
    }
  },

  // Multiple Items
  7: {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: "INV/2024/007",
      Dt: "05/04/2024"
    },
    SellerDtls: {
      Gstin: "33AABCT1332L000",
      LglNm: "Multi Product Traders",
      Addr1: "Trade Complex",
      Loc: "CHENNAI",
      Pin: 600001,
      Stcd: "33",
      Ph: "9876543221",
      Em: "info@multitraders.com"
    },
    BuyerDtls: {
      Gstin: "33AWGPV7107B1Z1",
      LglNm: "Retail Chain Stores",
      Pos: "33",
      Addr1: "Shopping Mall",
      Loc: "CHENNAI",
      Pin: 600001,
      Stcd: "33",
      Ph: "9876543222",
      Em: "orders@retailchain.com"
    },
    ItemList: [
      {
        SlNo: "1",
        IsServc: "N",
        PrdDesc: "Office Desk",
        HsnCd: "94033000",
        BchDtls: { Nm: "BATCH007A" },
        Qty: 10,
        Unit: "NOS",
        UnitPrice: 8000,
        TotAmt: 80000,
        AssAmt: 80000,
        GstRt: 12,
        IgstAmt: 0,
        CgstAmt: 4800,
        SgstAmt: 4800,
        TotItemVal: 89600
      },
      {
        SlNo: "2",
        IsServc: "N",
        PrdDesc: "Office Chair",
        HsnCd: "94013000",
        BchDtls: { Nm: "BATCH007B" },
        Qty: 20,
        Unit: "NOS",
        UnitPrice: 3000,
        TotAmt: 60000,
        AssAmt: 60000,
        GstRt: 12,
        IgstAmt: 0,
        CgstAmt: 3600,
        SgstAmt: 3600,
        TotItemVal: 67200
      },
      {
        SlNo: "3",
        IsServc: "N",
        PrdDesc: "LED Bulbs",
        HsnCd: "85395000",
        BchDtls: { Nm: "BATCH007C" },
        Qty: 100,
        Unit: "NOS",
        UnitPrice: 200,
        TotAmt: 20000,
        AssAmt: 20000,
        GstRt: 18,
        IgstAmt: 0,
        CgstAmt: 1800,
        SgstAmt: 1800,
        TotItemVal: 23600
      }
    ],
    ValDtls: {
      AssVal: 160000,
      CgstVal: 10200,
      SgstVal: 10200,
      IgstVal: 0,
      TotInvVal: 180400
    }
  }
};

// Simple storage for generated invoices
let invoices = [];
let counter = 1;

// Initialize with some samples
Object.values(TEST_SAMPLES).forEach((sample, index) => {
  invoices.push({
    id: counter++,
    irn: `IRNSAMPLE${index + 1}`,
    invoiceData: sample,
    status: 'Generated',
    generatedAt: new Date().toISOString()
  });
});

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 E-Invoice API - PREDICTABLE TEST DATA',
    status: '✅ Server is running with versioned samples',
    endpoints: {
      health: 'GET /health',
      invoices: 'GET /api/e-invoice/invoices',
      sample: 'GET /api/e-invoice/sample/:id (1-7)',
      samples: 'GET /api/e-invoice/samples',
      generate: 'POST /api/e-invoice/generate',
      generateDynamic: 'POST /api/e-invoice/generate-dynamic'
    },
    available_samples: Object.keys(TEST_SAMPLES).map(id => ({
      id: parseInt(id),
      type: TEST_SAMPLES[id].TranDtls.SupTyp,
      description: getSampleDescription(id),
      endpoint: `/api/e-invoice/sample/${id}`
    }))
  });
});

function getSampleDescription(id) {
  const descriptions = {
    1: "B2B Intrastate (CGST + SGST)",
    2: "B2B Interstate (IGST)", 
    3: "Export Invoice (Zero Tax)",
    4: "SEZ Supply",
    5: "Reverse Charge",
    6: "Credit Note",
    7: "Multiple Items"
  };
  return descriptions[id] || "Sample Invoice";
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    totalInvoices: invoices.length,
    availableSamples: Object.keys(TEST_SAMPLES).length
  });
});

// Get all invoices
app.get('/api/e-invoice/invoices', (req, res) => {
  try {
    res.json({
      success: true,
      data: invoices.map(inv => ({
        id: inv.id,
        irn: inv.irn,
        invoiceNo: inv.invoiceData.DocDtls.No,
        sellerGstin: inv.invoiceData.SellerDtls.Gstin,
        buyerGstin: inv.invoiceData.BuyerDtls.Gstin,
        supplyType: inv.invoiceData.TranDtls.SupTyp,
        totalValue: inv.invoiceData.ValDtls.TotInvVal,
        status: inv.status
      })),
      count: invoices.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific sample by ID
app.get('/api/e-invoice/sample/:id', (req, res) => {
  try {
    const id = req.params.id;
    
    if (TEST_SAMPLES[id]) {
      res.json({
        success: true,
        data: TEST_SAMPLES[id],
        sampleId: parseInt(id),
        description: getSampleDescription(id),
        type: TEST_SAMPLES[id].TranDtls.SupTyp
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Sample ${id} not found. Available samples: 1-${Object.keys(TEST_SAMPLES).length}`,
        availableSamples: Object.keys(TEST_SAMPLES).map(id => ({
          id: parseInt(id),
          type: TEST_SAMPLES[id].TranDtls.SupTyp,
          description: getSampleDescription(id)
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
    const samples = Object.keys(TEST_SAMPLES).map(id => ({
      id: parseInt(id),
      type: TEST_SAMPLES[id].TranDtls.SupTyp,
      description: getSampleDescription(id),
      invoiceNo: TEST_SAMPLES[id].DocDtls.No,
      totalValue: TEST_SAMPLES[id].ValDtls.TotInvVal,
      endpoint: `/api/e-invoice/sample/${id}`
    }));
    
    res.json({
      success: true,
      data: samples,
      count: samples.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random sample (backward compatibility)
app.get('/api/e-invoice/sample', (req, res) => {
  try {
    const randomId = Math.floor(Math.random() * Object.keys(TEST_SAMPLES).length) + 1;
    res.json({
      success: true,
      data: TEST_SAMPLES[randomId],
      sampleId: randomId,
      description: getSampleDescription(randomId.toString()),
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
    const newInvoices = [];
    
    for (let i = 0; i < count; i++) {
      let invoiceData;
      
      if (sampleId && TEST_SAMPLES[sampleId]) {
        // Use specific sample as template
        invoiceData = JSON.parse(JSON.stringify(TEST_SAMPLES[sampleId]));
        // Modify invoice number to make it unique
        invoiceData.DocDtls.No = `GEN/${new Date().getFullYear()}/${counter}`;
      } else {
        // Use random sample
        const randomId = Math.floor(Math.random() * Object.keys(TEST_SAMPLES).length) + 1;
        invoiceData = JSON.parse(JSON.stringify(TEST_SAMPLES[randomId]));
        invoiceData.DocDtls.No = `GEN/${new Date().getFullYear()}/${counter}`;
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

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Available samples: 1-${Object.keys(TEST_SAMPLES).length}`);
  });
}