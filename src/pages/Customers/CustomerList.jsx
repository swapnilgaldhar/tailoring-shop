import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  getCustomerById,
  getCustomerByMobileNo,
  getCustomers,
  getCustomersWithDeliveryDate,
  getCustomersWithBalance,
  updateCustomerBalence,
} from '../../services/api';
import {
  getMeasurementById,
  getMeasurements,
  getPantMeasurementById,
  getShirtMeasurementById,
} from '../../services/measurementApi';
import AddCustomer from './AddCustomer';
import CustomerView from './CustomerView';
import PageTabs from '../../components/common/PageTabs';

const resolveMeasurementMap = (value, fallback = {}) => {
  const extracted = unwrapMeasurementPayload(value ?? fallback);
  if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
    return {};
  }
  return extracted;
};

const readMeasurementObject = (value) => {
  const normalized = parseJsonIfString(value ?? {});

  if (Array.isArray(normalized)) {
    return readMeasurementObject(normalized[0] ?? {});
  }

  if (!normalized || typeof normalized !== 'object') {
    return {};
  }

  if (normalized.data !== undefined) return readMeasurementObject(normalized.data);
  if (normalized.result !== undefined) return readMeasurementObject(normalized.result);
  if (normalized.payload !== undefined) return readMeasurementObject(normalized.payload);

  const inner =
    normalized.shirtMeasurement ??
    normalized.pantMeasurement ??
    normalized.shirtMeasurements ??
    normalized.pantMeasurements ??
    normalized.measurement;

  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return { ...normalized, ...inner };
  }

  return normalized;
};

const normalizeCustomer = (customer = {}) => {
  const safeCustomer = unwrapMeasurementPayload(customer);
  const flatShirtFromCustomer = {
    length: safeCustomer.length ?? safeCustomer.shirtLength ?? '',
    chest: safeCustomer.chest ?? '',
    waist: safeCustomer.waist ?? '',
    hip: safeCustomer.shirtHip ?? safeCustomer.hip ?? '',
    shoulder: safeCustomer.shoulder ?? '',
    sleeve: safeCustomer.sleeve ?? '',
    neck: safeCustomer.neck ?? safeCustomer.collar ?? '',
    cuff: safeCustomer.cuff ?? '',
  };
  const flatPantFromCustomer = {
    length: safeCustomer.pantLength ?? safeCustomer.length ?? '',
    waist: safeCustomer.pantWaist ?? safeCustomer.waist ?? '',
    hip: safeCustomer.hip ?? '',
    thigh: safeCustomer.thigh ?? '',
    knee: safeCustomer.knee ?? '',
    calf: safeCustomer.calf ?? '',
    bottom: safeCustomer.bottom ?? '',
  };

  return {
    ...safeCustomer,
    id: safeCustomer.id ?? safeCustomer.custId ?? safeCustomer.customerId ?? '',
    name: safeCustomer.name ?? safeCustomer.custName ?? safeCustomer.customerName ?? '',
    mobileNumber: safeCustomer.mobileNumber ?? safeCustomer.custMobileNumber ?? safeCustomer.phone ?? safeCustomer.mobile ?? '',
    address: safeCustomer.address ?? safeCustomer.custAddress ?? safeCustomer.customerAddress ?? '',
    balance: safeCustomer.balance ?? safeCustomer.balanceAmount ?? safeCustomer.custBalance ?? safeCustomer.accountBalance ?? safeCustomer.outstandingBalance ?? '',
    billNumber: safeCustomer.billNumber ?? safeCustomer.billNo ?? '',
    deliveryDate: safeCustomer.deliveryDate ?? safeCustomer.deliverydate ?? safeCustomer.delivery_date ?? '',
    deliveryStatus:
      safeCustomer.deliveryStatus ??
      safeCustomer.deliverystatus ??
      safeCustomer.delivery_status ??
      safeCustomer.delivery?.status ??
      safeCustomer.delivery?.deliveryStatus ??
      safeCustomer.orderStatus ??
      safeCustomer.status ??
      '',
    shirtMeasurements: {
      ...flatShirtFromCustomer,
      ...resolveMeasurementMap(safeCustomer.shirtMeasurements ?? safeCustomer.shirtMeasuremet ?? safeCustomer.shirtMeasurement ?? safeCustomer.measurements?.shirtMeasurements ?? safeCustomer.measurements?.shirtMeasuremet ?? safeCustomer.measurements?.shirtMeasurement ?? safeCustomer.measurement?.shirtMeasurements ?? safeCustomer.measurement?.shirtMeasuremet ?? safeCustomer.measurement?.shirtMeasurement ?? {}),
    },
    pantMeasurements: {
      ...flatPantFromCustomer,
      ...resolveMeasurementMap(safeCustomer.pantMeasurements ?? safeCustomer.pantMeasuremet ?? safeCustomer.pantMeasurement ?? safeCustomer.measurements?.pantMeasurements ?? safeCustomer.measurements?.pantMeasuremet ?? safeCustomer.measurements?.pantMeasurement ?? safeCustomer.measurement?.pantMeasurements ?? safeCustomer.measurement?.pantMeasuremet ?? safeCustomer.measurement?.pantMeasurement ?? {}),
    },
    measurementNotes: unwrapMeasurementPayload(safeCustomer.measurementNotes ?? { shirt: safeCustomer.notes ?? '', pant: safeCustomer.notes ?? '' }),
  };
};

