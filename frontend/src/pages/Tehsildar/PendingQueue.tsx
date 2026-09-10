import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { LandRecord } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function PendingQueue() {
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('land_records')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setRecords((data as LandRecord[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {records.length} record{records.length !== 1 ? 's' : ''} awaiting review
        </p>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-teh-accent-600 hover:text-teh-accent-700 font-medium disabled:opacity-50"
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

      {loading && records.length === 0 ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-teh-accent-200 border-t-teh-accent-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading pending records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
          <p className="text-gray-500 text-sm">No pending records to review right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Link
              key={record.id}
              to={`/tehsildar/review/${record.id}`}
              className="card !p-4 flex items-center gap-4 hover:border-teh-accent-300 hover:shadow-md transition-all block"
            >
              <div className="w-10 h-10 bg-teh-accent-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-teh-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
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
                  <span>By: {record.user_id}</span>
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
                <p className="text-teh-accent-600 text-sm font-medium mt-1">Review →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
