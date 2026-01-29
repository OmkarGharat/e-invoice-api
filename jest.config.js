const path = require('path');

module.exports = {
    testEnvironment: 'node',
    reporters: [
        "default",
        ["jest-html-reporter", {
            "pageTitle": "E-Invoice API Test Report",
            "outputPath": path.join(process.cwd(), "test-report.html"),
            "includeFailureMsg": true,
            "includeSuiteFailure": true
        }]
    ]
};
