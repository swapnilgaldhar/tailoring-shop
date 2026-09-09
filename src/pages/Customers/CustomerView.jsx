import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import {
  blazerMeasurementFields,
  jacketMeasurementFields,
  pantMeasurementFields,
  sherwaniMeasurementFields,
  shirtMeasurementFields,
} from '../../constants/measurementFields';

const defaultCustomer = {
  id: 101,
  name: 'Ravi Kumar',
  mobileNumber: '9876543210',
  address: 'No. 12, Main Street, Coimbatore',
  balance: 1250,
  deliveryStatus: 'Delivered',
  deliveryDate: '2026-07-11',
  deliveryItem: 'Shirt and pant set',
  shirtMeasurements: {
    length: '28"',
    chest: '40"',
    waist: '34"',
    hip: '38"',
    shoulder: '18"',
    sleeve: '24"',
    neck: '16"',
    cuff: '8"',
  },
  pantMeasurements: {
    length: '40"',
    waist: '32"',
    hip: '38"',
    thigh: '20"',
    knee: '16"',
    calf: '14"',
    bottom: '16"',
  },
  jacketMeasurements: {},
  blazerMeasurements: {},
  sherwaniMeasurements: {},
  measurementNotes: {
    shirt: 'Front chest adjusted by 0.5 inch for comfort fit.',
    pant: 'Pant bottom kept medium slim as requested.',
  },
};

const formatBalance = (value) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const CustomerView = ({ customer = defaultCustomer, onEdit }) => {
  const deliveryStatus = customer.deliveryStatus ?? customer.deliverystatus ?? customer.delivery_status ?? customer.delivery?.status ?? customer.delivery?.deliveryStatus ?? customer.orderStatus ?? customer.status ?? 'Pending';
  const deliveryDate = customer.deliveryDate ?? customer.delivery?.date ?? customer.delivery?.deliveryDate ?? customer.deliveredAt ?? customer.deliveryAt ?? null;
  const deliveryItem = customer.deliveryItem ?? customer.delivery?.item ?? customer.delivery?.items ?? customer.orderItem ?? 'Tailoring item';
  const customerDetails = [
    { label: 'Customer ID', value: customer.id || '-' },
    { label: 'Mobile Number', value: customer.mobileNumber || '-' },
    { label: 'Address', value: customer.address || '-' },
  ];
  const overviewCards = [
    {
      title: 'Outstanding Balance',
      value: `Rs. ${formatBalance(customer.balance)}`,
      caption: 'Current due amount for this customer',
      accent: '#b45309',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      chip: 'Balance',
      chipColor: '#9a3412',
      chipBackground: '#fed7aa',
    },
  ];
  const summaryCards = [
    {
      title: 'Customer Details',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      content: (
        <Grid container spacing={2}>
          {customerDetails.map((item) => (
            <Grid item xs={12} key={item.label}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
                  gap: 1,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid #e5e7eb',
                  minHeight: 76,
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.8 }}>
                  {item.label}
                </Typography>
                <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 600, wordBreak: 'break-word' }}>
                  {item.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      ),
    },
    ...overviewCards.map((item) => ({
      title: item.title,
      background: item.background,
      border: '1px solid rgba(148, 163, 184, 0.18)',
      content: (
        <Stack justifyContent="space-between" sx={{ height: '100%' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: item.accent, lineHeight: 1.2 }}>
              {item.value}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.7 }}>
              {item.caption}
            </Typography>
            <Chip
              label={item.chip}
              size="small"
              sx={{
                bgcolor: item.chipBackground,
                color: item.chipColor,
                fontWeight: 700,
              }}
            />
          </Box>
        </Stack>
      ),
    })),
  ];

  const measurements = shirtMeasurementFields.map((field) => ({
    label: field.english,
    secondaryLabel: field.marathi,
    value: customer.shirtMeasurements?.[field.key],
  }));

  const pantMeasurements = pantMeasurementFields.map((field) => ({
    label: field.english,
    secondaryLabel: field.marathi,
    value: customer.pantMeasurements?.[field.key],
  }));

  const buildMeasurementItems = (fields, values) => fields.map((field) => ({
    label: field.english,
    secondaryLabel: field.marathi,
    value: values?.[field.key],
  }));

  const jacketMeasurements = buildMeasurementItems(jacketMeasurementFields, customer.jacketMeasurements);
  const blazerMeasurements = buildMeasurementItems(blazerMeasurementFields, customer.blazerMeasurements);
  const sherwaniMeasurements = buildMeasurementItems(sherwaniMeasurementFields, customer.sherwaniMeasurements);

  const measurementSections = [
    {
      title: 'Shirt Measurements',
      items: measurements,
      notes: customer.measurementNotes?.shirt,
    },
    {
      title: 'Pant Measurements',
      items: pantMeasurements,
      notes: customer.measurementNotes?.pant,
    },
    {
      title: 'Jacket Measurements',
      items: jacketMeasurements,
      notes: customer.measurementNotes?.jacket,
    },
    {
      title: 'Blazer Measurements',
      items: blazerMeasurements,
      notes: customer.measurementNotes?.blazer,
    },
    {
      title: 'Sherwani Measurements',
      items: sherwaniMeasurements,
      notes: customer.measurementNotes?.sherwani,
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Card
        elevation={3}
        sx={{
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4, lg: 5 } }}>
          <Stack spacing={4}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ maxWidth: 760 }}>
                <Typography variant="overline" sx={{ color: '#64748b', letterSpacing: 2.4, fontWeight: 700 }}>
                  Customer Profile
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mt: 1, mb: 1.25 }}>
                  {customer.name}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, maxWidth: 640 }}>
                  Full customer information, delivery progress, balance status, and tailoring measurements in one structured profile.
                </Typography>
              </Box>

              <IconButton
                onClick={onEdit}
                size="medium"
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: '#18392B',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: '#10261D' },
                }}
              >
                <EditIcon />
              </IconButton>
            </Box>

            <Divider />

            <Grid container spacing={3} alignItems="stretch">
              {summaryCards.map((item) => (
                <Grid item xs={12} md={6} xl={4} key={item.title} sx={{ display: 'flex' }}>
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 280,
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 3,
                      background: item.background,
                      border: item.border,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#0f172a' }}>
                      {item.title}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {item.content}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3} alignItems="stretch">
              {measurementSections.map((section) => (
                <Grid item xs={12} lg={6} key={section.title} sx={{ display: 'flex' }}>
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 100,
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 3,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#0f172a' }}>
                      {section.title}
                    </Typography>
                    <Grid container spacing={2} alignItems="stretch">
                      {section.items.map((item) => (
                        <Grid item xs={12} sm={6} xl={4} key={item.label} sx={{ display: 'flex' }}>
                          <Box
                            sx={{
                              width: '100%',
                              minHeight: 92,
                              p: 2,
                              borderRadius: 2,
                              bgcolor: 'white',
                              border: '1px solid #e5e7eb',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.7 }}>
                              {item.secondaryLabel}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mt: 0.25 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 1 }}>
                              {item.value || '-'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.7 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      {section.notes || 'No notes added for this measurement set.'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerView;
