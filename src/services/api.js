import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const candidateBaseUrls = [
  API_BASE_URL,
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
export const getCustomersWithBalance = () => requestCustomerApis('get', ['/getcustomer/withbalance', '/getCustomer/withbalance', '/customers/withbalance']);
export const getCustomersWithDeliveryDate = (date) =>
  requestCustomerApis('get', [`/getCustomerwithdeliverydate/${encodeURIComponent(date)}`]);
export const getCustomerCount = () => requestCustomerApis('get', ['/getCustomerCount', '/customercount', '/count']);
export const getCustomerById = (id) => requestCustomerApis('get', [`/getcustomer/${id}`, `/customer/${id}`, `/getCustomer/${id}`, `/customers/${id}`, `/get/customer/${id}`]);
export const getCustomerByMobileNo = (mobileNumber) =>
  requestCustomerApis('get', [
    `/getcustomer/withmobileno/${mobileNumber}`,
    `/getCustomer/withmobileno/${mobileNumber}`,
    `/customer/withmobileno/${mobileNumber}`,
    `/customers/withmobileno/${mobileNumber}`,
  ]);
export const createCustomer = (customer) => requestCustomerApis('post', ['/create', '/createcustomer', '/customers'], customer);
export const updateCustomer = (id, customer) => requestCustomerApis('put', [`/updatecustomer/${id}`, `/customer/${id}`, `/customers/${id}`], customer);
export const updateCustomerBalence = (id, amount) =>
  requestCustomerApis('put', [
    `/update/balence/${id}/${amount}`,
    `/update/balance/${id}/${amount}`,
  ]);
export const deleteCustomer = (id) => requestCustomerApis('delete', [`/deletecustomer/${id}`, `/customer/${id}`, `/customers/${id}`]);

export const getMeasurements = () => requestCustomerApis('get', ['/getallmeasurements', '/getallmeasurement', '/measurements', '/allmeasurements']);
export const getMeasurementById = (id) => requestCustomerApis('get', [`/getmeasurement/${id}`, `/measurement/${id}`, `/getMeasurement/${id}`, `/get/measurement/${id}`]);
export const createMeasurement = (measurement) => requestCustomerApis('post', ['/create', '/createmeasurement', '/measurements'], measurement);
export const updateMeasurement = (id, measurement) => requestCustomerApis('put', [`/updatemeasurement/${id}`, `/measurement/${id}`, `/measurements/${id}`], measurement);
export const deleteMeasurement = (id) => requestCustomerApis('delete', [`/deletemeasurement/${id}`, `/measurement/${id}`, `/measurements/${id}`]);

