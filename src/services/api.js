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

const requestCustomerApis = async (method, paths, data) => {
  const requestPaths = Array.isArray(paths) ? paths : [paths];
  let lastError = null;

  for (const client of customerApis) {
    for (const path of requestPaths) {
      try {
        return await client.request({
          method,
          url: path,
          data,
        });
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
};

export const getCustomers = () => requestCustomerApis('get', ['/getallcustomer', '/getallcustomers', '/customers', '/all']);
export const getCustomerCount = () => requestCustomerApis('get', ['/getCustomerCount', '/customercount', '/count']);
export const getCustomerById = (id) => requestCustomerApis('get', [`/getcustomer/${id}`, `/customer/${id}`, `/getCustomer/${id}`, `/customers/${id}`, `/get/customer/${id}`]);
export const createCustomer = (customer) => requestCustomerApis('post', ['/create', '/createcustomer', '/customers'], customer);
export const updateCustomer = (id, customer) => requestCustomerApis('put', [`/updatecustomer/${id}`, `/customer/${id}`, `/customers/${id}`], customer);
export const deleteCustomer = (id) => requestCustomerApis('delete', [`/deletecustomer/${id}`, `/customer/${id}`, `/customers/${id}`]);

export const getMeasurements = () => requestCustomerApis('get', ['/getallmeasurements', '/getallmeasurement', '/measurements', '/allmeasurements']);
export const getMeasurementById = (id) => requestCustomerApis('get', [`/getmeasurement/${id}`, `/measurement/${id}`, `/getMeasurement/${id}`, `/get/measurement/${id}`]);
export const createMeasurement = (measurement) => requestCustomerApis('post', ['/create', '/createmeasurement', '/measurements'], measurement);
export const updateMeasurement = (id, measurement) => requestCustomerApis('put', [`/updatemeasurement/${id}`, `/measurement/${id}`, `/measurements/${id}`], measurement);
export const deleteMeasurement = (id) => requestCustomerApis('delete', [`/deletemeasurement/${id}`, `/measurement/${id}`, `/measurements/${id}`]);

export { API_BASE_URL };
