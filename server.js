\const express = require('express');
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

// ==================== GENERIC FILTERING SYSTEM ====================

class GenericFilter {
  constructor(data) {
    this.data = data;
  }

  /**
   * Apply generic filters to any data array
   * @param {Array} data - The data to filter
   * @param {Object} filters - Filter parameters
   * @param {Object} fieldMapping - Map query params to actual fields
   * @returns {Array} Filtered data
   */
  apply(data, filters, fieldMapping = {}) {
    let filteredData = [...data];
    
    // Apply each filter dynamically
    Object.keys(filters).forEach(filterKey => {
      if (filterKey === 'page' || filterKey === 'limit' || filterKey === 'sortBy' || filterKey === 'sortOrder') {
        return; // Skip pagination/sorting params
      }
      
      const filterValue = filters[filterKey];
      if (filterValue === undefined || filterValue === '') {
        return;
      }
      
      // Map query param to actual field name
      const actualField = fieldMapping[filterKey] || filterKey;
      
      filteredData = this.applySingleFilter(filteredData, actualField, filterValue);
    });
    
    return filteredData;
  }

  /**
   * Apply a single filter dynamically
   */
  applySingleFilter(data, field, value) {
    return data.filter(item => {
      // Get the value from the item (support nested paths)
      const itemValue = this.getValueFromPath(item, field);
      
      // Handle special filter patterns
      if (typeof value === 'string') {
        // Multiple values (OR logic) - comma separated
        if (value.includes(',') && !value.startsWith('lt:') && !value.startsWith('gt:') && !value.startsWith('eq:') && !value.startsWith('ne:')) {
          const values = value.split(',').map(v => v.trim());
          return values.some(v => this.compareValues(itemValue, v));
        }
        
        // Range filters (lt:, gt:, eq:, ne:)
        if (value.startsWith('lt:')) {
          const numValue = parseFloat(value.substring(3));
          return typeof itemValue === 'number' && itemValue < numValue;
        }
        if (value.startsWith('gt:')) {
          const numValue = parseFloat(value.substring(3));
          return typeof itemValue === 'number' && itemValue > numValue;
        }
        if (value.startsWith('eq:')) {
          const compareValue = value.substring(3);
          return this.compareValues(itemValue, compareValue);
        }
        if (value.startsWith('ne:')) {
          const compareValue = value.substring(3);
          return !this.compareValues(itemValue, compareValue);
        }
        
        // Boolean filters
        if (value === 'true' || value === 'false') {
          const boolValue = value === 'true';
          return itemValue === boolValue;
        }
        
        // Date range (from:to)
        if (value.includes(':')) {
          const [dateFrom, dateTo] = value.split(':');
          if (dateFrom && dateTo) {
            const itemDate = new Date(itemValue);
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            return itemDate >= fromDate && itemDate <= toDate;
          }
        }
        
        // Text search (case-insensitive partial match)
        if (field === 'search') {
          return this.searchInItem(item, value);
        }
      }
      
      // Default: exact match (case-insensitive for strings)
      return this.compareValues(itemValue, value);
    });
  }

