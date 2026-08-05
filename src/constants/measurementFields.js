export const shirtMeasurementFields = [
  { key: 'length', marathi: 'उंची', english: 'Shirt Length' },
  { key: 'chest', marathi: 'छाती', english: 'Chest' },
  { key: 'waist', marathi: 'पोट', english: 'Waist/Stomach' },
  { key: 'hip', marathi: 'सीट', english: 'Seat/Hip' },
  { key: 'shoulder', marathi: 'शोल्डर', english: 'Shoulder' },
  { key: 'sleeve', marathi: 'हात', english: 'Sleeve Length' },
  { key: 'neck', marathi: 'कॉलर', english: 'Collar/Neck' },
  { key: 'cuff', marathi: 'कफ', english: 'Cuff' },
];

export const pantMeasurementFields = [
  { key: 'length', marathi: 'उंची', english: 'Pant Length' },
  { key: 'waist', marathi: 'कंबर', english: 'Waist' },
  { key: 'hip', marathi: 'सीट', english: 'Seat/Hip' },
  { key: 'thigh', marathi: 'मांडी', english: 'Thigh' },
  { key: 'knee', marathi: 'गुडघा', english: 'Knee' },
  { key: 'calf', marathi: 'पोटरी', english: 'Calf' },
  { key: 'bottom', marathi: 'बॉटम', english: 'Bottom' },
];

export const createMeasurementState = (fields) =>
  fields.reduce((accumulator, field) => {
    accumulator[field.key] = '';
    return accumulator;
  }, {});

export const getMeasurementFieldLabel = (field) => `${field.marathi} / ${field.english}`;