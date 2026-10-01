export const LIGHTWELL_API_BASE = '/api/staging-lightwell';
export const CS_API_BASE = '/api/content-sources/v1';

// Set to true to call content-sources instead of lightwell-experience
export const USE_CS = true;

export const API_BASE = USE_CS ? CS_API_BASE : LIGHTWELL_API_BASE;
