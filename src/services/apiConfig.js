const configuredCustomerUrl = import.meta.env.VITE_API_BASE_URL || '';
const configuredRootUrl = import.meta.env.VITE_API_ROOT_URL || '';
const defaultApiRootUrl = 'https://tailoring-shop-backend-production.up.railway.app';

export const API_ROOT_URL = (
  configuredRootUrl
  || configuredCustomerUrl.replace(/\/api\/customer\/?$/, '')
  || defaultApiRootUrl
).replace(/\/+$/, '');

export const API_BASE_URL = (
  /^https?:\/\//.test(configuredCustomerUrl)
    ? configuredCustomerUrl
    : `${API_ROOT_URL}/api/customer`
).replace(/\/+$/, '');

export const apiUrl = (path) => `${API_ROOT_URL}/${String(path).replace(/^\/+/, '')}`;