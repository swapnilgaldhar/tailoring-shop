import axios from 'axios';
import { apiUrl } from './apiConfig';

const VENDER_BASE_URL = apiUrl('/api/vender');

const vendorApi = {
  getAllVendors: async () => {
    try {
      const response = await axios.get(`${VENDER_BASE_URL}/getallvender`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  getVendorById: async (id) => {
    try {
      const response = await axios.get(`${VENDER_BASE_URL}/getvenderbyid/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor by ID:', error);
      throw error;
    }
  },

  createVendor: async (vendorData) => {
    try {
      const response = await axios.post(`${VENDER_BASE_URL}/createvender`, vendorData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  updateVendor: async (id, vendorData) => {
    try {
      const response = await axios.put(`${VENDER_BASE_URL}/${id}`, vendorData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  deleteVendor: async (id) => {
    try {
      const response = await axios.delete(`${VENDER_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },
};

export default vendorApi;
