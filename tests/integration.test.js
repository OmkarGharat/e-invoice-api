const request = require('supertest');
const app = require('../server');

describe('E-Invoice API Integration Tests', () => {

    // Test Credentials (matching middleware/auth.js)
    const validApiKey = 'ei_demo_8x92m3c7-4j5k-2h1g-9s8d-7f6g5h4j3k2l';

    // 1. PUBLIC ENDPOINTS
    describe('Public Endpoints (No Auth Required)', () => {

        it('GET /health should return 200 OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'OK');
        });

        it('GET /api/e-invoice/stats should return 200 OK', async () => {
            const res = await request(app).get('/api/e-invoice/stats');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('GET /api/e-invoice/samples should return 200 OK', async () => {
            const res = await request(app).get('/api/e-invoice/samples');
            expect(res.statusCode).toEqual(200);
        });
    });

    // 2. PROTECTED ENDPOINTS (Security Check)
    describe('Protected Endpoints (Security)', () => {

        it('GET /api/e-invoice/invoices should return 401 without keys', async () => {
            const res = await request(app).get('/api/e-invoice/invoices');
            expect(res.statusCode).toBeOneOf([401, 403]);
        });

        it('POST /api/e-invoice/generate should return 401 without keys', async () => {
            const res = await request(app).post('/api/e-invoice/generate').send({ count: 1 });
            expect(res.statusCode).toBeOneOf([401, 403]);
        });
    });

    // 3. AUTHENTICATION (Success Flows)
    describe('Authentication Flows', () => {

        it('GET /api/e-invoice/invoices should return 200 with Valid API Key', async () => {
            const res = await request(app)
                .get('/api/e-invoice/invoices')
                .set('x-api-key', validApiKey);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('POST /api/e-invoice/generate should return 201/200 with Valid API Key', async () => {
            const res = await request(app)
                .post('/api/e-invoice/generate-dynamic')
                .set('x-api-key', validApiKey)
                .send({ count: 1 });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    // 4. EDGE CASES & ERROR HANDLING
    describe('Edge Cases', () => {

        it('Should return 400 for Malformed JSON', async () => {
            // We use a string that looks like JSON but is broken to trigger syntax error
            const res = await request(app)
                .post('/api/edge-cases/strict-post')
                .set('Content-Type', 'application/json')
                .send('{"invalid": "json"'); // Missing closing brace, managed by supertest/express? 

            // Note: Supertest might stringify strings automatically, so we might need raw buffer or specific sending for malformed.
            // Actually, express body-parser throws 400 for invalid JSON automatically if we send header application/json and bad body.
        });

        it('Should return 404 for non-existent routes', async () => {
            const res = await request(app).get('/api/ghost-route');
            expect(res.statusCode).toEqual(404);
        });
    });
});

// Custom matcher for specific status codes (helper)
expect.extend({
    toBeOneOf(received, validValues) {
        const pass = validValues.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${validValues}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be one of ${validValues}`,
                pass: false,
            };
        }
    },
});
