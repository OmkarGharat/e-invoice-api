const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import data generator
const EInvoiceDataGenerator = require('./utils/dataGenerator');
const dataGenerator = new EInvoiceDataGenerator();

// Simple storage for generated invoices
let invoices = [];
let counter = 1;

// Initialize with some samples
const TEST_SAMPLES = dataGenerator.getTestSamples();
Object.values(TEST_SAMPLES).forEach((sample, index) => {
  invoices.push({
    id: counter++,
    irn: `IRNSAMPLE${index + 1}`,
    invoiceData: sample,
    status: Math.random() > 0.8 ? 'Cancelled' : 'Generated',
    generatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...(Math.random() > 0.8 ? {
      cancelledAt: new Date().toISOString(),
      cancelReason: ['Order cancelled', 'Price dispute', 'Duplicate invoice'][Math.floor(Math.random() * 3)]
    } : {})
  });
});

// ==================== ADVANCED FILTERING SYSTEM ====================

class AdvancedFilter {
  constructor(data) {
    this.data = data;
  }

  // Apply all filters
  applyFilters(filters) {
    let filteredData = [...this.data];
    
    // Single field equality filters
    if (filters.status) filteredData = this.filterByStatus(filteredData, filters.status);
    if (filters.supplyType) filteredData = this.filterBySupplyType(filteredData, filters.supplyType);
    if (filters.sellerState) filteredData = this.filterBySellerState(filteredData, filters.sellerState);
    if (filters.buyerState) filteredData = this.filterByBuyerState(filteredData, filters.buyerState);
    if (filters.documentType) filteredData = this.filterByDocumentType(filteredData, filters.documentType);
    
    // Special filters
    if (filters.interstate) filteredData = this.filterInterstate(filteredData, filters.interstate);
    if (filters.reverseCharge) filteredData = this.filterReverseCharge(filteredData, filters.reverseCharge);
    
    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      filteredData = this.filterByDateRange(filteredData, filters.dateFrom, filters.dateTo);
    }
    
    // Value range filters
    if (filters.minValue || filters.maxValue) {
      filteredData = this.filterByValueRange(filteredData, filters.minValue, filters.maxValue);
    }
    
    // Special value filters
    if (filters.totalValue) filteredData = this.filterByTotalValue(filteredData, filters.totalValue);
    
    // Text search
    if (filters.search) filteredData = this.filterBySearch(filteredData, filters.search);
    
    // Multiple value filters (OR logic)
    if (filters.supplyTypes) filteredData = this.filterByMultipleSupplyTypes(filteredData, filters.supplyTypes);
    if (filters.statuses) filteredData = this.filterByMultipleStatuses(filteredData, filters.statuses);
    
    // Sorting
    filteredData = this.sortData(filteredData, filters.sortBy, filters.sortOrder);
    
