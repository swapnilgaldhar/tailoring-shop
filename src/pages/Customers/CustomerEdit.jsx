import { useEffect, useRef, useState } from 'react';
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
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
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
  const [voiceField, setVoiceField] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setFormData(buildInitialFormData(customer));
      setFeedback(null);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      recognitionRef.current?.stop();
    };
  }, [customer]);

  const handleVoiceInput = (fieldName) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setVoiceField(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (transcript) {
        setFormData((prev) => ({ ...prev, [fieldName]: transcript }));
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(`Voice input error: ${event.error}`);
      setVoiceField(null);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setVoiceField(null);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setVoiceError('');
    setVoiceField(fieldName);
    recognition.start();
  };

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
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <Button
                  variant={voiceField === 'name' ? 'contained' : 'outlined'}
                  color={voiceField === 'name' ? 'error' : 'primary'}
                  startIcon={voiceField === 'name' ? <MicOffIcon /> : <MicIcon />}
                  onClick={() => handleVoiceInput('name')}
                  sx={{ minWidth: 120, whiteSpace: 'nowrap' }}
                >
                  {voiceField === 'name' ? 'Stop' : 'Voice'}
                </Button>
              </Stack>
              {voiceError && (
                <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                  {voiceError}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth multiline rows={3} required />
                <Button
                  variant={voiceField === 'address' ? 'contained' : 'outlined'}
                  color={voiceField === 'address' ? 'error' : 'primary'}
                  startIcon={voiceField === 'address' ? <MicOffIcon /> : <MicIcon />}
                  onClick={() => handleVoiceInput('address')}
                  sx={{ minWidth: 120, whiteSpace: 'nowrap', mt: 0.5 }}
                >
                  {voiceField === 'address' ? 'Stop' : 'Voice'}
                </Button>
              </Stack>
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
