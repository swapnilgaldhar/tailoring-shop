const configuredCustomerUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api/customer';

export const API_ROOT_URL = (
  import.meta.env.VITE_API_ROOT_URL
  || configuredCustomerUrl.replace(/\/api\/customer\/?$/, '')
).replace(/\/+$/, '');

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  || `${API_ROOT_URL}/api/customer`
).replace(/\/+$/, '');

export const apiUrl = (path) => {
  // For auth routes, always use API_ROOT_URL
  if (String(path).includes('/auth')) {
    return `${API_ROOT_URL}${String(path).startsWith('/') ? '' : '/'}${String(path)}`;
  }
  return `${API_ROOT_URL}/${String(path).replace(/^\/+/, '')}`;
};