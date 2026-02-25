/**
 * Configuración Global de la API - MotoManía
 */

// URL para Producción (Backend en Render)
export const API_BASE_URL = 'https://entregafinalmotomania.onrender.com';

// URL para Local (Descomentar para pruebas en local)
// export const API_BASE_URL = 'http://localhost:3000';

// Exponer globalmente para scripts que no son módulos (opcional pero útil)
window.API_BASE_URL = API_BASE_URL;
