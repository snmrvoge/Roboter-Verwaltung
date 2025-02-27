// API-Basis-URL für die Backend-Kommunikation
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://roboter-verwaltung-2025.ew.r.appspot.com' // Zurück zur Hauptanwendung
  : 'http://localhost:4000';