  /**
   * Get value from nested path (e.g., 'invoiceData.DocDtls.No')
   */
  getValueFromPath(item, path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], item);
  }

  /**
   * Compare values with type conversion
   */
  compareValues(itemValue, filterValue) {
    // Handle numbers
    if (typeof itemValue === 'number' && !isNaN(filterValue)) {
      return itemValue === parseFloat(filterValue);
    }
    
    // Handle booleans
    if (typeof itemValue === 'boolean') {
      return itemValue === (filterValue === 'true');
    }
    
    // Handle strings (case-insensitive)
    if (typeof itemValue === 'string') {
      return itemValue.toLowerCase() === filterValue.toLowerCase();
    }
    
    // Default strict equality
    return itemValue == filterValue;
  }

  /**
   * Search across multiple fields in an item
   */
  searchInItem(item, searchTerm) {
    const term = searchTerm.toLowerCase();
    
    // Define searchable fields (can be customized)
    const searchableFields = [
      'irn',
      'invoiceData.DocDtls.No',
      'invoiceData.SellerDtls.LglNm',
      'invoiceData.BuyerDtls.LglNm',
      'invoiceData.SellerDtls.Gstin',
      'invoiceData.BuyerDtls.Gstin',
      'status'
    ];
    
    return searchableFields.some(field => {
      const value = this.getValueFromPath(item, field);
      return value && value.toString().toLowerCase().includes(term);
    });
  }

  /**
   * Sort data dynamically
   */
  sort(data, sortBy = 'generatedAt', sortOrder = 'desc') {
    const order = sortOrder === 'desc' ? -1 : 1;
    
    return [...data].sort((a, b) => {
      const aValue = this.getValueFromPath(a, sortBy);
      const bValue = this.getValueFromPath(b, sortBy);
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
  }

  /**
   * Apply pagination
   */
  paginate(data, page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
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

// Create filter instance
const filter = new GenericFilter();

// ==================== HELPER FUNCTIONS ====================

/**
 * Format invoice for response
 */
function formatInvoice(invoice) {
  return {
    id: invoice.id,
    irn: invoice.irn,
    invoiceNo: invoice.invoiceData.DocDtls.No,
    invoiceDate: invoice.invoiceData.DocDtls.Dt,
    sellerGstin: invoice.invoiceData.SellerDtls.Gstin,
    sellerName: invoice.invoiceData.SellerDtls.LglNm,
    buyerGstin: invoice.invoiceData.BuyerDtls.Gstin,
    buyerName: invoice.invoiceData.BuyerDtls.LglNm,
    supplyType: invoice.invoiceData.TranDtls.SupTyp,
    documentType: invoice.invoiceData.DocDtls.Typ,
    totalValue: invoice.invoiceData.ValDtls.TotInvVal,
    status: invoice.status,
    generatedAt: invoice.generatedAt,
    sellerState: invoice.invoiceData.SellerDtls.Stcd,
    buyerState: invoice.invoiceData.BuyerDtls.Stcd,
    pos: invoice.invoiceData.BuyerDtls.Pos,
    isInterstate: invoice.invoiceData.SellerDtls.Stcd !== invoice.invoiceData.BuyerDtls.Pos,
    reverseCharge: invoice.invoiceData.TranDtls.RegRev === 'Y',
    itemCount: invoice.invoiceData.ItemList ? invoice.invoiceData.ItemList.length : 0
  };
}

/**
 * Format sample for response
 */
function formatSample(id, sample) {
  return {
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
    itemCount: sample.ItemList ? sample.ItemList.length : 0,
    invoiceDate: sample.DocDtls.Dt,
    endpoint: `/api/e-invoice/sample/${id}`
  };
}

// ==================== API ENDPOINTS WITH GENERIC FILTERING ====================

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
    version: '2.2.0',
    features: {
      genericFiltering: true,
      dynamicFieldSupport: true,
      pagination: true,
      sorting: true,
      search: true
    }
  });
});

