import axios from 'axios';





const customerApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091';
const rawMeasurementApiBaseUrl =
  import.meta.env.VITE_MEASUREMENT_API_BASE_URL ||
  customerApiBaseUrl.replace('/api/customer', '');
const measurementApiBaseUrl = rawMeasurementApiBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: measurementApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMeasurements = () => api.get('/getallmeasurements');
export const getMeasurementById = (id) => api.get(`/getmeasurement/${id}`);

export const getShirtMeasurementById = (id) => api.get(`/measurement/get/shirt/measurement/${id}`);
export const getPantMeasurementById = (id) => api.get(`/measurement/get/pant/measurement/${id}`);

const measurementCreatePaths = [
  '/measurement/create/measurement',
  '/createmeasurement',
  '/create',
];

export const createMeasurement = async (measurement) => {
  let lastError = null;

  for (const path of measurementCreatePaths) {
    try {
      return await api.post(path, measurement);
    } catch (error) {
      lastError = error;

      if (error?.response && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const createShirtMeasurement = (measurement) =>
  api.post('/measurement/create/shirt/measurement', measurement);

export const createPantMeasurement = (measurement) =>
  api.post('/measurement/create/pant/measurement', measurement);

export const updateMeasurement = (id, measurement) => api.put(`/updatemeasurement/${id}`, measurement);
export const deleteMeasurement = (id) => api.delete(`/deletemeasurement/${id}`);