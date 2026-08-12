import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import { createBill, getBillById } from '../../services/billingApi';
import PageTabs from '../../components/common/PageTabs';

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

const createEmptyItem = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  item: 'Suiting',
  description: '',
  qty: '1',
 // unit: 'mtr',
  price: '0',
});

const createInitialBillMeta = () => ({
  billDate: dayjs().format('YYYY-MM-DD'),
  dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
  paymentType: 'Cash',
  discount: '0',
  paidAmount: '0',
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

const getFirstValue = (source, keys, fallback = '-') => {
  const value = keys.map((key) => source?.[key]).find((candidate) => candidate != null && candidate !== '');
  return value ?? fallback;
};

const BillDetailsCard = ({ bill, onPrint }) => {
  const billItems = bill?.billItems ?? bill?.items ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: '1px solid #dbe6f5',
        bgcolor: 'white',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Bill #{getFirstValue(bill, ['billNumber', 'billNo', 'id'])}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer ID: {getFirstValue(bill, ['customerId', 'customer', 'custId'])}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontWeight: 700, color: '#1d4ed8' }}>
            {getFirstValue(bill, ['paymentMode', 'paymentType'])}
          </Typography>
          <Button size="small" variant="outlined" startIcon={<ReceiptLongIcon />} onClick={onPrint}>
            Print Bill
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          ['Bill Date', getFirstValue(bill, ['billDate'])],
          ['Delivery Date', getFirstValue(bill, ['deliveryDate', 'dueDate'])],
          ['Total Amount', `₹ ${formatCurrency(getFirstValue(bill, ['totalAmount'], 0))}`],
          ['Discount', `₹ ${formatCurrency(getFirstValue(bill, ['discount'], 0))}`],
          ['Paid Amount', `₹ ${formatCurrency(getFirstValue(bill, ['paidAmount'], 0))}`],
          ['Balance Amount', `₹ ${formatCurrency(getFirstValue(bill, ['balanceAmount', 'remainingAmount'], 0))}`],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <Box
              sx={{
                minHeight: 82,
                px: 2,
                py: 1.5,
                border: '1px solid #dbe6f5',
                borderRadius: 1.5,
                bgcolor: label === 'Balance Amount' ? '#fff7ed' : '#f8fbff',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: label === 'Balance Amount' ? '#c2410c' : '#0f172a',
                  fontSize: 17,
                }}
              >
                {value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700, color: '#1e3a8a' }}>
        Bill Items
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#eef5ff' }}>
              <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rate (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billItems.length ? (
              billItems.map((item, index) => (
                <TableRow key={item.id ?? item.billItemId ?? index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{getFirstValue(item, ['itemName', 'item', 'name'])}</TableCell>
                  <TableCell>{getFirstValue(item, ['itemDescription', 'description'])}</TableCell>
                  <TableCell>{getFirstValue(item, ['quantity', 'qty'])}</TableCell>
                  <TableCell>{formatCurrency(getFirstValue(item, ['rate', 'price', 'unitPrice'], 0))}</TableCell>
                  <TableCell>{formatCurrency(getFirstValue(item, ['amount', 'totalAmount', 'total'], 0))}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                  No bill items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Notes
        </Typography>
        <Typography sx={{ color: '#0f172a', whiteSpace: 'pre-wrap' }}>
          {getFirstValue(bill, ['notes'])}
        </Typography>
      </Box>
    </Paper>
  );
};

const ViewBillPrintTemplate = ({ bill }) => {
  const billItems = bill?.billItems ?? bill?.items ?? [];

  return (
    <>
      <div className="header">
        <div>
          <h1>Tailoring Shop</h1>
          <p className="muted">Customer Invoice</p>
        </div>
        <div>
          <p className="muted">Bill No: {getFirstValue(bill, ['billNumber', 'billNo', 'id'])}</p>
          <p className="muted">Bill Date: {getFirstValue(bill, ['billDate'])}</p>
          <p className="muted">Delivery Date: {getFirstValue(bill, ['deliveryDate', 'dueDate'])}</p>
        </div>
      </div>
      <div className="card">
        <h3>Customer Information</h3>
        <p>
          <strong>Customer ID:</strong> {getFirstValue(bill, ['customerId', 'customer', 'custId'])}
        </p>
        <p>
          <strong>Payment Type:</strong> {getFirstValue(bill, ['paymentMode', 'paymentType'])}
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
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {billItems.map((item, index) => (
              <tr key={item.id ?? item.billItemId ?? index}>
                <td>{index + 1}</td>
                <td>{getFirstValue(item, ['itemName', 'item', 'name'])}</td>
                <td>{getFirstValue(item, ['itemDescription', 'description'])}</td>
                <td>{getFirstValue(item, ['quantity', 'qty'])}</td>
                <td>₹ {formatCurrency(getFirstValue(item, ['rate', 'price', 'unitPrice'], 0))}</td>
                <td>₹ {formatCurrency(getFirstValue(item, ['amount', 'totalAmount', 'total'], 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div>
            <span>Discount</span>
            <span>₹ {formatCurrency(getFirstValue(bill, ['discount'], 0))}</span>
          </div>
          <div className="grand">
            <span>Total Amount</span>
            <span>₹ {formatCurrency(getFirstValue(bill, ['totalAmount'], 0))}</span>
          </div>
          <div>
            <span>Paid Amount</span>
            <span>₹ {formatCurrency(getFirstValue(bill, ['paidAmount'], 0))}</span>
          </div>
          <div className="grand">
            <span>Balance Amount</span>
            <span>₹ {formatCurrency(getFirstValue(bill, ['balanceAmount', 'remainingAmount'], 0))}</span>
          </div>
        </div>
      </div>
      <div className="card">
        <p>
          <strong>Notes:</strong> {getFirstValue(bill, ['notes'])}
        </p>
      </div>
    </>
  );
};

const Billing = () => {
  const printRef = useRef(null);
  const viewBillPrintRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [customerLookupId, setCustomerLookupId] = useState('');
  const [billNumberLookup, setBillNumberLookup] = useState('');
  const [createdBillNumber, setCreatedBillNumber] = useState('');
  const [loadedBill, setLoadedBill] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(true);
  const [billMeta, setBillMeta] = useState(createInitialBillMeta);
  const [items, setItems] = useState([createEmptyItem()]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
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
  const paidAmount = Math.min(toNumber(billMeta.paidAmount), totalAmount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

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

  const loadBill = async () => {
    const billNumber = billNumberLookup.trim();
    if (!billNumber) {
      setFeedback({ type: 'error', message: 'Enter a bill number to view bill details.' });
      return;
    }

    setLoadingBill(true);
    try {
      const response = await getBillById(billNumber);
      if (!response?.data) {
        setLoadedBill(null);
        setFeedback({ type: 'error', message: 'No bill found for that bill number.' });
        return;
      }

      setLoadedBill(response.data);
      setFeedback(null);
    } catch (error) {
      setLoadedBill(null);
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to load bill details for that bill number.',
      });
    } finally {
      setLoadingBill(false);
    }
  };

  const buildBillPayload = () => {
    const billItems = lineTotals.map((row) => ({
      itemName: row.item,
      itemDescription: row.description,
      quantity: Math.trunc(toNumber(row.qty)),
      rate: toNumber(row.price),
      amount: row.total,
    }));

    return {
      customerId: Number(customer?.id),
      billDate: billMeta.billDate,
      deliveryDate: billMeta.dueDate,
      paymentMode: billMeta.paymentType,
      paidAmount,
      discount: discountAmount,
      balanceAmount: remainingAmount,
      totalAmount,
      notes: billMeta.notes.trim(),
      billItems,
    };
  };

  const openPrintWindow = (targetRef = printRef) => {
    const printContents = targetRef.current?.innerHTML;
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
          <title>Customer Invoice</title>
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
    if (!Number.isInteger(Number(customer?.id))) {
      setFeedback({ type: 'error', message: 'Load a customer with a numeric customer ID before generating the bill.' });
      return;
    }

    if (!items.some((row) => row.item && Number.isInteger(toNumber(row.qty)) && toNumber(row.qty) > 0 && toNumber(row.price) >= 0)) {
      setFeedback({ type: 'error', message: 'Add at least one bill item with a whole-number quantity.' });
      return;
    }

    setSaving(true);
    try {
      const payload = buildBillPayload();
      const response = await createBill(payload);
      const billNumber = getFirstValue(response?.data, ['billNumber', 'billNo', 'id'], '');
      setCreatedBillNumber(billNumber);
      setFeedback({
        type: 'success',
        message: `Bill saved for customer ${customer.id} and ready to print.`,
      });
      requestAnimationFrame(() => openPrintWindow());
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
    if (!Number.isInteger(Number(customer?.id))) {
      setFeedback({ type: 'error', message: 'Load a customer with a numeric customer ID before saving the bill.' });
      return;
    }

    setSaving(true);
    try {
      const payload = buildBillPayload();
      await createBill(payload);
      setFeedback({
        type: 'success',
        message: `Bill saved for customer ${customer.id}.`,
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

      <PageTabs
        value={activeTab}
        onChange={(_, nextTab) => setActiveTab(nextTab)}
        tabs={[{ label: 'Create Bill' }, { label: 'View Bill' }]}
        sx={{ mb: 2, borderBottom: '1px solid #dbe6f5' }}
      />

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {activeTab === 1 ? (
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 2,
              border: '1px solid #dbe6f5',
              bgcolor: 'white',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                label="Bill Number"
                value={billNumberLookup}
                onChange={(event) => setBillNumberLookup(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadBill();
                }}
                sx={{ minWidth: { sm: 260 } }}
              />
              <Button variant="contained" onClick={loadBill} disabled={loadingBill}>
                {loadingBill ? 'Loading...' : 'View Bill'}
              </Button>
            </Stack>
          </Paper>
          {loadedBill && (
            <>
              <BillDetailsCard bill={loadedBill} onPrint={() => openPrintWindow(viewBillPrintRef)} />
              <Box ref={viewBillPrintRef} sx={{ display: 'none' }}>
                <ViewBillPrintTemplate bill={loadedBill} />
              </Box>
            </>
          )}
        </Stack>
      ) : (
      <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: '1px solid #dbe6f5',
          bgcolor: 'white',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 1.5, md: 2 },
              border: '1px solid #e2e8f0',
              borderRadius: 2,
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
                  sx={{ minWidth: { sm: 220 } }}
                />
                <Button variant="contained" onClick={loadCustomer} disabled={loadingCustomer}>
                  {loadingCustomer ? 'Loading...' : 'Load Customer'}
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
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
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.75, width: '100%' }}>
                  {[
                    ['Customer ID', customer.id],
                    ['Customer Name', customer.name],
                    ['Mobile', customer.mobileNumber],
                    ['Address', customer.address],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ display: 'contents' }}>
                      <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>{value || '-'}</Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 1.5, md: 2 },
              border: '1px solid #e2e8f0',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <ReceiptLongIcon sx={{ color: '#2563eb' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                Bill Details
              </Typography>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={12} lg={6}>
              <TextField
                size="small"
                type="date"
                label="Bill Date"
                value={billMeta.billDate}
                onChange={handleBillMetaChange('billDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              </Grid>
              <Grid item xs={12} sm={6} md={12} lg={6}>
              <TextField
                size="small"
                type="date"
                label="Due Date"
                value={billMeta.dueDate}
                onChange={handleBillMetaChange('dueDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              borderTop: '1px solid #e2e8f0',
              pt: 3,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ShoppingCartIcon sx={{ color: '#2563eb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                  Bill Items
                </Typography>
              </Stack>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ textTransform: 'none', boxShadow: 'none' }}
              >
                Add Item
              </Button>
            </Stack>

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#eef5ff' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
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
                            inputProps={{ min: 1, step: 1 }}
                            sx={{ width: 90 }}
                          />
                         {/* /* <TextField
                            size="small"
                            value={row.unit}
                            onChange={handleItemChange(row.id, 'unit')}
                            sx={{ width: 70 }}
                          />
                         */ }
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
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 1.5, md: 2 },
              border: '1px solid #e2e8f0',
              borderRadius: 2,
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
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 1.5, md: 2 },
              border: '1px solid #dbe6f5',
              borderRadius: 2,
              bgcolor: '#f8fbff',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                Bill Summary
              </Typography>
              <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Sub total</Typography><Typography fontWeight={700}>₹ {formatCurrency(subTotal)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography color="text.secondary">Discount</Typography>
                <TextField size="small" type="number" value={billMeta.discount} onChange={handleBillMetaChange('discount')} inputProps={{ min: 0, step: 0.01 }} sx={{ width: 130 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 800 }}>Total</Typography><Typography sx={{ fontWeight: 800, color: '#2563eb', fontSize: 20 }}>₹ {formatCurrency(totalAmount)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography color="text.secondary">Paid amount</Typography>
                <TextField size="small" type="number" value={billMeta.paidAmount} onChange={handleBillMetaChange('paidAmount')} inputProps={{ min: 0, max: totalAmount, step: 0.01 }} sx={{ width: 130 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 800 }}>Balance due</Typography><Typography sx={{ fontWeight: 800, color: '#dc2626', fontSize: 18 }}>₹ {formatCurrency(remainingAmount)}</Typography></Stack>
              <Divider />
              <Button
                variant="contained"
                startIcon={<ReceiptLongIcon />}
                onClick={handleGenerateBill}
                disabled={saving}
                sx={{
                  minHeight: 46,
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {saving ? 'Saving...' : 'Generate Bill'}
              </Button>

              <Stack direction="row" spacing={1.2}>
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
          </Box>
        </Grid>
      </Grid>
      </Paper>

      <Box ref={printRef} sx={{ display: 'none' }}>
        <div className="header">
          <div>
            <h1>Tailoring Shop</h1>
            <p className="muted">Customer Invoice</p>
          </div>
          <div>
            <p className="muted">Bill No: {createdBillNumber || '-'}</p>
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
            <div>
              <span>Paid Amount</span>
              <span>₹ {formatCurrency(paidAmount)}</span>
            </div>
            <div className="grand">
              <span>Remaining Amount</span>
              <span>₹ {formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <p>
            <strong>Payment Type:</strong> {billMeta.paymentType}
          </p>
          <p>
            <strong>Notes:</strong> {billMeta.notes || 'Thank you for your business!'}
          </p>
        </div>
      </Box>
      </>
      )}
    </Box>
  );
};

export default Billing;
