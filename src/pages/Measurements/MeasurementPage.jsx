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
  getMeasurementById,
  getMeasurements,
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

const resolveMeasurementMap = (value, fallback = {}) => {
  const extracted = unwrapMeasurementPayload(value ?? fallback);
  if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
    return {};
  }
  return extracted;
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
    shirtMeasurements: {
      ...flatShirtFromCustomer,
      ...resolveMeasurementMap(
        safeCustomer.shirtMeasurements ?? safeCustomer.shirtMeasurement ?? safeCustomer.measurements?.shirtMeasurements ?? safeCustomer.measurements?.shirtMeasurement ?? safeCustomer.measurement?.shirtMeasurements ?? safeCustomer.measurement?.shirtMeasurement ?? {}
      ),
    },
    pantMeasurements: {
      ...flatPantFromCustomer,
      ...resolveMeasurementMap(
        safeCustomer.pantMeasurements ?? safeCustomer.pantMeasurement ?? safeCustomer.measurements?.pantMeasurements ?? safeCustomer.measurements?.pantMeasurement ?? safeCustomer.measurement?.pantMeasurements ?? safeCustomer.measurement?.pantMeasurement ?? {}
      ),
    },
    measurementNotes: unwrapMeasurementPayload(safeCustomer.measurementNotes ?? { shirt: safeCustomer.notes ?? '', pant: safeCustomer.notes ?? '' }),
  };
};

const coalesceMeasurementSource = (...sources) => {
  for (const source of sources) {
    const candidate = unwrapMeasurementPayload(source ?? {});
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate) && Object.keys(candidate).length > 0) {
      return candidate;
    }
  }
  return {};
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

