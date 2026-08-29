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
  { key: 'chainFly', marathi: 'चेन फ्लाय', english: 'Chain Fly' },
  { key: 'knee', marathi: 'गुडघा', english: 'Knee' },
  { key: 'calf', marathi: 'पोटरी', english: 'Calf' },
  { key: 'bottom', marathi: 'बॉटम', english: 'Bottom' },
];

export const jacketMeasurementFields = [
  { key: 'length', marathi: 'उंची', english: 'Length' },
  { key: 'chest', marathi: 'छाती', english: 'Chest' },
  { key: 'waist', marathi: 'पोट', english: 'Waist' },
  { key: 'hip', marathi: 'सीट', english: 'Hip' },
  { key: 'shoulder', marathi: 'शोल्डर', english: 'Shoulder' },
  { key: 'standCollar', marathi: 'स्टँड कॉलर', english: 'Stand Collar' },
  { key: 'note', marathi: 'टीप', english: 'Note' },
];

export const blazerMeasurementFields = [
  { key: 'height', marathi: 'उंची', english: 'Height' },
  { key: 'chest', marathi: 'छाती', english: 'Chest' },
  { key: 'waist', marathi: 'पोट', english: 'Waist' },
  { key: 'hip', marathi: 'सीट', english: 'Hip' },
  { key: 'shoulder', marathi: 'शोल्डर', english: 'Shoulder' },
  { key: 'bicep', marathi: 'बायसेप', english: 'Bicep' },
  { key: 'sleeveLength', marathi: 'हात', english: 'Sleeve Length' },
  { key: 'note', marathi: 'टीप', english: 'Note' },
  { key: 'cuffWidth', marathi: 'कफ', english: 'Cuff Width' },
  { key: 'lapelWidth', marathi: 'लॅपल', english: 'Lapel Width' },
];

export const sherwaniMeasurementFields = [
  { key: 'chest', marathi: 'छाती', english: 'Chest' },
  { key: 'waist', marathi: 'पोट', english: 'Waist' },
  { key: 'hip', marathi: 'सीट', english: 'Hip' },
  { key: 'shoulder', marathi: 'शोल्डर', english: 'Shoulder' },
  { key: 'sleeve', marathi: 'हात', english: 'Sleeve' },
  { key: 'length', marathi: 'उंची', english: 'Length' },
  { key: 'neck', marathi: 'कॉलर', english: 'Neck' },
  { key: 'cuff', marathi: 'कफ', english: 'Cuff' },
  { key: 'stand', marathi: 'स्टँड', english: 'Stand' },
  { key: 'notes', marathi: 'टीप', english: 'Notes' },
];

export const measurementBackendKeys = {
  shirtMeasurements: 'shirtMeasurement',
  pantMeasurements: 'pantMeasuremet',
  jacketMeasurements: 'jacketMeasuremet',
  blazerMeasurements: 'blazerMeasurement',
  sherwaniMeasurements: 'sherwaniMeasuremet',
};

export const createMeasurementState = (fields) =>
  fields.reduce((accumulator, field) => {
    accumulator[field.key] = '';
    return accumulator;
  }, {});

export const getMeasurementFieldLabel = (field) => `${field.marathi} / ${field.english}`;