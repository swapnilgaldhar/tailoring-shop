import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import vendorApi from '../../services/vendorApi';

const VendorForm = ({ onVendorAdded }) => {
  const [formData, setFormData] = useState({
    venderName: '',
    venderAddress: '',
    venderPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.venderName.trim()) {
      setError('Vendor name is required');
      return;
    }

    if (!formData.venderAddress.trim()) {
      setError('Vendor address is required');
      return;
    }

    if (!formData.venderPhone.trim()) {
      setError('Vendor phone is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        venderName: formData.venderName.trim(),
        venderAddress: formData.venderAddress.trim(),
        venderPhone: formData.venderPhone.trim(),
      };

      await vendorApi.createVendor(payload);
      setSuccess('Vendor created successfully!');
      setFormData({
        venderName: '',
        venderAddress: '',
        venderPhone: '',
      });

      if (onVendorAdded) {
        setTimeout(() => onVendorAdded(), 400);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create vendor';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      venderName: '',
      venderAddress: '',
      venderPhone: '',
    });
    setError('');
    setSuccess('');
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Create New Vendor
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5} sx={{ maxWidth: '100%' }}>
            <TextField
              fullWidth
              label="Vendor Name"
              name="venderName"
              value={formData.venderName}
              onChange={handleInputChange}
              placeholder="e.g., ABC Fabrics"
              size="small"
              required
            />

            <TextField
              fullWidth
              label="Vendor Address"
              name="venderAddress"
              value={formData.venderAddress}
              onChange={handleInputChange}
              placeholder="e.g., 25 Market Road, Indore"
              multiline
              rows={3}
              size="small"
              required
            />

            <TextField
              fullWidth
              label="Vendor Phone"
              name="venderPhone"
              value={formData.venderPhone}
              onChange={handleInputChange}
              placeholder="e.g., +91 98765 43210"
              size="small"
              required
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                disabled={loading}
                sx={{
                  backgroundColor: '#1266d8',
                  borderRadius: 1.5,
                  px: 3,
                  '&:hover': { backgroundColor: '#0f58b0' },
                }}
              >
                {loading ? 'Saving...' : 'Save Vendor'}
              </Button>

              <Button
                type="button"
                variant="outlined"
                startIcon={<ClearOutlinedIcon />}
                onClick={handleReset}
                sx={{ borderRadius: 1.5, px: 3 }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VendorForm;
