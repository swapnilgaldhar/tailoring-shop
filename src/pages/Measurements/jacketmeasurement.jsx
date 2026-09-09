import { Box, Grid, TextField, Typography } from '@mui/material';
import { getMeasurementFieldLabel, jacketMeasurementFields } from '../../constants/measurementFields';

const JacketMeasurement = ({ formData, measurementErrors, onFieldChange }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
      Jacket Measurements
    </Typography>
    <Grid container spacing={2}>
      {jacketMeasurementFields.map((field) => (
        <Grid item xs={12} sm={6} md={4} key={field.key}>
          <TextField
            label={getMeasurementFieldLabel(field)}
            name={`jacketMeasurements.${field.key}`}
            value={formData.jacketMeasurements[field.key]}
            onChange={onFieldChange}
            error={Boolean(measurementErrors[`jacketMeasurements.${field.key}`])}
            helperText={measurementErrors[`jacketMeasurements.${field.key}`]}
            inputProps={{ inputMode: 'decimal' }}
            fullWidth
          />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default JacketMeasurement;
