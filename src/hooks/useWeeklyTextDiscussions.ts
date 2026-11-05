import { useEffect, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import type { ReadingDiscussionListing } from '@/services/reading-discussion.service';

// Fetch once for the text list, rather than once for every text.
export function useWeeklyTextDiscussions(classId: string | undefined, userId?: string) {
  const [result, setResult] = useState<{ classId?: string; userId?: string; rows: ReadingDiscussionListing[] }>();
  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let loading = false;
    const refresh = async () => {
      if (loading) return;
      loading = true;
      try {
        const result = await executeLearningContent<{ readings: ReadingDiscussionListing[] }>({ action: 'listReadingDiscussions', listingClassId: classId, includeActivity: false });
        if (!disposed) setResult({ classId, userId, rows: result.readings.filter(row => (!classId || row.classId === classId) && row.available) });
      } catch {
        // Keep the last successful activity state during a temporary outage.
      } finally { loading = false; }
    };
    void refresh();
    const onRefresh = (event: Event) => { if ((event as CustomEvent).detail === classId) void refresh(); };
    window.addEventListener('class-materials-refreshed', onRefresh);
    return () => { disposed = true; window.removeEventListener('class-materials-refreshed', onRefresh); };
  }, [classId, userId]);
  return result && result.classId === classId && result.userId === userId ? result.rows : [];
}
