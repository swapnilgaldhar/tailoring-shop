import axios from 'axios';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api/customer';
const trimmedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = trimmedApiBaseUrl.includes('/api/customer')
  ? trimmedApiBaseUrl
  : `${trimmedApiBaseUrl}/api/customer`;

const toCustomerApiBase = (baseUrl) => {
  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  if (!cleanBase) return '/api/customer';
  return cleanBase.includes('/api/customer') ? cleanBase : `${cleanBase}/api/customer`;
};

const candidateBaseUrls = [
  toCustomerApiBase(trimmedApiBaseUrl),
  'http://localhost:8091/api/customer',
  '/api/customer',
].filter((value, index, array) => value && array.indexOf(value) === index);

const customerApis = candidateBaseUrls.map((baseURL) =>
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
);

const requestCustomerApis = async (method, path, data) => {
  let lastError = null;

  for (const client of customerApis) {
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

export const getCustomers = () => requestCustomerApis('get', '/getallcustomer');
export const getCustomerById = (id) => requestCustomerApis('get', `/getcustomer/${id}`);
export const createCustomer = (customer) => requestCustomerApis('post', '/create', customer);
export const updateCustomer = (id, customer) => requestCustomerApis('put', `/updatecustomer/${id}`, customer);
export const deleteCustomer = (id) => requestCustomerApis('delete', `/deletecustomer/${id}`);

export const getMeasurements = () => requestCustomerApis('get', '/getallmeasurements');
export const getMeasurementById = (id) => requestCustomerApis('get', `/getmeasurement/${id}`);
export const createMeasurement = (measurement) => requestCustomerApis('post', '/create', measurement);
export const updateMeasurement = (id, measurement) => requestCustomerApis('put', `/updatemeasurement/${id}`, measurement);
export const deleteMeasurement = (id) => requestCustomerApis('delete', `/deletemeasurement/${id}`);

export { API_BASE_URL };