    return filteredData;
  }

  // Individual filter methods
  filterByStatus(data, status) {
    return data.filter(item => item.status === status);
  }

  filterBySupplyType(data, supplyType) {
    // Handle comma-separated values (OR logic)
    if (supplyType.includes(',')) {
      const types = supplyType.split(',').map(t => t.trim());
      return data.filter(item => types.includes(item.invoiceData.TranDtls.SupTyp));
    }
    return data.filter(item => item.invoiceData.TranDtls.SupTyp === supplyType);
  }

  filterBySellerState(data, state) {
    return data.filter(item => item.invoiceData.SellerDtls.Stcd === state);
  }

  filterByBuyerState(data, state) {
    return data.filter(item => item.invoiceData.BuyerDtls.Stcd === state);
  }

  filterByDocumentType(data, docType) {
    return data.filter(item => item.invoiceData.DocDtls.Typ === docType);
  }

  filterInterstate(data, isInterstate) {
    const interstate = isInterstate === 'true';
    return data.filter(item => {
      const sellerState = item.invoiceData.SellerDtls.Stcd;
      const buyerState = item.invoiceData.BuyerDtls.Stcd;
      const pos = item.invoiceData.BuyerDtls.Pos;
      return interstate ? sellerState !== pos : sellerState === pos;
    });
  }

  filterReverseCharge(data, reverseCharge) {
    const isReverse = reverseCharge === 'true';
    return data.filter(item => {
      const regRev = item.invoiceData.TranDtls.RegRev;
      return isReverse ? regRev === 'Y' : regRev === 'N';
    });
  }

  filterByDateRange(data, dateFrom, dateTo) {
    return data.filter(item => {
      const generatedDate = new Date(item.generatedAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      let pass = true;
      if (fromDate) pass = pass && generatedDate >= fromDate;
      if (toDate) pass = pass && generatedDate <= toDate;
      return pass;
    });
  }

  filterByValueRange(data, minValue, maxValue) {
    const min = minValue ? parseFloat(minValue) : 0;
    const max = maxValue ? parseFloat(maxValue) : Number.MAX_SAFE_INTEGER;
    
    return data.filter(item => {
      const value = item.invoiceData.ValDtls.TotInvVal;
      return value >= min && value <= max;
    });
  }

  filterByTotalValue(data, filterString) {
    // Handle special filters like: lt:1000, gt:5000, eq:10000
    if (filterString.startsWith('lt:')) {
      const maxValue = parseFloat(filterString.substring(3));
      return data.filter(item => item.invoiceData.ValDtls.TotInvVal < maxValue);
    } else if (filterString.startsWith('gt:')) {
      const minValue = parseFloat(filterString.substring(3));
      return data.filter(item => item.invoiceData.ValDtls.TotInvVal > minValue);
    } else if (filterString.startsWith('eq:')) {
      const exactValue = parseFloat(filterString.substring(3));
      return data.filter(item => item.invoiceData.ValDtls.TotInvVal === exactValue);
    } else if (filterString.startsWith('ne:')) {
      const notValue = parseFloat(filterString.substring(3));
      return data.filter(item => item.invoiceData.ValDtls.TotInvVal !== notValue);
    }
    return data;
  }

  filterBySearch(data, searchTerm) {
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return (
        item.irn.toLowerCase().includes(term) ||
        item.invoiceData.DocDtls.No.toLowerCase().includes(term) ||
        item.invoiceData.SellerDtls.LglNm.toLowerCase().includes(term) ||
        item.invoiceData.BuyerDtls.LglNm.toLowerCase().includes(term) ||
        item.invoiceData.SellerDtls.Gstin.toLowerCase().includes(term) ||
        item.invoiceData.BuyerDtls.Gstin.toLowerCase().includes(term)
      );
    });
  }

  filterByMultipleSupplyTypes(data, supplyTypes) {
    const types = supplyTypes.split(',').map(t => t.trim());
    return data.filter(item => types.includes(item.invoiceData.TranDtls.SupTyp));
  }

  filterByMultipleStatuses(data, statuses) {
    const statusArray = statuses.split(',').map(s => s.trim());
    return data.filter(item => statusArray.includes(item.status));
  }

  sortData(data, sortBy = 'generatedAt', sortOrder = 'desc') {
    const validSortFields = [
      'id', 'irn', 'generatedAt', 'totalValue', 'invoiceNo', 
      'status', 'supplyType', 'sellerState', 'buyerState'
    ];
    
    // Use default if invalid sort field
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'generatedAt';
    }
    
    return data.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case 'totalValue':
          aValue = a.invoiceData.ValDtls.TotInvVal;
          bValue = b.invoiceData.ValDtls.TotInvVal;
          break;
        case 'invoiceNo':
          aValue = a.invoiceData.DocDtls.No;
          bValue = b.invoiceData.DocDtls.No;
          break;
        case 'supplyType':
          aValue = a.invoiceData.TranDtls.SupTyp;
          bValue = b.invoiceData.TranDtls.SupTyp;
          break;
        case 'sellerState':
          aValue = a.invoiceData.SellerDtls.Stcd;
          bValue = b.invoiceData.SellerDtls.Stcd;
          break;
        case 'buyerState':
          aValue = a.invoiceData.BuyerDtls.Stcd;
          bValue = b.invoiceData.BuyerDtls.Stcd;
          break;
        case 'generatedAt':
          aValue = new Date(a.generatedAt);
          bValue = new Date(b.generatedAt);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  // Pagination
  paginateData(data, page = 1, limit = 10) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    
    return {
      data: data.slice(startIndex, endIndex),
      total: data.length,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(data.length / limitNum),
      hasNext: endIndex < data.length,
      hasPrev: startIndex > 0
    };
  }
}

