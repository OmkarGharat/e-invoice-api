# 🚀 E-Invoice Test API

A free, hosted API for testing Indian E-Invoicing system with complete validations.

## 🌐 Live API URL
`https://e-invoice-api.vercel.app`

## 📋 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `POST` | `/api/e-invoice/generate` | Generate E-Invoice |
| `POST` | `/api/e-invoice/validate` | Validate invoice data |
| `POST` | `/api/e-invoice/cancel` | Cancel invoice |
| `GET` | `/api/e-invoice/invoices` | List all invoices |
| `GET` | `/api/e-invoice/sample` | Get sample invoice |
| `GET` | `/api/e-invoice/validation-rules` | Get validation rules |

## 🚀 Quick Start

### Generate E-Invoice
```bash
curl -X POST https://e-invoice-api.vercel.app/api/e-invoice/generate \
  -H "Content-Type: application/json" \
  -d '{
    "Version": "1.1",
    "TranDtls": {
      "TaxSch": "GST",
      "SupTyp": "B2B"
    },
    "DocDtls": {
      "Typ": "INV", 
      "No": "TEST/001",
      "Dt": "20/05/2024"
    },
    "SellerDtls": {
      "Gstin": "29AABCT1332L000",
      "LglNm": "Test Seller",
      "Addr1": "Address",
      "Loc": "City",
      "Pin": 560001,
      "Stcd": "29"
    },
    "BuyerDtls": {
      "Gstin": "29AWGPV7107B1Z1", 
      "LglNm": "Test Buyer",
      "Pos": "29",
      "Addr1": "Address",
      "Loc": "City",
      "Pin": 560004,
      "Stcd": "29"
    },
    "ItemList": [{
      "SlNo": "1",
      "IsServc": "N",
      "PrdDesc": "Product",
      "HsnCd": "8471",
      "Qty": 1,
      "Unit": "NOS",
      "UnitPrice": 1000,
      "TotAmt": 1000,
      "AssAmt": 1000,
      "GstRt": 18,
      "IgstAmt": 180,
      "TotItemVal": 1180
    }],
    "ValDtls": {
      "AssVal": 1000,
      "IgstVal": 180,
      "TotInvVal": 1180
    }
  }'
