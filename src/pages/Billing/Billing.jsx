import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
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
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import { getCustomerById } from '../../services/api';
import { createBill } from '../../services/billingApi';

const ITEM_OPTIONS = [
  'Suiting',
  'Shirting',
  'Pant Stitching',
  'Shirt Stitching',
  'Blazer',
  'Alteration',
  'Other',
];

const PAYMENT_TYPES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'];

const createEmptyItem = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  item: 'Suiting',
  description: '',
  qty: '1',
  unit: 'mtr',
  price: '0',
});

const createInitialBillMeta = () => ({
  billId: `BILL-${dayjs().format('YYYY')}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
  billDate: dayjs().format('YYYY-MM-DD'),
  dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
  paymentType: 'Cash',
  paymentStatus: 'Paid',
  discount: '0',
  notes: '',
});

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCustomer = (customer = {}) => ({
  id: customer.id ?? customer.customerId ?? customer.custId ?? '',
  name: customer.name ?? customer.customerName ?? customer.custName ?? '',
  mobileNumber:
    customer.mobileNumber ??
    customer.custMobileNumber ??
    customer.phone ??
    customer.mobile ??
    '',
  address: customer.address ?? customer.custAddress ?? customer.customerAddress ?? '',
});

const Billing = () => {
  const printRef = useRef(null);
  const [customerLookupId, setCustomerLookupId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(true);
  const [billMeta, setBillMeta] = useState(createInitialBillMeta);
  const [items, setItems] = useState([createEmptyItem()]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const lineTotals = useMemo(
    () =>
      items.map((row) => ({
        ...row,
        total: toNumber(row.qty) * toNumber(row.price),
      })),
    [items],
  );

  const subTotal = useMemo(
    () => lineTotals.reduce((sum, row) => sum + row.total, 0),
    [lineTotals],
  );

  const discountAmount = Math.min(toNumber(billMeta.discount), subTotal);
  const totalAmount = Math.max(subTotal - discountAmount, 0);

  const handleBillMetaChange = (field) => (event) => {
    setBillMeta((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleItemChange = (id, field) => (event) => {
    const value = event.target.value;
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const loadCustomer = async () => {
    const searchId = customerLookupId.trim();
    if (!searchId) {
      setFeedback({ type: 'error', message: 'Enter a customer ID to load customer details.' });
      return;
    }

    setLoadingCustomer(true);
    try {
      const response = await getCustomerById(searchId);
      const loadedCustomer = normalizeCustomer(response?.data);

      if (!loadedCustomer.id && !loadedCustomer.name) {
        setCustomer(null);
        setFeedback({ type: 'error', message: 'No customer found for that ID.' });
        return;
      }

      setCustomer(loadedCustomer);
      setIsEditingCustomer(false);
      setFeedback({ type: 'success', message: 'Customer loaded successfully.' });
    } catch (error) {
      setCustomer(null);
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to load customer for billing.',
      });
    } finally {
      setLoadingCustomer(false);
    }
  };

  const buildBillPayload = () => {
    const billItems = lineTotals.map((row, index) => ({
      srNo: index + 1,
      item: row.item,
      itemName: row.item,
      description: row.description,
      qty: toNumber(row.qty),
      quantity: toNumber(row.qty),
      unit: row.unit,
      price: toNumber(row.price),
      unitPrice: toNumber(row.price),
      total: row.total,
      lineTotal: row.total,
    }));

    return {
      billId: billMeta.billId,
      billDate: billMeta.billDate,
      dueDate: billMeta.dueDate,
      paymentType: billMeta.paymentType,
      paymentStatus: billMeta.paymentStatus,
      discount: discountAmount,
      subTotal,
      totalAmount,
      notes: billMeta.notes,
      customerId: customer?.id,
      custId: customer?.id,
      customerName: customer?.name,
      customerMobile: customer?.mobileNumber,
      customerAddress: customer?.address,
      customer: customer
        ? {
            id: customer.id,
            customerId: customer.id,
            name: customer.name,
            customerName: customer.name,
            mobileNumber: customer.mobileNumber,
            address: customer.address,
          }
        : undefined,
      items: billItems,
      billItems,
    };
  };

  const openPrintWindow = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setFeedback({
        type: 'warning',
        message: 'Bill saved, but popup was blocked. Allow popups to print.',
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${billMeta.billId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            h1, h2, h3, p { margin: 0 0 8px; }
            .muted { color: #64748b; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; }
            .totals { width: 280px; margin-left: auto; margin-top: 12px; }
            .totals div { display: flex; justify-content: space-between; margin: 6px 0; }
            .grand { font-weight: 700; font-size: 16px; color: #1d4ed8; }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGenerateBill = async () => {
    if (!customer?.id) {
      setFeedback({ type: 'error', message: 'Load a customer by ID before generating the bill.' });
      return;
    }

    if (!items.some((row) => row.item && toNumber(row.qty) > 0 && toNumber(row.price) >= 0)) {
      setFeedback({ type: 'error', message: 'Add at least one valid bill item.' });
      return;
    }

    setSaving(true);
    try {
      const payload = buildBillPayload();
      await createBill(payload);
      setFeedback({
        type: 'success',
        message: `Bill ${billMeta.billId} saved for customer ${customer.id} and ready to print.`,
      });
      openPrintWindow();
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to save bill. Please verify billing API endpoint is available.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!customer?.id) {
      setFeedback({ type: 'error', message: 'Load a customer by ID before saving draft.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...buildBillPayload(),
        paymentStatus: billMeta.paymentStatus || 'Pending',
        draft: true,
      };
      await createBill(payload);
      setFeedback({
        type: 'success',
        message: `Draft bill ${billMeta.billId} saved for customer ${customer.id}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to save draft bill.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 3,
        width: '100%',
        bgcolor: '#f4f7fb',
        backgroundImage: 'radial-gradient(circle at 10% 10%, #e9f2ff 0%, transparent 40%)',
        minHeight: '100%',
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Billing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage customer bills
        </Typography>
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #dbe6f5',
              bgcolor: 'white',
              background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              height: '100%',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PeopleIcon sx={{ color: '#2563eb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                  Customer Information
                </Typography>
              </Stack>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setIsEditingCustomer(true)}
              >
                Change Customer
              </Button>
            </Stack>

            {isEditingCustomer || !customer ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <TextField
                  size="small"
                  label="Customer ID"
                  value={customerLookupId}
                  onChange={(event) => setCustomerLookupId(event.target.value)}
                  sx={{ minWidth: 220 }}
                />
                <Button variant="contained" onClick={loadCustomer} disabled={loadingCustomer}>
                  {loadingCustomer ? 'Loading...' : 'Load Customer'}
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#e7f0ff',
                    color: '#2563eb',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    border: '1px solid #cfe0ff',
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Stack spacing={1.2} sx={{ width: '100%' }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Typography sx={{ width: 140, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                      Customer ID
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                      {customer.id || '-'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Typography sx={{ width: 140, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                      Customer Name
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                      {customer.name || '-'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Typography sx={{ width: 140, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                      Mobile Number
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                      {customer.mobileNumber || '-'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Typography sx={{ width: 140, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                      Address
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                      {customer.address || '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #dbe6f5',
              bgcolor: 'white',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <ReceiptLongIcon sx={{ color: '#2563eb' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                Bill Details
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Bill ID"
                value={billMeta.billId}
                onChange={handleBillMetaChange('billId')}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label="Bill Date"
                value={billMeta.billDate}
                onChange={handleBillMetaChange('billDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label="Due Date"
                value={billMeta.dueDate}
                onChange={handleBillMetaChange('dueDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                size="small"
                label="Payment Type"
                value={billMeta.paymentType}
                onChange={handleBillMetaChange('paymentType')}
                fullWidth
              >
                {PAYMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Payment Status"
                value={billMeta.paymentStatus}
                onChange={handleBillMetaChange('paymentStatus')}
                fullWidth
              >
                {PAYMENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <Chip
                size="small"
                label={billMeta.paymentStatus}
                color={
                  billMeta.paymentStatus === 'Paid'
                    ? 'success'
                    : billMeta.paymentStatus === 'Pending'
                      ? 'warning'
                      : 'info'
                }
                sx={{ alignSelf: 'flex-start', fontWeight: 700, px: 0.5 }}
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #dbe6f5',
              bgcolor: 'white',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartIcon sx={{ color: '#2563eb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                  Bill Items
                </Typography>
              </Stack>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#eef5ff' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddItem}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            boxShadow: 'none',
                            bgcolor: '#1d4ed8',
                          }}
                        >
                          Add Item
                        </Button>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                          Action
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineTotals.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <TextField
                          select
                          size="small"
                          value={row.item}
                          onChange={handleItemChange(row.id, 'item')}
                          fullWidth
                        >
                          {ITEM_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <TextField
                          size="small"
                          value={row.description}
                          onChange={handleItemChange(row.id, 'description')}
                          placeholder="Item description"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.qty}
                            onChange={handleItemChange(row.id, 'qty')}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 90 }}
                          />
                          <TextField
                            size="small"
                            value={row.unit}
                            onChange={handleItemChange(row.id, 'unit')}
                            sx={{ width: 70 }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.price}
                          onChange={handleItemChange(row.id, 'price')}
                          inputProps={{ min: 0, step: 0.01 }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(row.total)}</TableCell>
                      <TableCell align="center">
                        <Button
                          color="error"
                          size="small"
                          onClick={() => handleRemoveItem(row.id)}
                          aria-label="Remove item"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack spacing={1} sx={{ mt: 2.5, maxWidth: 320, ml: 'auto' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Sub Total</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(subTotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography color="text.secondary">Discount</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={billMeta.discount}
                  onChange={handleBillMetaChange('discount')}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: 120 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 800 }}>Total Amount (₹)</Typography>
                <Typography sx={{ fontWeight: 800, color: '#2563eb', fontSize: 20 }}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #dbe6f5',
              bgcolor: 'white',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                Notes
              </Typography>
            </Stack>
            <TextField
              multiline
              minRows={3}
              fullWidth
              placeholder="Enter any additional notes here..."
              value={billMeta.notes}
              onChange={handleBillMetaChange('notes')}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Thank you for your business!
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #dbe6f5',
              background: 'linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)',
              boxShadow: '0 10px 26px rgba(37, 99, 235, 0.12)',
              height: '100%',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                Billing Actions
              </Typography>
              <Button
                variant="contained"
                startIcon={<ReceiptLongIcon />}
                onClick={handleGenerateBill}
                disabled={saving}
                sx={{
                  minHeight: 46,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
                }}
              >
                {saving ? 'Saving...' : 'Generate Bill'}
              </Button>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={openPrintWindow}
                  disabled={!customer}
                  sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                >
                  Print Bill
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                >
                  Save Draft
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box ref={printRef} sx={{ display: 'none' }}>
        <div className="header">
          <div>
            <h1>Tailoring Shop</h1>
            <p className="muted">Customer Invoice</p>
          </div>
          <div>
            <h3>{billMeta.billId}</h3>
            <p className="muted">Date: {billMeta.billDate}</p>
            <p className="muted">Due: {billMeta.dueDate}</p>
          </div>
        </div>

        <div className="card">
          <h3>Customer Information</h3>
          <p>
            <strong>ID:</strong> {customer?.id || '-'}
          </p>
          <p>
            <strong>Name:</strong> {customer?.name || '-'}
          </p>
          <p>
            <strong>Mobile:</strong> {customer?.mobileNumber || '-'}
          </p>
          <p>
            <strong>Address:</strong> {customer?.address || '-'}
          </p>
        </div>

        <div className="card">
          <h3>Bill Items</h3>
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Item</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineTotals.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.item}</td>
                  <td>{row.description || '-'}</td>
                  <td>
                    {row.qty} {row.unit}
                  </td>
                  <td>₹ {formatCurrency(row.price)}</td>
                  <td>₹ {formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div>
              <span>Sub Total</span>
              <span>₹ {formatCurrency(subTotal)}</span>
            </div>
            <div>
              <span>Discount</span>
              <span>₹ {formatCurrency(discountAmount)}</span>
            </div>
            <div className="grand">
              <span>Total Amount</span>
              <span>₹ {formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <p>
            <strong>Payment Type:</strong> {billMeta.paymentType}
          </p>
          <p>
            <strong>Payment Status:</strong> {billMeta.paymentStatus}
          </p>
          <p>
            <strong>Notes:</strong> {billMeta.notes || 'Thank you for your business!'}
          </p>
        </div>
      </Box>
    </Box>
  );
};

export default Billing;
