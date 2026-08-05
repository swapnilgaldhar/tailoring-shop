import axios from 'axios';

const customerApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091';
const defaultRootBaseUrl = customerApiBaseUrl.replace('/api/customer', '');
const rawEmployeeApiBaseUrl = import.meta.env.VITE_EMPLOYEE_API_BASE_URL || defaultRootBaseUrl;
const trimmedEmployeeApiBaseUrl = rawEmployeeApiBaseUrl.replace(/\/+$/, '');

const toApiBase = (baseUrl) => {
  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  if (!cleanBase) return '/api';
  return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
};

const candidateBaseUrls = [
  toApiBase(trimmedEmployeeApiBaseUrl),
  'http://localhost:8091/api',
  '/api',
].filter((value, index, array) => value && array.indexOf(value) === index);

const employeeApis = candidateBaseUrls.map((baseURL) =>
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
);

const requestEmployeeApis = async (method, path, data) => {
  let lastError = null;

  for (const client of employeeApis) {
    try {
      return await client.request({
        method,
        url: path,
        data,
      });
    } catch (error) {
      lastError = error;
      if (error?.response && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const createEmployee = (payload) =>
  requestEmployeeApis('post', '/employee/createemployee', payload);

export const getAllEmployee = () =>
  requestEmployeeApis('get', '/employee/getAllEmployee');

export const createKaragir = (payload) =>
  requestEmployeeApis('post', '/karagir/createkaragir', payload);

export const getAllKaragir = () =>
  requestEmployeeApis('get', '/karagir/getallkaragir');
