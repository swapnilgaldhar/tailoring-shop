import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { updateCustomer } from '../../services/api';
import {
  createMeasurementState,
  getMeasurementFieldLabel,
  pantMeasurementFields,
  shirtMeasurementFields,
} from '../../constants/measurementFields';

const buildInitialFormData = (customer = {}) => ({
  name: customer.name || customer.custName || customer.customerName || '',
  mobileNumber: customer.mobileNumber || '',
  address: customer.address || '',
  balance: customer.balance ?? '',
  shirtMeasurements: shirtMeasurementFields.reduce((accumulator, field) => {
    accumulator[field.key] = customer.shirtMeasurements?.[field.key] || '';
    return accumulator;
  }, createMeasurementState(shirtMeasurementFields)),
  pantMeasurements: pantMeasurementFields.reduce((accumulator, field) => {
    accumulator[field.key] = customer.pantMeasurements?.[field.key] || '';
    return accumulator;
  }, createMeasurementState(pantMeasurementFields)),
});

const normalizeCustomer = (customer = {}) => ({
  ...customer,
  id: customer.id ?? customer.custId ?? customer.customerId ?? '',
  name: customer.name ?? customer.custName ?? customer.customerName ?? '',
  mobileNumber: customer.mobileNumber ?? customer.custMobileNumber ?? customer.phone ?? customer.mobile ?? '',
  address: customer.address ?? customer.custAddress ?? customer.customerAddress ?? '',
  balance: customer.balance ?? customer.custBalance ?? customer.accountBalance ?? customer.outstandingBalance ?? '',
});

const CustomerEdit = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => buildInitialFormData(customer));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setFormData(buildInitialFormData(customer));
      setFeedback(null);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [customer]);

  const handleChange = (event) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in the required customer details.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        custName: formData.name.trim(),
        customerName: formData.name.trim(),
        custMobileNumber: formData.mobileNumber.trim(),
        custAddress: formData.address.trim(),
        balance: formData.balance === '' ? 0 : Number(formData.balance),
        shirtMeasurements: formData.shirtMeasurements,
        pantMeasurements: formData.pantMeasurements,
      };

      const response = await updateCustomer(customer?.id, payload);
      const savedCustomer = normalizeCustomer(response?.data ?? { ...customer, ...payload });
      setFeedback({ type: 'success', message: 'Customer updated successfully.' });

      if (onSave) {
        await onSave(savedCustomer);
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.message || 'Unable to update customer.';
      setFeedback({ type: 'error', message: serverMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Edit Customer Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Update the customer profile and tailoring measurements below.
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" name="name" value={formData.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth multiline rows={3} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Balance" name="balance" type="number" value={formData.balance} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Shirt Measurements
          </Typography>
          <Grid container spacing={2}>
            {shirtMeasurementFields.map((field) => (
              <Grid item xs={12} sm={6} key={field.key}>
                <TextField
                  label={getMeasurementFieldLabel(field)}
                  name={`shirtMeasurements.${field.key}`}
                  value={formData.shirtMeasurements[field.key]}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Pant Measurements
          </Typography>
          <Grid container spacing={2}>
            {pantMeasurementFields.map((field) => (
              <Grid item xs={12} sm={6} key={field.key}>
                <TextField
                  label={getMeasurementFieldLabel(field)}
                  name={`pantMeasurements.${field.key}`}
                  value={formData.pantMeasurements[field.key]}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CustomerEdit;
