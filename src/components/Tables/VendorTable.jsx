import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
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
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import vendorApi from '../../services/vendorApi';

const VendorTable = ({ mode = 'all', onCreateOrderForVendor }) => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const normalizeVendorList = (response) => {
    const extractNestedArray = (value) => {
      if (Array.isArray(value)) return value;
      if (!value || typeof value !== 'object') return null;

      const keys = ['vender', 'vendor', 'venders', 'vendors', 'data', 'content', 'result', 'items', 'records', 'list', '_embedded'];
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const nested = extractNestedArray(value[key]);
          if (nested) return nested;
        }
      }

      if (value._embedded && typeof value._embedded === 'object') {
        for (const nestedValue of Object.values(value._embedded)) {
          const nested = extractNestedArray(nestedValue);
          if (nested) return nested;
        }
      }

      const values = Object.values(value).filter((item) => Array.isArray(item));
      return values.length > 0 ? values[0] : null;
    };

    const directArray = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : null;
    if (directArray) return directArray;

    const normalized = extractNestedArray(response);
    return Array.isArray(normalized) ? normalized : [];
  };

  const loadAllVendors = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await vendorApi.getAllVendors();
      console.log('Vendor list raw response:', response);

      const normalized = normalizeVendorList(response);
      console.log('Normalized vendor list:', normalized);

      setVendors(normalized);
      setSelectedVendor(null);
      if (normalized.length === 0) {
        setError('No vendors found in the backend response.');
      }
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Failed to load vendors. Check backend is running and CORS is enabled for http://localhost:5173');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'all') {
      loadAllVendors();
    } else {
      setLoading(false);
      setVendors([]);
      setSelectedVendor(null);
    }
  }, [mode]);

  const handleSearchById = async () => {
    if (!searchId.trim()) {
      setError('Please enter a vendor ID to search');
      return;
    }

    const vendorId = Number(searchId);
    if (Number.isNaN(vendorId) || vendorId <= 0) {
      setError('Vendor ID must be a positive number');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await vendorApi.getVendorById(vendorId);
      const coercedVendor = Array.isArray(response)
        ? response[0] ?? null
        : response?.vender ?? response?.vendor ?? response?.data ?? response ?? null;

      setSelectedVendor(coercedVendor || null);
      if (!coercedVendor) {
        setError('Vendor not found for this ID');
      }
    } catch (err) {
      console.error('Error fetching vendor by ID:', err);
      setError('Vendor not found or backend request failed');
      setSelectedVendor(null);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && (
        <Box sx={{ p: 1.5, bgcolor: '#fee2e2', borderRadius: 1 }}>
          <Typography sx={{ color: '#dc2626' }}>{error}</Typography>
        </Box>
      )}

      {mode === 'by-id' && (
        <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search Vendor By ID"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              size="small"
              type="number"
              sx={{ minWidth: { xs: '100%', md: 240 } }}
            />
            <Button
              variant="contained"
              startIcon={<SearchOutlinedIcon />}
              onClick={handleSearchById}
              disabled={searching}
              sx={{ backgroundColor: '#1266d8', '&:hover': { backgroundColor: '#0f58b0' } }}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outlined" onClick={() => setSelectedVendor(null)}>
              Clear
            </Button>
          </Stack>

          {error && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fee2e2', borderRadius: 1 }}>
              <Typography sx={{ color: '#dc2626' }}>{error}</Typography>
            </Box>
          )}
        </Card>
      )}

      {selectedVendor && (
        <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>Vendor Details</Typography>
          <Stack spacing={1}>
            <Typography><strong>ID:</strong> {selectedVendor.venderId ?? selectedVendor.id ?? '-'}</Typography>
            <Typography><strong>Name:</strong> {selectedVendor.venderName ?? selectedVendor.name ?? '-'}</Typography>
            <Typography><strong>Address:</strong> {selectedVendor.venderAddress ?? selectedVendor.address ?? '-'}</Typography>
            <Typography><strong>Phone:</strong> {selectedVendor.venderPhone ?? selectedVendor.phone ?? '-'}</Typography>

            <Button
              variant="contained"
              sx={{ mt: 1, alignSelf: 'flex-start', backgroundColor: '#1266d8', '&:hover': { backgroundColor: '#0f58b0' } }}
              onClick={() => onCreateOrderForVendor?.(selectedVendor)}
            >
              Add Order
            </Button>
          </Stack>
        </Card>
      )}

      <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2 }}>
        {vendors.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748b' }}>No vendors found</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc', borderBottom: '2px solid #e7edf5' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Vendor ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Vendor Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#172033', textAlign: 'center' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((vendor, index) => (
                  <TableRow
                    key={vendor.venderId || vendor.id || `vendor-${index}`}
                    sx={{ borderBottom: '1px solid #e7edf5', '&:hover': { bgcolor: '#f8fafc' } }}
                  >
                    <TableCell sx={{ color: '#172033', fontWeight: 600 }}>
                      {vendor.venderId ?? vendor.id ?? '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>
                      {vendor.venderName ?? vendor.name ?? '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>
                      {vendor.venderAddress ?? vendor.address ?? '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>
                      {vendor.venderPhone ?? vendor.phone ?? '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onCreateOrderForVendor?.(vendor)}
                        sx={{ textTransform: 'none' }}
                      >
                        Add Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default VendorTable;
