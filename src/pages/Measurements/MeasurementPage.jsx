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
import SearchIcon from '@mui/icons-material/Search';
import {
  getCustomerById,
  getCustomers,
  updateCustomer,
} from '../../services/api';
import {
  createBlazerMeasurement,
  createJacketMeasurement,
  createPantMeasurement,
  createSherwaniMeasurement,
  createShirtMeasurement,
  getBlazerMeasurementById,
  getJacketMeasurementById,
  getMeasurementById,
  getMeasurements,
  getPantMeasurementById,
  getSherwaniMeasurementById,
  getShirtMeasurementById,
} from '../../services/measurementApi';
import PageTabs from '../../components/common/PageTabs';
import {
  createMeasurementState,
  blazerMeasurementFields,
  getMeasurementFieldLabel,
  jacketMeasurementFields,
  measurementBackendKeys,
  pantMeasurementFields,
  sherwaniMeasurementFields,
  shirtMeasurementFields,
} from '../../constants/measurementFields';

const shirtFields = shirtMeasurementFields.map((field) => field.key);
const pantFields = pantMeasurementFields.map((field) => field.key);
const jacketFields = jacketMeasurementFields.map((field) => field.key);
const blazerFields = blazerMeasurementFields.map((field) => field.key);
const sherwaniFields = sherwaniMeasurementFields.map((field) => field.key);
const measurementTypes = [
  { key: 'shirt', label: 'Shirt Measurement', formKey: 'shirtMeasurements', fields: shirtMeasurementFields },
  { key: 'pant', label: 'Pant Measurement', formKey: 'pantMeasurements', fields: pantMeasurementFields },
  { key: 'jacket', label: 'Jacket Measurement', formKey: 'jacketMeasurements', fields: jacketMeasurementFields },
  { key: 'blazer', label: 'Blazer Measurement', formKey: 'blazerMeasurements', fields: blazerMeasurementFields },
  { key: 'sherwani', label: 'Sherwani Measurement', formKey: 'sherwaniMeasurements', fields: sherwaniMeasurementFields },
];
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

const sanitizeMeasurementValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const lowered = trimmed.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined' || lowered === 'nan') {
      return '';
    }

    return trimmed;
  }
  return value;
};

const toTrimmedString = (value) => String(value ?? '').trim();

const normalizeLookupKey = (key = '') =>
  String(key)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const pickMeasurementValue = (source = {}, aliases = []) => {
  if (!source || typeof source !== 'object') return '';

  const normalizedAliases = aliases.map((alias) => normalizeLookupKey(alias));

  for (const alias of normalizedAliases) {
    const direct = sanitizeMeasurementValue(source[alias]);
    if (direct !== '') return direct;
  }

  for (const alias of aliases) {
    const exact = sanitizeMeasurementValue(source[alias]);
    if (exact !== '') return exact;
  }

  const entries = Object.entries(source);
  for (const alias of normalizedAliases) {
    const found = entries.find(([key]) => normalizeLookupKey(key) === alias);
    if (found) {
      const value = sanitizeMeasurementValue(found[1]);
      if (value !== '') return value;
    }
  }

  for (const alias of normalizedAliases) {
    const contained = entries.find(([key]) => normalizeLookupKey(key).includes(alias));
    if (contained) {
      const value = sanitizeMeasurementValue(contained[1]);
      if (value !== '') return value;
    }
  }

  return '';
};

const formatMeasurementDisplay = (value) => {
  const sanitized = sanitizeMeasurementValue(value);
  return sanitized === '' ? '-' : sanitized;
};

const mergeMissingMeasurementValues = (primary = {}, fallback = {}) => {
  const keys = new Set([
    ...Object.keys(primary || {}),
    ...Object.keys(fallback || {}),
  ]);

  const merged = {};
  keys.forEach((key) => {
    const primaryValue = sanitizeMeasurementValue(primary?.[key]);
    if (primaryValue !== '') {
      merged[key] = primaryValue;
      return;
    }

    merged[key] = sanitizeMeasurementValue(fallback?.[key]);
  });

  return merged;
};

