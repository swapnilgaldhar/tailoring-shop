import { useState } from 'react';
import {
  Box,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import VendorForm from '../../components/Forms/VendorForm';
import VendorOrderForm from '../../components/Forms/VendorOrderForm';
import VendorOrderTable from '../../components/Tables/VendorOrderTable';
import VendorTable from '../../components/Tables/VendorTable';

const Orders = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [vendorViewTab, setVendorViewTab] = useState(0);
  const [prefillVendor, setPrefillVendor] = useState(null);

  const handleTabChange = (_event, newValue) => setCurrentTab(newValue);
  const handleVendorViewTabChange = (_event, newValue) => setVendorViewTab(newValue);

  const handleCreateOrderForVendor = (vendor) => {
    setPrefillVendor(vendor);
    setCurrentTab(0);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.1} alignItems="baseline">
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0, fontSize: { xs: 28, md: 30 } }}>
            Create Purchase Order
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 12 }}>
            Manage purchase orders and supplier details
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ borderBottom: '2px solid #e7edf5', mb: 2.5 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 15,
              color: '#64748b',
              '&.Mui-selected': { color: '#1266d8' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#1266d8' },
          }}
        >
          <Tab label="Create Order" />
          <Tab label="Create Vendor" />
          <Tab label="View Vendor" />
          
          <Tab label="View All Orders" />
        </Tabs>
      </Box>

      {currentTab === 0 && <VendorOrderForm prefillVendor={prefillVendor} />}

      {currentTab === 1 && <VendorForm />}

      {currentTab === 2 && (
        <Box>
          <Box sx={{ borderBottom: '2px solid #e7edf5', mb: 2.5 }}>
            <Tabs value={vendorViewTab} onChange={handleVendorViewTabChange}>
              <Tab label="View All Vendors" />
              <Tab label="View Vendors By ID" />
            </Tabs>
          </Box>

          {vendorViewTab === 0 && <VendorTable mode="all" onCreateOrderForVendor={handleCreateOrderForVendor} />}
          {vendorViewTab === 1 && <VendorTable mode="by-id" onCreateOrderForVendor={handleCreateOrderForVendor} />}
        </Box>
      )}

      {currentTab === 3 && <VendorOrderTable />}
    </Box>
  );
};

export default Orders;
