import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { createCustomer } from '../../services/api';

const initialForm = {
  name: '',
  mobileNumber: '',
  address: '',
};

const AddCustomer = ({ onCustomerCreated }) => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [voiceField, setVoiceField] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in all customer details.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        customerName: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim(),
        custName: formData.name.trim(),
        custMobileNumber: formData.mobileNumber.trim(),
        custAddress: formData.address.trim(),
      };

      const response = await createCustomer(payload);
      const createdId = response?.data?.id || response?.data?.customerId || response?.data?.custId;
      setFeedback({
        type: 'success',
        message: createdId
          ? `Customer created successfully with customer ID "${createdId}".`
          : 'Customer created successfully.',
      });
      setFormData(initialForm);
      if (onCustomerCreated) {
        await onCustomerCreated();
      }
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to save customer.';

      setFeedback({
        type: 'error',
        message: serverMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Add New Customer
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Stack spacing={3}>
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
          <Typography variant="caption" color="error.main">
            {voiceError}
          </Typography>
        )}
        <TextField
          label="Mobile Number"
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          fullWidth
          required
        />
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            required
          />
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

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Create Customer'}
        </Button>
      </Stack>
    </Box>
  );
};

export default AddCustomer;
