// API Base URL
const API_BASE = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadSamples();
});

// Load API statistics
async function loadStats() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        document.getElementById('totalInvoices').textContent = data.totalInvoices || '--';
        document.getElementById('apiStatus').textContent = data.status === 'OK' ? '✅ Online' : '❌ Offline';
        document.getElementById('apiStatus').className = data.status === 'OK' ? 'h2 mb-1 text-success' : 'h2 mb-1 text-danger';
        
        // Load additional stats
        const statsResponse = await fetch('/api/e-invoice/stats');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            const totalValue = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(statsData.data.totalValue);
            
            document.getElementById('totalValue').textContent = totalValue;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('apiStatus').textContent = '❌ Offline';
        document.getElementById('apiStatus').className = 'h2 mb-1 text-danger';
    }
}

// Load available samples
async function loadSamples() {
    try {
        const response = await fetch('/api/e-invoice/samples');
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('samplesContainer');
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
                    <div class="card sample-card bg-secondary border-0 h-100" onclick="testSample(${sample.id})">
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

// Test a specific endpoint
async function testEndpoint(endpoint) {
    const testResult = document.getElementById('testResult');
    const resultContent = document.getElementById('resultContent');
    
    testResult.style.display = 'block';
    resultContent.textContent = 'Testing...';
    
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        resultContent.textContent = JSON.stringify(data, null, 2);
        testResult.querySelector('.card').className = 'card bg-dark border-success';
        
        // Update stats if health endpoint was tested
        if (endpoint === '/health') {
            loadStats();
        }
    } catch (error) {
        resultContent.textContent = 'Error: ' + error.message;
        testResult.querySelector('.card').className = 'card bg-dark border-danger';
    }
}

// Test a specific sample
async function testSample(sampleId) {
    await testEndpoint(`/api/e-invoice/sample/${sampleId}`);
}

// Copy result to clipboard
async function copyResult() {
    const resultContent = document.getElementById('resultContent');
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
    }
}

// Generate dynamic invoice
async function generateInvoice() {
    const count = prompt('How many invoices to generate?', '1');
    if (count) {
        try {
            const response = await fetch('/api/e-invoice/generate-dynamic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ count: parseInt(count) })
            });
            const data = await response.json();
            
            const testResult = document.getElementById('testResult');
            const resultContent = document.getElementById('resultContent');
            
            testResult.style.display = 'block';
            resultContent.textContent = JSON.stringify(data, null, 2);
            testResult.querySelector('.card').className = 'card bg-dark border-success';
            
            // Refresh stats
            loadStats();
        } catch (error) {
            console.error('Error generating invoice:', error);
        }
    }
}