// API-Basis-URL für die Backend-Kommunikation
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://test-api-dot-roboter-verwaltung-2025.ew.r.appspot.com' // Test-API-URL im Produktionsmodus
  : 'http://localhost:4000';
