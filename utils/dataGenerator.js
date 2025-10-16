const { MASTERS } = require('../validation/eInvoiceValidation');

class EInvoiceDataGenerator {
  constructor() {
    this.states = {
      '29': { name: 'Karnataka', capital: 'BANGALORE', pincodes: [560001, 560002, 560003, 560004] },
      '07': { name: 'Delhi', capital: 'NEW DELHI', pincodes: [110001, 110002, 110003, 110004] },
      '27': { name: 'Maharashtra', capital: 'MUMBAI', pincodes: [400001, 400002, 400003, 400004] },
      '33': { name: 'Tamil Nadu', capital: 'CHENNAI', pincodes: [600001, 600002, 600003, 600004] },
      '36': { name: 'Telangana', capital: 'HYDERABAD', pincodes: [500001, 500002, 500003, 500004] },
      '24': { name: 'Gujarat', capital: 'GANDHINAGAR', pincodes: [380001, 380002, 380003, 380004] }
    };

    this.products = [
      { name: "Laptop Computer", hsn: "84713000", category: "Electronics", priceRange: [30000, 150000] },
      { name: "Mobile Phone", hsn: "85171210", category: "Electronics", priceRange: [8000, 80000] },
      { name: "Office Chair", hsn: "94013000", category: "Furniture", priceRange: [2000, 15000] },
      { name: "Cotton Shirts", hsn: "62052000", category: "Textiles", priceRange: [500, 3000] },
      { name: "Steel Rods", hsn: "72139900", category: "Metals", priceRange: [80, 200] },
      { name: "Printed Books", hsn: "49019900", category: "Books", priceRange: [100, 2000] },
      { name: "Coffee Powder", hsn: "09012100", category: "Food", priceRange: [200, 1000] },
      { name: "Car Tyres", hsn: "40111000", category: "Automotive", priceRange: [2000, 10000] },
      { name: "LED Bulbs", hsn: "85395000", category: "Electrical", priceRange: [100, 500] },
      { name: "Painting Service", hsn: "999999", category: "Services", priceRange: [5000, 50000] }
    ];

    this.companies = [
      "Global", "National", "Premium", "Elite", "Standard", "Quality", "Reliable", "Trusted",
      "Modern", "Advanced", "Innovative", "Superior", "Prime", "Select", "Preferred"
    ];

    this.industries = [
      "Electronics", "Textiles", "Automobiles", "Chemicals", "Metals", "Food Products",
      "Pharmaceuticals", "Construction", "IT Services", "Logistics", "Retail", "Manufacturing"
    ];
  }

  // Generate random GSTIN for a state
  generateGSTIN(stateCode) {
    const randomChars = () => Math.random().toString(36).toUpperCase().substr(2, 3);
    const randomNumber = () => Math.floor(Math.random() * 10);
    
    return `${stateCode}${Array.from({length: 10}, () => randomNumber()).join('')}${randomChars()}${randomNumber()}`;
  }

  // Generate company name
  generateCompanyName() {
    const company = this.companies[Math.floor(Math.random() * this.companies.length)];
    const industry = this.industries[Math.floor(Math.random() * this.industries.length)];
    const suffix = Math.random() > 0.5 ? "Pvt Ltd" : "Ltd";
    
    return `${company} ${industry} ${suffix}`;
  }

  // Generate random date within last 90 days
  generateDate() {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    return date.toLocaleDateString('en-GB');
  }

  // Generate address for state
  generateAddress(stateCode) {
    const state = this.states[stateCode];
    const streetNames = ["Main Road", "Gandhi Street", "Market Area", "Industrial Estate", "Tech Park"];
    const areas = ["North", "South", "East", "West", "Central"];
    
    return {
      Addr1: `${Math.floor(Math.random() * 1000) + 1} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`,
      Addr2: `${areas[Math.floor(Math.random() * areas.length)]} ${state.capital}`,
      Loc: state.capital,
      Pin: state.pincodes[Math.floor(Math.random() * state.pincodes.length)],
      Stcd: stateCode
    };
  }