const formatBalance = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : value;
};

const parseJsonIfString = (payload) => {
  if (typeof payload !== 'string') return payload;

  const trimmed = payload.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) {
    return payload;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
};

const unwrapMeasurementPayload = (payload = {}) => {
  const normalized = parseJsonIfString(payload);

  if (Array.isArray(normalized)) {
    return normalized[0] ?? {};
  }

  if (!normalized || typeof normalized !== 'object') {
    return {};
  }

  if (normalized.data !== undefined) return unwrapMeasurementPayload(normalized.data);
  if (normalized.result !== undefined) return unwrapMeasurementPayload(normalized.result);
  if (normalized.measurement !== undefined) return unwrapMeasurementPayload(normalized.measurement);

  return normalized;
};

const normalizeShirtMeasurements = (measurement = {}) => {
  const root = unwrapMeasurementPayload(measurement);
  const nested = unwrapMeasurementPayload(
    root.shirtMeasurements ??
      root.shirtMeasurement ??
      root.measurements?.shirtMeasurements ??
      root.measurements?.shirtMeasurement ??
      root.measurement?.shirtMeasurements ??
      root.measurement?.shirtMeasurement ??
      {}
  );
  const source = { ...root, ...nested };

  return {
    length: source.length ?? source.shirtLength ?? '',
    chest: source.chest ?? '',
    waist: source.waist ?? '',
    hip: source.shirtHip ?? source.hip ?? '',
    shoulder: source.shoulder ?? '',
    sleeve: source.sleeve ?? '',
    neck: source.neck ?? source.collar ?? '',
    cuff: source.cuff ?? '',
  };
};

const normalizePantMeasurements = (measurement = {}) => {
  const root = unwrapMeasurementPayload(measurement);
  const nested = unwrapMeasurementPayload(
    root.pantMeasurements ??
      root.pantMeasurement ??
      root.measurements?.pantMeasurements ??
      root.measurements?.pantMeasurement ??
      root.measurement?.pantMeasurements ??
      root.measurement?.pantMeasurement ??
      {}
  );
  const source = { ...root, ...nested };

  return {
    length: source.pantLength ?? source.length ?? '',
    waist: source.pantWaist ?? source.waist ?? '',
    hip: source.hip ?? '',
    thigh: source.thigh ?? '',
    knee: source.knee ?? '',
    calf: source.calf ?? '',
    bottom: source.bottom ?? '',
  };
};

const extractCustomersList = (payload) => {
  const normalizedPayload = parseJsonIfString(payload);

  if (Array.isArray(normalizedPayload)) return normalizedPayload;
  if (normalizedPayload && typeof normalizedPayload === 'object') {
    if (Array.isArray(normalizedPayload.customers)) return normalizedPayload.customers;
    if (Array.isArray(normalizedPayload.data)) return normalizedPayload.data;
    if (Array.isArray(normalizedPayload.content)) return normalizedPayload.content;
    if (Array.isArray(normalizedPayload.items)) return normalizedPayload.items;
    if (Array.isArray(normalizedPayload.results)) return normalizedPayload.results;
    if (Array.isArray(normalizedPayload.list)) return normalizedPayload.list;
  }
  return [];
};

