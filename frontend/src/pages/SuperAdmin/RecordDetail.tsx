import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FIELD_LABELS, FIELD_ORDER, STORAGE_BUCKET } from '../../constants';
import type { LandRecord, LandDocument, ScanFieldResult } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchRecord() {
      setLoading(true);
      setError(null);

      try {
        // Fetch record
        const { data: recordData, error: recordError } = await supabase
          .from('land_records')
          .select('*')
          .eq('id', id)
          .single();

        if (recordError || !recordData) {
          throw new Error(recordError?.message || 'Record not found');
        }

        setRecord(recordData as LandRecord);

        // Fetch documents
        const { data: docsData } = await supabase
          .from('land_documents')
          .select('*')
          .eq('land_record_id', id);

        const docs = (docsData as LandDocument[]) || [];
        setDocuments(docs);

        // Get signed URL for the first document
        if (docs.length > 0 && docs[0]) {
          const { data: urlData } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(docs[0].file_path, 3600); // 1 hour

          if (urlData?.signedUrl) {
            setDocUrl(urlData.signedUrl);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load record');
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-sa-accent-200 border-t-sa-accent-600 rounded-full" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Record not found'}</h3>
          <Link to="/super-admin/search" className="text-sa-accent-600 hover:text-sa-accent-800 font-medium">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const extractedData = record.extracted_data || {};

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        to="/super-admin/search"
        className="inline-flex items-center gap-1 text-sm text-sa-accent-600 hover:text-sa-accent-800 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extracted Data */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Extracted Data</h2>
              <StatusBadge status={record.status} />
            </div>

            <div className="divide-y divide-gray-100">
              {FIELD_ORDER.map((key) => {
                const field = extractedData[key] as ScanFieldResult | undefined;
                return (
                  <div key={key} className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-600">{FIELD_LABELS[key]}</dt>
                    <dd className="text-sm text-gray-900">{field?.value || '—'}</dd>
                    <dd className="text-sm text-gray-600 italic">
                      {field?.translated_value || '—'}
                    </dd>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            {(extractedData.notes || extractedData.notes_translated) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block mb-1">Original</span>
                    <p className="text-sm text-gray-700">{extractedData.notes || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block mb-1">Translated</span>
                    <p className="text-sm text-gray-700">{extractedData.notes_translated || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Record ID:</span>
                <p className="font-mono text-xs text-gray-700 break-all">{record.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Submitted by:</span>
                <p className="text-gray-700">{record.user_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Document Language:</span>
                <p className="text-gray-700">{record.document_language || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Target Language:</span>
                <p className="text-gray-700">{record.target_language || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="text-gray-700">
                  {new Date(record.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              {record.approved_at && (
                <div>
                  <span className="text-gray-500">Approved:</span>
                  <p className="text-gray-700">
                    {new Date(record.approved_at).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Document</h2>

            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No document attached.</p>
            ) : (
              <div>
                {documents.map((doc) => (
                  <div key={doc.id} className="mb-4">
                    <p className="text-sm text-gray-700 font-medium truncate mb-2">{doc.file_name}</p>
                    <p className="text-xs text-gray-400 mb-3">
                      {doc.file_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </p>
                  </div>
                ))}

                {docUrl && (
                  <div className="mb-4">
                    {documents[0]?.file_type?.includes('pdf') ? (
                      <iframe
                        src={docUrl}
                        className="w-full h-96 border border-gray-200 rounded-lg"
                        title="Document Preview"
                      />
                    ) : (
                      <img
                        src={docUrl}
                        alt="Document"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                )}

                {docUrl && (
                  <a
                    href={docUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-sa w-full flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Original
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
