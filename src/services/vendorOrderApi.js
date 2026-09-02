import axios from 'axios';

const ORDER_API_BASE = '/api/order';

const vendorOrderApi = {
  getAllVendorOrders: async () => {
    try {
      const response = await axios.get(`${ORDER_API_BASE}/getallorders`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching all vendor orders:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to fetch vendor orders';
      throw new Error(message);
    }
  },

  getOrdersByVendorId: async (venderId) => {
    try {
      const response = await axios.get(`${ORDER_API_BASE}/getallorders/venderid/${encodeURIComponent(venderId)}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching vendor orders by vendor ID:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to fetch vendor orders for the selected vendor';
      throw new Error(message);
    }
  },

  updateRemainingAmount: async ({ orderId, amount }) => {
    try {
      const numericAmount = Number(amount);
      if (!orderId || Number.isNaN(numericAmount)) {
        throw new Error('Order ID and valid amount are required.');
      }

      const response = await axios.put(
        `${ORDER_API_BASE}/update/remainingamount/${encodeURIComponent(numericAmount)}/${encodeURIComponent(orderId)}`,
        {},
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating remaining amount:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to update remaining amount';
      throw new Error(message);
    }
  },

  updateOrderReceivedDate: async ({ orderId, orderRecivedDate }) => {
    try {
      if (!orderId || !orderRecivedDate) {
        throw new Error('Order ID and received date are required.');
      }

      const dateValue = String(orderRecivedDate).slice(0, 10);
      const response = await axios.put(
        `${ORDER_API_BASE}/update/orderreciveddate/${encodeURIComponent(orderId)}/${encodeURIComponent(dateValue)}`,
        {},
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating order received date:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to update received date';
      throw new Error(message);
    }
  },

  createVendorOrder: async (orderData) => {
    try {
      // Only include checkNumber if it has a value
      const checkNumberValue = orderData.checkNumber && String(orderData.checkNumber).trim() 
        ? String(orderData.checkNumber).trim() 
        : null;

      // Ensure received date is always set
      const receivedDate = orderData.orderReceivedDate || orderData.deliveryDate || new Date().toISOString().slice(0, 10);

      const payload = {
        invoiceNo: Number(orderData.invoiceNo),
        venderId: Number(orderData.venderId),
        vendorName: orderData.vendorName || orderData.venderName || '',
        venderName: orderData.venderName || orderData.vendorName || '',
        order: orderData.order || orderData.orderDescription || '',
        orderDescription: orderData.orderDescription || orderData.order || '',
        orderAmount: Number(orderData.orderAmount),
        paidAmount: Number(orderData.paidAmount || 0),
        remainingAmount: Number(orderData.remainingAmount || Math.max(Number(orderData.orderAmount || 0) - Number(orderData.paidAmount || 0), 0)),
        checkNumber: checkNumberValue,
        paymentMethod: orderData.paymentMethod || 'Cash',
        orderDate: orderData.orderDate || new Date().toISOString().slice(0, 10),
        orderReceivedDate: receivedDate,
        deliveryDate: receivedDate,
        updatedDate: orderData.updatedDate || new Date().toISOString().slice(0, 10),
      };

      console.log('Payload sent to backend:', payload);
      const response = await axios.post(`${ORDER_API_BASE}/createorder`, payload, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating vendor order:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to create vendor order';
      throw new Error(message);
    }
  },
};

export default vendorOrderApi;
