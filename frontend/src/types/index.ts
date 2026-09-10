// A single field result from the scanner API
export interface ScanFieldResult {
  value: string | null;
  confidence: number;
  translated_value?: string;
}

// Raw response from POST /extract
export interface ScanResult {
  owner_name: ScanFieldResult;
  khasra_no: ScanFieldResult;
  khata_no: ScanFieldResult;
  survey_no: ScanFieldResult;
  village: ScanFieldResult;
  tehsil: ScanFieldResult;
  district: ScanFieldResult;
  plot_area: ScanFieldResult;
  land_classification: ScanFieldResult;
  document_language: string;
  notes: string;
}

// Response from POST /translate (extends scan result with translations)
export interface TranslatedResult extends ScanResult {
  owner_name: ScanFieldResult & { translated_value: string };
  khasra_no: ScanFieldResult & { translated_value: string };
  khata_no: ScanFieldResult & { translated_value: string };
  survey_no: ScanFieldResult & { translated_value: string };
  village: ScanFieldResult & { translated_value: string };
  tehsil: ScanFieldResult & { translated_value: string };
  district: ScanFieldResult & { translated_value: string };
  plot_area: ScanFieldResult & { translated_value: string };
  land_classification: ScanFieldResult & { translated_value: string };
  notes_translated: string;
  target_language: string;
}

// The extractable field keys (excludes document_language, notes, etc.)
export type ExtractableField = 
  | 'owner_name'
  | 'khasra_no'
  | 'khata_no'
  | 'survey_no'
  | 'village'
  | 'tehsil'
  | 'district'
  | 'plot_area'
  | 'land_classification';

// Database row from land_records table
export interface LandRecord {
  id: string;
  user_id: string;
  owner_name: string | null;
  khasra_no: string | null;
  khata_no: string | null;
  survey_no: string | null;
  village: string | null;
  tehsil: string | null;
  district: string | null;
  plot_area: string | null;
  land_classification: string | null;
  document_language: string | null;
  target_language: string | null;
  extracted_data: TranslatedResult;
  status: 'pending' | 'approved' | 'rejected';
  rejection_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

// Database row from land_documents table
export interface LandDocument {
  id: string;
  land_record_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

// Database row from invite_codes table
export interface InviteCode {
  id: string;
  email: string;
  code: string;
  role: 'field_officer' | 'tehsildar';
  is_used: boolean;
  generated_by: string | null;
  created_at: string;
}

// Upload flow state machine
export type FlowStep = 'idle' | 'scanning' | 'translating' | 'review' | 'submitting' | 'submitted';

export interface LanguageOption {
  code: string;
  label: string;
}
