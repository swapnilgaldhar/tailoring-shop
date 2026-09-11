import axios from 'axios';
import { API_ROOT_URL } from './apiConfig';

const rawBillingApiBaseUrl = import.meta.env.VITE_BILLING_API_BASE_URL || API_ROOT_URL;
const trimmedBillingApiBaseUrl = rawBillingApiBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const toApiBase = (baseUrl) => {
  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  if (!cleanBase) return '/api';
  return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
};

const candidateBaseUrls = [
  toApiBase(trimmedBillingApiBaseUrl),
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

export const createBill = (payload) => requestWithFallback('post', '/billing/createbill', payload);

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
    `/billing/getallbills/${encodeURIComponent(customerId)}`,
    `/bill/customer/${customerId}`,
    `/billing/customer/${customerId}`,
    `/bills/customer/${customerId}`,
    `/getbillsbycustomer/${customerId}`,
  ]);

export const getTodaysSales = () => requestWithFallback('get', ['/report/todays/sales', '/report/today/sales']);

export const getMonthlySales = () => requestWithFallback('get', ['/report/monthly/sales', '/report/month/sales']);

export const getTodaysDelivery = () =>
  requestWithFallback('get', [
    '/report/todays/delivery',
    '/report/today/delivery',
    '/delivery/today',
  ]);

export const getTodaysCollection = () => requestWithFallback('get', ['/report/todays/collection', '/report/today/collection']);

export const getCustomersWithBalanceCount = () => requestWithFallback('get', '/report/customers/withbalance');

export const getDeliveryByDate = (date) =>
  requestWithFallback('get', [
    `/report/delivery/${date}`,
    `/delivery/${date}`,
  ]);

export const updateDeliveryStatus = (billNumber, status) =>
  requestWithFallback(
    'put',
    `/billing/updateDeliveryStatus/${encodeURIComponent(billNumber)}/${encodeURIComponent(status)}`,
  );
