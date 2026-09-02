import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import vendorApi from '../../services/vendorApi';
import vendorOrderApi from '../../services/vendorOrderApi';

const VendorOrderForm = ({ onOrderAdded, prefillVendor = null }) => {
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchVendorId, setSearchVendorId] = useState('');
  const [searchingVendor, setSearchingVendor] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    venderId: '',
    vendorName: '',
    venderName: '',
    order: '',
    orderAmount: '',
    paidAmount: '0',
    remainingAmount: '',
    checkNumber: '',
    paymentMethod: 'Cash',
    orderDate: new Date().toISOString().slice(0, 10),
    orderReceivedDate: '',
    updatedDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        const response = await vendorApi.getAllVendors();
        const normalized = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.vender)
              ? response.vender
              : Array.isArray(response?.vendors)
                ? response.vendors
                : [];

        console.log('Vendors loaded in form:', normalized);
        setVendors(normalized);

        if (prefillVendor) {
          const vendorId = prefillVendor.venderId ?? prefillVendor.id ?? '';
          const vendorName = prefillVendor.venderName ?? prefillVendor.name ?? '';
          console.log('Prefilling vendor:', { vendorId, vendorName });
          
          setFormData((prev) => ({
            ...prev,
            venderId: String(vendorId),
            vendorName,
            venderName: vendorName,
          }));
          setSearchVendorId(String(vendorId));
          setSuccess(`Vendor "${vendorName}" has been pre-selected for order creation.`);
          setTimeout(() => setSuccess(''), 4000);
        }
      } catch (err) {
        console.error('Error fetching vendors for order form:', err);
        setError('Unable to load vendors. Please create a vendor first.');
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendors();
  }, [prefillVendor]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'orderAmount' || name === 'paidAmount') {
      const orderAmt = name === 'orderAmount' ? Number(value || 0) : Number(formData.orderAmount || 0);
      const paidAmt = name === 'paidAmount' ? Number(value || 0) : Number(formData.paidAmount || 0);
      setFormData((prev) => ({
        ...prev,
        remainingAmount: String(Math.max(orderAmt - paidAmt, 0).toFixed(2)),
      }));
    }
  };

  const handleSearchVendor = () => {
    setError('');
    if (!searchVendorId.trim()) {
      setError('Please enter a Vendor ID to search.');
      return;
    }

    setSearchingVendor(true);
    const selectedVendor = vendors.find((vendor) => 
      String(vendor.venderId ?? vendor.id) === String(searchVendorId.trim())
    );

    if (selectedVendor) {
      const vendorId = selectedVendor.venderId ?? selectedVendor.id;
      const vendorName = selectedVendor.venderName ?? selectedVendor.name ?? '';
      setFormData((prev) => ({
        ...prev,
        venderId: String(vendorId),
        vendorName: vendorName,
        venderName: vendorName,
      }));
      setSuccess(`Vendor "${vendorName}" selected successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(`Vendor with ID "${searchVendorId}" not found.`);
    }
    setSearchingVendor(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.invoiceNo || Number(formData.invoiceNo) <= 0) {
      setError('Invoice No is required and must be a positive number.');
      return;
    }

    if (!formData.venderId) {
      setError('Please select a vendor by VenderId.');
      return;
    }

    if (!formData.order.trim()) {
      setError('Order description is required.');
      return;
    }

    if (!formData.orderAmount || Number(formData.orderAmount) <= 0) {
      setError('Order Amount must be greater than zero.');
      return;
    }

    if (formData.paymentMethod === 'Check' && !formData.checkNumber.trim()) {
      setError('Check Number is required when payment method is Check.');
      return;
    }

    if (!formData.orderReceivedDate) {
      setError('Order Received Date is required.');
      return;
    }

    setLoading(true);

    try {
      const receivedDate = formData.orderReceivedDate || new Date().toISOString().slice(0, 10);
      
      const payload = {
        invoiceNo: Number(formData.invoiceNo),
        venderId: Number(formData.venderId),
        vendorName: formData.vendorName || formData.venderName || '',
        venderName: formData.venderName || formData.vendorName || '',
        order: formData.order.trim(),
        orderDescription: formData.order.trim(),
        orderAmount: Number(formData.orderAmount),
        paidAmount: Number(formData.paidAmount || 0),
        remainingAmount: Number(formData.remainingAmount || Math.max(Number(formData.orderAmount) - Number(formData.paidAmount || 0), 0)),
        checkNumber: formData.checkNumber && formData.checkNumber.trim() ? formData.checkNumber.trim() : null,
        paymentMethod: formData.paymentMethod || 'Cash',
        orderDate: formData.orderDate || new Date().toISOString().slice(0, 10),
        orderReceivedDate: receivedDate,
        deliveryDate: receivedDate,
        updatedDate: new Date().toISOString().slice(0, 10),
      };

      console.log('Order payload being sent:', payload);
      await vendorOrderApi.createVendorOrder(payload);
      setSuccess('Vendor order created successfully!');
      setFormData({
        invoiceNo: '',
        venderId: '',
        vendorName: '',
        venderName: '',
        order: '',
        orderAmount: '',
        paidAmount: '0',
        remainingAmount: '',
        checkNumber: '',
        paymentMethod: 'Cash',
        orderDate: new Date().toISOString().slice(0, 10),
        orderReceivedDate: '',
        updatedDate: new Date().toISOString().slice(0, 10),
      });

      if (onOrderAdded) {
        setTimeout(() => onOrderAdded(), 400);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err?.message || 'Failed to create vendor order.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      invoiceNo: '',
      venderId: prefillVendor ? String(prefillVendor.venderId ?? prefillVendor.id ?? '') : '',
      vendorName: prefillVendor ? (prefillVendor.venderName ?? prefillVendor.name ?? '') : '',
      venderName: prefillVendor ? (prefillVendor.venderName ?? prefillVendor.name ?? '') : '',
      order: '',
      orderAmount: '',
      paidAmount: '0',
      remainingAmount: '',
      checkNumber: '',
      paymentMethod: 'Cash',
      orderDate: new Date().toISOString().slice(0, 10),
      orderReceivedDate: '',
      updatedDate: new Date().toISOString().slice(0, 10),
    });
    setError('');
    setSuccess('');
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Create New Purchase Order
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ mb: 3, p: 2.5, bgcolor: '#dbeafe', borderRadius: 1.5, border: '2px solid #1266d8' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1266d8', fontSize: 14 }}>
            🔍 Step 1: Search and Select Vendor
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#334155', fontSize: 13 }}>
            Enter the Vendor ID to find and select a vendor for this order.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
            <TextField
              label="Vendor ID"
              value={searchVendorId}
              onChange={(e) => setSearchVendorId(e.target.value)}
              placeholder="e.g., 1001, 1002, 1003"
              size="small"
              fullWidth
              type="number"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchVendor();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<SearchOutlinedIcon />}
              onClick={handleSearchVendor}
              disabled={loadingVendors || searchingVendor}
              sx={{ bgcolor: '#1266d8', textTransform: 'none', minWidth: 130, fontWeight: 600 }}
            >
              {searchingVendor ? 'Searching...' : 'Find Vendor'}
            </Button>
          </Stack>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Invoice No"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleInputChange}
                type="number"
                size="small"
                required
              />

              <TextField
                fullWidth
                label="Vendor ID"
                value={formData.venderId}
                size="small"
                InputProps={{ readOnly: true }}
                helperText={formData.venderId ? 'Selected from search' : 'check and enter vender id'}
              />
            </Stack>

            <TextField
              fullWidth
              label="Vendor Name"
              value={formData.vendorName || formData.venderName}
              size="small"
              InputProps={{ readOnly: true }}
              required
            />

            <TextField
              fullWidth
              label="Order Description"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              multiline
              rows={3}
              size="small"
              required
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Order Amount"
                name="orderAmount"
                value={formData.orderAmount}
                onChange={handleInputChange}
                type="number"
                inputProps={{ step: '0.01' }}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Paid Amount"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleInputChange}
                type="number"
                inputProps={{ step: '0.01' }}
                size="small"
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Remaining Amount"
                name="remainingAmount"
                value={formData.remainingAmount}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <TextField
                fullWidth
                label="Check Number"
                name="checkNumber"
                value={formData.checkNumber}
                onChange={handleInputChange}
                size="small"
                required={formData.paymentMethod === 'Check'}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                size="small"
                required
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Check">Check</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Order Date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                type="date"
                size="small"
                
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Order Received Date"
              name="orderReceivedDate"
              value={formData.orderReceivedDate}
              onChange={handleInputChange}
              type="date"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                disabled={loading || loadingVendors || vendors.length === 0}
                sx={{ bgcolor: '#1266d8', textTransform: 'none' }}
              >
                {loading ? 'Saving...' : 'Save Order'}
              </Button>

              <Button
                type="button"
                variant="outlined"
                startIcon={<ClearOutlinedIcon />}
                onClick={handleReset}
                disabled={loading}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VendorOrderForm;
