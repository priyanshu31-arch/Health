// =============================================================================
// ⚠️ DEPRECATED: This file is kept for backward compatibility
// Please use: import { api } from './config/api.config';
// =============================================================================

// Re-export everything from the new config file
export { api, API_BASE_URL, setAuthToken, getAuthToken } from './config/api.config.ts';

// Default export for convenience
export { default } from './config/api.config.ts';