const normalizeMeasurement = (measurement = {}) => {
  const root = unwrapMeasurementPayload(measurement);
  const shirtSource = resolveMeasurementMap(
    root.shirtMeasurements ?? root.shirtMeasurement ?? root.measurements?.shirtMeasurements ?? root.measurements?.shirtMeasurement ?? root.measurement?.shirtMeasurements ?? root.measurement?.shirtMeasurement ?? {}
  );
  const pantSource = resolveMeasurementMap(
    root.pantMeasurements ?? root.pantMeasurement ?? root.measurements?.pantMeasurements ?? root.measurements?.pantMeasurement ?? root.measurement?.pantMeasurements ?? root.measurement?.pantMeasurement ?? {}
  );

  return {
    id: root.id ?? root.measurementId ?? root.customerId ?? '',
    customerId: root.customerId ?? root.custId ?? root.customer?.id ?? '',
    customerName: root.customerName ?? root.customer?.name ?? '',
    shirtMeasurements: normalizeShirtMeasurements({ ...root, ...shirtSource }),
    pantMeasurements: normalizePantMeasurements({ ...root, ...pantSource }),
    notes: root.notes ?? root.measurementNotes?.shirt ?? root.measurementNotes?.pant ?? '',
  };
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

const hasAnyValue = (values = {}) =>
  Object.values(values || {}).some((value) => value !== null && value !== undefined && String(value).trim() !== '');

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
    let customer = null;

    try {
      const customerResponse = await getCustomerById(customerId);
      customer = normalizeCustomer(customerResponse?.data);
    } catch {
      const customerListResponse = await getCustomers();
      const list = extractList(customerListResponse?.data).map(normalizeCustomer);
      customer = list.find((item) => String(item.id) === String(customerId)) ?? null;
    }

    if (!customer?.id && !customer?.name) {
      const customerListResponse = await getCustomers();
      const list = extractList(customerListResponse?.data).map(normalizeCustomer);
      customer = list.find((item) => String(item.id) === String(customerId)) ?? null;
    }

    if (!customer?.id && !customer?.name) {
      customer = null;
    }

    const lookupId = customer?.id || customerId;

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

    const customerShirt = coalesceMeasurementSource(customer?.shirtMeasurements, customer?.shirtMeasurement, customer?.measurements?.shirtMeasurements, customer?.measurements?.shirtMeasurement, customer?.measurement?.shirtMeasurements, customer?.measurement?.shirtMeasurement, genericData.shirtMeasurements, genericData.shirtMeasurement, shirtData.shirtMeasurements, shirtData.shirtMeasurement, listData.shirtMeasurements, listData.shirtMeasurement);
    const customerPant = coalesceMeasurementSource(customer?.pantMeasurements, customer?.pantMeasurement, customer?.measurements?.pantMeasurements, customer?.measurements?.pantMeasurement, customer?.measurement?.pantMeasurements, customer?.measurement?.pantMeasurement, genericData.pantMeasurements, genericData.pantMeasurement, pantData.pantMeasurements, pantData.pantMeasurement, listData.pantMeasurements, listData.pantMeasurement);

    const unifiedShirt = {
      ...stripEmptyValues(listData),
      ...stripEmptyValues(genericData),
      ...stripEmptyValues(customerShirt),
      ...stripEmptyValues(shirtData),
    };
    const unifiedPant = {
      ...stripEmptyValues(listData),
      ...stripEmptyValues(genericData),
      ...stripEmptyValues(customerPant),
      ...stripEmptyValues(pantData),
    };

    if (!customer) {
      const derivedCustomerId = genericData.customerId ?? shirtData.customerId ?? pantData.customerId ?? listData.customerId ?? listData.custId ?? customerId;
      const derivedCustomerName = genericData.customerName ?? shirtData.customerName ?? pantData.customerName ?? listData.customerName ?? listData.customer?.name ?? '';

      customer = normalizeCustomer({
        id: derivedCustomerId,
        customerId: derivedCustomerId,
        name: derivedCustomerName,
        customerName: derivedCustomerName,
      });
    }

    let measurement = normalizeMeasurement({
      customerId: customer?.id || customerId,
      customerName: customer.name || '',
      shirtMeasurements: normalizeShirtMeasurements(unifiedShirt),
      pantMeasurements: normalizePantMeasurements(unifiedPant),
      notes: unifiedShirt.notes ?? unifiedPant.notes ?? listData.notes ?? genericData.notes ?? shirtData.notes ?? pantData.notes ?? '',
    });

    const hasShirt = hasAnyValue(measurement.shirtMeasurements);
    const hasPant = hasAnyValue(measurement.pantMeasurements);
    const hasCustomer = Boolean(customer?.id || customer?.name);

    if (!hasCustomer && !hasShirt && !hasPant) {
      throw new Error('No customer or measurement found for that ID.');
    }

    if (!hasMeasurementValues(measurement)) {
      measurement = normalizeMeasurement({
        ...customer,
        shirtMeasurements: coalesceMeasurementSource(customer.shirtMeasurements, customerShirt, unifiedShirt),
        pantMeasurements: coalesceMeasurementSource(customer.pantMeasurements, customerPant, unifiedPant),
      });
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
      setFormData(buildFormFromCustomer(customer, measurement));
      setFormMode(hasMeasurementRecord(measurement) ? 'edit' : 'create');
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

    const customerId = formData.customerId.trim() || String(selectedCustomer?.id ?? '').trim();

    if (!customerId) {
      setFeedback({ type: 'error', message: 'Customer ID is required.' });
      return;
    }

    setSaving(true);
    try {
      let customerForPayload = selectedCustomer;
      const measurementFormData = {
        ...formData,
        customerId,
        customerName: formData.customerName || selectedCustomer?.name || '',
      };

      if (!customerForPayload?.id) {
        try {
          const customerResponse = await getCustomerById(customerId);
          customerForPayload = normalizeCustomer(customerResponse?.data);
          if (customerForPayload?.id) {
            setSelectedCustomer(customerForPayload);
          }
        } catch {
          customerForPayload = selectedCustomer;
        }
      }

      const mergedPayload = buildMeasurementPayload(measurementFormData, customerForPayload);

      if (activeFormMeasurementTab === 0) {
        await createShirtMeasurement(buildShirtMeasurementPayload(measurementFormData, customerForPayload));
      } else {
        await createPantMeasurement(buildPantMeasurementPayload(measurementFormData, customerForPayload));
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
          await updateCustomer(customerId, {
            custName: selectedCustomer?.name || measurementFormData.customerName || '',
            custMobileNumber: selectedCustomer?.mobileNumber || '',
            custAddress: selectedCustomer?.address || '',
            shirtMeasurements: mergedPayload.shirtMeasurements,
            pantMeasurements: mergedPayload.pantMeasurements,
          });

          const refreshedCustomerResponse = await getCustomerById(customerId);
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
          id: previous?.id || customerId,
          measurementId: FIXED_MEASUREMENT_ID,
          customerId,
          customerName: customerForPayload?.name || measurementFormData.customerName,
          shirtMeasurements:
            activeFormMeasurementTab === 0
              ? { ...measurementFormData.shirtMeasurements }
              : base.shirtMeasurements,
          pantMeasurements:
            activeFormMeasurementTab === 1
              ? { ...measurementFormData.pantMeasurements }
              : base.pantMeasurements,
          notes: measurementFormData.notes,
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
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">No customers found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>{customer.id}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.mobileNumber}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                           {/* <Button size="small" onClick={() => {
                            openCustomerDetails(customer, 0);
                          }}>
                            View 
                          </Button> */}
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