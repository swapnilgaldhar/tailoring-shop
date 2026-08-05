import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
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
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import {
  getCustomerById,
  getCustomers,
  updateCustomer,
} from '../../services/api';
import {
  createPantMeasurement,
  createShirtMeasurement,
  getPantMeasurementById,
  getShirtMeasurementById,
} from '../../services/measurementApi';
import PageTabs from '../../components/common/PageTabs';
import {
  createMeasurementState,
  getMeasurementFieldLabel,
  pantMeasurementFields,
  shirtMeasurementFields,
} from '../../constants/measurementFields';

const shirtFields = shirtMeasurementFields.map((field) => field.key);
const pantFields = pantMeasurementFields.map((field) => field.key);
const FIXED_MEASUREMENT_ID = '101';

const normalizeCustomer = (customer = {}) => ({
  ...customer,
  id: customer.id ?? customer.custId ?? customer.customerId ?? '',
  name: customer.name ?? customer.custName ?? customer.customerName ?? '',
  mobileNumber: customer.mobileNumber ?? customer.custMobileNumber ?? customer.phone ?? customer.mobile ?? '',
  address: customer.address ?? customer.custAddress ?? customer.customerAddress ?? '',
  shirtMeasurements: customer.shirtMeasurements ?? customer.measurements?.shirtMeasurements ?? {},
  pantMeasurements: customer.pantMeasurements ?? customer.measurements?.pantMeasurements ?? {},
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

const extractList = (payload) => {
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

const normalizeMeasurement = (measurement = {}) => ({
  id: measurement.id ?? measurement.measurementId ?? measurement.customerId ?? '',
  customerId: measurement.customerId ?? measurement.custId ?? measurement.customer?.id ?? '',
  customerName: measurement.customerName ?? measurement.customer?.name ?? '',
  shirtMeasurements: measurement.shirtMeasurements ?? {
    length: measurement.length ?? measurement.shirtLength ?? '',
    chest: measurement.chest ?? '',
    waist: measurement.waist ?? '',
    hip: measurement.shirtHip ?? measurement.hip ?? '',
    shoulder: measurement.shoulder ?? '',
    sleeve: measurement.sleeve ?? '',
    neck: measurement.neck ?? measurement.collar ?? '',
    cuff: measurement.cuff ?? '',
  },
  pantMeasurements: measurement.pantMeasurements ?? {
    length: measurement.pantLength ?? '',
    waist: measurement.pantWaist ?? measurement.waist ?? '',
    hip: measurement.hip ?? '',
    thigh: measurement.thigh ?? '',
    knee: measurement.knee ?? '',
    calf: measurement.calf ?? '',
    bottom: measurement.bottom ?? '',
  },
  notes: measurement.notes ?? '',
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

const buildEmptyForm = () => ({
  measurementId: FIXED_MEASUREMENT_ID,
  customerId: '',
  customerName: '',
  shirtMeasurements: createMeasurementState(shirtMeasurementFields),
  pantMeasurements: createMeasurementState(pantMeasurementFields),
  notes: '',
});

const buildFormFromCustomer = (customer = {}, measurement = {}) => ({
  measurementId: FIXED_MEASUREMENT_ID,
  customerId: customer.id ?? measurement.customerId ?? '',
  customerName: customer.name ?? measurement.customerName ?? '',
  shirtMeasurements: shirtFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.shirtMeasurements?.[field] ?? customer.shirtMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  pantMeasurements: pantFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.pantMeasurements?.[field] ?? customer.pantMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  notes: measurement.notes ?? '',
});

const buildMeasurementPayload = (formData, customer = null) => {
  const shirtMeasurements = { ...formData.shirtMeasurements };
  const pantMeasurements = { ...formData.pantMeasurements };

  return {
    measurementId: FIXED_MEASUREMENT_ID,
    id: FIXED_MEASUREMENT_ID,
    customerId: formData.customerId.trim(),
    custId: formData.customerId.trim(),
    customerName: formData.customerName.trim(),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          mobileNumber: customer.mobileNumber,
          address: customer.address,
        }
      : undefined,
    shirtMeasurements,
    pantMeasurements,
    notes: formData.notes.trim(),
    neck: shirtMeasurements.neck,
    chest: shirtMeasurements.chest,
    waist: shirtMeasurements.waist,
    shoulder: shirtMeasurements.shoulder,
    sleeve: shirtMeasurements.sleeve,
    length: shirtMeasurements.length,
    shirtLength: shirtMeasurements.length,
    collar: shirtMeasurements.neck,
    cuff: shirtMeasurements.cuff,
    shirtHip: shirtMeasurements.hip,
    pantWaist: pantMeasurements.waist,
    pantLength: pantMeasurements.length,
    hip: pantMeasurements.hip,
    thigh: pantMeasurements.thigh,
    knee: pantMeasurements.knee,
    calf: pantMeasurements.calf,
    bottom: pantMeasurements.bottom,
  };
};

const buildShirtMeasurementPayload = (formData, customer = null) => ({
  customerId: formData.customerId.trim(),
  custId: formData.customerId.trim(),
  customerName: formData.customerName.trim(),
  customer: customer
    ? {
        id: customer.id,
        name: customer.name,
        mobileNumber: customer.mobileNumber,
        address: customer.address,
      }
    : undefined,
  shirtMeasurements: { ...formData.shirtMeasurements },
  ...formData.shirtMeasurements,
  notes: formData.notes.trim(),
});

const buildPantMeasurementPayload = (formData, customer = null) => ({
  customerId: formData.customerId.trim(),
  custId: formData.customerId.trim(),
  customerName: formData.customerName.trim(),
  customer: customer
    ? {
        id: customer.id,
        name: customer.name,
        mobileNumber: customer.mobileNumber,
        address: customer.address,
      }
    : undefined,
  pantMeasurements: { ...formData.pantMeasurements },
  pantLength: formData.pantMeasurements.length,
  pantWaist: formData.pantMeasurements.waist,
  hip: formData.pantMeasurements.hip,
  thigh: formData.pantMeasurements.thigh,
  knee: formData.pantMeasurements.knee,
  calf: formData.pantMeasurements.calf,
  bottom: formData.pantMeasurements.bottom,
  notes: formData.notes.trim(),
});

const hasMeasurementValues = (customer = {}) =>
  shirtFields.some((field) => customer.shirtMeasurements?.[field]) ||
  pantFields.some((field) => customer.pantMeasurements?.[field]);

const getDeliverySummary = (customer = {}) => ({
  status: customer.deliveryStatus ?? customer.delivery?.status ?? customer.delivery?.deliveryStatus ?? customer.orderStatus ?? 'Pending',
  date: customer.deliveryDate ?? customer.delivery?.date ?? customer.delivery?.deliveryDate ?? customer.deliveredAt ?? customer.deliveryAt ?? null,
  item: customer.deliveryItem ?? customer.delivery?.item ?? customer.delivery?.items ?? customer.orderItem ?? 'Tailoring item',
});

const hasMeasurementRecord = (measurement = null) =>
  Boolean(measurement?.id || measurement?.measurementId || hasMeasurementValues(measurement || {}));

const MeasurementPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeViewMeasurementTab, setActiveViewMeasurementTab] = useState(0);
  const [activeFormMeasurementTab, setActiveFormMeasurementTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [lookupId, setLookupId] = useState('');
  const [viewLookupId, setViewLookupId] = useState('');
  const [formData, setFormData] = useState(buildEmptyForm());
  const [formMode, setFormMode] = useState('create');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers();
      setCustomers(extractList(response?.data).map(normalizeCustomer));
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to load customers.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await getCustomers();
        if (active) {
          setCustomers(extractList(response?.data).map(normalizeCustomer));
        }
      } catch {
        if (active) {
          setFeedback({
            type: 'error',
            message: 'Unable to load customers.',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      active = false;
    };
  }, []);

  const selectedMeasurementView = useMemo(
    () => selectedMeasurement ?? (selectedCustomer ? normalizeMeasurement(selectedCustomer) : null),
    [selectedCustomer, selectedMeasurement],
  );

  const fetchCustomerWithMeasurements = async (customerId) => {
    const customerResponse = await getCustomerById(customerId);
    const customer = normalizeCustomer(customerResponse?.data);

    if (!customer.id && !customer.name) {
      throw new Error('No customer found for that ID.');
    }

    const [shirtResult, pantResult] = await Promise.allSettled([
      getShirtMeasurementById(customer.id || customerId),
      getPantMeasurementById(customer.id || customerId),
    ]);

    const shirtData = shirtResult.status === 'fulfilled' ? shirtResult.value?.data ?? {} : {};
    const pantData = pantResult.status === 'fulfilled' ? pantResult.value?.data ?? {} : {};

    let measurement = normalizeMeasurement({
      customerId: customer.id || customerId,
      customerName: customer.name || '',
      shirtMeasurements: normalizeShirtMeasurements(shirtData),
      pantMeasurements: normalizePantMeasurements(pantData),
      notes: shirtData.notes ?? pantData.notes ?? '',
    });

    if (!hasMeasurementValues(measurement)) {
      measurement = normalizeMeasurement(customer);
    }

    return { customer, measurement };
  };

  const loadCustomerById = async () => {
    const searchText = lookupId.trim();
    if (!searchText) {
      setFeedback({ type: 'error', message: 'Enter a customer ID first.' });
      return;
    }

    setLookupLoading(true);
    try {
      const { customer, measurement } = await fetchCustomerWithMeasurements(searchText);

      setSelectedCustomer(customer);
      setSelectedMeasurement(measurement);
      setFeedback({ type: 'success', message: 'Customer loaded successfully.' });
      setActiveTab(1);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to load that customer.',
      });
      setSelectedCustomer(null);
      setSelectedMeasurement(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const loadMeasurementByIdForView = async () => {
    const searchText = viewLookupId.trim();
    if (!searchText) {
      setFeedback({ type: 'error', message: 'Enter a customer ID to view measurements.' });
      return;
    }

    setLookupLoading(true);
    try {
      const { customer, measurement } = await fetchCustomerWithMeasurements(searchText);
      setSelectedCustomer(customer);
      setSelectedMeasurement(measurement);
      setFeedback({ type: 'success', message: 'Measurement loaded successfully.' });
      setActiveTab(3);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to load measurement for that customer ID.',
      });
      setSelectedCustomer(null);
      setSelectedMeasurement(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const openCustomerDetails = async (customer, defaultMeasurementTab = 0) => {
    const normalizedCustomer = normalizeCustomer(customer);
    const customerId = normalizedCustomer.id;

    setLookupLoading(true);
    try {
      if (!customerId) {
        setSelectedCustomer(normalizedCustomer);
        setSelectedMeasurement(normalizeMeasurement(normalizedCustomer));
      } else {
        const { customer: loadedCustomer, measurement } = await fetchCustomerWithMeasurements(customerId);
        setSelectedCustomer(loadedCustomer);
        setSelectedMeasurement(measurement);
      }

      setActiveViewMeasurementTab(defaultMeasurementTab);
      setFeedback(null);
      setActiveTab(1);
    } catch {
      setSelectedCustomer(normalizedCustomer);
      setSelectedMeasurement(normalizeMeasurement(normalizedCustomer));
      setActiveViewMeasurementTab(defaultMeasurementTab);
      setActiveTab(1);
      setFeedback({
        type: 'info',
        message: 'Customer loaded, but detailed measurements could not be fetched from server.',
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('shirtMeasurements.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        shirtMeasurements: {
          ...prev.shirtMeasurements,
          [key]: value,
        },
      }));
      return;
    }

    if (name.startsWith('pantMeasurements.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pantMeasurements: {
          ...prev.pantMeasurements,
          [key]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const beginNewMeasurement = () => {
    setFormMode('create');
    setFormData(buildEmptyForm());
    setActiveFormMeasurementTab(0);
    setSelectedCustomer(null);
    setSelectedMeasurement(null);
    setFeedback(null);
    setActiveTab(2);
  };

  const beginEditingMeasurement = async (customer, measurementTab = 0) => {
    const normalizedCustomer = normalizeCustomer(customer);
    setFormMode('edit');
    setSelectedCustomer(normalizedCustomer);
    setActiveFormMeasurementTab(measurementTab);
    setFeedback(null);
    setActiveTab(2);

    const [shirtResult, pantResult] = await Promise.allSettled([
      getShirtMeasurementById(normalizedCustomer.id),
      getPantMeasurementById(normalizedCustomer.id),
    ]);

    const shirtData =
      shirtResult.status === 'fulfilled' ? shirtResult.value?.data ?? {} : {};
    const pantData =
      pantResult.status === 'fulfilled' ? pantResult.value?.data ?? {} : {};

    const measurement = normalizeMeasurement({
      customerId: normalizedCustomer.id,
      customerName: normalizedCustomer.name,
      shirtMeasurements: normalizeShirtMeasurements(shirtData),
      pantMeasurements: normalizePantMeasurements(pantData),
      notes: shirtData.notes ?? pantData.notes ?? '',
    });

    if (hasMeasurementValues(measurement)) {
      setSelectedMeasurement(measurement);
      setFormData(buildFormFromCustomer(normalizedCustomer, measurement));
      setFormMode('edit');
    } else {
      setSelectedMeasurement(null);
      setFormData(buildFormFromCustomer(normalizedCustomer));
      setFeedback({
        type: 'info',
        message: 'No measurement profile was found for this customer. Fill the required values and save.',
      });
      setFormMode('create');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.customerId.trim()) {
      setFeedback({ type: 'error', message: 'Customer ID is required.' });
      return;
    }

    setSaving(true);
    try {
      let customerForPayload = selectedCustomer;

      if (!customerForPayload?.id && formData.customerId.trim()) {
        try {
          const customerResponse = await getCustomerById(formData.customerId.trim());
          customerForPayload = normalizeCustomer(customerResponse?.data);
          if (customerForPayload?.id) {
            setSelectedCustomer(customerForPayload);
          }
        } catch {
          customerForPayload = selectedCustomer;
        }
      }

      const mergedPayload = buildMeasurementPayload(formData, customerForPayload);

      if (activeFormMeasurementTab === 0) {
        await createShirtMeasurement(buildShirtMeasurementPayload(formData, customerForPayload));
      } else {
        await createPantMeasurement(buildPantMeasurementPayload(formData, customerForPayload));
      }

      setFeedback({
        type: 'success',
        message: activeFormMeasurementTab === 0
          ? 'Shirt measurement saved successfully.'
          : 'Pant measurement saved successfully.',
      });
      setFormMode('edit');

      if (selectedCustomer?.id) {
        try {
          await updateCustomer(formData.customerId, {
            custName: selectedCustomer?.name || formData.customerName || '',
            custMobileNumber: selectedCustomer?.mobileNumber || '',
            custAddress: selectedCustomer?.address || '',
            shirtMeasurements: mergedPayload.shirtMeasurements,
            pantMeasurements: mergedPayload.pantMeasurements,
          });

          const refreshedCustomerResponse = await getCustomerById(formData.customerId);
          const refreshedCustomer = normalizeCustomer(refreshedCustomerResponse?.data);
          setSelectedCustomer(refreshedCustomer);
          setCustomers((prev) =>
            prev.map((customer) =>
              String(customer.id) === String(refreshedCustomer.id) ? refreshedCustomer : customer,
            ),
          );
        } catch {
          setFeedback((current) => current ?? {
            type: 'info',
            message: 'Measurement saved. Customer profile sync could not be refreshed.',
          });
        }
      }

      setSelectedMeasurement((previous) => {
        const base = previous ?? normalizeMeasurement();
        return {
          ...base,
          id: previous?.id || formData.customerId,
          measurementId: FIXED_MEASUREMENT_ID,
          customerId: formData.customerId,
          customerName: customerForPayload?.name || formData.customerName,
          shirtMeasurements:
            activeFormMeasurementTab === 0
              ? { ...formData.shirtMeasurements }
              : base.shirtMeasurements,
          pantMeasurements:
            activeFormMeasurementTab === 1
              ? { ...formData.pantMeasurements }
              : base.pantMeasurements,
          notes: formData.notes,
        };
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to save measurement.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Measurements
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View all customers, open a single customer by ID, and maintain one shirt and one pant measurement profile per customer.
          </Typography>
        </Box>
       {/* <Button variant="contained" startIcon={<AddIcon />} onClick={beginNewMeasurement}>
          New Customer Measurement
        </Button> 
        */}

      </Stack>

      <Stack sx={{ mb: 2 }}>
        <PageTabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            if (value === 0) {
              loadCustomers();
            }
          }}
          sx={{ minHeight: 44 }}
          tabs={[
            { label: 'All Customers' },
            { label: 'Customer Details' },
            { label: 'Add / Edit Measurement' },
            { label: 'View Measurement' },
          ]}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, maxWidth: 520 }}>
        <TextField
          size="small"
          label="Customer ID"
          value={lookupId}
          onChange={(event) => setLookupId(event.target.value)}
        />
        <Button variant="outlined" startIcon={<SearchIcon />} onClick={loadCustomerById} disabled={lookupLoading}>
          {lookupLoading ? 'Searching...' : 'Find Customer'}
        </Button>
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3 }}>
          {feedback.message}
        </Alert>
      )}

      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">All Customers</Typography>
              <Typography variant="body2" color="text.secondary">
                Browse every customer and open their single measurement profile.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={loadCustomers} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Measurement Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No customers found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>{customer.id}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.mobileNumber}</TableCell>
                      <TableCell>{hasMeasurementValues(customer) ? 'Saved' : 'Not added yet'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => {
                            openCustomerDetails(customer, 0);
                          }}>
                            View
                          </Button>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => beginEditingMeasurement(customer, 0)}>
                            Edit Shirt
                          </Button>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => beginEditingMeasurement(customer, 1)}>
                            Edit Pant
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Customer Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search a customer by ID to review their profile and saved measurements.
              </Typography>

              {!selectedCustomer ? (
                <Typography color="text.secondary">Load a customer from the search box or the table.</Typography>
              ) : (
                <Stack spacing={1.2}>
                  <Typography><strong>ID:</strong> {selectedCustomer.id}</Typography>
                  <Typography><strong>Name:</strong> {selectedCustomer.name}</Typography>
                  <Typography><strong>Mobile:</strong> {selectedCustomer.mobileNumber}</Typography>
                  <Typography><strong>Address:</strong> {selectedCustomer.address}</Typography>
                  <Typography><strong>Measurement status:</strong> {hasMeasurementValues(selectedMeasurementView || selectedCustomer) ? 'Saved' : 'Not added yet'}</Typography>
                  <Typography><strong>Measurement notes:</strong> {selectedMeasurementView?.notes || 'No notes added'}</Typography>
                  <Typography><strong>Delivery status:</strong> {getDeliverySummary(selectedCustomer).status}</Typography>
                  <Typography><strong>Delivery item:</strong> {getDeliverySummary(selectedCustomer).item}</Typography>
                  <Typography><strong>Delivery date:</strong> {getDeliverySummary(selectedCustomer).date || 'Not available'}</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                    <Button variant="contained" startIcon={<EditIcon />} onClick={() => beginEditingMeasurement(selectedCustomer, 0)}>
                      {hasMeasurementRecord(selectedMeasurementView || selectedCustomer) ? 'Edit Shirt Measurement' : 'Add Shirt Measurement'}
                    </Button>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => beginEditingMeasurement(selectedCustomer, 1)}>
                      {hasMeasurementRecord(selectedMeasurementView || selectedCustomer) ? 'Edit Pant Measurement' : 'Add Pant Measurement'}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Measurement Preview
              </Typography>

              <Stack sx={{ mb: 2 }}>
                <PageTabs
                  value={activeViewMeasurementTab}
                  onChange={(_, value) => setActiveViewMeasurementTab(value)}
                  sx={{ minHeight: 40 }}
                  tabs={[
                    { label: 'Shirt Measurement' },
                    { label: 'Pant Measurement' },
                  ]}
                />
              </Stack>

              {!selectedMeasurementView ? (
                <Typography color="text.secondary">No measurement selected.</Typography>
              ) : (
                <Stack spacing={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Customer ID: {selectedMeasurementView.customerId || selectedCustomer?.id || '-'}
                      </Typography>

                      {activeViewMeasurementTab === 0 ? (
                        <>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            Shirt Measurements
                          </Typography>
                          <Grid container spacing={1.5}>
                            {shirtMeasurementFields.map((field) => (
                              <Grid item xs={6} sm={4} key={field.key}>
                                <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {field.marathi}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {field.english}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {selectedMeasurementView.shirtMeasurements?.[field.key] || '-'}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            Pant Measurements
                          </Typography>
                          <Grid container spacing={1.5}>
                            {pantMeasurementFields.map((field) => (
                              <Grid item xs={6} sm={4} key={field.key}>
                                <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {field.marathi}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {field.english}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {selectedMeasurementView.pantMeasurements?.[field.key] || '-'}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </>
                      )}

                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedMeasurementView?.notes || 'No notes added for this measurement profile.'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">{formMode === 'edit' ? 'Edit Measurement Profile' : 'Add Measurement Profile'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage shirt and pant measurements separately using the tabs below.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={beginNewMeasurement}>
              Clear Form
            </Button>
          </Stack>

          <Stack sx={{ mb: 2 }}>
            <PageTabs
              value={activeFormMeasurementTab}
              onChange={(_, value) => setActiveFormMeasurementTab(value)}
              sx={{ minHeight: 40 }}
              tabs={[
                { label: 'Shirt Measurement Form' },
                { label: 'Pant Measurement Form' },
              ]}
            />
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Customer ID"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleFieldChange}
                    fullWidth
                    required
                    disabled={Boolean(selectedCustomer?.id)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleFieldChange}
                    fullWidth
                  />
                  
                </Grid>
                {/*
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Measurement ID"
                    name="measurementId"
                    value={formData.measurementId}
                    fullWidth
                    disabled
                  />
                </Grid>
                */}
              </Grid>

              <Divider />

              {activeFormMeasurementTab === 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Shirt Measurements
                  </Typography>
                  <Grid container spacing={2}>
                    {shirtMeasurementFields.map((field) => (
                      <Grid item xs={12} sm={6} md={4} key={field.key}>
                        <TextField
                          label={getMeasurementFieldLabel(field)}
                          name={`shirtMeasurements.${field.key}`}
                          value={formData.shirtMeasurements[field.key]}
                          onChange={handleFieldChange}
                          fullWidth
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Pant Measurements
                  </Typography>
                  <Grid container spacing={2}>
                    {pantMeasurementFields.map((field) => (
                      <Grid item xs={12} sm={6} md={4} key={field.key}>
                        <TextField
                          label={getMeasurementFieldLabel(field)}
                          name={`pantMeasurements.${field.key}`}
                          value={formData.pantMeasurements[field.key]}
                          onChange={handleFieldChange}
                          fullWidth
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFieldChange}
                fullWidth
                multiline
                rows={3}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button type="submit" variant="contained" startIcon={formMode === 'edit' ? <EditIcon /> : <AddIcon />} disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : formMode === 'edit'
                      ? activeFormMeasurementTab === 0
                        ? 'Update Shirt Measurement'
                        : 'Update Pant Measurement'
                      : activeFormMeasurementTab === 0
                        ? 'Save Shirt Measurement'
                        : 'Save Pant Measurement'}
                </Button>
                <Button variant="outlined" onClick={() => setActiveTab(0)}>
                  Back to customers
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, maxWidth: 560 }}>
            <TextField
              size="small"
              label="Customer ID"
              value={viewLookupId}
              onChange={(event) => setViewLookupId(event.target.value)}
            />
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={loadMeasurementByIdForView}
              disabled={lookupLoading}
            >
              {lookupLoading ? 'Searching...' : 'View Measurement'}
            </Button>
          </Stack>

          {!selectedCustomer ? (
            <Typography color="text.secondary">Enter a customer ID and click View Measurement.</Typography>
          ) : (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {selectedCustomer.name || 'Customer'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer ID: {selectedCustomer.id || '-'}
                </Typography>
              </Box>

              <Stack sx={{ mb: 1 }}>
                <PageTabs
                  value={activeViewMeasurementTab}
                  onChange={(_, value) => setActiveViewMeasurementTab(value)}
                  sx={{ minHeight: 40 }}
                  tabs={[
                    { label: 'Shirt Measurement' },
                    { label: 'Pant Measurement' },
                  ]}
                />
              </Stack>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {activeViewMeasurementTab === 0 ? 'Shirt Measurement Card' : 'Pant Measurement Card'}
                  </Typography>

                  <Grid container spacing={1.5}>
                    {(activeViewMeasurementTab === 0 ? shirtMeasurementFields : pantMeasurementFields).map((field) => (
                      <Grid item xs={6} sm={4} key={field.key}>
                        <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                          <Typography variant="caption" color="text.secondary">
                            {field.marathi}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {field.english}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {activeViewMeasurementTab === 0
                              ? selectedMeasurementView?.shirtMeasurements?.[field.key] || '-'
                              : selectedMeasurementView?.pantMeasurements?.[field.key] || '-'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default MeasurementPage;