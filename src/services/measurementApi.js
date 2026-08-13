import axios from 'axios';





const customerApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091';
const rawMeasurementApiBaseUrl =
  import.meta.env.VITE_MEASUREMENT_API_BASE_URL ||
  customerApiBaseUrl.replace('/api/customer', '');
const measurementApiBaseUrl = rawMeasurementApiBaseUrl.replace(/\/+$/, '');

const toHostRoot = (baseUrl) => {
  const clean = (baseUrl || '').replace(/\/+$/, '');
  if (!clean) return '';
  return clean.replace(/\/api(?:\/customer)?$/, '');
};

const measurementBaseCandidates = [
  measurementApiBaseUrl,
  toHostRoot(measurementApiBaseUrl),
  toHostRoot(customerApiBaseUrl),
  'http://localhost:8091',
  '/api',
].filter((value, index, array) => value && array.indexOf(value) === index);

const measurementApis = measurementBaseCandidates.map((baseURL) =>
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
);

const requestMeasurementPaths = async (method, paths, data) => {
  const requestPaths = Array.isArray(paths) ? paths : [paths];
  let lastError = null;

  for (const client of measurementApis) {
    for (const path of requestPaths) {
      try {
        const response = await client.request({
          method,
          url: path,
          data,
        });

        // Ignore accidental SPA HTML fallback responses from wrong base/path combos.
        if (typeof response?.data === 'string') {
          const body = response.data.trim().toLowerCase();
          if (body.startsWith('<!doctype html') || body.startsWith('<html')) {
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
};

export const getMeasurements = () =>
  requestMeasurementPaths('get', [
    '/getallmeasurements',
    '/measurement/getallmeasurements',
    '/get/all/measurements',
  ]);
export const getMeasurementById = (id) =>
  requestMeasurementPaths('get', [
    `/measurement/get/measurement/${id}`,
    `/getmeasurement/${id}`,
    `/get/measurement/${id}`,
    `/measurement/${id}`,
  ]);

export const getShirtMeasurementById = (id) =>
  requestMeasurementPaths('get', [
    `/measurement/get/shirt/measurement/${id}`,
    `/get/shirt/measurement/${id}`,
    `/shirt/measurement/${id}`,
    `/get/shirt/${id}`,
  ]);

export const getPantMeasurementById = (id) =>
  requestMeasurementPaths('get', [
    `/measurement/get/pant/measurement/${id}`,
    `/get/pant/measurement/${id}`,
    `/pant/measurement/${id}`,
    `/get/pant/${id}`,
  ]);

const measurementCreatePaths = [
  '/measurement/create/measurement',
  '/createmeasurement',
  '/create',
  '/create/measurement',
];

export const createMeasurement = async (measurement) => {
  return requestMeasurementPaths('post', measurementCreatePaths, measurement);
};

export const createShirtMeasurement = (measurement) =>
  requestMeasurementPaths('post', [
    '/measurement/create/shirt/measurement',
    '/create/shirt/measurement',
    '/shirt/measurement/create',
  ], measurement);

export const createPantMeasurement = (measurement) =>
  requestMeasurementPaths('post', [
    '/measurement/create/pant/measurement',
    '/create/pant/measurement',
    '/pant/measurement/create',
  ], measurement);

export const updateMeasurement = (id, measurement) =>
  requestMeasurementPaths('put', [
    `/updatemeasurement/${id}`,
    `/measurement/update/${id}`,
  ], measurement);

export const deleteMeasurement = (id) =>
  requestMeasurementPaths('delete', [
    `/deletemeasurement/${id}`,
    `/measurement/delete/${id}`,
  ]);