  // Generate product item
  generateProductItem(slNo, isInterState = false) {
    const product = this.products[Math.floor(Math.random() * this.products.length)];
    const isService = product.name.includes("Service");
    const qty = isService ? 1 : Math.floor(Math.random() * 100) + 1;
    const unitPrice = Math.floor(Math.random() * (product.priceRange[1] - product.priceRange[0])) + product.priceRange[0];
    const totAmt = qty * unitPrice;
    const assAmt = totAmt;
    
    // Select appropriate tax rate
    const taxRates = isService ? [0, 5, 12, 18] : [0, 5, 12, 18, 28];
    const gstRt = taxRates[Math.floor(Math.random() * taxRates.length)];
    
    // Calculate taxes
    let igstAmt = 0, cgstAmt = 0, sgstAmt = 0;
    
    if (isInterState || gstRt === 0) {
      igstAmt = (assAmt * gstRt) / 100;
    } else {
      cgstAmt = (assAmt * gstRt) / 200; // Half rate for CGST
      sgstAmt = (assAmt * gstRt) / 200; // Half rate for SGST
    }
    
    const totItemVal = assAmt + igstAmt + cgstAmt + sgstAmt;

    return {
      SlNo: slNo.toString(),
      IsServc: isService ? "Y" : "N",
      PrdDesc: product.name,
      HsnCd: product.hsn,
      BchDtls: isService ? undefined : { Nm: `BATCH${Math.floor(Math.random() * 1000) + 1}` },
      Qty: isService ? undefined : parseFloat(qty.toFixed(3)),
      Unit: isService ? undefined : this.getUnit(product.category),
      UnitPrice: parseFloat(unitPrice.toFixed(2)),
      TotAmt: parseFloat(totAmt.toFixed(2)),
      AssAmt: parseFloat(assAmt.toFixed(2)),
      GstRt: parseFloat(gstRt.toFixed(2)),
      IgstAmt: parseFloat(igstAmt.toFixed(2)),
      CgstAmt: parseFloat(cgstAmt.toFixed(2)),
      SgstAmt: parseFloat(sgstAmt.toFixed(2)),
      TotItemVal: parseFloat(totItemVal.toFixed(2))
    };
  }

  getUnit(category) {
    const units = {
      "Electronics": "NOS",
      "Furniture": "NOS", 
      "Textiles": "NOS",
      "Metals": "KGS",
      "Books": "NOS",
      "Food": "KGS",
      "Automotive": "NOS",
      "Electrical": "NOS"
    };
    return units[category] || "NOS";
  }