const getMeasurementNoteByTab = (measurement = {}, customer = {}, activeTab = 0) => {
  const tabKey = measurementTypes[activeTab]?.key || 'shirt';
  const tabNote = sanitizeMeasurementValue(measurement?.measurementNotes?.[tabKey]);
  if (tabNote !== '') return tabNote;

  const customerTabNote = sanitizeMeasurementValue(customer?.measurementNotes?.[tabKey]);
  if (customerTabNote !== '') return customerTabNote;

  return 'No notes added for this measurement profile.';
};

const getMeasurementNote = (source = {}, typeKey, allowLegacyNote = false) => {
  const root = unwrapMeasurementPayload(source);
  const scopedNote = sanitizeMeasurementValue(root.measurementNotes?.[typeKey]);
  if (scopedNote !== '') return scopedNote;

  return allowLegacyNote ? sanitizeMeasurementValue(root.notes) : '';
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
        safeCustomer.shirtMeasurements ?? safeCustomer.shirtMeasuremet ?? safeCustomer.shirtMeasurement ?? safeCustomer.measurements?.shirtMeasurements ?? safeCustomer.measurements?.shirtMeasuremet ?? safeCustomer.measurements?.shirtMeasurement ?? safeCustomer.measurement?.shirtMeasurements ?? safeCustomer.measurement?.shirtMeasuremet ?? safeCustomer.measurement?.shirtMeasurement ?? {}
      ),
    },
    pantMeasurements: {
      ...flatPantFromCustomer,
      ...resolveMeasurementMap(
        safeCustomer.pantMeasurements ?? safeCustomer.pantMeasuremet ?? safeCustomer.pantMeasurement ?? safeCustomer.measurements?.pantMeasurements ?? safeCustomer.measurements?.pantMeasuremet ?? safeCustomer.measurements?.pantMeasurement ?? safeCustomer.measurement?.pantMeasurements ?? safeCustomer.measurement?.pantMeasuremet ?? safeCustomer.measurement?.pantMeasurement ?? {}
      ),
    },
    jacketMeasurements: normalizeMeasurementFields(
      safeCustomer.jacketMeasurements ?? safeCustomer.jacketMeasuremet ?? safeCustomer.jacketMeasurement ?? safeCustomer.measurements?.jacketMeasurements ?? safeCustomer.measurements?.jacketMeasuremet ?? safeCustomer.measurements?.jacketMeasurement ?? safeCustomer.measurement?.jacketMeasurements ?? safeCustomer.measurement?.jacketMeasuremet ?? safeCustomer.measurement?.jacketMeasurement ?? {},
      jacketMeasurementFields,
    ),
    blazerMeasurements: normalizeMeasurementFields(
      safeCustomer.blazerMeasurements ?? safeCustomer.blazerMeasurement ?? safeCustomer.measurements?.blazerMeasurements ?? safeCustomer.measurements?.blazerMeasurement ?? safeCustomer.measurement?.blazerMeasurements ?? safeCustomer.measurement?.blazerMeasurement ?? {},
      blazerMeasurementFields,
    ),
    sherwaniMeasurements: normalizeMeasurementFields(
      safeCustomer.sherwaniMeasurements ?? safeCustomer.sherwaniMeasuremet ?? safeCustomer.sherwaniMeasurement ?? safeCustomer.measurements?.sherwaniMeasurements ?? safeCustomer.measurements?.sherwaniMeasuremet ?? safeCustomer.measurements?.sherwaniMeasurement ?? safeCustomer.measurement?.sherwaniMeasurements ?? safeCustomer.measurement?.sherwaniMeasuremet ?? safeCustomer.measurement?.sherwaniMeasurement ?? {},
      sherwaniMeasurementFields,
    ),
    measurementNotes: unwrapMeasurementPayload(safeCustomer.measurementNotes ?? { shirt: safeCustomer.notes ?? '' }),
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
    normalized.shirtMeasuremet ??
    normalized.pantMeasurement ??
    normalized.pantMeasuremet ??
    normalized.jacketMeasurement ??
    normalized.jacketMeasuremet ??
    normalized.blazerMeasurement ??
    normalized.blazerMeasuremet ??
    normalized.sherwaniMeasurement ??
    normalized.sherwaniMeasuremet ??
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
  const rootNotes = unwrapMeasurementPayload(root.measurementNotes ?? {});
  const shirtSource = resolveMeasurementMap(
    root.shirtMeasurements ?? root.shirtMeasuremet ?? root.shirtMeasurement ?? root.measurements?.shirtMeasurements ?? root.measurements?.shirtMeasuremet ?? root.measurements?.shirtMeasurement ?? root.measurement?.shirtMeasurements ?? root.measurement?.shirtMeasuremet ?? root.measurement?.shirtMeasurement ?? {}
  );
  const pantSource = resolveMeasurementMap(
    root.pantMeasurements ?? root.pantMeasuremet ?? root.pantMeasurement ?? root.measurements?.pantMeasurements ?? root.measurements?.pantMeasuremet ?? root.measurements?.pantMeasurement ?? root.measurement?.pantMeasurements ?? root.measurement?.pantMeasuremet ?? root.measurement?.pantMeasurement ?? {}
  );
  const jacketSource = resolveMeasurementMap(root.jacketMeasurements ?? root.jacketMeasuremet ?? root.jacketMeasurement ?? root.measurements?.jacketMeasurements ?? root.measurements?.jacketMeasuremet ?? root.measurements?.jacketMeasurement ?? root.measurement?.jacketMeasurements ?? root.measurement?.jacketMeasuremet ?? root.measurement?.jacketMeasurement ?? {});
  const blazerSource = resolveMeasurementMap(root.blazerMeasurements ?? root.blazerMeasurement ?? root.measurements?.blazerMeasurements ?? root.measurements?.blazerMeasurement ?? {});
  const sherwaniSource = resolveMeasurementMap(root.sherwaniMeasurements ?? root.sherwaniMeasuremet ?? root.sherwaniMeasurement ?? root.measurements?.sherwaniMeasurements ?? root.measurements?.sherwaniMeasuremet ?? root.measurements?.sherwaniMeasurement ?? root.measurement?.sherwaniMeasurements ?? root.measurement?.sherwaniMeasuremet ?? root.measurement?.sherwaniMeasurement ?? {});

  return {
    id: root.id ?? root.measurementId ?? root.customerId ?? '',
    customerId: root.customerId ?? root.custId ?? root.customer?.id ?? '',
    customerName: root.customerName ?? root.customer?.name ?? '',
    shirtMeasurements: normalizeShirtMeasurements({ ...root, ...shirtSource }),
    pantMeasurements: normalizePantMeasurements({ ...root, ...pantSource }),
    jacketMeasurements: normalizeMeasurementFields(jacketSource, jacketMeasurementFields),
    blazerMeasurements: normalizeMeasurementFields(blazerSource, blazerMeasurementFields),
    sherwaniMeasurements: normalizeMeasurementFields(sherwaniSource, sherwaniMeasurementFields),
    measurementNotes: {
      shirt: rootNotes.shirt ?? shirtSource.notes ?? '',
      pant: rootNotes.pant ?? pantSource.notes ?? '',
      jacket: rootNotes.jacket ?? jacketSource.notes ?? '',
      blazer: rootNotes.blazer ?? blazerSource.notes ?? '',
      sherwani: rootNotes.sherwani ?? sherwaniSource.notes ?? '',
    },
  };
};