const extractMeasurementRecords = (payload) => {
  const normalizedPayload = parseJsonIfString(payload);

  if (Array.isArray(normalizedPayload)) return normalizedPayload;
  if (normalizedPayload && typeof normalizedPayload === 'object') {
    if (Array.isArray(normalizedPayload.measurements)) return normalizedPayload.measurements;
    if (Array.isArray(normalizedPayload.data)) return normalizedPayload.data;
    if (Array.isArray(normalizedPayload.content)) return normalizedPayload.content;
    if (Array.isArray(normalizedPayload.items)) return normalizedPayload.items;
    if (Array.isArray(normalizedPayload.results)) return normalizedPayload.results;
    if (Array.isArray(normalizedPayload.list)) return normalizedPayload.list;
  }
  return [];
};

const stripEmptyValues = (values = {}) => {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {};

  return Object.entries(values).reduce((accumulator, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
};

const normalizeMobileNumber = (value = '') => String(value).replace(/\D/g, '');

const resolveCustomerFromLookupPayload = (payload) => {
  const normalizedPayload = parseJsonIfString(payload);

  if (Array.isArray(normalizedPayload)) {
    return normalizeCustomer(normalizedPayload[0] ?? {});
  }

  if (normalizedPayload && typeof normalizedPayload === 'object') {
    const listCandidate = extractCustomersList(normalizedPayload);
    if (listCandidate.length > 0) {
      return normalizeCustomer(listCandidate[0]);
    }
  }

  return normalizeCustomer(normalizedPayload ?? {});
};

const getViewModeIndex = (mode) => {
  if (mode === 'create') return 0;
  if (mode === 'view') return 1;
  if (mode === 'viewByMobile') return 2;
  if (mode === 'detail') return 3;
  if (mode === 'all') return 4;
  if (mode === 'withBalance') return 5;
  if (mode === 'delivery') return 6;
  return 0;
};

const CustomerList = () => {
  const [viewMode, setViewMode] = useState('create');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchValue, setMobileSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [page, setPage] = useState(1);
  const [balanceCustomers, setBalanceCustomers] = useState([]);
  const [balancePage, setBalancePage] = useState(1);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceCustomer, setBalanceCustomer] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [deliveryCustomers, setDeliveryCustomers] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryPage, setDeliveryPage] = useState(1);
  const rowsPerPage = 20;

  const getCustomerWithMeasurements = async (customerId) => {
    const response = await getCustomerById(customerId);
    const baseCustomer = normalizeCustomer(response?.data);
    const lookupId = baseCustomer?.id || customerId;

    const [shirtResult, pantResult, genericResult, allMeasurementsResult] = await Promise.allSettled([
      getShirtMeasurementById(lookupId),
      getPantMeasurementById(lookupId),
      getMeasurementById(lookupId),
      getMeasurements(),
    ]);

    const genericData = readMeasurementObject(genericResult.status === 'fulfilled' ? genericResult.value?.data : {});
    const shirtData = readMeasurementObject(shirtResult.status === 'fulfilled' ? shirtResult.value?.data : {});
    const pantData = readMeasurementObject(pantResult.status === 'fulfilled' ? pantResult.value?.data : {});
    const allMeasurements =
      allMeasurementsResult.status === 'fulfilled'
        ? extractMeasurementRecords(allMeasurementsResult.value?.data)
        : [];
    const measurementFromList =
      allMeasurements.find((item) => {
        const record = readMeasurementObject(item);
        const recordCustomerId =
          record.customerId ?? record.custId ?? record.customer?.id ?? record.customer?.customerId;
        return String(recordCustomerId ?? '') === String(lookupId);
      }) ?? {};
    const listData = readMeasurementObject(measurementFromList);

    const unifiedShirt = {
      ...stripEmptyValues(listData),
      ...stripEmptyValues(genericData),
      ...stripEmptyValues(readMeasurementObject(listData.shirtMeasurements ?? listData.shirtMeasurement ?? listData.measurements?.shirtMeasurements ?? listData.measurements?.shirtMeasurement)),
      ...stripEmptyValues(readMeasurementObject(genericData.shirtMeasurements ?? genericData.shirtMeasurement ?? genericData.measurements?.shirtMeasurements ?? genericData.measurements?.shirtMeasurement)),
      ...stripEmptyValues(readMeasurementObject(shirtData.shirtMeasurements ?? shirtData.shirtMeasurement ?? shirtData.measurements?.shirtMeasurements ?? shirtData.measurements?.shirtMeasurement)),
      ...stripEmptyValues(shirtData),
    };
    const unifiedPant = {
      ...stripEmptyValues(listData),
      ...stripEmptyValues(genericData),
      ...stripEmptyValues(readMeasurementObject(listData.pantMeasurements ?? listData.pantMeasurement ?? listData.measurements?.pantMeasurements ?? listData.measurements?.pantMeasurement)),
      ...stripEmptyValues(readMeasurementObject(genericData.pantMeasurements ?? genericData.pantMeasurement ?? genericData.measurements?.pantMeasurements ?? genericData.measurements?.pantMeasurement)),
      ...stripEmptyValues(readMeasurementObject(pantData.pantMeasurements ?? pantData.pantMeasurement ?? pantData.measurements?.pantMeasurements ?? pantData.measurements?.pantMeasurement)),
      ...stripEmptyValues(pantData),
    };

    return normalizeCustomer({
      ...baseCustomer,
      shirtMeasurements: {
        ...baseCustomer.shirtMeasurements,
        ...normalizeShirtMeasurements(unifiedShirt),
      },
      pantMeasurements: {
        ...baseCustomer.pantMeasurements,
        ...normalizePantMeasurements(unifiedPant),
      },
      measurementNotes: {
        shirt: unifiedShirt.notes ?? baseCustomer.measurementNotes?.shirt ?? '',
        pant: unifiedPant.notes ?? baseCustomer.measurementNotes?.pant ?? '',
      },
    });
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers();
      const data = extractCustomersList(response?.data);
      setCustomers(data.map(normalizeCustomer));
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to load customers from the backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersWithBalance = async () => {
    setLoading(true);
    try {
      const response = await getCustomersWithBalance();
      const data = extractCustomersList(response?.data);
      setBalanceCustomers(data.map(normalizeCustomer));
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to load customers with balance from the backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersWithDeliveryDate = async (date = deliveryDate) => {
    if (!date) {
      setFeedback({ type: 'error', message: 'Please select a delivery date.' });
      return;
    }

    setLoading(true);
    try {
      const response = await getCustomersWithDeliveryDate(date);
      const data = extractCustomersList(response?.data);
      setDeliveryCustomers(data.map(normalizeCustomer));
      setDeliveryPage(1);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to load customers for the selected delivery date.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForEdit = (customer) => {
    const normalizedCustomer = normalizeCustomer(customer);
    setSelectedCustomer(normalizedCustomer);
    setViewMode('view');
    setFeedback(null);
  };

  const handleFindCustomerForEdit = async () => {
    const searchText = searchValue.trim();
    if (!searchText) {
      setFeedback({ type: 'error', message: 'Please enter a customer ID or name.' });
      return;
    }

    setLoading(true);
    try {
      const customer = await getCustomerWithMeasurements(searchText);

      if (!customer?.id && !customer?.name) {
        setFeedback({ type: 'error', message: 'No customer found for that search.' });
        setSelectedCustomer(null);
        return;
      }

      setSelectedCustomer(customer);
      setFeedback({ type: 'success', message: 'Customer loaded successfully.' });
      setViewMode('detail');
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to find that customer.';
      setFeedback({ type: 'error', message });
      setSelectedCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFindCustomerByMobile = async () => {
    const mobileText = mobileSearchValue.trim();
    const normalizedSearch = normalizeMobileNumber(mobileText);

    if (!normalizedSearch) {
      setFeedback({ type: 'error', message: 'Please enter a mobile number.' });
      return;
    }

    setLoading(true);
    try {
      const response = await getCustomerByMobileNo(normalizedSearch);
      const matchedCustomer = resolveCustomerFromLookupPayload(response?.data);

      if (!matchedCustomer?.id && !matchedCustomer?.name) {
        setFeedback({ type: 'error', message: 'No customer found for that mobile number.' });
        setSelectedCustomer(null);
        return;
      }

      const lookupId = matchedCustomer?.id || normalizedSearch;
      const customer = await getCustomerWithMeasurements(lookupId);
      setSelectedCustomer(customer);
      setFeedback({ type: 'success', message: 'Customer loaded successfully.' });
      setViewMode('detail');
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to find customer by mobile number.';
      setFeedback({ type: 'error', message });
      setSelectedCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForView = async (customer) => {
    setLoading(true);
    try {
      const customerDetails = await getCustomerWithMeasurements(customer.id);
      setSelectedCustomer(customerDetails);
      setViewMode('detail');
      setFeedback(null);
    } catch (error) {
      const fallbackCustomer = normalizeCustomer(customer);
      setSelectedCustomer(fallbackCustomer);
      setViewMode('detail');
      setFeedback({
        type: 'info',
        message: error?.response?.data?.message || 'Loaded customer details, but measurement details could not be fetched.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBalanceDialog = (customer) => {
    const normalizedCustomer = normalizeCustomer(customer);
    setBalanceCustomer(normalizedCustomer);
    setBalanceAmount('');
    setBalanceDialogOpen(true);
  };

  const handleCloseBalanceDialog = () => {
    if (updatingBalance) return;
    setBalanceDialogOpen(false);
    setBalanceCustomer(null);
    setBalanceAmount('');
  };

  const handleSubmitBalanceUpdate = async () => {
    const customerId = balanceCustomer?.id;
    const amountValue = balanceAmount.trim();

    if (!customerId) {
      setFeedback({ type: 'error', message: 'Customer ID is missing for balance update.' });
      return;
    }

    if (amountValue === '' || Number.isNaN(Number(amountValue))) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }

    setUpdatingBalance(true);
    try {
      await updateCustomerBalence(customerId, Number(amountValue));
      setFeedback({
        type: 'success',
        message: `Balence update sucessfully for customerid ${customerId}.`,
      });
      setBalanceDialogOpen(false);
      setBalanceCustomer(null);
      setBalanceAmount('');
      await loadCustomersWithBalance();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to update customer balence.',
      });
    } finally {
      setUpdatingBalance(false);
    }
  };

  const handleTabChange = async (_, value) => {
    const mode = value === 0
      ? 'create'
      : value === 1
        ? 'view'
        : value === 2
          ? 'viewByMobile'
          : value === 3
            ? 'detail'
            : value === 4
              ? 'all'
              : value === 5
                ? 'withBalance'
                : 'delivery';
    setViewMode(mode);

    if (mode === 'all') {
      setPage(1);
      setFeedback(null);
      await loadCustomers();
    }

    if (mode === 'withBalance') {
      setBalancePage(1);
      setFeedback(null);
      await loadCustomersWithBalance();
    }

    if (mode === 'delivery') {
      setDeliveryPage(1);
      setFeedback(null);
      await loadCustomersWithDeliveryDate();
    }
  };

  const pagedCustomers = customers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(customers.length / rowsPerPage));
  const pagedBalanceCustomers = balanceCustomers.slice((balancePage - 1) * rowsPerPage, balancePage * rowsPerPage);
  const totalBalancePages = Math.max(1, Math.ceil(balanceCustomers.length / rowsPerPage));
  const totalCustomerBalance = balanceCustomers.reduce((total, customer) => {
    const balance = Number(customer.balance);
    return Number.isFinite(balance) ? total + balance : total;
  }, 0);
  const pagedDeliveryCustomers = deliveryCustomers.slice((deliveryPage - 1) * rowsPerPage, deliveryPage * rowsPerPage);
  const totalDeliveryPages = Math.max(1, Math.ceil(deliveryCustomers.length / rowsPerPage));

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3, width: '100%' }}>
        <Box>
          <Typography variant="h4">Customers</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome our Customer.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setViewMode('create')}>
          New Customer
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <PageTabs
          value={getViewModeIndex(viewMode)}
          onChange={handleTabChange}
          tabs={[
            { label: 'Create Customer' },
            { label: 'View Customer' },
            { label: 'Find By Mobile' },
            { label: 'Customer Details' },
            { label: 'View All Customers' },
            { label: 'Customer with Balance' },
            { label: 'Delivery Customers' },
          ]}
        />
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3 }}>
          {feedback.message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ width: '100%', maxWidth: viewMode === 'detail' ? 1600 : viewMode === 'all' || viewMode === 'withBalance' || viewMode === 'delivery' ? 1400 : 1200, mx: 'auto' }}>
        {viewMode !== 'all' && viewMode !== 'withBalance' && viewMode !== 'delivery' && (
        <Grid item xs={12} md={viewMode === 'detail' ? 12 : 4} sx={{ width: '100%' }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              width: '100%',
              maxWidth: viewMode === 'detail' ? '100%' : 700,
              mx: 'auto',
            }}
          >
            {viewMode === 'create' && (
              <AddCustomer onCustomerCreated={loadCustomers} />
            )}

            {viewMode === 'view' && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  View Customer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter a customer ID to fetch and view the customer details.
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Customer ID"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    fullWidth
                  />
                  <Button variant="outlined" onClick={handleFindCustomerForEdit} disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Customer'}
                  </Button>

                  {selectedCustomer && (
                    <Box sx={{ mt: 2 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Customer Card</Typography>
                        <Typography><strong>ID:</strong> {selectedCustomer.id}</Typography>
                        <Typography><strong>Name:</strong> {selectedCustomer.name}</Typography>
                        <Typography><strong>Mobile:</strong> {selectedCustomer.mobileNumber}</Typography>
                        <Typography><strong>Address:</strong> {selectedCustomer.address}</Typography>
                        {selectedCustomer.email && <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>}
                        {selectedCustomer.balance != null && <Typography><strong>Balance:</strong> {formatBalance(selectedCustomer.balance)}</Typography>}
                        {selectedCustomer.notes && <Typography><strong>Notes:</strong> {selectedCustomer.notes}</Typography>}
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {viewMode === 'viewByMobile' && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Find Customer By Mobile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter a mobile number to fetch and view customer details.
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Mobile Number"
                    value={mobileSearchValue}
                    onChange={(event) => setMobileSearchValue(event.target.value)}
                    fullWidth
                  />
                  <Button variant="outlined" onClick={handleFindCustomerByMobile} disabled={loading}>
                    {loading ? 'Loading...' : 'Find Customer'}
                  </Button>

                  {selectedCustomer && (
                    <Box sx={{ mt: 2 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Customer Card</Typography>
                        <Typography><strong>ID:</strong> {selectedCustomer.id}</Typography>
                        <Typography><strong>Name:</strong> {selectedCustomer.name}</Typography>
                        <Typography><strong>Mobile:</strong> {selectedCustomer.mobileNumber}</Typography>
                        <Typography><strong>Address:</strong> {selectedCustomer.address}</Typography>
                        {selectedCustomer.email && <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>}
                        {selectedCustomer.balance != null && <Typography><strong>Balance:</strong> {formatBalance(selectedCustomer.balance)}</Typography>}
                        {selectedCustomer.notes && <Typography><strong>Notes:</strong> {selectedCustomer.notes}</Typography>}
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {viewMode === 'detail' && (
              <Box>
                {selectedCustomer ? (
                  <CustomerView
                    customer={selectedCustomer}
                    onEdit={() => {
                      setViewMode('view');
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">No customer selected. Use View Customer or View All first.</Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        )}

        {viewMode === 'all' && (
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Paper sx={{ p: 3, width: '100%', mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customer List
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Typography color="text.secondary">Loading customers...</Typography>
              ) : customers.length === 0 ? (
                <Typography color="text.secondary">No customers found yet.</Typography>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedCustomers.map((customer) => (
                        <TableRow key={customer.id} hover>
                          <TableCell>{customer.id}</TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.mobileNumber}</TableCell>
                          <TableCell>{formatBalance(customer.balance)}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" startIcon={<EditIcon />} onClick={() => handleSelectForEdit(customer)}>
                                Edit
                              </Button>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleSelectForView(customer)}>
                                View
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Page {page} of {totalPages}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                        Previous
                      </Button>
                      <Button size="small" variant="outlined" disabled={page === totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                        Next
                      </Button>
                    </Stack>
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>
        )}

        {viewMode === 'withBalance' && (
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Paper sx={{ p: 3, width: '100%', mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customers With Balance &gt; 0
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Typography color="text.secondary">Loading customers...</Typography>
              ) : balanceCustomers.length === 0 ? (
                <Typography color="text.secondary">No customers with outstanding balance found.</Typography>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell colSpan={5} />
                        <TableCell align="right" sx={{ borderBottom: 0 }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              px: 2,
                              py: 1,
                              borderRadius: 1,
                              minWidth: 190,
                            }}
                          >
                            <Typography variant="caption">Total Balance</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {formatBalance(totalCustomerBalance)}
                              
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Address</TableCell>
                        {<TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedBalanceCustomers.map((customer) => (
                        <TableRow key={customer.id} hover>
                          <TableCell>{customer.id}</TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.mobileNumber}</TableCell>
                          <TableCell>{formatBalance(customer.balance)}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenBalanceDialog(customer)}>
                                Update Balence
                              </Button>
                              {/*
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleSelectForView(customer)}>
                                View
                              </Button> */}
                            </Stack> 
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Page {balancePage} of {totalBalancePages}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" disabled={balancePage === 1} onClick={() => setBalancePage((prev) => Math.max(1, prev - 1))}>
                        Previous
                      </Button>
                      <Button size="small" variant="outlined" disabled={balancePage === totalBalancePages} onClick={() => setBalancePage((prev) => Math.min(totalBalancePages, prev + 1))}>
                        Next
                      </Button>
                    </Stack>
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>
        )}

        {viewMode === 'delivery' && (
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Paper sx={{ p: 3, width: '100%', mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customers With Delivery
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                  label="Delivery Date"
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: { sm: 220 } }}
                />
                <Button variant="contained" onClick={() => loadCustomersWithDeliveryDate()} disabled={loading || !deliveryDate}>
                  {loading ? 'Loading...' : 'Find Customers'}
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Typography color="text.secondary">Loading customers...</Typography>
              ) : deliveryCustomers.length === 0 ? (
                <Typography color="text.secondary">No customers found for the selected delivery date.</Typography>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Bill No</TableCell>
                        <TableCell>Delivery Date</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedDeliveryCustomers.map((customer, index) => (
                        <TableRow key={`${customer.id}-${customer.billNumber || 'delivery'}-${index}`} hover>
                          <TableCell>{customer.id}</TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.mobileNumber}</TableCell>
                          <TableCell>{customer.billNumber || '-'}</TableCell>
                          <TableCell>{customer.deliveryDate || '-'}</TableCell>
                          <TableCell>{formatBalance(customer.balance)}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" startIcon={<EditIcon />} onClick={() => handleSelectForEdit(customer)}>
                                Edit
                              </Button>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleSelectForView(customer)}>
                                View
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Page {deliveryPage} of {totalDeliveryPages}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" disabled={deliveryPage === 1} onClick={() => setDeliveryPage((prev) => Math.max(1, prev - 1))}>
                        Previous
                      </Button>
                      <Button size="small" variant="outlined" disabled={deliveryPage === totalDeliveryPages} onClick={() => setDeliveryPage((prev) => Math.min(totalDeliveryPages, prev + 1))}>
                        Next
                      </Button>
                    </Stack>
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={balanceDialogOpen} onClose={handleCloseBalanceDialog} fullWidth maxWidth="xs">
        <DialogTitle>Update Balence</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Customer ID"
              value={balanceCustomer?.id || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Amount"
              type="number"
              value={balanceAmount}
              onChange={(event) => setBalanceAmount(event.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBalanceDialog} disabled={updatingBalance}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitBalanceUpdate} disabled={updatingBalance}>
            {updatingBalance ? 'Updating...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
