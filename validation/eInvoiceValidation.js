// Simplified validation for demo
const MASTERS = {
  SUPPLY_TYPES: ['B2B', 'SEZWP', 'SEZWOP', 'EXPWP', 'EXPWOP', 'DEXP'],
  DOC_TYPES: ['INV', 'CRN', 'DBN'],
  STATE_CODES: ['29', '36', '07', '27', '96'] // Sample states
};

const helpers = {
  getFinancialYear: (dateStr) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
};

module.exports = {
  MASTERS,
  helpers
};
