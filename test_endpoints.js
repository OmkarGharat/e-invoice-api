const http = require('http');

const ENDPOINTS = [
    // PUBLIC Endpoints (Should return 200)
    { path: '/health', method: 'GET', expected: 200, type: 'Public' },
    { path: '/api/e-invoice/stats', method: 'GET', expected: 200, type: 'Public' },
    { path: '/api/e-invoice/samples', method: 'GET', expected: 200, type: 'Public' },
    { path: '/api/e-invoice/filter-options', method: 'GET', expected: 200, type: 'Public' },
    { path: '/api/e-invoice/sample/1', method: 'GET', expected: 200, type: 'Public' },

    // PROTECTED Endpoints (Should return 401/403)
    { path: '/api/e-invoice/invoices', method: 'GET', expected: 401, type: 'Protected' },
    { path: '/api/e-invoice/generate', method: 'POST', expected: 401, type: 'Protected' },
    { path: '/api/e-invoice/generate-dynamic', method: 'POST', expected: 401, type: 'Protected' },
    { path: '/api/e-invoice/validate', method: 'POST', expected: 401, type: 'Protected' },
    { path: '/api/e-invoice/cancel', method: 'POST', expected: 401, type: 'Protected' }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json' // Just standard header, no AUTH
            }
        };

        const req = http.request(options, (res) => {
            const result = {
                path: endpoint.path,
                expected: endpoint.expected,
                actual: res.statusCode,
                pass: false
            };

            // Allow 403 as equivalent to 401 for protected resources
            if (endpoint.type === 'Protected') {
                if (res.statusCode === 401 || res.statusCode === 403) {
                    result.pass = true;
                }
            } else {
                if (res.statusCode === endpoint.expected) {
                    result.pass = true;
                }
            }
            resolve(result);
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve({ path: endpoint.path, expected: endpoint.expected, actual: 'ERROR', pass: false });
        });

        if (endpoint.method === 'POST') {
            req.write(JSON.stringify({ dummy: 'data' }));
        }
        req.end();
    });
}

async function runTests() {
    console.log("🚀 Testing Endpoint Security (No Auth Headers)\n");
    console.log("--------------------------------------------------------------------------------");
    console.log(String("ENDPOINT").padEnd(35) + String("TYPE").padEnd(12) + String("STATUS").padEnd(10) + "RESULT");
    console.log("--------------------------------------------------------------------------------");

    for (const endpoint of ENDPOINTS) {
        const res = await testEndpoint(endpoint);
        const statusColor = res.pass ? "✅ PASS" : "❌ FAIL";
        console.log(
            String(res.method + " " + res.path).padEnd(35) +
            String(endpoint.type).padEnd(12) +
            String(res.actual).padEnd(10) +
            statusColor
        );
    }
    console.log("--------------------------------------------------------------------------------");
}

runTests();
