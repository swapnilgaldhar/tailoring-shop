import SettingsIcon from '@mui/icons-material/Settings';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';

const Settings = () => (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    <Paper
      elevation={0}
      sx={{
        maxWidth: 760,
        mx: 'auto',
        p: { xs: 3, md: 5 },
        border: '1px solid #dbe5f0',
        borderRadius: 3,
        textAlign: 'center',
        background: 'linear-gradient(145deg, #ffffff 0%, #f3f8ff 100%)',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            color: '#1266d8',
            backgroundColor: '#e4efff',
          }}
        >
          <SettingsIcon sx={{ fontSize: 38 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#172033' }}>
          Settings are not configured yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
          Hello Admin, there are currently no settings set for your tailoring shop.
          This area will be available when configuration options are added.
        </Typography>
        <Alert severity="info" sx={{ width: '100%', textAlign: 'left' }}>
          No settings are set. Your shop is ready to use with the current defaults.
        </Alert>
      </Stack>
    </Paper>
  </Box>
);

export default Settings;