const { defineConfig } = require('cypress');

const isProd = process.env.CYPRESS_ENV === 'prod';

module.exports = defineConfig({
  e2e: {
    baseUrl: isProd
      ? 'https://OpsDental-dental.vercel.app'
      : (process.env.CYPRESS_BASE_URL || 'http://localhost:3000'),
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    // 30s — necesario para cold starts de Railway en producción
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 60000,
    requestTimeout: 30000,
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
  env: {
    API_URL: isProd
      ? 'https://OpsDental-backend-production-7474.up.railway.app/api'
      : (process.env.CYPRESS_API_URL || 'http://localhost:8000/api'),
  },
});

