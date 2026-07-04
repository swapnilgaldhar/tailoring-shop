import { Box, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary">
        Welcome to the Tailoring Shop  Dashboard
      </Typography>
    </Box>
  );
};

export default Dashboard;