const normalizeMeasurementFields = (measurement = {}, fields) => {
  const root = unwrapMeasurementPayload(measurement);
  return fields.reduce((values, field) => {
    values[field.key] = pickMeasurementValue(root, [field.key]);
    return values;
  }, {});
};

const normalizeShirtMeasurements = (measurement = {}) => {
  const root = unwrapMeasurementPayload(measurement);
  const nested = unwrapMeasurementPayload(
    root.shirtMeasurements ??
      root.shirtMeasuremet ??
      root.shirtMeasurement ??
      root.measurements?.shirtMeasurements ??
      root.measurements?.shirtMeasurement ??
      root.measurement?.shirtMeasurements ??
      root.measurement?.shirtMeasurement ??
      {}
  );
  const source = { ...root, ...nested };

  return {
    length: pickMeasurementValue(source, ['length', 'shirtLength', 'shirt_length']),
    chest: pickMeasurementValue(source, ['chest']),
    waist: pickMeasurementValue(source, ['waist']),
    hip: pickMeasurementValue(source, ['shirtHip', 'shirt_hip', 'hip']),
    shoulder: pickMeasurementValue(source, ['shoulder']),
    sleeve: pickMeasurementValue(source, ['sleeve']),
    neck: pickMeasurementValue(source, ['neck', 'collar']),
    cuff: pickMeasurementValue(source, ['cuff']),
  };
};

