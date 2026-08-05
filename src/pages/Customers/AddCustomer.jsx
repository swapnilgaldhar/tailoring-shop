import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { createCustomer } from '../../services/api';

const initialForm = {
  name: '',
  mobileNumber: '',
  address: '',
};

const AddCustomer = ({ onCustomerCreated }) => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
        <TextField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Mobile Number"
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          fullWidth
          required
        />
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

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Create Customer'}
        </Button>
      </Stack>
    </Box>
  );
};

export default AddCustomer;
