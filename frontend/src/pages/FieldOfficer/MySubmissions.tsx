import { useSubmissions } from '../../hooks/useSubmissions';
import StatusBadge from '../../components/StatusBadge';

interface Props {
  userId: string;
}

export default function MySubmissions({ userId }: Props) {
  const { submissions, loading, error, refetch } = useSubmissions(userId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-fo-accent-600 hover:text-fo-accent-700 font-medium disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-fo-accent-200 border-t-fo-accent-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions yet</h3>
          <p className="text-gray-500 text-sm">Upload and scan a document to create your first submission.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((record) => (
            <div
              key={record.id}
              className={`card !p-4 ${
                record.status === 'rejected' ? 'border-red-200 bg-red-50/30' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {record.owner_name || 'Unknown Owner'}
                    </h3>
                    <StatusBadge status={record.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {record.village && <span>Village: {record.village}</span>}
                    {record.khasra_no && <span>Khasra: {record.khasra_no}</span>}
                    {record.khata_no && <span>Khata: {record.khata_no}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(record.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(record.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Rejection Note — shown when record is rejected */}
              {record.status === 'rejected' && record.rejection_note && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-red-800 text-sm font-medium">Reason for Rejection</p>
                      <p className="text-red-700 text-sm mt-0.5">{record.rejection_note}</p>
                      {record.reviewed_by && (
                        <p className="text-red-500 text-xs mt-1">By: {record.reviewed_by}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
