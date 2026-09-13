const DEFAULT_PRODUCTION_API_ROOT_URL = 'https://tailoring-shop-backend-production.up.railway.app';
const configuredCustomerUrl = import.meta.env.VITE_API_BASE_URL || '';
const configuredRootUrl = import.meta.env.VITE_API_ROOT_URL || (
  configuredCustomerUrl.startsWith('http')
    ? configuredCustomerUrl.replace(/\/api\/customer\/?$/, '')
    : ''
);

export const API_ROOT_URL = (
  configuredRootUrl
  || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_ROOT_URL : 'http://localhost:8091')
).replace(/\/+$/, '');

export const API_BASE_URL = (
  configuredCustomerUrl
  || `${API_ROOT_URL}/api/customer`
).replace(/\/+$/, '');

export const apiUrl = (path) => {
  // For auth routes, always use API_ROOT_URL
  if (String(path).includes('/auth')) {
    return `${API_ROOT_URL}${String(path).startsWith('/') ? '' : '/'}${String(path)}`;
  }
  return `${API_ROOT_URL}/${String(path).replace(/^\/+/, '')}`;
};