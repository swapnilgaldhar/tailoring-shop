import axios from "axios";
import { API_ROOT_URL } from './apiConfig';

const rawBaseUrl = import.meta.env.VITE_STITCHING_API_BASE_URL || API_ROOT_URL;
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

const stitchingOrderApi = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export const getAllStitchingOrders = async () => {
  try {
    const response = await stitchingOrderApi.get("/stichingorder/get/allorders");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch stitching orders"));
  }
};

export const getStitchingOrderDetails = async (billNo) => {
  const normalizedBillNo = String(billNo || "").trim();
  if (!normalizedBillNo) {
    throw new Error("Bill number is required.");
  }

  try {
    const response = await stitchingOrderApi.get(`/stichingorder/getdetails/${encodeURIComponent(normalizedBillNo)}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch bill details"));
  }
};

export const updateStitchingOrderStage = async (billNo, currentStage) => {
  const normalizedBillNo = String(billNo || "").trim();
  const normalizedStage = String(currentStage || "").trim();
  if (!normalizedBillNo || normalizedBillNo === "-" || !normalizedStage) {
    throw new Error("Bill number and stage are required.");
  }

  try {
    const response = await stitchingOrderApi.put(
      `/stichingorder/update/currentStage/${encodeURIComponent(normalizedBillNo)}/${encodeURIComponent(normalizedStage)}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update stitching order stage"));
  }
};

export const createStitchingOrder = async (order) => {
  const customerName = String(order.customerName || "").trim();
  const garmentType = String(order.garmentType || "").trim();
  const expectedDelivery = order.expectedDelivery || order.deliveryDate;

  if (!customerName || !garmentType || !expectedDelivery) {
    throw new Error("Customer name, garment type, and expected delivery are required.");
  }

  const payload = {
    srNo: order.srNo ? Number(order.srNo) : undefined,
    stOrderId: order.stOrderId || undefined,
    billNo: Number(order.billNo || 0),
    orderDate: order.orderDate || new Date().toISOString().slice(0, 10),
    customerId: String(order.customerId || "").trim(),
    customerName,
    garmentType,
    quantity: Number(order.quantity || 1),
    currentStage: "Order Received",
    deliveryDate: expectedDelivery,
    notes: String(order.notes || "").trim(),
    productionNotes: String(order.notes || "").trim(),
    productionNoted: String(order.notes || "").trim(),
  };

  try {
    const response = await stitchingOrderApi.post("/stichingorder/create/stiorder", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create stitching order"));
  }
};
