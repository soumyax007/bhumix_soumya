import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { FlowStep, TranslatedResult } from '../../types';
import { FIELD_ORDER, STORAGE_BUCKET } from '../../constants';
import { supabase } from '../../lib/supabaseClient';
import { extractDocument } from '../../lib/scanApi';
import { translateResult } from '../../lib/translateApi';
import Stepper from '../../components/Stepper';
import LanguageSelect from '../../components/LanguageSelect';
import UploadDropzone from '../../components/UploadDropzone';
import ExtractedRecordReview from '../../components/ExtractedRecordReview';

interface Props {
  userId: string;
}

export default function DocumentUploadFlow({ userId }: Props) {
  const [step, setStep] = useState<FlowStep>('idle');
  const [sourceLang, setSourceLang] = useState('hi-IN');
  const [targetLang, setTargetLang] = useState('en-IN');
  const [file, setFile] = useState<File | null>(null);
  const [, setScanResult] = useState<unknown>(null);
  const [translatedResult, setTranslatedResult] = useState<TranslatedResult | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const resetFlow = useCallback(() => {
    setStep('idle');
    setFile(null);
    setScanResult(null);
    setTranslatedResult(null);
    setEditedValues({});
    setNotes('');
    setError(null);
    setSubmittedId(null);
  }, []);

  const handleScan = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStep('scanning');

    try {
      const result = await extractDocument(file);
      setScanResult(result);
      setStep('translating');

      try {
        const translated = await translateResult(result, sourceLang, targetLang);
        setTranslatedResult(translated);

        // Initialize edited values from extracted data
        const initial: Record<string, string> = {};
        for (const key of FIELD_ORDER) {
          const field = translated[key as keyof TranslatedResult];
          // @ts-ignore - this is a simplification for this component
          initial[key] = field?.value ?? '';
        }
        setEditedValues(initial);
        setNotes(translated.notes || '');
        setStep('review');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Translation failed');
        setStep('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setStep('idle');
    }
  }, [file, sourceLang, targetLang]);

  const handleSubmit = useCallback(async () => {
    if (!translatedResult || !file) return;
    setError(null);
    setStep('submitting');

    let recordId: string | null = null;
    let fileUploaded = false;

    try {
      // 1. Insert land_records row
      const record = {
        user_id: userId,
        owner_name: editedValues['owner_name'] || null,
        khasra_no: editedValues['khasra_no'] || null,
        khata_no: editedValues['khata_no'] || null,
        survey_no: editedValues['survey_no'] || null,
        village: editedValues['village'] || null,
        tehsil: editedValues['tehsil'] || null,
        district: editedValues['district'] || null,
        plot_area: editedValues['plot_area'] || null,
        land_classification: editedValues['land_classification'] || null,
        document_language: translatedResult.document_language || null,
        target_language: targetLang,
        extracted_data: translatedResult,
        status: 'pending' as const,
      };

      const { data: insertedRecord, error: insertError } = await supabase
        .from('land_records')
        .insert(record)
        .select('id')
        .single();

      if (insertError || !insertedRecord) {
        throw new Error(insertError?.message || 'Failed to create record');
      }

      recordId = insertedRecord.id;

      // 2. Upload file to storage
      const filePath = `${userId}/${recordId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      fileUploaded = true;

      // 3. Insert land_documents row
      const { error: docError } = await supabase
        .from('land_documents')
        .insert({
          land_record_id: recordId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
        });

      if (docError) {
        throw new Error(`Document record failed: ${docError.message}`);
      }

      // Success!
      setSubmittedId(recordId);
      setStep('submitted');
    } catch (err) {
      // ROLLBACK: clean up partial state
      if (fileUploaded && recordId) {
        // Delete uploaded file
        const filePath = `${userId}/${recordId}/${file.name}`;
        try { await supabase.storage.from(STORAGE_BUCKET).remove([filePath]); } catch { /* rollback best-effort */ }
      }
      if (recordId) {
        // Delete the DB row (CASCADE will clean up land_documents)
        try { await supabase.from('land_records').delete().eq('id', recordId); } catch { /* rollback best-effort */ }
      }

      setError(err instanceof Error ? err.message : 'Submission failed');
      setStep('review');
    }
  }, [translatedResult, file, userId, editedValues, targetLang]);

  const handleFieldEdit = useCallback((key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---- RENDER ----

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper currentStep={step} />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-red-800 font-medium text-sm">Error</p>
            <p className="text-red-700 text-sm mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Step 1: Language & Upload */}
      {step === 'idle' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Languages &amp; Upload Document</h2>
          <LanguageSelect
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
          />
          <UploadDropzone file={file} onFileSelect={setFile} />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleScan}
              disabled={!file}
              className="btn-fo"
            >
              Scan Document
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scanning */}
      {step === 'scanning' && (
        <div className="card text-center py-16">
          <div className="animate-spin w-12 h-12 border-4 border-fo-accent-200 border-t-fo-accent-600 rounded-full mx-auto mb-6" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Scanning your document...</h2>
          <p className="text-gray-500 text-sm">
            This may take up to 60 seconds if the server is waking up from a cold start.
            Please be patient.
          </p>
        </div>
      )}

      {/* Step 3: Translating */}
      {step === 'translating' && (
        <div className="card text-center py-16">
          <div className="animate-spin w-12 h-12 border-4 border-fo-accent-200 border-t-fo-accent-600 rounded-full mx-auto mb-6" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Translating extracted data...</h2>
          <p className="text-gray-500 text-sm">
            Converting fields from source to target language. Almost there.
          </p>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {(step === 'review' || step === 'submitting') && translatedResult && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Review Extracted Data</h2>
            <span className="text-sm text-gray-500">
              Edit any field if the extraction wasn't accurate
            </span>
          </div>

          <ExtractedRecordReview
            data={translatedResult}
            editedValues={editedValues}
            onFieldEdit={handleFieldEdit}
            notes={notes}
            onNotesChange={setNotes}
            disabled={step === 'submitting'}
          />

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={resetFlow}
              disabled={step === 'submitting'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Start Over
            </button>
            <button
              onClick={handleSubmit}
              disabled={step === 'submitting'}
              className="btn-fo flex items-center gap-2"
            >
              {step === 'submitting' && (
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              )}
              {step === 'submitting' ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Submitted */}
      {step === 'submitted' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Record Submitted!</h2>
          <p className="text-gray-600 mb-1">Your land record has been submitted for approval.</p>
          {submittedId && (
            <p className="text-xs text-gray-400 font-mono mb-6">Record ID: {submittedId}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button onClick={resetFlow} className="btn-fo">
              Submit Another
            </button>
            <Link
              to="/field-officer/submissions"
              className="px-4 py-2 text-sm font-medium text-fo-accent-700 bg-fo-accent-50 border border-fo-accent-200 rounded-lg hover:bg-fo-accent-100 transition"
            >
              View My Submissions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
