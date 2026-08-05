import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
  getCustomers,
} from '../../services/api';
import {
  getPantMeasurementById,
  getShirtMeasurementById,
} from '../../services/measurementApi';
import AddCustomer from './AddCustomer';
import CustomerView from './CustomerView';
import PageTabs from '../../components/common/PageTabs';

const normalizeCustomer = (customer = {}) => ({
  ...customer,
  id: customer.id ?? customer.custId ?? customer.customerId ?? '',
  name: customer.name ?? customer.custName ?? customer.customerName ?? '',
  mobileNumber: customer.mobileNumber ?? customer.custMobileNumber ?? customer.phone ?? customer.mobile ?? '',
  address: customer.address ?? customer.custAddress ?? customer.customerAddress ?? '',
  balance: customer.balance ?? customer.custBalance ?? customer.accountBalance ?? customer.outstandingBalance ?? '',
  shirtMeasurements: customer.shirtMeasurements ?? {},
  pantMeasurements: customer.pantMeasurements ?? {},
  measurementNotes: customer.measurementNotes ?? { shirt: '', pant: '' },
});

const normalizeShirtMeasurements = (measurement = {}) => ({
  length: measurement.length ?? measurement.shirtLength ?? '',
  chest: measurement.chest ?? '',
  waist: measurement.waist ?? '',
  hip: measurement.shirtHip ?? measurement.hip ?? '',
  shoulder: measurement.shoulder ?? '',
  sleeve: measurement.sleeve ?? '',
  neck: measurement.neck ?? measurement.collar ?? '',
  cuff: measurement.cuff ?? '',
});

const normalizePantMeasurements = (measurement = {}) => ({
  length: measurement.pantLength ?? measurement.length ?? '',
  waist: measurement.pantWaist ?? measurement.waist ?? '',
  hip: measurement.hip ?? '',
  thigh: measurement.thigh ?? '',
  knee: measurement.knee ?? '',
  calf: measurement.calf ?? '',
  bottom: measurement.bottom ?? '',
});

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

const getViewModeIndex = (mode) => {
  if (mode === 'create') return 0;
  if (mode === 'view') return 1;
  if (mode === 'detail') return 2;
  return 3;
};

const  CustomerList = () => {
  const [viewMode, setViewMode] = useState('create');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const getCustomerWithMeasurements = async (customerId) => {
    const response = await getCustomerById(customerId);
    const baseCustomer = normalizeCustomer(response?.data);

    const [shirtResult, pantResult] = await Promise.allSettled([
      getShirtMeasurementById(customerId),
      getPantMeasurementById(customerId),
    ]);

    const shirtData = shirtResult.status === 'fulfilled' ? shirtResult.value?.data ?? {} : {};
    const pantData = pantResult.status === 'fulfilled' ? pantResult.value?.data ?? {} : {};

    return normalizeCustomer({
      ...baseCustomer,
      shirtMeasurements: {
        ...baseCustomer.shirtMeasurements,
        ...normalizeShirtMeasurements(shirtData),
      },
      pantMeasurements: {
        ...baseCustomer.pantMeasurements,
        ...normalizePantMeasurements(pantData),
      },
      measurementNotes: {
        shirt: shirtData.notes ?? baseCustomer.measurementNotes?.shirt ?? '',
        pant: pantData.notes ?? baseCustomer.measurementNotes?.pant ?? '',
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

  const handleTabChange = async (_, value) => {
    const mode = value === 0 ? 'create' : value === 1 ? 'view' : value === 2 ? 'detail' : 'all';
    setViewMode(mode);

    if (mode === 'all') {
      setPage(1);
      setFeedback(null);
      await loadCustomers();
    }
  };

  const pagedCustomers = customers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(customers.length / rowsPerPage));

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
            { label: 'Customer Details' },
            { label: 'View All Customers' },
          ]}
        />
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3 }}>
          {feedback.message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ width: '100%', maxWidth: viewMode === 'detail' ? 1600 : viewMode === 'all' ? 1400 : 1200, mx: 'auto' }}>
        {viewMode !== 'all' && (
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
                        {selectedCustomer.balance != null && <Typography><strong>Balance:</strong> {selectedCustomer.balance}</Typography>}
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
                          <TableCell>{customer.balance != null && customer.balance !== '' ? customer.balance : '-'}</TableCell>
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
      </Grid>
    </Box>
  );
};

export default CustomerList;
