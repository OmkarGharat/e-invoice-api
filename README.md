# 🧾 E-Invoice Test API

A comprehensive, free testing API for Indian E-Invoicing system with beautiful dark-themed documentation and realistic sample data.

![API Status](https://img.shields.io/badge/Status-Online-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ⚠️ IMPORTANT DISCLAIMER

**THIS IS A TESTING/DEVELOPMENT API ONLY**

### 🚫 CRITICAL NOTES:

1. **NOT FOR PRODUCTION USE**: This API is for **testing and development purposes only**
2. **NOT A REPLACEMENT**: Do **NOT** use this as a replacement for the official GST e-Invoice system
3. **MOCK DATA**: All IRNs, QR codes, and validations are **simulated** and **not legally valid**
4. **NO LEGAL VALIDITY**: Generated e-Invoices have **no legal standing** for tax purposes
5. **TESTING ONLY**: Use this API only to test your integration before moving to production

### ✅ Intended Use Cases:
- Testing your application's E-Invoice integration
- Understanding the E-Invoice JSON structure
- Developing and debugging your E-Invoice implementation
- Learning how the E-Invoice system works

### ❌ Not For:
- Generating actual tax invoices
- Legal compliance purposes
- Production GST filing
- Official business transactions

---


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
