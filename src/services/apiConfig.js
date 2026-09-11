const configuredCustomerUrl = import.meta.env.VITE_API_BASE_URL || '';
const configuredRootUrl = import.meta.env.VITE_API_ROOT_URL || '';
const defaultApiRootUrl = 'https://tailoring-shop-backend-production.up.railway.app';

export const API_BASE_URL = (
  configuredRootUrl
  || configuredCustomerUrl.replace(/\/api\/customer\/?$/, '')
  || defaultApiRootUrl
).replace(/\/+$/, '');

export const API_ROOT_URL = API_BASE_URL;

export const apiUrl = (path) => `${API_BASE_URL}/${String(path).replace(/^\/+/, '')}`;