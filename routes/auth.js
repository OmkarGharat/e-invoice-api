const express = require('express');
const router = express.Router();
const { authMiddleware, CONSTANTS } = require('../middleware/auth');

// ==================== AUTHENTICATION PROVIDER ENDPOINTS ====================

// 1. Get API Key Information
router.get('/credentials', (req, res) => {
    res.json({
        success: true,
        message: "Use these credentials to test authentication",
        credentials: {
            apiKey: CONSTANTS.VALID_API_KEY,
            basicAuth: {
                username: CONSTANTS.VALID_USERNAME,
                password: CONSTANTS.VALID_PASSWORD
            },
            bearerToken: CONSTANTS.VALID_BEARER_TOKEN
        }
    });
});

// 2. Login (for Bearer/OAuth flow)
router.post('/login', (req, res) => {
    const { username, password, grant_type } = req.body;

    // Simple mock login
    if (username === CONSTANTS.VALID_USERNAME && password === CONSTANTS.VALID_PASSWORD) {

        let token = CONSTANTS.VALID_BEARER_TOKEN;
        let type = "Bearer";
        let expiresIn = 3600;

        if (grant_type === 'client_credentials' || grant_type === 'authorization_code') {
            token = "oauth-" + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
            type = "OAuth 2.0";
        }

        res.json({
            success: true,
            access_token: token,
            token_type: "Bearer",
            expires_in: expiresIn,
            scope: "read write"
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }
});

// ==================== PROTECTED ROUTES (TESTING GROUND) ====================

// Test API Key
router.get('/test/api-key', authMiddleware.apiKey, (req, res) => {
    res.json({
        success: true,
        message: "You have successfully accessed the API Key protected endpoint!",
        authData: req.auth
    });
});

// Test Basic Auth
router.get('/test/basic', authMiddleware.basicAuth, (req, res) => {
    res.json({
        success: true,
        message: "You have successfully accessed the Basic Auth protected endpoint!",
        authData: req.auth
    });
});

// Test Bearer Token
router.get('/test/bearer', authMiddleware.bearerToken, (req, res) => {
    res.json({
        success: true,
        message: "You have successfully accessed the Bearer Token protected endpoint!",
        authData: req.auth
    });
});

// Test OAuth 2.0
router.get('/test/oauth', authMiddleware.oauth2, (req, res) => {
    res.json({
        success: true,
        message: "You have successfully accessed the OAuth 2.0 protected endpoint!",
        authData: req.auth
    });
});

// 3. Session Login (Sets Cookie)
router.post('/session-login', (req, res) => {
    const { username, password } = req.body;
    if (username === CONSTANTS.VALID_USERNAME && password === CONSTANTS.VALID_PASSWORD) {
        // Set JSESSIONID cookie
        res.setHeader('Set-Cookie', 'JSESSIONID=valid-session-id-123; Path=/; HttpOnly');
        res.json({
            success: true,
            message: "Session login successful",
            sessionId: "valid-session-id-123"
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Test Session Auth (Dashboard)
router.get('/test/session', authMiddleware.sessionAuth, (req, res) => {
    res.json({
        success: true,
        message: "You have successfully accessed the Session protected dashboard!",
        user: CONSTANTS.VALID_USERNAME
    });
});

module.exports = router;
