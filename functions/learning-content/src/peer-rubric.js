export function validatePeerRubric(r) {
 const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 if(!r||!text(r.name,100)||!Array.isArray(r.columns)||r.columns.length<1||r.columns.length>8||r.columns.some(c=>!text(c,100))||!Array.isArray(r.rows)||r.rows.length<1||r.rows.length>20) return false;
 return new Set(r.rows.map(row=>row?.id)).size===r.rows.length&&r.rows.every(row=>row&&typeof row.id==='string'&&/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(row.id)&&text(row.label,100)&&typeof row.description==='string'&&row.description.length<=500&&Array.isArray(row.points)&&row.points.length===r.columns.length&&row.points.every(p=>typeof p==='number'&&Number.isFinite(p)&&p>=0&&p<=1000)&&Math.max(...row.points)>0);
}
const keys=['poise','voice','life','eyeContact','gestures','speed'];
export function peerRatingData(activity,ratings) {
 const rubric=activity.rubricJson?JSON.parse(activity.rubricJson):null;
 const ids=rubric?rubric.rows.map(r=>r.id):keys, columns=rubric?rubric.columns.length:3;
 if(!ratings||ids.some(id=>!Number.isInteger(ratings[id])||ratings[id]<1||ratings[id]>columns))return null;
 const normalized=Object.fromEntries(ids.map(id=>[id,ratings[id]]));
 // Required legacy fields remain populated for backwards-compatible storage.
 return rubric?{...Object.fromEntries(keys.map(id=>[id,2])),ratingsJson:JSON.stringify(normalized)}:normalized;
}
