export const rhetoricalFields=['writer','audience','purpose','exigence','context','message'];
// David’s existing AP Language section is labelled AP English in the live app.
export const isApLanguageCourse=(name,classId)=>classId==='88421c66-9cda-4002-8e15-086312b7805e'||/^AP\s+(?:English\s+)?Lang(?:uage)?\b/i.test(String(name||'').trim());
