import axios from 'axios';

const customerApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091';
const defaultRootBaseUrl = String(customerApiBaseUrl).replace('/api/customer', '');
const rawBillingApiBaseUrl = import.meta.env.VITE_BILLING_API_BASE_URL || defaultRootBaseUrl;
const trimmedBillingApiBaseUrl = rawBillingApiBaseUrl.replace(/\/+$/, '');

const toApiBase = (baseUrl) => {
  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  if (!cleanBase) return '/api';
  return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
};

const candidateBaseUrls = [
  toApiBase(trimmedBillingApiBaseUrl),
  'http://localhost:8091/api',
  'http://localhost:8091',
  '/api',
].filter((value, index, array) => value && array.indexOf(value) === index);

const billingApis = candidateBaseUrls.map((baseURL) =>
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
);

const requestWithFallback = async (method, paths, data) => {
  let lastError = null;
  const pathList = Array.isArray(paths) ? paths : [paths];

  for (const client of billingApis) {
    for (const path of pathList) {
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
  }

  throw lastError;
};

export const createBill = (payload) =>
  requestWithFallback('post', [
    '/bill/create',
    '/billing/create',
    '/bills/create',
    '/createbill',
    '/bill/createbill',
  ], payload);

export const getBills = () =>
  requestWithFallback('get', [
    '/bill/getall',
    '/billing/getall',
    '/bills/getall',
    '/getallbills',
  ]);

export const getBillById = (id) =>
  requestWithFallback('get', [
    `/bill/getbill/${id}`,
    `/billing/getbill/${id}`,
    `/bills/${id}`,
    `/getbill/${id}`,
  ]);

export const getBillsByCustomerId = (customerId) =>
  requestWithFallback('get', [
    `/bill/customer/${customerId}`,
    `/billing/customer/${customerId}`,
    `/bills/customer/${customerId}`,
    `/getbillsbycustomer/${customerId}`,
  ]);
