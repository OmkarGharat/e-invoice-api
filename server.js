const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware - SIMPLE
app.use(cors());
app.use(bodyParser.json());

// SIMPLE Data Generator - ALL IN ONE FILE
class SimpleDataGenerator {
  static generateGSTIN(stateCode) {
    return `${stateCode}${Math.random().toString(36).substring(2, 15).toUpperCase()}`.substring(0, 15);
  }

  static generateCompany() {
    const companies = ["Tech Solutions", "Global Traders", "Quality Products", "Reliable Suppliers"];
    const industries = ["Pvt Ltd", "Ltd", "Inc"];
    return `${companies[Math.floor(Math.random() * companies.length)]} ${industries[Math.floor(Math.random() * industries.length)]}`;
  }

  static generateProduct() {
    const products = [
      { name: "Laptop", hsn: "84713000", price: [30000, 80000] },
      { name: "Mobile", hsn: "85171210", price: [8000, 50000] },
      { name: "Chair", hsn: "94013000", price: [2000, 10000] },
      { name: "Books", hsn: "49019900", price: [100, 2000] }
    ];
    return products[Math.floor(Math.random() * products.length)];
  }

  static generateInvoice() {
    const states = ['29', '07', '27'];
    const sellerState = states[Math.floor(Math.random() * states.length)];
    const buyerState = states[Math.floor(Math.random() * states.length)];
    const isInterState = sellerState !== buyerState;
    
    const product = this.generateProduct();
    const qty = Math.floor(Math.random() * 10) + 1;
    const price = Math.floor(Math.random() * (product.price[1] - product.price[0])) + product.price[0];
    const total = qty * price;
    const taxRate = [0, 5, 12, 18][Math.floor(Math.random() * 4)];
    
    let igst = 0, cgst = 0, sgst = 0;
    if (isInterState) {
      igst = (total * taxRate) / 100;
    } else {
      cgst = (total * taxRate) / 200;
      sgst = (total * taxRate) / 200;
    }
    
    const finalTotal = total + igst + cgst + sgst;

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
        Gstin: this.generateGSTIN(sellerState),
        LglNm: this.generateCompany(),
        Addr1: "Seller Address",
        Loc: "City",
        Pin: 560001,
        Stcd: sellerState
      },
      BuyerDtls: {
        Gstin: this.generateGSTIN(buyerState),
        LglNm: this.generateCompany(),
        Pos: buyerState,
        Addr1: "Buyer Address",
        Loc: "City",
        Pin: 560002,
        Stcd: buyerState
      },
      ItemList: [{
        SlNo: "1",
        IsServc: "N",
        PrdDesc: product.name,
        HsnCd: product.hsn,
        Qty: qty,
        Unit: "NOS",
        UnitPrice: price,
        TotAmt: total,
        AssAmt: total,
        GstRt: taxRate,
        IgstAmt: igst,
        CgstAmt: cgst,
        SgstAmt: sgst,
        TotItemVal: finalTotal
      }],
      ValDtls: {
        AssVal: total,
        CgstVal: cgst,
        SgstVal: sgst,
        IgstVal: igst,
        TotInvVal: finalTotal
      }
    };
  }
}

// Simple storage
let invoices = [];
let counter = 1;

// Generate 5 sample invoices
for (let i = 0; i < 5; i++) {
  invoices.push({
    id: counter++,
    irn: `IRN${Date.now()}${i}`,
    invoiceData: SimpleDataGenerator.generateInvoice(),
    status: 'Generated',
    generatedAt: new Date().toISOString()
  });
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 E-Invoice API - WORKING VERSION',
    status: '✅ Server is running',
    endpoints: {
      health: 'GET /health',
      invoices: 'GET /api/e-invoice/invoices',
      sample: 'GET /api/e-invoice/sample',
      generate: 'POST /api/e-invoice/generate',
      generateDynamic: 'POST /api/e-invoice/generate-dynamic'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    totalInvoices: invoices.length
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
        totalValue: inv.invoiceData.ValDtls.TotInvVal,
        status: inv.status
      })),
      count: invoices.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sample invoice
app.get('/api/e-invoice/sample', (req, res) => {
  try {
    const sample = SimpleDataGenerator.generateInvoice();
    res.json({
      success: true,
      data: sample
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic invoice
app.post('/api/e-invoice/generate-dynamic', (req, res) => {
  try {
    const { count = 1 } = req.body;
    const newInvoices = [];
    
    for (let i = 0; i < count; i++) {
      const invoiceData = SimpleDataGenerator.generateInvoice();
      const irn = `IRN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
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
        SignedInvoice: invoiceData
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
    const irn = `IRN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
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
  });
}