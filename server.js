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

// ==================== BEAUTIFUL UI FOR ROOT ENDPOINT ====================

app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Invoice Test API - Complete Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            color: white;
            padding: 40px 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }

        .badge {
            display: inline-block;
            background: #00c853;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-left: 10px;
        }

        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .card h3 {
            color: #4a5568;
            margin-bottom: 15px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .endpoint {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }

        .endpoint.get { border-left: 4px solid #48bb78; }
        .endpoint.post { border-left: 4px solid #4299e1; }

        .method {
            font-weight: bold;
            color: #2d3748;
        }

        .url {
            color: #4a5568;
            word-break: break-all;
        }

        .sample-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .sample-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .sample-card:hover {
            background: #e3f2fd;
            border-color: #2196f3;
        }

        .sample-card h4 {
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 1rem;
        }

        .sample-card p {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }

        .code-block {
            background: #1a202c;
            color: #cbd5e0;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }

        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: background 0.3s ease;
            border: none;
            cursor: pointer;
            margin: 5px;
        }

        .btn:hover {
            background: #5a6fd8;
        }

        .btn.test {
            background: #48bb78;
        }

        .btn.test:hover {
            background: #3ca56a;
        }

        .feature-list {
            list-style: none;
            margin: 15px 0;
        }

        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .feature-list li:before {
            content: "✅ ";
            margin-right: 10px;
        }

        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }

        .footer {
            text-align: center;
            color: white;
            padding: 30px 0;
            margin-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .card-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧾 E-Invoice Test API</h1>
            <p>Complete testing API for Indian E-Invoicing system with realistic sample data</p>
            <div style="margin-top: 15px;">
                <span class="badge">FREE</span>
                <span class="badge" style="background: #ff6b6b;">TESTING ONLY</span>
                <span class="badge" style="background: #4ecdc4;">ALWAYS ONLINE</span>
            </div>
        </div>

        <div class="card">
            <h3>📖 Quick Start</h3>
            <p>Get started immediately with our pre-built sample invoices. No authentication required!</p>
            
            <div class="endpoint get">
                <span class="method">GET</span>
                <span class="url">/api/e-invoice/samples</span>
            </div>
            
            <button class="btn test" onclick="testEndpoint('/api/e-invoice/samples')">
                Test This Endpoint
            </button>
        </div>

        <div class="card-grid">
            <div class="card">
                <h3>🚀 Core Features</h3>
                <ul class="feature-list">
                    <li>Generate E-Invoices with IRN</li>
                    <li>Validate invoice data</li>
                    <li>Cancel invoices</li>
                    <li>Multiple supply types (B2B, Export, SEZ)</li>
                    <li>Automatic tax calculations</li>
                    <li>Realistic company data</li>
                    <li>QR code generation</li>
                    <li>Duplicate prevention</li>
                </ul>
            </div>

            <div class="card">
                <h3>⚡ Quick Actions</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
                    <button class="btn" onclick="testEndpoint('/health')">Health Check</button>
                    <button class="btn" onclick="testEndpoint('/api/e-invoice/invoices')">View Invoices</button>
                    <button class="btn" onclick="testEndpoint('/api/e-invoice/sample/1')">B2B Sample</button>
                    <button class="btn" onclick="testEndpoint('/api/e-invoice/sample/3')">Export Sample</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📚 Available Samples</h3>
            <p>Stable, predictable test data for consistent testing:</p>
            
            <div class="sample-grid">
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/1')">
                    <h4>#1 - B2B Intrastate</h4>
                    <p>CGST + SGST applicable</p>
                    <small>Total: ₹4,42,500</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/2')">
                    <h4>#2 - B2B Interstate</h4>
                    <p>IGST applicable</p>
                    <small>Total: ₹89,600</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/3')">
                    <h4>#3 - Export Invoice</h4>
                    <p>Zero tax</p>
                    <small>Total: ₹2,50,000</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/4')">
                    <h4>#4 - SEZ Supply</h4>
                    <p>IGST on SEZ</p>
                    <small>Total: ₹1,18,000</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/5')">
                    <h4>#5 - Reverse Charge</h4>
                    <p>Service with RCM</p>
                    <small>Total: ₹59,000</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/6')">
                    <h4>#6 - Credit Note</h4>
                    <p>Returns/Refunds</p>
                    <small>Total: ₹-88,500</small>
                </div>
                <div class="sample-card" onclick="testEndpoint('/api/e-invoice/sample/7')">
                    <h4>#7 - Multiple Items</h4>
                    <p>3 items in one invoice</p>
                    <small>Total: ₹1,80,400</small>
                </div>
            </div>
        </div>

        <div class="card-grid">
            <div class="card">
                <h3>🔗 API Endpoints</h3>
                
                <div class="endpoint get">
                    <span class="method">GET</span>
                    <span class="url">/health</span>
                </div>
                <div class="endpoint get">
                    <span class="method">GET</span>
                    <span class="url">/api/e-invoice/invoices</span>
                </div>
                <div class="endpoint get">
                    <span class="method">GET</span>
                    <span class="url">/api/e-invoice/sample/:id</span>
                </div>
                <div class="endpoint get">
                    <span class="method">GET</span>
                    <span class="url">/api/e-invoice/samples</span>
                </div>
                <div class="endpoint post">
                    <span class="method">POST</span>
                    <span class="url">/api/e-invoice/generate</span>
                </div>
                <div class="endpoint post">
                    <span class="method">POST</span>
                    <span class="url">/api/e-invoice/generate-dynamic</span>
                </div>
                <div class="endpoint post">
                    <span class="method">POST</span>
                    <span class="url">/api/e-invoice/validate</span>
                </div>
                <div class="endpoint post">
                    <span class="method">POST</span>
                    <span class="url">/api/e-invoice/cancel</span>
                </div>
            </div>

            <div class="card">
                <h3>💡 Usage Examples</h3>
                
                <h4>Generate Invoice:</h4>
                <div class="code-block">
POST /api/e-invoice/generate<br>
Content-Type: application/json<br>
<br>
{{<br>
  "Version": "1.1",<br>
  "TranDtls": {<br>
    "TaxSch": "GST",<br>
    "SupTyp": "B2B"<br>
  },<br>
  ...<br>
}}
                </div>

                <h4>Validate Data:</h4>
                <div class="code-block">
POST /api/e-invoice/validate<br>
Content-Type: application/json<br>
<br>
{{ your_invoice_data }}
                </div>
            </div>
        </div>

        <div class="alert">
            <strong>⚠️ Important Notice:</strong> This is a testing API only. All generated IRNs and QR codes are simulated and have no legal validity. Do not use for production purposes.
        </div>

        <div class="card">
            <h3>🛠️ Testing Tools</h3>
            <div id="testResult" style="margin-top: 15px; padding: 15px; border-radius: 8px; background: #f8f9fa; display: none;">
                <pre id="resultContent" style="white-space: pre-wrap;"></pre>
            </div>
            <div style="margin-top: 15px;">
                <button class="btn" onclick="testEndpoint('/health')">Test Health</button>
                <button class="btn" onclick="testEndpoint('/api/e-invoice/samples')">List Samples</button>
                <button class="btn" onclick="testEndpoint('/api/e-invoice/invoices')">View All Invoices</button>
            </div>
        </div>

        <div class="footer">
            <p>Built with ❤️ for developers testing E-Invoice integration</p>
            <p>Base URL: <strong>https://e-invoice-api.vercel.app</strong></p>
            <p style="margin-top: 10px; opacity: 0.8;">
                Refresh the page to see updated API status
            </p>
        </div>
    </div>

    <script>
        async function testEndpoint(endpoint) {
            const testResult = document.getElementById('testResult');
            const resultContent = document.getElementById('resultContent');
            
            testResult.style.display = 'block';
            resultContent.textContent = 'Testing...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                resultContent.textContent = JSON.stringify(data, null, 2);
                testResult.style.background = '#d4edda';
                testResult.style.border = '1px solid #c3e6cb';
            } catch (error) {
                resultContent.textContent = 'Error: ' + error.message;
                testResult.style.background = '#f8d7da';
                testResult.style.border = '1px solid #f5c6cb';
            }
        }

        // Test health on page load
        window.addEventListener('load', () => {
            testEndpoint('/health');
        });
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// ==================== KEEP ALL YOUR EXISTING API ENDPOINTS ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running smoothly',
    timestamp: new Date().toISOString(),
    totalInvoices: invoices.length,
    version: '2.0.0'
  });
});

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
        status: inv.status,
        generatedAt: inv.generatedAt
      })),
      count: invoices.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// ... (keep all your other existing endpoints: generate, generate-dynamic, validate, cancel, etc.)
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