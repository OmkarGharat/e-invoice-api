```markdown
# 🧾 E-Invoice Test API

A comprehensive, free testing API for Indian E-Invoicing system with beautiful dark-themed documentation and realistic sample data.

![API Status](https://img.shields.io/badge/Status-Online-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌐 Live API

**Base URL:** `https://e-invoice-api.vercel.app`

**Documentation:** [https://e-invoice-api.vercel.app](https://e-invoice-api.vercel.app)

## 🚀 Features

- ✅ **Generate E-Invoices** with auto IRN & QR codes
- ✅ **Validate Invoice Data** against business rules
- ✅ **Cancel Invoices** with proper audit trail
- ✅ **7 Pre-built Samples** covering all scenarios
- ✅ **Dynamic Data Generation** for unlimited testing
- ✅ **Beautiful Dark UI** with Bootstrap 5
- ✅ **Real-time API Testing** directly from browser
- ✅ **No Authentication Required** - completely free
- ✅ **Always Online** - hosted on Vercel

## 📚 Available Test Samples

| Sample | Type | Description | Total Value |
|--------|------|-------------|-------------|
| #1 | B2B | Intrastate (CGST + SGST) | ₹4,42,500 |
| #2 | B2B | Interstate (IGST) | ₹89,600 |
| #3 | EXPWP | Export Invoice (Zero Tax) | ₹2,50,000 |
| #4 | SEZWP | SEZ Supply | ₹1,18,000 |
| #5 | B2B | Reverse Charge Mechanism | ₹59,000 |
| #6 | CRN | Credit Note (Returns) | ₹-88,500 |
| #7 | B2B | Multiple Items (3 products) | ₹1,80,400 |

## 🔧 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |
| `GET` | `/api/e-invoice/invoices` | List all generated invoices |
| `GET` | `/api/e-invoice/samples` | List all available samples |
| `GET` | `/api/e-invoice/sample/:id` | Get specific sample (1-7) |
| `GET` | `/api/e-invoice/stats` | Get API statistics |
| `POST` | `/api/e-invoice/generate` | Generate new invoice |
| `POST` | `/api/e-invoice/generate-dynamic` | Generate dynamic invoices |
| `POST` | `/api/e-invoice/validate` | Validate invoice data |
| `POST` | `/api/e-invoice/cancel` | Cancel an invoice |

### Quick Testing

Visit the [live documentation](https://e-invoice-api.vercel.app) to test endpoints directly from your browser with our interactive UI.

## 🛠️ Usage Examples

### Generate Invoice
```bash
curl -X POST https://e-invoice-api.vercel.app/api/e-invoice/generate \
  -H "Content-Type: application/json" \
  -d '{
    "Version": "1.1",
    "TranDtls": {
      "TaxSch": "GST",
      "SupTyp": "B2B",
      "RegRev": "N"
    },
    "DocDtls": {
      "Typ": "INV",
      "No": "TEST/001",
      "Dt": "20/05/2024"
    },
    "SellerDtls": {
      "Gstin": "29AABCT1332L000",
      "LglNm": "Test Company",
      "Addr1": "Test Address",
      "Loc": "BANGALORE",
      "Pin": 560001,
      "Stcd": "29"
    },
    "BuyerDtls": {
      "Gstin": "29AWGPV7107B1Z1",
      "LglNm": "Test Buyer",
      "Pos": "29",
      "Addr1": "Buyer Address",
      "Loc": "BANGALORE", 
      "Pin": 560004,
      "Stcd": "29"
    },
    "ItemList": [{
      "SlNo": "1",
      "IsServc": "N",
      "PrdDesc": "Test Product",
      "HsnCd": "8471",
      "Qty": 10,
      "Unit": "NOS",
      "UnitPrice": 1000,
      "TotAmt": 10000,
      "AssAmt": 10000,
      "GstRt": 18,
      "IgstAmt": 0,
      "CgstAmt": 900,
      "SgstAmt": 900,
      "TotItemVal": 11800
    }],
    "ValDtls": {
      "AssVal": 10000,
      "CgstVal": 900,
      "SgstVal": 900,
      "IgstVal": 0,
      "TotInvVal": 11800
    }
  }'
```

### Get Sample Invoice
```bash
curl https://e-invoice-api.vercel.app/api/e-invoice/sample/1
```

### Validate Invoice Data
```bash
curl -X POST https://e-invoice-api.vercel.app/api/e-invoice/validate \
  -H "Content-Type: application/json" \
  -d '{
    "Version": "1.1",
    "TranDtls": {
      "TaxSch": "GST",
      "SupTyp": "B2B"
    }
    // ... your invoice data
  }'
```

### Generate Multiple Invoices
```bash
curl -X POST https://e-invoice-api.vercel.app/api/e-invoice/generate-dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "sampleId": 2
  }'
```

## 🎯 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "Irn": "IRN1234567890123456789012345678901234567890",
    "AckNo": "ACK1234567890",
    "AckDt": "20/05/2024",
    "SignedInvoice": {
      // Your invoice data with IRN
    },
    "QRCode": "QR_IRN1234567890"
  },
  "message": "E-Invoice generated successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Version must be 1.1",
    "Seller GSTIN is required"
  ]
}
```

## 📊 Supported Supply Types

- **B2B** - Business to Business
- **EXPWP** - Export with Payment
- **EXPWOP** - Export without Payment  
- **SEZWP** - SEZ with Payment
- **SEZWOP** - SEZ without Payment
- **DEXP** - Deemed Export

## 🔒 Validation Rules

The API validates:
- ✅ Version must be "1.1"
- ✅ Document number format
- ✅ GSTIN format (15 characters)
- ✅ HSN code validity
- ✅ Tax rate compliance
- ✅ Date format (DD/MM/YYYY)
- ✅ State code validity
- ✅ PIN code validation
- ✅ Tax calculation accuracy
- ✅ Duplicate prevention

## 🏗️ Project Structure

```
e-invoice-api/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── vercel.json           # Vercel configuration
├── public/               # Frontend assets
│   ├── index.html        # Documentation UI
│   ├── css/
│   │   └── style.css     # Custom dark theme
│   └── js/
│       └── app.js        # Interactive functionality
├── utils/
│   └── dataGenerator.js  # Dynamic data generation
└── README.md             # This file
```

## 🚨 Important Notice

**⚠️ THIS IS A TESTING API ONLY**

- All generated IRNs and QR codes are **simulated**
- Data has **no legal validity** for tax purposes
- **Do not use** for production GST filing
- Intended for **development and testing** only
- Always test with official GST sandbox before production

## 🛠️ Local Development

```bash
# Clone repository
git clone https://github.com/your-username/e-invoice-api.git
cd e-invoice-api

# Install dependencies
npm install

# Start development server
npm start

# Access locally
open http://localhost:3000
```

## 🌐 Deployment

The API is automatically deployed on Vercel when pushing to the main branch.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **API Documentation**: [https://e-invoice-api.vercel.app](https://e-invoice-api.vercel.app)
- **Report Issues**: [GitHub Issues](https://github.com/your-username/e-invoice-api/issues)
- **Live Testing**: Use the interactive documentation for immediate testing

---

**Built with ❤️ for developers testing E-Invoice integration**

*Happy Testing! 🚀*
```