// Get all invoices with generic filtering
app.get('/api/e-invoice/invoices', (req, res) => {
  try {
    // Parse query parameters
    const { page = 1, limit = 10, sortBy = 'generatedAt', sortOrder = 'desc', ...filters } = req.query;
    
    // Validate parameters
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    
    // Apply generic filtering
    let filteredData = filter.apply(invoices, filters);
    
    // Apply sorting
    filteredData = filter.sort(filteredData, sortBy, validSortOrder);
    
    // Apply pagination
    const paginated = filter.paginate(filteredData, validPage, validLimit);
    
    // Format response
    const responseData = paginated.data.map(formatInvoice);
    
    const response = {
      success: true,
      data: responseData,
      pagination: {
        page: paginated.page,
        limit: paginated.limit,
        total: paginated.total,
        pages: paginated.pages,
        hasNext: paginated.hasNext,
        hasPrev: paginated.hasPrev
      },
      filters: filters,
      sort: {
        by: sortBy,
        order: validSortOrder
      },
      availableFields: Object.keys(responseData[0] || {}).concat([
        'invoiceData.TranDtls.SupTyp',
        'invoiceData.DocDtls.Typ',
        'invoiceData.SellerDtls.Stcd',
        'invoiceData.BuyerDtls.Stcd',
        'invoiceData.ValDtls.TotInvVal'
      ])
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

// Get samples with generic filtering
app.get('/api/e-invoice/samples', (req, res) => {
  try {
    const samples = dataGenerator.getTestSamples();
    
    // Convert samples to array format
    let samplesArray = Object.entries(samples).map(([id, sample]) => 
      formatSample(id, sample)
    );
    
    // Parse query parameters
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc', ...filters } = req.query;
    
    // Apply generic filtering if filters present
    if (Object.keys(filters).length > 0) {
      samplesArray = filter.apply(samplesArray, filters);
    }
    
    // Apply sorting
    samplesArray = filter.sort(samplesArray, sortBy, sortOrder);
    
    // Apply pagination
    const { page: pageNum = 1, limit: limitNum = 100 } = req.query;
    const paginated = filter.paginate(samplesArray, pageNum, limitNum);
    
    res.json({
      success: true,
      data: paginated.data,
      count: paginated.data.length,
      total: samplesArray.length,
      filters: filters,
      pagination: {
        page: paginated.page,
        limit: paginated.limit,
        total: paginated.total,
        pages: paginated.pages
      },
      sort: {
        by: sortBy,
        order: sortOrder
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
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
        metadata: formatSample(id, samples[id])
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Sample ${id} not found. Available samples: 1-${Object.keys(samples).length}`,
        availableSamples: Object.keys(samples).map(id => 
          formatSample(id, samples[id])
        )
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get available fields for filtering
app.get('/api/e-invoice/fields', (req, res) => {
  try {
    // Get field info from invoices
    const invoiceFields = invoices.length > 0 ? 
      Object.keys(formatInvoice(invoices[0])) : [];
    
    // Get field info from samples
    const samples = dataGenerator.getTestSamples();
    const sampleFields = Object.keys(samples).length > 0 ?
      Object.keys(formatSample('1', samples[1])) : [];
    
    // Get nested fields
    const nestedFields = [
      'invoiceData.TranDtls.SupTyp',
      'invoiceData.TranDtls.RegRev',
      'invoiceData.DocDtls.No',
      'invoiceData.DocDtls.Typ',
      'invoiceData.DocDtls.Dt',
      'invoiceData.SellerDtls.Gstin',
      'invoiceData.SellerDtls.LglNm',
      'invoiceData.SellerDtls.Stcd',
      'invoiceData.BuyerDtls.Gstin',
      'invoiceData.BuyerDtls.LglNm',
      'invoiceData.BuyerDtls.Stcd',
      'invoiceData.BuyerDtls.Pos',
      'invoiceData.ValDtls.TotInvVal',
      'invoiceData.ValDtls.AssVal',
      'invoiceData.ValDtls.IgstVal',
      'invoiceData.ValDtls.CgstVal',
      'invoiceData.ValDtls.SgstVal'
    ];
    
    const fieldTypes = {
      string: ['irn', 'invoiceNo', 'sellerGstin', 'buyerGstin', 'sellerName', 'buyerName', 'status', 'supplyType', 'documentType', 'sellerState', 'buyerState'],
      number: ['id', 'totalValue', 'itemCount'],
      boolean: ['isInterstate', 'reverseCharge'],
      date: ['generatedAt', 'invoiceDate'],
      nested: nestedFields
    };
    
    res.json({
      success: true,
      data: {
        invoiceFields,
        sampleFields,
        nestedFields,
        fieldTypes,
        filterOperators: {
          exact: 'field=value',
          multiple: 'field=value1,value2,value3',
          lessThan: 'field=lt:value',
          greaterThan: 'field=gt:value',
          equalTo: 'field=eq:value',
          notEqualTo: 'field=ne:value',
          dateRange: 'dateField=2024-01-01:2024-12-31',
          boolean: 'field=true or field=false',
          search: 'search=term'
        },
        examples: {
          invoices: {
            exact: '/invoices?status=Generated',
            multiple: '/invoices?supplyType=B2B,EXPWP',
            range: '/invoices?totalValue=lt:100000',
            date: '/invoices?generatedAt=2024-01-01:2024-12-31',
            nested: '/invoices?invoiceData.TranDtls.SupTyp=B2B',
            combined: '/invoices?status=Generated&supplyType=B2B&totalValue=gt:50000'
          },
          samples: {
            exact: '/samples?totalValue=442500',
            multiple: '/samples?type=B2B,EXPWP',
            boolean: '/samples?isInterstate=true',
            range: '/samples?totalValue=lt:100000',
            search: '/samples?search=INV/2024'
          }
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generic search across all endpoints
app.get('/api/e-invoice/search', (req, res) => {
  try {
    const { q: query, type = 'all', ...filters } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }
    
    let results = [];
    
    // Search in invoices
    if (type === 'all' || type === 'invoices') {
      const invoiceResults = filter.apply(invoices, { search: query, ...filters });
      results.push(...invoiceResults.map(inv => ({
        type: 'invoice',
        data: formatInvoice(inv),
        score: 1.0
      })));
    }
    
    // Search in samples
    if (type === 'all' || type === 'samples') {
      const samples = dataGenerator.getTestSamples();
      const sampleArray = Object.entries(samples).map(([id, sample]) => 
        formatSample(id, sample)
      );
      
      const sampleResults = filter.apply(sampleArray, { search: query, ...filters });
      results.push(...sampleResults.map(sample => ({
        type: 'sample',
        data: sample,
        score: 1.0
      })));
    }
    
    // Sort by relevance (simple implementation)
    results.sort((a, b) => b.score - a.score);
    
    res.json({
      success: true,
      query,
      type,
      count: results.length,
      results,
      filters
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Keep other endpoints (they remain the same)
// ... (generate, generate-dynamic, validate, cancel, etc.)

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET    /health',
      'GET    /api/e-invoice/invoices',
      'GET    /api/e-invoice/samples',
      'GET    /api/e-invoice/sample/:id',
      'GET    /api/e-invoice/fields',
      'GET    /api/e-invoice/search',
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
    console.log(`🔧 Generic filtering enabled - works for ANY field!`);
  });
}