const normalizePantMeasurements = (measurement = {}) => {
  const root = unwrapMeasurementPayload(measurement);
  const nested = unwrapMeasurementPayload(
    root.pantMeasurements ??
      root.pantMeasuremet ??
      root.pantMeasurement ??
      root.measurements?.pantMeasurements ??
      root.measurements?.pantMeasurement ??
      root.measurement?.pantMeasurements ??
      root.measurement?.pantMeasurement ??
      {}
  );
  const source = { ...root, ...nested };

  return {
    length: pickMeasurementValue(source, ['pantLength', 'pant_length', 'length', 'pantlength', 'outseam', 'inseam', 'fullLength', 'height', 'unchi']),
    waist: pickMeasurementValue(source, ['pantWaist', 'pant_waist', 'waist', 'pantwaist', 'waistSize', 'kamar', 'kambar']),
    hip: pickMeasurementValue(source, ['hip']),
    thigh: pickMeasurementValue(source, ['thigh']),
    knee: pickMeasurementValue(source, ['knee']),
    calf: pickMeasurementValue(source, ['calf']),
    bottom: pickMeasurementValue(source, ['bottom']),
  };
};

const buildEmptyForm = () => ({
  measurementId: FIXED_MEASUREMENT_ID,
  customerId: '',
  customerName: '',
  shirtMeasurements: createMeasurementState(shirtMeasurementFields),
  pantMeasurements: createMeasurementState(pantMeasurementFields),
  jacketMeasurements: createMeasurementState(jacketMeasurementFields),
  blazerMeasurements: createMeasurementState(blazerMeasurementFields),
  sherwaniMeasurements: createMeasurementState(sherwaniMeasurementFields),
  notes: '',
});

const buildFormFromCustomer = (customer = {}, measurement = {}) => ({
  measurementId: FIXED_MEASUREMENT_ID,
  customerId: toTrimmedString(customer.id ?? measurement.customerId),
  customerName: toTrimmedString(customer.name ?? measurement.customerName),
  shirtMeasurements: shirtFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.shirtMeasurements?.[field] ?? customer.shirtMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  pantMeasurements: pantFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.pantMeasurements?.[field] ?? customer.pantMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  jacketMeasurements: jacketFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.jacketMeasurements?.[field] ?? customer.jacketMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  blazerMeasurements: blazerFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.blazerMeasurements?.[field] ?? customer.blazerMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  sherwaniMeasurements: sherwaniFields.reduce((accumulator, field) => {
    accumulator[field] = measurement.sherwaniMeasurements?.[field] ?? customer.sherwaniMeasurements?.[field] ?? '';
    return accumulator;
  }, {}),
  notes: measurement.measurementNotes?.shirt ?? measurement.notes ?? '',
});

const buildMeasurementPayload = (formData, customer = null) => {
  const shirtMeasurements = { ...formData.shirtMeasurements };
  const pantMeasurements = { ...formData.pantMeasurements };
  const jacketMeasurements = { ...formData.jacketMeasurements };
  const blazerMeasurements = { ...formData.blazerMeasurements };
  const sherwaniMeasurements = { ...formData.sherwaniMeasurements };

  return {
    measurementId: FIXED_MEASUREMENT_ID,
    id: FIXED_MEASUREMENT_ID,
    customerId: toTrimmedString(formData.customerId),
    custId: toTrimmedString(formData.customerId),
    customerName: toTrimmedString(formData.customerName),
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
    jacketMeasurements,
    blazerMeasurements,
    sherwaniMeasurements,
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
    pantMeasurement: { ...pantMeasurements },
    pantMeasuremet: { ...pantMeasurements },
    pantLengthValue: pantMeasurements.length,
    pantWaistValue: pantMeasurements.waist,
    hip: pantMeasurements.hip,
    thigh: pantMeasurements.thigh,
    knee: pantMeasurements.knee,
    calf: pantMeasurements.calf,
    bottom: pantMeasurements.bottom,
    jacketChest: jacketMeasurements.chest,
    jacketWaist: jacketMeasurements.waist,
    jacketShoulder: jacketMeasurements.shoulder,
    jacketSleeve: jacketMeasurements.sleeve,
    jacketLength: jacketMeasurements.length,
    blazerChest: blazerMeasurements.chest,
    blazerWaist: blazerMeasurements.waist,
    blazerShoulder: blazerMeasurements.shoulder,
    blazerSleeve: blazerMeasurements.sleeve,
    blazerLength: blazerMeasurements.length,
    sherwaniChest: sherwaniMeasurements.chest,
    sherwaniWaist: sherwaniMeasurements.waist,
    sherwaniShoulder: sherwaniMeasurements.shoulder,
    sherwaniSleeve: sherwaniMeasurements.sleeve,
    sherwaniLength: sherwaniMeasurements.length,
  };
};

