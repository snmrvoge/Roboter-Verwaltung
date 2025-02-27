// API-Basis-URL für die Backend-Kommunikation
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Leerer String für relative URLs im Produktionsmodus
  : 'http://localhost:8080';