  // Generate complete invoice based on supply type
  generateInvoice(supplyType = "B2B") {
    let sellerState, buyerState, buyerGstin, pos;
    
    // Determine states based on supply type
    const stateCodes = Object.keys(this.states);
    
    switch(supplyType) {
      case "B2B":
        // Random states, could be same or different
        sellerState = stateCodes[Math.floor(Math.random() * stateCodes.length)];
        buyerState = Math.random() > 0.5 ? sellerState : stateCodes[Math.floor(Math.random() * stateCodes.length)];
        buyerGstin = this.generateGSTIN(buyerState);
        pos = buyerState;
        break;
        
      case "EXPWP":
      case "EXPWOP":
        sellerState = stateCodes[Math.floor(Math.random() * stateCodes.length)];
        buyerGstin = "URP";
        pos = "96";
        buyerState = "96";
        break;
        
      case "SEZWP":
      case "SEZWOP":
        sellerState = stateCodes[Math.floor(Math.random() * stateCodes.length)];
        buyerState = sellerState;
        buyerGstin = `${sellerState}SEZ${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        pos = "96";
        break;
        
      default:
        sellerState = stateCodes[Math.floor(Math.random() * stateCodes.length)];
        buyerState = sellerState;
        buyerGstin = this.generateGSTIN(buyerState);
        pos = buyerState;
    }

    const isInterState = sellerState !== pos;
    const sellerAddress = this.generateAddress(sellerState);
    const buyerAddress = this.generateAddress(buyerState);
    
    // Override buyer address for special cases
    if (supplyType.includes("EXP") || supplyType.includes("SEZ")) {
      buyerAddress.Loc = "PORT AREA";
      buyerAddress.Pin = 999999;
      buyerAddress.Stcd = "96";
    }

    // Generate items (1-5 items per invoice)
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const itemList = Array.from({length: itemCount}, (_, i) => 
      this.generateProductItem(i + 1, isInterState)
    );

    // Calculate value details
    const valDtls = this.calculateValueDetails(itemList);

    return {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: supplyType,
        RegRev: supplyType === "B2B" && Math.random() > 0.8 ? "Y" : "N",
        EcmGstin: null,
        IgstOnIntra: "N"
      },
      DocDtls: {
        Typ: "INV",
        No: `INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000) + 1}`,
        Dt: this.generateDate()
      },
      SellerDtls: {
        Gstin: this.generateGSTIN(sellerState),
        LglNm: this.generateCompanyName(),
        TrdNm: this.generateCompanyName(),
        ...sellerAddress,
        Ph: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
        Em: `info@${this.generateCompanyName().toLowerCase().replace(/\s+/g, '')}.com`
      },
      BuyerDtls: {
        Gstin: buyerGstin,
        LglNm: this.generateCompanyName(),
        TrdNm: this.generateCompanyName(),
        Pos: pos,
        ...buyerAddress,
        Ph: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
        Em: `purchase@${this.generateCompanyName().toLowerCase().replace(/\s+/g, '')}.com`
      },
      ItemList: itemList,
      ValDtls: valDtls
    };
  }

  calculateValueDetails(itemList) {
    const totals = itemList.reduce((acc, item) => {
      acc.assVal += item.AssAmt;
      acc.igstVal += item.IgstAmt;
      acc.cgstVal += item.CgstAmt;
      acc.sgstVal += item.SgstAmt;
      acc.totInvVal += item.TotItemVal;
      return acc;
    }, { assVal: 0, igstVal: 0, cgstVal: 0, sgstVal: 0, totInvVal: 0 });

    return {
      AssVal: parseFloat(totals.assVal.toFixed(2)),
      CgstVal: parseFloat(totals.cgstVal.toFixed(2)),
      SgstVal: parseFloat(totals.sgstVal.toFixed(2)),
      IgstVal: parseFloat(totals.igstVal.toFixed(2)),
      TotInvVal: parseFloat(totals.totInvVal.toFixed(2))
    };
  }

  // Generate multiple invoices
  generateMultipleInvoices(count = 10) {
    const supplyTypes = ["B2B", "EXPWP", "SEZWP"];
    const invoices = [];
    
    for (let i = 0; i < count; i++) {
      const supplyType = supplyTypes[Math.floor(Math.random() * supplyTypes.length)];
      invoices.push(this.generateInvoice(supplyType));
    }
    
    return invoices;
  }

  // Generate specific scenario
  generateScenario(scenarioType) {
    const scenarios = {
      "b2b_interstate": () => {
        const states = Object.keys(this.states);
        const sellerState = states[0];
        const buyerState = states[1];
        return this.generateInvoiceWithStates("B2B", sellerState, buyerState);
      },
      "b2b_intrastate": () => {
        const state = Object.keys(this.states)[0];
        return this.generateInvoiceWithStates("B2B", state, state);
      },
      "export": () => this.generateInvoice("EXPWP"),
      "sez": () => this.generateInvoice("SEZWP"),
      "reverse_charge": () => {
        const invoice = this.generateInvoice("B2B");
        invoice.TranDtls.RegRev = "Y";
        return invoice;
      },
      "credit_note": () => {
        const invoice = this.generateInvoice("B2B");
        invoice.DocDtls.Typ = "CRN";
        return invoice;
      }
    };

    return scenarios[scenarioType] ? scenarios[scenarioType]() : this.generateInvoice();
  }

  generateInvoiceWithStates(supplyType, sellerState, buyerState) {
    const invoice = this.generateInvoice(supplyType);
    invoice.SellerDtls.Gstin = this.generateGSTIN(sellerState);
    invoice.SellerDtls.Stcd = sellerState;
    invoice.BuyerDtls.Gstin = this.generateGSTIN(buyerState);
    invoice.BuyerDtls.Pos = buyerState;
    invoice.BuyerDtls.Stcd = buyerState;
    return invoice;
  }
}

module.exports = EInvoiceDataGenerator;