import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { LandRecord } from '../types';

/**
 * Fetches land record submissions for a given user_id.
 * Handles records disappearing between fetches gracefully (rejected records get deleted).
 */
export function useSubmissions(userId: string | null) {
  const [submissions, setSubmissions] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!userId) {
      setSubmissions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('land_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Records may disappear between fetches (rejected records are deleted)
      // — this is expected, not an error
      setSubmissions((data as LandRecord[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
}
