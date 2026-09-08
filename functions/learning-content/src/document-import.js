import WordExtractor from 'word-extractor';

export async function importLegacyWord(profile, encoded) {
  if (profile.role !== 'teacher') throw new Error('Only teachers can import Word documents.');
  if (typeof encoded !== 'string' || encoded.length > 2800000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid Word file. The .doc limit is 2 MB.');
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length > 2 * 1024 * 1024 || buffer.subarray(0, 8).toString('hex') !== 'd0cf11e0a1b11ae1') throw new Error('This is not a supported Word .doc file. Save it as .docx and try again.');
  try {
    const document = await new WordExtractor().extract(buffer);
    const text = document.getBody();
    if (!text.trim()) throw new Error('Empty document');
    if (text.length > 500000) throw new Error('Document too long');
    return { text: text.replace(/\r\n?/g, '\n').replace(/\n+/g, '\n\n') };
  } catch {
    throw new Error('Could not read this .doc file. It may be encrypted or damaged. Try saving it as .docx.');
  }
}
