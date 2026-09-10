import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { LandRecord } from '../../types';

interface TehsildarStats {
  tehsildarId: string;
  approved: number;
  rejected: number;
  total: number;
  lastAction: string | null;
}

export default function TehsildarLogs() {
  const [stats, setStats] = useState<TehsildarStats[]>([]);
  const [recentActions, setRecentActions] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all reviewed records (approved or rejected) that have a reviewed_by
        const { data, error: queryError } = await supabase
          .from('land_records')
          .select('*')
          .not('reviewed_by', 'is', null)
          .in('status', ['approved', 'rejected'])
          .order('updated_at', { ascending: false });

        if (queryError) throw new Error(queryError.message);

        const records = (data as LandRecord[]) || [];

        // Aggregate stats per tehsildar
        const statsMap = new Map<string, TehsildarStats>();

        for (const record of records) {
          const tid = record.reviewed_by!;
          if (!statsMap.has(tid)) {
            statsMap.set(tid, {
              tehsildarId: tid,
              approved: 0,
              rejected: 0,
              total: 0,
              lastAction: null,
            });
          }
          const s = statsMap.get(tid)!;
          if (record.status === 'approved') s.approved++;
          if (record.status === 'rejected') s.rejected++;
          s.total++;
          if (!s.lastAction) s.lastAction = record.updated_at;
        }

        setStats(Array.from(statsMap.values()).sort((a, b) => b.total - a.total));
        setRecentActions(records.slice(0, 20)); // Last 20 actions
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-sa-accent-200 border-t-sa-accent-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Total counts
  const totalApproved = stats.reduce((sum, s) => sum + s.approved, 0);
  const totalRejected = stats.reduce((sum, s) => sum + s.rejected, 0);
  const totalReviewed = totalApproved + totalRejected;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card !p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{totalReviewed}</p>
          <p className="text-sm text-gray-500 mt-1">Total Reviewed</p>
        </div>
        <div className="card !p-5 text-center border-green-200 bg-green-50/30">
          <p className="text-3xl font-bold text-green-600">{totalApproved}</p>
          <p className="text-sm text-gray-500 mt-1">Approved</p>
        </div>
        <div className="card !p-5 text-center border-red-200 bg-red-50/30">
          <p className="text-3xl font-bold text-red-600">{totalRejected}</p>
          <p className="text-sm text-gray-500 mt-1">Rejected</p>
        </div>
      </div>

      {/* Per-Tehsildar Breakdown */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tehsildar Performance</h2>

        {stats.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No reviews recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tehsildar</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Approved</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Rejected</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Approval Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.map((s) => {
                  const rate = s.total > 0 ? ((s.approved / s.total) * 100).toFixed(0) : '0';
                  return (
                    <tr key={s.tehsildarId} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-teh-accent-100 rounded-full flex items-center justify-center">
                            <span className="text-teh-accent-600 text-xs font-bold">
                              {s.tehsildarId.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{s.tehsildarId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-green-600 font-semibold">{s.approved}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-red-600 font-semibold">{s.rejected}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">{s.total}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-400">
                        {s.lastAction
                          ? new Date(s.lastAction).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {recentActions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentActions.map((record) => (
              <div
                key={record.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  record.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    record.status === 'approved'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  {record.status === 'approved' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{record.reviewed_by}</span>
                    {' '}
                    <span className={record.status === 'approved' ? 'text-green-700' : 'text-red-700'}>
                      {record.status}
                    </span>
                    {' '}
                    record for <span className="font-medium">{record.owner_name || 'Unknown'}</span>
                    {record.village && <span className="text-gray-500"> — {record.village}</span>}
                  </p>
                  {record.status === 'rejected' && record.rejection_note && (
                    <p className="text-xs text-red-600 mt-1 italic">
                      "{record.rejection_note}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(record.updated_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
