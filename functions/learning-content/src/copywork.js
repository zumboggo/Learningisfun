export function validateObservations(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3 || value.some(item => typeof item !== 'string' || item.trim().length > 2000)) {
    throw new Error('Add up to three observations, each 2,000 characters or fewer.');
  }
  return value.map(item => item.trim()).filter(Boolean);
}
