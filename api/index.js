// api/index.js
// Vercel Serverless Function Entry Point

// Import the fully configured app from server.js
// This ensures that all middleware (Auth, Security, logging) logic is identical to localhost.
const app = require('../server');

module.exports = app;