const buildShirtMeasurementPayload = (formData, customer = null) => ({
  customerId: toTrimmedString(formData.customerId),
  custId: toTrimmedString(formData.customerId),
  customerName: toTrimmedString(formData.customerName),
  customer: customer
    ? {
        id: customer.id,
        name: customer.name,
        mobileNumber: customer.mobileNumber,
        address: customer.address,
      }
    : undefined,
  shirtMeasurement: {
    ...formData.shirtMeasurements,
    notes: toTrimmedString(formData.notes),
  },
  ...formData.shirtMeasurements,
  measurementNotes: { shirt: toTrimmedString(formData.notes) },
});

const buildPantMeasurementPayload = (formData, customer = null) => ({
  customerId: toTrimmedString(formData.customerId),
  custId: toTrimmedString(formData.customerId),
  customerName: toTrimmedString(formData.customerName),
  customer: customer
    ? {
        id: customer.id,
        name: customer.name,
        mobileNumber: customer.mobileNumber,
        address: customer.address,
      }
    : undefined,
  pantMeasurement: {
    ...formData.pantMeasurements,
    notes: toTrimmedString(formData.notes),
  },
  pantMeasuremet: {
    ...formData.pantMeasurements,
    notes: toTrimmedString(formData.notes),
  },
  pantLength: formData.pantMeasurements.length,
  pantWaist: formData.pantMeasurements.waist,
  length: formData.pantMeasurements.length,
  waist: formData.pantMeasurements.waist,
  hip: formData.pantMeasurements.hip,
  thigh: formData.pantMeasurements.thigh,
  knee: formData.pantMeasurements.knee,
  calf: formData.pantMeasurements.calf,
  bottom: formData.pantMeasurements.bottom,
  chainFly: formData.pantMeasurements.chainFly ?? '',
  measurementNotes: { pant: toTrimmedString(formData.notes) },
  ...formData.pantMeasurements,
});

const buildTypedMeasurementPayload = (type, formData, customer = null) => {
  const values = { ...formData[type.formKey] };
  const notes = toTrimmedString(formData.notes);
  const backendMeasurement = {
    ...values,
    notes,
  };
  const response = {
    customerId: toTrimmedString(formData.customerId),
    custId: toTrimmedString(formData.customerId),
    customerName: toTrimmedString(formData.customerName),
    customer: customer
      ? { id: customer.id, name: customer.name, mobileNumber: customer.mobileNumber, address: customer.address }
      : undefined,
    [measurementBackendKeys[type.formKey]]: backendMeasurement,
    ...values,
    measurementNotes: { [type.key]: notes },
  };

  if (type.formKey === 'pantMeasurements') {
    response.pantMeasurement = backendMeasurement;
    response.pantMeasuremet = backendMeasurement;
    response.length = values.length ?? '';
    response.waist = values.waist ?? '';
    response.pantLength = values.length ?? '';
    response.pantWaist = values.waist ?? '';
  }

  return response;
};

