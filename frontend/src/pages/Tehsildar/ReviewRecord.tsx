import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FIELD_LABELS, FIELD_ORDER, STORAGE_BUCKET } from '../../constants';
import type { LandRecord, LandDocument, ScanFieldResult } from '../../types';
import StatusBadge from '../../components/StatusBadge';

interface Props {
  tehsildarId: string;
}

export default function ReviewRecord({ tehsildarId }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchRecord() {
      setLoading(true);
      setError(null);

      try {
        const { data: recordData, error: recordError } = await supabase
          .from('land_records')
          .select('*')
          .eq('id', id)
          .single();

        if (recordError || !recordData) {
          throw new Error(recordError?.message || 'Record not found');
        }

        setRecord(recordData as LandRecord);

        const { data: docsData } = await supabase
          .from('land_documents')
          .select('*')
          .eq('land_record_id', id);

        const docs = (docsData as LandDocument[]) || [];
        setDocuments(docs);

        if (docs.length > 0 && docs[0]) {
          const { data: urlData } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(docs[0].file_path, 3600);

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

  /** APPROVE: update status to 'approved', set approved_at and reviewed_by */
  const handleApprove = async () => {
    if (!id) return;
    setActionLoading('approve');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('land_records')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_by: tehsildarId,
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      navigate('/tehsildar', { state: { approved: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
      setActionLoading(null);
    }
  };

  /**
   * REJECT: soft-reject — update status to 'rejected' with a note.
   * Data is NOT deleted so the Field Officer can see the rejection reason.
   */
  const handleReject = async () => {
    if (!id || !rejectionNote.trim()) return;
    setActionLoading('reject');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('land_records')
        .update({
          status: 'rejected',
          rejection_note: rejectionNote.trim(),
          reviewed_by: tehsildarId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      navigate('/tehsildar', { state: { rejected: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
      setActionLoading(null);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-teh-accent-200 border-t-teh-accent-600 rounded-full" />
      </div>
    );
  }

  // --- Error / Not found ---
  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <Link to="/tehsildar" className="text-teh-accent-600 hover:text-teh-accent-800 font-medium">
            ← Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const extractedData = record.extracted_data || {};
  const isPending = record.status === 'pending';

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        to="/tehsildar"
        className="inline-flex items-center gap-1 text-sm text-teh-accent-600 hover:text-teh-accent-800 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Queue
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

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
                <span className="text-gray-500">Submitted by:</span>
                <p className="text-gray-700">{record.user_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="text-gray-700">
                  {new Date(record.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Document Language:</span>
                <p className="text-gray-700">{record.document_language || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Target Language:</span>
                <p className="text-gray-700">{record.target_language || '—'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons — only for pending records */}
          {isPending && (
            <div className="mt-6">
              {!showRejectConfirm ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={!!actionLoading}
                    className="flex-1 py-3 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'approve' ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {actionLoading === 'approve' ? 'Approving...' : 'Approve Record'}
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={!!actionLoading}
                    className="flex-1 py-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Record
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="text-red-800 font-semibold">Reject this record</h3>
                      <p className="text-red-700 text-sm mt-1">
                        Please provide a reason for rejection. The Field Officer will see this note in their submissions.
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="e.g. Document is illegible, incorrect khasra number, missing owner signature..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 mb-4"
                    disabled={!!actionLoading}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={!!actionLoading || !rejectionNote.trim()}
                      className="px-6 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading === 'reject' ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : null}
                      {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => { setShowRejectConfirm(false); setRejectionNote(''); }}
                      disabled={!!actionLoading}
                      className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show existing rejection note if already rejected */}
          {record.status === 'rejected' && record.rejection_note && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="text-red-800 font-semibold text-sm mb-1">Rejection Reason</h3>
              <p className="text-red-700 text-sm">{record.rejection_note}</p>
              {record.reviewed_by && (
                <p className="text-red-500 text-xs mt-2">Rejected by: {record.reviewed_by}</p>
              )}
            </div>
          )}
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
                    <p className="text-sm text-gray-700 font-medium truncate mb-1">{doc.file_name}</p>
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
                    className="btn-teh w-full flex items-center justify-center gap-2"
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
