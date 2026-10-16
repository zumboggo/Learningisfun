// Scoped to the verified advisory class, rather than a class-name match.
export const FAMILY_CONTACT_CLASS_ID = '585406db-6bcf-4fc7-b42f-1f5e4bc8a540';
export const FAMILY_CONTACT_FIELDS = [
  { column: 'Grade', label: 'Grade' },
  { column: 'Passport Name', label: 'Full name as shown on your passport', required: true },
  { column: 'Preferred Name', label: 'Preferred name' },
  { column: 'Gender', label: 'Gender (as written on your card)' },
  { column: 'PP Country', label: 'Passport country' },
  { column: 'Parent 1 Name', label: 'Parent 1 · Full name', required: true },
  { column: 'Parent 1 Cell', label: 'Parent 1 · Mobile phone', type: 'tel', required: true },
  { column: 'Parent 1 Email', label: 'Parent 1 · Email', type: 'email' },
  { column: 'Parent 2 Name', label: 'Parent 2 · Full name' },
  { column: 'Parent 2 Cell', label: 'Parent 2 · Mobile phone', type: 'tel' },
  { column: 'Parent 2 Email', label: 'Parent 2 · Email', type: 'email' },
];
export const blankFamilyContacts = () => FAMILY_CONTACT_FIELDS.map((_, i) => i === 0 ? '9' : '');
export function validateFamilyContacts(values) {
  if (!Array.isArray(values) || values.length !== FAMILY_CONTACT_FIELDS.length || values.some(value => typeof value !== 'string' || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))) throw new Error('Use a single line of up to 200 characters for each field.');
  const clean = values.map(value => value.trim());
  if (clean[0] !== '9') throw new Error('This form is for Grade 9.');
  FAMILY_CONTACT_FIELDS.forEach((field, i) => {
    if (field.required && !clean[i]) throw new Error(`Please complete ${field.label}.`);
    if (field.type === 'email' && clean[i] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean[i])) throw new Error(`Please check ${field.label}.`);
  });
  return clean;
}
// Excel's leading apostrophe preserves phone numbers and prevents formulas.
export function familyContactsTsv(rows) {
  return [...rows].sort((a,b) => a.values[1].localeCompare(b.values[1])).map(row => row.values.map((value,i) => {
    const safe=value.replace(/[\t\r\n]/g,' ');
    return safe && (FAMILY_CONTACT_FIELDS[i].type==='tel' || /^\s*[=+@\-]/.test(safe)) ? `'${safe}` : safe;
  }).join('\t')).join('\n');
}