const hasMeasurementValues = (customer = {}) =>
  shirtFields.some((field) => customer.shirtMeasurements?.[field]) ||
  pantFields.some((field) => customer.pantMeasurements?.[field]) ||
  jacketFields.some((field) => customer.jacketMeasurements?.[field]) ||
  blazerFields.some((field) => customer.blazerMeasurements?.[field]) ||
  sherwaniFields.some((field) => customer.sherwaniMeasurements?.[field]);

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
    let customer;

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

    const lookupId = customer?.id || customerId;

    const [shirtResult, pantResult, jacketResult, blazerResult, sherwaniResult, genericResult, allMeasurementsResult] = await Promise.allSettled([
      getShirtMeasurementById(lookupId),
      getPantMeasurementById(lookupId),
      getJacketMeasurementById(lookupId),
      getBlazerMeasurementById(lookupId),
      getSherwaniMeasurementById(lookupId),
      getMeasurementById(lookupId),
      getMeasurements(),
    ]);

    const genericData = readMeasurementObject(genericResult.status === 'fulfilled' ? genericResult.value?.data : {});
    const shirtData = readMeasurementObject(shirtResult.status === 'fulfilled' ? shirtResult.value?.data : {});
    const pantData = readMeasurementObject(pantResult.status === 'fulfilled' ? pantResult.value?.data : {});
    const jacketData = readMeasurementObject(jacketResult.status === 'fulfilled' ? jacketResult.value?.data : {});
    const blazerData = readMeasurementObject(blazerResult.status === 'fulfilled' ? blazerResult.value?.data : {});
    const sherwaniData = readMeasurementObject(sherwaniResult.status === 'fulfilled' ? sherwaniResult.value?.data : {});
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
    const customerJacket = coalesceMeasurementSource(customer?.jacketMeasurements, customer?.jacketMeasurement, genericData.jacketMeasurements, genericData.jacketMeasurement, jacketData.jacketMeasurements, jacketData.jacketMeasurement, listData.jacketMeasurements, listData.jacketMeasurement);
    const customerBlazer = coalesceMeasurementSource(customer?.blazerMeasurements, customer?.blazerMeasurement, genericData.blazerMeasurements, genericData.blazerMeasurement, blazerData.blazerMeasurements, blazerData.blazerMeasurement, listData.blazerMeasurements, listData.blazerMeasurement);
    const customerSherwani = coalesceMeasurementSource(customer?.sherwaniMeasurements, customer?.sherwaniMeasurement, genericData.sherwaniMeasurements, genericData.sherwaniMeasurement, sherwaniData.sherwaniMeasurements, sherwaniData.sherwaniMeasurement, listData.sherwaniMeasurements, listData.sherwaniMeasurement);

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
    const unifiedJacket = { ...stripEmptyValues(customerJacket), ...stripEmptyValues(jacketData) };
    const unifiedBlazer = { ...stripEmptyValues(customerBlazer), ...stripEmptyValues(blazerData) };
    const unifiedSherwani = { ...stripEmptyValues(customerSherwani), ...stripEmptyValues(sherwaniData) };

    if (!customer) {
      const derivedCustomerId = genericData.customerId ?? shirtData.customerId ?? pantData.customerId ?? jacketData.customerId ?? blazerData.customerId ?? sherwaniData.customerId ?? listData.customerId ?? listData.custId ?? customerId;
      const derivedCustomerName = genericData.customerName ?? shirtData.customerName ?? pantData.customerName ?? jacketData.customerName ?? blazerData.customerName ?? sherwaniData.customerName ?? listData.customerName ?? listData.customer?.name ?? '';

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
      jacketMeasurements: normalizeMeasurementFields(unifiedJacket, jacketMeasurementFields),
      blazerMeasurements: normalizeMeasurementFields(unifiedBlazer, blazerMeasurementFields),
      sherwaniMeasurements: normalizeMeasurementFields(unifiedSherwani, sherwaniMeasurementFields),
      measurementNotes: {
        shirt: getMeasurementNote(shirtData, 'shirt', true) || getMeasurementNote(genericData, 'shirt') || getMeasurementNote(listData, 'shirt'),
        pant: getMeasurementNote(pantData, 'pant', true) || getMeasurementNote(genericData, 'pant') || getMeasurementNote(listData, 'pant'),
        jacket: getMeasurementNote(jacketData, 'jacket', true) || getMeasurementNote(genericData, 'jacket') || getMeasurementNote(listData, 'jacket'),
        blazer: getMeasurementNote(blazerData, 'blazer', true) || getMeasurementNote(genericData, 'blazer') || getMeasurementNote(listData, 'blazer'),
        sherwani: getMeasurementNote(sherwaniData, 'sherwani', true) || getMeasurementNote(genericData, 'sherwani') || getMeasurementNote(listData, 'sherwani'),
      },
    });

    measurement = {
      ...measurement,
      shirtMeasurements: mergeMissingMeasurementValues(
        measurement.shirtMeasurements,
        normalizeShirtMeasurements(customer?.shirtMeasurements ?? {}),
      ),
      pantMeasurements: mergeMissingMeasurementValues(
        measurement.pantMeasurements,
        normalizePantMeasurements(customer?.pantMeasurements ?? {}),
      ),
      jacketMeasurements: mergeMissingMeasurementValues(measurement.jacketMeasurements, normalizeMeasurementFields(customer?.jacketMeasurements ?? {}, jacketMeasurementFields)),
      blazerMeasurements: mergeMissingMeasurementValues(measurement.blazerMeasurements, normalizeMeasurementFields(customer?.blazerMeasurements ?? {}, blazerMeasurementFields)),
      sherwaniMeasurements: mergeMissingMeasurementValues(measurement.sherwaniMeasurements, normalizeMeasurementFields(customer?.sherwaniMeasurements ?? {}, sherwaniMeasurementFields)),
    };

    const hasShirt = hasAnyValue(measurement.shirtMeasurements);
    const hasPant = hasAnyValue(measurement.pantMeasurements);
    const hasOtherMeasurement = ['jacketMeasurements', 'blazerMeasurements', 'sherwaniMeasurements'].some((key) => hasAnyValue(measurement[key]));
    const hasCustomer = Boolean(customer?.id || customer?.name);

    if (!hasCustomer && !hasShirt && !hasPant && !hasOtherMeasurement) {
      throw new Error('No customer or measurement found for that ID.');
    }

    if (!hasMeasurementValues(measurement)) {
      measurement = normalizeMeasurement({
        ...customer,
        shirtMeasurements: coalesceMeasurementSource(customer.shirtMeasurements, customerShirt, unifiedShirt),
        pantMeasurements: coalesceMeasurementSource(customer.pantMeasurements, customerPant, unifiedPant),
        jacketMeasurements: coalesceMeasurementSource(customer.jacketMeasurements, customerJacket, unifiedJacket),
        blazerMeasurements: coalesceMeasurementSource(customer.blazerMeasurements, customerBlazer, unifiedBlazer),
        sherwaniMeasurements: coalesceMeasurementSource(customer.sherwaniMeasurements, customerSherwani, unifiedSherwani),
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
      setActiveTab(2);
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
    const measurementType = measurementTypes.find((type) => name.startsWith(`${type.formKey}.`));
    if (measurementType) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        [measurementType.formKey]: {
          ...prev[measurementType.formKey],
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

  const handleMeasurementTypeChange = (_, value) => {
    setActiveFormMeasurementTab(value);
    setFormData((previous) => ({
      ...buildEmptyForm(),
      customerId: previous.customerId,
      customerName: previous.customerName,
    }));
  };

  const beginNewMeasurement = () => {
    setFormData(buildEmptyForm());
    setActiveFormMeasurementTab(0);
    setSelectedCustomer(null);
    setSelectedMeasurement(null);
    setFeedback(null);
    setActiveTab(1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const customerId = toTrimmedString(formData.customerId) || toTrimmedString(selectedCustomer?.id);

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

      const selectedType = measurementTypes[activeFormMeasurementTab];
      const selectedMeasurementValues = {
        ...measurementFormData[selectedType.formKey],
        notes: toTrimmedString(measurementFormData.notes),
      };
      const mergedPayload = {
        ...buildMeasurementPayload(measurementFormData, customerForPayload),
        [selectedType.formKey]: selectedMeasurementValues,
        measurementNotes: {
          ...(selectedMeasurement?.measurementNotes || {}),
          [selectedType.key]: toTrimmedString(measurementFormData.notes),
        },
      };
      const saveMeasurement = [
        (data) => createShirtMeasurement(buildShirtMeasurementPayload(data, customerForPayload)),
        (data) => createPantMeasurement(buildPantMeasurementPayload(data, customerForPayload)),
        (data) => createJacketMeasurement(buildTypedMeasurementPayload(selectedType, data, customerForPayload)),
        (data) => createBlazerMeasurement(buildTypedMeasurementPayload(selectedType, data, customerForPayload)),
        (data) => createSherwaniMeasurement(buildTypedMeasurementPayload(selectedType, data, customerForPayload)),
      ][activeFormMeasurementTab];
      await saveMeasurement(mergedPayload);

      setFeedback({
        type: 'success',
        message: `${selectedType.label} saved successfully.`,
      });

      if (selectedCustomer?.id) {
        try {
          await updateCustomer(customerId, {
            custName: selectedCustomer?.name || measurementFormData.customerName || '',
            custMobileNumber: selectedCustomer?.mobileNumber || '',
            custAddress: selectedCustomer?.address || '',
            shirtMeasurements: mergedPayload.shirtMeasurements,
            pantMeasurements: mergedPayload.pantMeasurements,
            jacketMeasurements: mergedPayload.jacketMeasurements,
            blazerMeasurements: mergedPayload.blazerMeasurements,
            sherwaniMeasurements: mergedPayload.sherwaniMeasurements,
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
          jacketMeasurements: activeFormMeasurementTab === 2 ? { ...measurementFormData.jacketMeasurements } : base.jacketMeasurements,
          blazerMeasurements: activeFormMeasurementTab === 3 ? { ...measurementFormData.blazerMeasurements } : base.blazerMeasurements,
          sherwaniMeasurements: activeFormMeasurementTab === 4 ? { ...measurementFormData.sherwaniMeasurements } : base.sherwaniMeasurements,
          measurementNotes: {
            ...(base.measurementNotes || {}),
            [selectedType.key]: measurementFormData.notes,
          },
        };
      });
    } catch (error) {
      const responseData = error?.response?.data;
      const serverMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === 'string' ? responseData : '') ||
        error?.message;
      setFeedback({
        type: 'error',
        message: serverMessage || 'Unable to save measurement.',
      });
    } finally {
      setSaving(false);
    }
  };

  const activeViewType = measurementTypes[activeViewMeasurementTab] || measurementTypes[0];
  const activeFormType = measurementTypes[activeFormMeasurementTab] || measurementTypes[0];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Measurements
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View all customers,Maintain Shirt, Pant, Jacket, Blazer, Sherwani Measurement profile per customer.
          </Typography>
        </Box>
      

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
            { label: 'Add Measurement' },
            { label: 'View Measurement' },
          ]}
        />
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
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setFormData(buildFormFromCustomer(customer));
                              setActiveFormMeasurementTab(0);
                              setFeedback(null);
                              setActiveTab(1);
                            }}
                          >
                            Add Measurement
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
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">Add Measurement Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Add each measurement profile separately using the tabs below.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={beginNewMeasurement}>
              Clear Form
            </Button>
          </Stack>

          <Stack sx={{ mb: 2 }}>
            <PageTabs
              value={activeFormMeasurementTab}
              onChange={handleMeasurementTypeChange}
              sx={{ minHeight: 40 }}
              tabs={[
                ...measurementTypes.map((type) => ({ label: `${type.label} Form` })),
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

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {activeFormType.label}s
                </Typography>
                <Grid container spacing={2}>
                  {activeFormType.fields.map((field) => (
                    <Grid item xs={12} sm={6} md={4} key={field.key}>
                      <TextField
                        label={getMeasurementFieldLabel(field)}
                        name={`${activeFormType.formKey}.${field.key}`}
                        value={formData[activeFormType.formKey][field.key]}
                        onChange={handleFieldChange}
                        fullWidth
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

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
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : `Save ${activeFormType.label}`}
                </Button>
                <Button variant="outlined" onClick={() => setActiveTab(0)}>
                  Back to customers
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      )}

      {activeTab === 2 && (
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
                    ...measurementTypes.map((type) => ({ label: type.label })),
                  ]}
                />
              </Stack>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {activeViewType.label} Card
                  </Typography>

                  <Grid container spacing={1.5}>
                    {activeViewType.fields.map((field) => (
                      <Grid item xs={6} sm={4} key={field.key}>
                        <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                              <Typography variant="caption" color="text.secondary">
                                {field.marathi} / {field.english}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatMeasurementDisplay(selectedMeasurementView?.[activeViewType.formKey]?.[field.key])}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {getMeasurementNoteByTab(selectedMeasurementView, selectedCustomer, activeViewMeasurementTab)}
                  </Typography>
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