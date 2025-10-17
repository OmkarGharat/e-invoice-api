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
            
            // Refresh stats and invoices
            loadStats();
        } catch (error) {
            console.error('Error generating invoice:', error);
            const testResult = document.getElementById('testResult');
            const resultContent = document.getElementById('resultContent');
            
            testResult.style.display = 'block';
            resultContent.textContent = 'Error: ' + error.message;
            testResult.querySelector('.card').className = 'card bg-dark border-danger';
        }
    }
}