// ==================== API ENDPOINTS WITH ADVANCED FILTERING ====================

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-Invoice API is running smoothly',
    timestamp: new Date().toISOString(),
    totalInvoices: invoices.length,
    version: '2.1.0',
    features: {
      advancedFiltering: true,
      pagination: true,
      sorting: true,
      search: true
    }
  });
});

// Get all invoices with advanced filtering
app.get('/api/e-invoice/invoices', (req, res) => {
  try {
    // Parse query parameters with defaults
    const {
      page = 1,
      limit = 10,
      sortBy = 'generatedAt',
      sortOrder = 'desc',
      status,
      supplyType,
      supplyTypes,
      sellerState,
      buyerState,
      documentType,
      interstate,
      reverseCharge,
      dateFrom,
      dateTo,
      minValue,
      maxValue,
      totalValue,
      search,
      statuses
    } = req.query;
    
    // Validate parameters
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    
    // Apply advanced filtering
    const filter = new AdvancedFilter(invoices);
    const filteredData = filter.applyFilters({
      status,
      supplyType,
      supplyTypes,
      sellerState,
      buyerState,
      documentType,
      interstate,
      reverseCharge,
      dateFrom,
      dateTo,
      minValue,
      maxValue,
      totalValue,
      search,
      statuses,
      sortBy,
      sortOrder: validSortOrder
    });
    
    // Apply pagination
    const paginated = filter.paginateData(filteredData, validPage, validLimit);
    
    // Format response
    const response = {
      success: true,
      data: paginated.data.map(inv => ({
        id: inv.id,
        irn: inv.irn,
        invoiceNo: inv.invoiceData.DocDtls.No,
        invoiceDate: inv.invoiceData.DocDtls.Dt,
        sellerGstin: inv.invoiceData.SellerDtls.Gstin,
        sellerName: inv.invoiceData.SellerDtls.LglNm,
        buyerGstin: inv.invoiceData.BuyerDtls.Gstin,
        buyerName: inv.invoiceData.BuyerDtls.LglNm,
        supplyType: inv.invoiceData.TranDtls.SupTyp,
        documentType: inv.invoiceData.DocDtls.Typ,
        totalValue: inv.invoiceData.ValDtls.TotInvVal,
        status: inv.status,
        generatedAt: inv.generatedAt,
        sellerState: inv.invoiceData.SellerDtls.Stcd,
        buyerState: inv.invoiceData.BuyerDtls.Stcd,
        pos: inv.invoiceData.BuyerDtls.Pos,
        isInterstate: inv.invoiceData.SellerDtls.Stcd !== inv.invoiceData.BuyerDtls.Pos,
        reverseCharge: inv.invoiceData.TranDtls.RegRev === 'Y'
      })),
      pagination: {
        page: paginated.page,
        limit: paginated.limit,
        total: paginated.total,
        pages: paginated.pages,
        hasNext: paginated.hasNext,
        hasPrev: paginated.hasPrev
      },
      filters: {
        applied: {
          status, supplyType, sellerState, buyerState, documentType,
          interstate, reverseCharge, dateFrom, dateTo, minValue, maxValue,
          totalValue, search, statuses, supplyTypes
        },
        available: {
          status: ['Generated', 'Cancelled'],
          supplyType: ['B2B', 'EXPWP', 'EXPWOP', 'SEZWP', 'SEZWOP', 'DEXP'],
          documentType: ['INV', 'CRN', 'DBN']
        }
      },
      sort: {
        by: sortBy,
        order: validSortOrder
      }
    };
    
    // Set custom headers
    res.set({
      'X-Total-Count': paginated.total,
      'X-Page-Count': paginated.pages,
      'X-Page': paginated.page,
      'X-Limit': paginated.limit,
      'X-Has-Next': paginated.hasNext,
      'X-Has-Prev': paginated.hasPrev
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('Error in /invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
      details: 'Check your filter parameters'
    });
  }
});

// Get filtered stats
app.get('/api/e-invoice/stats', (req, res) => {
  try {
    // Apply same filters as invoices endpoint
    const filter = new AdvancedFilter(invoices);
    const filteredData = filter.applyFilters(req.query);
    
    const stats = {
      totalInvoices: filteredData.length,
      generated: filteredData.filter(inv => inv.status === 'Generated').length,
      cancelled: filteredData.filter(inv => inv.status === 'Cancelled').length,
      bySupplyType: {},
      byState: {},
      byDocumentType: {},
      byStatus: {},
      totalValue: filteredData.reduce((sum, inv) => sum + inv.invoiceData.ValDtls.TotInvVal, 0),
      averageValue: filteredData.length > 0 ? 
        filteredData.reduce((sum, inv) => sum + inv.invoiceData.ValDtls.TotInvVal, 0) / filteredData.length : 0,
      interstateCount: filteredData.filter(inv => 
        inv.invoiceData.SellerDtls.Stcd !== inv.invoiceData.BuyerDtls.Pos
      ).length,
      reverseChargeCount: filteredData.filter(inv => 
        inv.invoiceData.TranDtls.RegRev === 'Y'
      ).length
    };
    
    filteredData.forEach(inv => {
      const supplyType = inv.invoiceData.TranDtls.SupTyp;
      const state = inv.invoiceData.SellerDtls.Stcd;
      const docType = inv.invoiceData.DocDtls.Typ;
      const status = inv.status;
      
      stats.bySupplyType[supplyType] = (stats.bySupplyType[supplyType] || 0) + 1;
      stats.byState[state] = (stats.byState[state] || 0) + 1;
      stats.byDocumentType[docType] = (stats.byDocumentType[docType] || 0) + 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });
    
    // Add date range stats if filters applied
    if (req.query.dateFrom || req.query.dateTo) {
      const dates = filteredData.map(inv => new Date(inv.generatedAt).toISOString().split('T')[0]);
      const uniqueDates = [...new Set(dates)].sort();
      stats.dateRange = {
        from: uniqueDates[0],
        to: uniqueDates[uniqueDates.length - 1],
        days: uniqueDates.length
      };
    }
    
    res.json({
      success: true,
      data: stats,
      filters: req.query,
      sampleCount: filteredData.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating statistics',
      error: error.message
    });
  }
});

// Get samples with filtering
// Get samples with filtering
app.get('/api/e-invoice/samples', (req, res) => {
  try {
    const samples = dataGenerator.getTestSamples();
    const samplesList = Object.keys(samples).map(id => ({
      id: parseInt(id),
      type: samples[id].TranDtls.SupTyp,
      description: dataGenerator.getSampleDescription(id),
      invoiceNo: samples[id].DocDtls.No,
      totalValue: samples[id].ValDtls.TotInvVal,
      documentType: samples[id].DocDtls.Typ,
      sellerState: samples[id].SellerDtls.Stcd,
      buyerState: samples[id].BuyerDtls.Stcd,
      isInterstate: samples[id].SellerDtls.Stcd !== samples[id].BuyerDtls.Pos,
      reverseCharge: samples[id].TranDtls.RegRev === 'Y',
      itemCount: samples[id].ItemList.length,
      invoiceDate: samples[id].DocDtls.Dt,
      endpoint: `/api/e-invoice/sample/${id}`
    }));
    
    // Apply filtering to samples if requested
    if (Object.keys(req.query).length > 0) {
      // Create a separate filter for samples
      let filteredSamples = [...samplesList];
      
      // Apply each filter
      const { 
        type, 
        totalValue, 
        documentType, 
        sellerState, 
        buyerState, 
        interstate,
        reverseCharge,
        minValue,
        maxValue,
        search
      } = req.query;
      
      // Filter by type
      if (type) {
        if (type.includes(',')) {
          const types = type.split(',').map(t => t.trim());
          filteredSamples = filteredSamples.filter(sample => types.includes(sample.type));
        } else {
          filteredSamples = filteredSamples.filter(sample => sample.type === type);
        }
      }
      
      // Filter by totalValue (exact match)
      if (totalValue) {
        // Check if it's a special filter (lt:, gt:, eq:, ne:)
        if (totalValue.startsWith('lt:')) {
          const maxVal = parseFloat(totalValue.substring(3));
          filteredSamples = filteredSamples.filter(sample => sample.totalValue < maxVal);
        } else if (totalValue.startsWith('gt:')) {
          const minVal = parseFloat(totalValue.substring(3));
          filteredSamples = filteredSamples.filter(sample => sample.totalValue > minVal);
        } else if (totalValue.startsWith('eq:')) {
          const exactVal = parseFloat(totalValue.substring(3));
          filteredSamples = filteredSamples.filter(sample => sample.totalValue === exactVal);
        } else if (totalValue.startsWith('ne:')) {
          const notVal = parseFloat(totalValue.substring(3));
          filteredSamples = filteredSamples.filter(sample => sample.totalValue !== notVal);
        } else {
          // Exact match
          const val = parseFloat(totalValue);
          filteredSamples = filteredSamples.filter(sample => sample.totalValue === val);
        }
      }
      
      // Filter by documentType
      if (documentType) {
        filteredSamples = filteredSamples.filter(sample => sample.documentType === documentType);
      }
      
      // Filter by sellerState
      if (sellerState) {
        filteredSamples = filteredSamples.filter(sample => sample.sellerState === sellerState);
      }
      
      // Filter by buyerState
      if (buyerState) {
        filteredSamples = filteredSamples.filter(sample => sample.buyerState === buyerState);
      }
      
      // Filter by interstate
      if (interstate) {
        const isInterstate = interstate === 'true';
        filteredSamples = filteredSamples.filter(sample => sample.isInterstate === isInterstate);
      }
      
      // Filter by reverseCharge
      if (reverseCharge) {
        const isReverse = reverseCharge === 'true';
        filteredSamples = filteredSamples.filter(sample => sample.reverseCharge === isReverse);
      }
      
      // Filter by value range
      if (minValue || maxValue) {
        const min = minValue ? parseFloat(minValue) : -Infinity;
        const max = maxValue ? parseFloat(maxValue) : Infinity;
        filteredSamples = filteredSamples.filter(sample => 
          sample.totalValue >= min && sample.totalValue <= max
        );
      }
      
      // Filter by search
      if (search) {
        const term = search.toLowerCase();
        filteredSamples = filteredSamples.filter(sample => 
          sample.invoiceNo.toLowerCase().includes(term) ||
          sample.description.toLowerCase().includes(term)
        );
      }
      
      res.json({
        success: true,
        data: filteredSamples,
        count: filteredSamples.length,
        total: samplesList.length,
        filters: req.query,
        message: filteredSamples.length === 0 ? 'No samples found matching the criteria' : 'Samples filtered successfully'
      });
    } else {
      res.json({
        success: true,
        data: samplesList,
        count: samplesList.length
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error filtering samples',
      error: error.message
    });
  }
});

// Get filtered sample by criteria
app.get('/api/e-invoice/sample-by', (req, res) => {
  try {
    const { 
      type, 
      minValue, 
      maxValue, 
      interstate, 
      reverseCharge,
      totalValue,
      documentType,
      sellerState,
      buyerState
    } = req.query;
    
    const samples = dataGenerator.getTestSamples();
    
    let filteredSamples = Object.entries(samples).map(([id, sample]) => ({
      id: parseInt(id),
      type: sample.TranDtls.SupTyp,
      description: dataGenerator.getSampleDescription(id),
      invoiceNo: sample.DocDtls.No,
      totalValue: sample.ValDtls.TotInvVal,
      documentType: sample.DocDtls.Typ,
      sellerState: sample.SellerDtls.Stcd,
      buyerState: sample.BuyerDtls.Stcd,
      isInterstate: sample.SellerDtls.Stcd !== sample.BuyerDtls.Pos,
      reverseCharge: sample.TranDtls.RegRev === 'Y',
      itemCount: sample.ItemList.length,
      data: sample
    }));
    
    // Apply filters
    if (type) {
      if (type.includes(',')) {
        const types = type.split(',').map(t => t.trim());
        filteredSamples = filteredSamples.filter(s => types.includes(s.type));
      } else {
        filteredSamples = filteredSamples.filter(s => s.type === type);
      }
    }
    
    if (totalValue) {
      // Handle special filters
      if (totalValue.startsWith('lt:')) {
        const maxVal = parseFloat(totalValue.substring(3));
        filteredSamples = filteredSamples.filter(s => s.totalValue < maxVal);
      } else if (totalValue.startsWith('gt:')) {
        const minVal = parseFloat(totalValue.substring(3));
        filteredSamples = filteredSamples.filter(s => s.totalValue > minVal);
      } else if (totalValue.startsWith('eq:')) {
        const exactVal = parseFloat(totalValue.substring(3));
        filteredSamples = filteredSamples.filter(s => s.totalValue === exactVal);
      } else if (totalValue.startsWith('ne:')) {
        const notVal = parseFloat(totalValue.substring(3));
        filteredSamples = filteredSamples.filter(s => s.totalValue !== notVal);
      } else {
        const val = parseFloat(totalValue);
        filteredSamples = filteredSamples.filter(s => s.totalValue === val);
      }
    }
    
    if (minValue) {
      const min = parseFloat(minValue);
      filteredSamples = filteredSamples.filter(s => s.totalValue >= min);
    }
    
    if (maxValue) {
      const max = parseFloat(maxValue);
      filteredSamples = filteredSamples.filter(s => s.totalValue <= max);
    }
    
    if (interstate) {
      const isInterstate = interstate === 'true';
      filteredSamples = filteredSamples.filter(s => s.isInterstate === isInterstate);
    }
    
    if (reverseCharge) {
      const isReverse = reverseCharge === 'true';
      filteredSamples = filteredSamples.filter(s => s.reverseCharge === isReverse);
    }
    
    if (documentType) {
      filteredSamples = filteredSamples.filter(s => s.documentType === documentType);
    }
    
    if (sellerState) {
      filteredSamples = filteredSamples.filter(s => s.sellerState === sellerState);
    }
    
    if (buyerState) {
      filteredSamples = filteredSamples.filter(s => s.buyerState === buyerState);
    }
    
    if (filteredSamples.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No samples found matching the criteria',
        filters: req.query,
        availableSamples: Object.keys(samples).map(id => ({
          id: parseInt(id),
          type: samples[id].TranDtls.SupTyp,
          totalValue: samples[id].ValDtls.TotInvVal
        }))
      });
    }
    
    // Return all matching samples, not just random
    res.json({
      success: true,
      data: filteredSamples.map(s => s.data),
      metadata: {
        matchedCount: filteredSamples.length,
        filters: req.query,
        samples: filteredSamples.map(s => ({
          id: s.id,
          type: s.type,
          totalValue: s.totalValue,
          description: s.description
        }))
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error filtering samples',
      error: error.message 
    });
  }
});

// Get specific sample by ID
app.get('/api/e-invoice/sample/:id', (req, res) => {
  try {
    const id = req.params.id;
    const samples = dataGenerator.getTestSamples();
    
    if (samples[id]) {
      res.json({
        success: true,
        data: samples[id],
        sampleId: parseInt(id),
        description: dataGenerator.getSampleDescription(id),
        type: samples[id].TranDtls.SupTyp,
        metadata: {
          totalValue: samples[id].ValDtls.TotInvVal,
          isInterstate: samples[id].SellerDtls.Stcd !== samples[id].BuyerDtls.Pos,
          reverseCharge: samples[id].TranDtls.RegRev === 'Y',
          itemCount: samples[id].ItemList.length
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Sample ${id} not found. Available samples: 1-${Object.keys(samples).length}`,
        availableSamples: Object.keys(samples).map(id => ({
          id: parseInt(id),
          type: samples[id].TranDtls.SupTyp,
          description: dataGenerator.getSampleDescription(id),
          totalValue: samples[id].ValDtls.TotInvVal
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filtered sample by criteria
app.get('/api/e-invoice/sample-by', (req, res) => {
  try {
    const { type, minValue, maxValue, interstate, reverseCharge } = req.query;
    const samples = dataGenerator.getTestSamples();
    
    let filteredSamples = Object.entries(samples).map(([id, sample]) => ({
      id: parseInt(id),
      ...sample
    }));
    
    // Apply filters
    if (type) {
      filteredSamples = filteredSamples.filter(s => s.TranDtls.SupTyp === type);
    }
    
    if (minValue) {
      const min = parseFloat(minValue);
      filteredSamples = filteredSamples.filter(s => s.ValDtls.TotInvVal >= min);
    }
    
    if (maxValue) {
      const max = parseFloat(maxValue);
      filteredSamples = filteredSamples.filter(s => s.ValDtls.TotInvVal <= max);
    }
    
    if (interstate) {
      const isInterstate = interstate === 'true';
      filteredSamples = filteredSamples.filter(s => 
        isInterstate ? s.SellerDtls.Stcd !== s.BuyerDtls.Pos : s.SellerDtls.Stcd === s.BuyerDtls.Pos
      );
    }
    
    if (reverseCharge) {
      const isReverse = reverseCharge === 'true';
      filteredSamples = filteredSamples.filter(s => 
        isReverse ? s.TranDtls.RegRev === 'Y' : s.TranDtls.RegRev === 'N'
      );
    }
    
    if (filteredSamples.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No samples found matching the criteria',
        filters: req.query
      });
    }
    
    // Return random sample from filtered results
    const randomSample = filteredSamples[Math.floor(Math.random() * filteredSamples.length)];
    
    res.json({
      success: true,
      data: randomSample,
      matchedCount: filteredSamples.length,
      filters: req.query
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random sample
app.get('/api/e-invoice/sample', (req, res) => {
  try {
    const samples = dataGenerator.getTestSamples();
    const randomId = Math.floor(Math.random() * Object.keys(samples).length) + 1;
    
    res.json({
      success: true,
      data: samples[randomId],
      sampleId: randomId,
      description: dataGenerator.getSampleDescription(randomId.toString()),
      note: "This is a random sample. Use /api/e-invoice/sample/:id for specific samples",
      filters: req.query
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available filter options
app.get('/api/e-invoice/filter-options', (req, res) => {
  try {
    const options = {
      status: ['Generated', 'Cancelled'],
      supplyType: ['B2B', 'EXPWP', 'EXPWOP', 'SEZWP', 'SEZWOP', 'DEXP'],
      documentType: ['INV', 'CRN', 'DBN'],
      sellerState: ['29', '07', '27', '33', '36', '06'],
      buyerState: ['29', '07', '27', '33', '36', '06', '96'],
      sortBy: ['id', 'irn', 'generatedAt', 'totalValue', 'invoiceNo', 'status', 'supplyType', 'sellerState', 'buyerState'],
      sortOrder: ['asc', 'desc'],
      valueOperators: ['lt:', 'gt:', 'eq:', 'ne:'],
      dateFormats: ['YYYY-MM-DD', 'ISO string'],
      examples: {
        singleValue: '?supplyType=B2B',
        multipleValues: '?supplyTypes=B2B,EXPWP,SEZWP',
        dateRange: '?dateFrom=2024-01-01&dateTo=2024-12-31',
        valueRange: '?minValue=1000&maxValue=10000',
        specialValue: '?totalValue=lt:1000',
        interstate: '?interstate=true',
        reverseCharge: '?reverseCharge=false',
        pagination: '?page=2&limit=20',
        sorting: '?sortBy=totalValue&sortOrder=desc',
        search: '?search=INV/2024'
      }
    };
    
    // Add available states from actual data
    const uniqueSellerStates = [...new Set(invoices.map(inv => inv.invoiceData.SellerDtls.Stcd))];
    const uniqueBuyerStates = [...new Set(invoices.map(inv => inv.invoiceData.BuyerDtls.Stcd))];
    
    options.sellerState = uniqueSellerStates;
    options.buyerState = uniqueBuyerStates;
    
    res.json({
      success: true,
      data: options,
      count: Object.keys(options).length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Keep all other endpoints (generate, generate-dynamic, validate, cancel) as they are
// ... (previous code for other endpoints remains the same)

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
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET    /health',
      'GET    /api/e-invoice/invoices',
      'GET    /api/e-invoice/samples',
      'GET    /api/e-invoice/sample/:id',
      'GET    /api/e-invoice/sample-by',
      'GET    /api/e-invoice/filter-options',
      'GET    /api/e-invoice/stats',
      'POST   /api/e-invoice/generate',
      'POST   /api/e-invoice/generate-dynamic',
      'POST   /api/e-invoice/validate',
      'POST   /api/e-invoice/cancel'
    ]
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
    console.log(`🔧 Advanced filtering enabled`);
  });
}