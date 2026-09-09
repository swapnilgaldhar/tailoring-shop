import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import vendorOrderApi from '../../services/vendorOrderApi';

const VendorOrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogState, setDialogState] = useState({
    open: false,
    type: null,
    order: null,
  });
  const [formData, setFormData] = useState({
    orderId: '',
    paidAmount: '',
    receivedDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await vendorOrderApi.getAllVendorOrders();
      const normalized = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.orders)
            ? response.orders
            : Array.isArray(response?.result)
              ? response.result
              : [];

      setOrders(normalized);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0';
  };

  const getDisplayDate = (value) => {
    if (!value) return '-';
    const dateValue = typeof value === 'string' ? value : value?.toString?.();
    if (!dateValue) return '-';
    return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
  };

  const getOrderReceivedDateValue = (order) => {
    const receivedDate = order?.orderRecivedDate
      ?? order?.orderReceivedDate
      ?? order?.orderRecievedDate
      ?? order?.deliveryDate
      ?? order?.receivedDate
      ?? order?.deliveredDate
      ?? order?.orderreciveddate
      ?? order?.recivedDate
      ?? order?.orderReciveDate
      ?? '';

    return getDisplayDate(receivedDate);
  };

  const getVendorIdValue = (order) => {
    const vendorId = order?.venderId
      ?? order?.vendorId
      ?? order?.venderid
      ?? order?.vendorID
      ?? order?.supplierId
      ?? order?.supplierID
      ?? order?.id
      ?? '-';

    return vendorId ?? '-';
  };

  const getOrderIdentifier = (order) => order?.orderId ?? order?.id ?? order?.orderID ?? order?.invoiceNo ?? '';

  const openDialog = (type, order) => {
    const orderId = getOrderIdentifier(order);
    setDialogState({ open: true, type, order });
    setFormData({
      orderId: String(orderId),
      paidAmount: '',
      receivedDate: getOrderReceivedDateValue(order).includes('-') ? getOrderReceivedDateValue(order) : '',
    });
    setDialogError('');
  };

  const closeDialog = () => {
    setDialogState({ open: false, type: null, order: null });
    setFormData({ orderId: '', paidAmount: '', receivedDate: '' });
    setDialogError('');
  };

  const handleSubmitAmountUpdate = async () => {
    const amount = Number(formData.paidAmount);
    const orderId = formData.orderId || getOrderIdentifier(dialogState.order);

    if (!orderId) {
      setDialogError('Order ID is required.');
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setDialogError('Enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      setDialogError('');
      await vendorOrderApi.updateRemainingAmount({ orderId, amount });
      await loadOrders();
      closeDialog();
    } catch (err) {
      setDialogError(err?.message || 'Failed to update remaining amount.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDateUpdate = async () => {
    const orderId = formData.orderId || getOrderIdentifier(dialogState.order);
    const receivedDate = formData.receivedDate;

    if (!orderId) {
      setDialogError('Order ID is required.');
      return;
    }

    if (!receivedDate) {
      setDialogError('Please choose a received date.');
      return;
    }

    try {
      setSubmitting(true);
      setDialogError('');
      await vendorOrderApi.updateOrderReceivedDate({
        orderId,
        orderRecivedDate: receivedDate,
      });
      await loadOrders();
      closeDialog();
    } catch (err) {
      setDialogError(err?.message || 'Failed to update received date.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && (
        <Box sx={{ p: 1.5, bgcolor: '#fee2e2', borderRadius: 1 }}>
          <Typography sx={{ color: '#dc2626' }}>{error}</Typography>
        </Box>
      )}

      <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2 }}>
        {orders.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748b' }}>No orders found</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc', borderBottom: '2px solid #e7edf5' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Invoice No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Vendor ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Vendor Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Order</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#172033' }}>Order Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#172033' }}>Paid Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#172033' }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Check No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Order Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Order Received Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={getOrderIdentifier(order) || `${order.invoiceNo ?? 'inv'}-${index}`} sx={{ borderBottom: '1px solid #e7edf5' }}>
                    <TableCell>{order.invoiceNo ?? '-'}</TableCell>
                    <TableCell>{getVendorIdValue(order)}</TableCell>
                    <TableCell>{order.vendorName ?? order.venderName ?? order.vendername ?? '-'}</TableCell>
                    <TableCell>{order.orderDescription ?? order.order ?? order.Order ?? '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(order.orderAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.paidAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.remainingAmount)}</TableCell>
                    <TableCell>{order.checkNumber ?? order.checknumber ?? '-'}</TableCell>
                    <TableCell>{order.paymentMethod ?? order.paymentmethod ?? '-'}</TableCell>
                    <TableCell>{getDisplayDate(order.orderDate ?? order.orderdate ?? '-')}</TableCell>
                    <TableCell>{getOrderReceivedDateValue(order)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => openDialog('amount', order)}>
                          Update Amount
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => openDialog('date', order)}>
                          Update Received Date
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogState.open} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          {dialogState.type === 'amount' ? 'Update Remaining Amount' : 'Update Received Date'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Order ID"
              value={formData.orderId}
              InputProps={{ readOnly: true }}
              fullWidth
            />

            {dialogState.type === 'amount' ? (
              <TextField
                label="Newly Paid Amount"
                type="number"
                value={formData.paidAmount}
                onChange={(event) => setFormData((prev) => ({ ...prev, paidAmount: event.target.value }))}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            ) : (
              <TextField
                label="Received Date"
                type="date"
                value={formData.receivedDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, receivedDate: event.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}

            {dialogError && (
              <Typography sx={{ color: '#dc2626', fontSize: 14 }}>{dialogError}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={dialogState.type === 'amount' ? handleSubmitAmountUpdate : handleSubmitDateUpdate}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorOrderTable;
