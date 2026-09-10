import type { ExtractableField, LanguageOption } from '../types';

// Human-readable labels for each extractable field
export const FIELD_LABELS: Record<ExtractableField, string> = {
  owner_name: 'Owner Name',
  khasra_no: 'Khasra Number',
  khata_no: 'Khata Number',
  survey_no: 'Survey Number',
  village: 'Village',
  tehsil: 'Tehsil',
  district: 'District',
  plot_area: 'Plot Area',
  land_classification: 'Land Classification',
};

// Display order of fields in the review screen
export const FIELD_ORDER: ExtractableField[] = [
  'owner_name',
  'khasra_no',
  'khata_no',
  'survey_no',
  'village',
  'tehsil',
  'district',
  'plot_area',
  'land_classification',
];

// Supported language codes — matches the translator API
export const LANGUAGE_CODES: LanguageOption[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'od-IN', label: 'Odia' },
];

// Accepted file types for document upload
export const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.tif,.tiff,.pdf';
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/pdf',
];

// Supabase storage bucket name
export const STORAGE_BUCKET = 'land-documents';
