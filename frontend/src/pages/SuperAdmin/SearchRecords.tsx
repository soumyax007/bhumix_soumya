import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { LandRecord } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function SearchRecords() {
  const [ownerName, setOwnerName] = useState('');
  const [village, setVillage] = useState('');
  const [khasraNo, setKhasraNo] = useState('');
  const [results, setResults] = useState<LandRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('land_records')
        .select('*')
        .eq('status', 'approved');

      if (ownerName.trim()) {
        query = query.ilike('owner_name', `%${ownerName.trim()}%`);
      }
      if (village.trim()) {
        query = query.ilike('village', `%${village.trim()}%`);
      }
      if (khasraNo.trim()) {
        query = query.ilike('khasra_no', `%${khasraNo.trim()}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(100);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setResults((data as LandRecord[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [ownerName, village, khasraNo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Search Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Approved Records</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Owner Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name..."
              className="input-sa"
            />
          </div>
          <div>
            <label className="label">Village</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by village..."
              className="input-sa"
            />
          </div>
          <div>
            <label className="label">Khasra Number</label>
            <input
              type="text"
              value={khasraNo}
              onChange={(e) => setKhasraNo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by khasra..."
              className="input-sa"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-sa flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results === null ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Search approved records</h3>
          <p className="text-gray-500 text-sm">Enter criteria above and click Search to find records.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 font-medium">
              {results.length} record{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Owner Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Village</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Khasra No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">District</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{record.owner_name || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">{record.village || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">{record.khasra_no || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">{record.district || '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={record.status} /></td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/super-admin/record/${record.id}`}
                        className="text-sa-accent-600 hover:text-sa-accent-800 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
