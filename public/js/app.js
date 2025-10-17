// API Base URL
const API_BASE = '';

// Global function definitions
window.testEndpoint = async function(endpoint) {
    const testResult = document.getElementById('testResult');
    const resultContent = document.getElementById('resultContent');
    
    if (!testResult || !resultContent) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Show loading state
    testResult.style.display = 'block';
    resultContent.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Loading...</div></div>';
    testResult.querySelector('.card').className = 'card bg-dark border-secondary';
    
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Format the JSON response with syntax highlighting
        resultContent.textContent = JSON.stringify(data, null, 2);
        testResult.querySelector('.card').className = 'card bg-dark border-success';
        
        // Update stats if health endpoint was tested
        if (endpoint === '/health') {
            loadStats();
        }
        
        // Scroll to the result section
        testResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Error testing endpoint:', error);
        resultContent.textContent = 'Error: ' + error.message;
        testResult.querySelector('.card').className = 'card bg-dark border-danger';
        
        // Scroll to the error
        testResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

window.testSample = function(sampleId) {
    window.testEndpoint('/api/e-invoice/sample/' + sampleId);
};

window.copyResult = async function() {
    const resultContent = document.getElementById('resultContent');
    if (!resultContent) return;
    
    try {
        await navigator.clipboard.writeText(resultContent.textContent);
        
        // Show temporary feedback
        const btn = event.target;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
        btn.className = 'btn btn-sm btn-success';
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.className = 'btn btn-sm btn-outline-light';
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = resultContent.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const btn = event.target;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
        btn.className = 'btn btn-sm btn-success';
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.className = 'btn btn-sm btn-outline-light';
        }, 2000);
    }
};

window.generateInvoice = async function() {
    const count = prompt('How many invoices to generate?', '1');
    if (count) {
        const testResult = document.getElementById('testResult');
        const resultContent = document.getElementById('resultContent');
        
        if (testResult && resultContent) {
            testResult.style.display = 'block';
            resultContent.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Generating invoices...</div></div>';
            testResult.querySelector('.card').className = 'card bg-dark border-secondary';
        }
        
        try {
            const response = await fetch('/api/e-invoice/generate-dynamic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ count: parseInt(count) })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (testResult && resultContent) {
                resultContent.textContent = JSON.stringify(data, null, 2);
                testResult.querySelector('.card').className = 'card bg-dark border-success';
            }
            
            // Refresh stats and invoices
            loadStats();
            
            // Scroll to result
            testResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            if (testResult && resultContent) {
                resultContent.textContent = 'Error: ' + error.message;
                testResult.querySelector('.card').className = 'card bg-dark border-danger';
                
                // Scroll to error
                testResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
};

// Load API statistics
async function loadStats() {
    try {
        const response = await fetch('/health');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const totalInvoicesEl = document.getElementById('totalInvoices');
        const apiStatusEl = document.getElementById('apiStatus');
        
        if (totalInvoicesEl) {
            totalInvoicesEl.textContent = data.totalInvoices || '--';
        }
        
        if (apiStatusEl) {
            apiStatusEl.textContent = data.status === 'OK' ? '✅ Online' : '❌ Offline';
            apiStatusEl.className = data.status === 'OK' ? 'h2 mb-1 text-success' : 'h2 mb-1 text-danger';
        }
        
        // Load additional stats
        const statsResponse = await fetch('/api/e-invoice/stats');
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            
            if (statsData.success) {
                const totalValueEl = document.getElementById('totalValue');
                if (totalValueEl) {
                    const totalValue = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                    }).format(statsData.data.totalValue);
                    
                    totalValueEl.textContent = totalValue;
                }
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        const apiStatusEl = document.getElementById('apiStatus');
        if (apiStatusEl) {
            apiStatusEl.textContent = '❌ Offline';
            apiStatusEl.className = 'h2 mb-1 text-danger';
        }
    }
}

// Load available samples
async function loadSamples() {
    try {
        const response = await fetch('/api/e-invoice/samples');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('samplesContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            data.data.forEach(sample => {
                const totalValue = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(sample.totalValue);
                
                const card = document.createElement('div');
                card.className = 'col-md-6 col-lg-4';
                card.innerHTML = `
                    <div class="card sample-card bg-secondary border-0 h-100" onclick="testSample(${sample.id})" style="cursor: pointer;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title mb-0">Sample #${sample.id}</h5>
                                <span class="badge bg-primary">${sample.type}</span>
                            </div>
                            <p class="card-text text-muted small mb-2">${sample.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-light">${totalValue}</small>
                                <small class="text-muted">${sample.invoiceNo}</small>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading samples:', error);
    }
}

// Auto-test health on page load
window.addEventListener('load', function() {
    console.log('E-Invoice API UI loaded successfully');
    loadStats();
    loadSamples();
    
    // Auto-test health endpoint after a short delay
    setTimeout(() => {
        const testResult = document.getElementById('testResult');
        const resultContent = document.getElementById('resultContent');
        
        if (testResult && resultContent) {
            testResult.style.display = 'block';
            resultContent.innerHTML = '<div class="text-center text-muted"><i class="bi bi-info-circle me-2"></i>Click any test button to see API responses here</div>';
        }
    }, 1000);
});

// Make functions globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testEndpoint: window.testEndpoint,
        testSample: window.testSample,
        copyResult: window.copyResult,
        generateInvoice: window.generateInvoice
    };
}