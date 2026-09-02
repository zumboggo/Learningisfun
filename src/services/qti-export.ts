import JSZip from 'jszip';
import type { Quiz, QuizQuestion } from '@/types';

const xml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function questionXml(question: QuizQuestion, index: number): string {
  const id = `q_${index + 1}_${question.$id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (question.type === 'mc') {
    const options: string[] = JSON.parse(question.options || '[]');
    const labels = options.map((option, i) =>
      `<response_label ident="a${i}"><material><mattext texttype="text/html">${xml(option)}</mattext></material></response_label>`
    ).join('');
    return `<item ident="${id}" title="Question ${index + 1}">
      <itemmetadata><qtimetadata><qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield><qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1</fieldentry></qtimetadatafield></qtimetadata></itemmetadata>
      <presentation><material><mattext texttype="text/html">${xml(question.questionText)}</mattext></material><response_lid ident="response1" rcardinality="Single"><render_choice>${labels}</render_choice></response_lid></presentation>
      <resprocessing><outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes><respcondition continue="No"><conditionvar><varequal respident="response1">a${question.correctIndex}</varequal></conditionvar><setvar action="Set" varname="SCORE">100</setvar></respcondition></resprocessing>
    </item>`;
  }
  if (question.type === 'matching') {
    const data = parseMatching(question.matchingData);
    const labels = data.terms.map((term, termIndex) => `<response_label ident="term${termIndex}"><material><mattext texttype="text/html">${xml(term)}</mattext></material></response_label>`).join('');
    const responses = data.pairs.map((pair, pairIndex) => `<material><mattext texttype="text/html">${xml(pair.definition)}</mattext></material><response_lid ident="match${pairIndex}" rcardinality="Single"><render_choice>${labels}</render_choice></response_lid>`).join('');
    const scoring = data.pairs.map((pair, pairIndex) => {
      const correctIndex = data.terms.indexOf(pair.term);
      return `<respcondition continue="Yes"><conditionvar><varequal respident="match${pairIndex}">term${correctIndex}</varequal></conditionvar><setvar action="Add" varname="SCORE">${100 / data.pairs.length}</setvar></respcondition>`;
    }).join('');
    return `<item ident="${id}" title="Matching ${index + 1}">
      <itemmetadata><qtimetadata><qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>matching_question</fieldentry></qtimetadatafield><qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>${question.points ?? data.pairs.length * 0.5}</fieldentry></qtimetadatafield></qtimetadata></itemmetadata>
      <presentation><material><mattext texttype="text/html">${xml(question.questionText)}</mattext></material>${responses}</presentation>
      <resprocessing><outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>${scoring}</resprocessing>
    </item>`;
  }
  const variants = [question.clozeAnswer, ...parseVariants(question.clozeVariants)].filter(Boolean);
  const conditions = variants.map(answer => `<varequal respident="response1" case="No">${xml(answer)}</varequal>`).join('');
  return `<item ident="${id}" title="Question ${index + 1}">
    <itemmetadata><qtimetadata><qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>short_answer_question</fieldentry></qtimetadatafield><qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1</fieldentry></qtimetadatafield></qtimetadata></itemmetadata>
    <presentation><material><mattext texttype="text/html">${xml(question.questionText)}</mattext></material><response_str ident="response1" rcardinality="Single"><render_fib><response_label ident="answer1"/></render_fib></response_str></presentation>
    <resprocessing><outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes><respcondition continue="No"><conditionvar><or>${conditions}</or></conditionvar><setvar action="Set" varname="SCORE">100</setvar></respcondition></resprocessing>
  </item>`;
}

function parseMatching(raw?: string): { pairs: Array<{ id: string; definition: string; term: string }>; terms: string[] } {
  try {
    const value = JSON.parse(raw || '{}');
    return { pairs: Array.isArray(value.pairs) ? value.pairs : [], terms: Array.isArray(value.terms) ? value.terms : [] };
  } catch { return { pairs: [], terms: [] }; }
}

function parseVariants(raw?: string): string[] {
  try { const value = JSON.parse(raw || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}

export function buildQtiAssessmentXml(quiz: Quiz, questions: QuizQuestion[]): string {
  const assessmentId = `quiz_${quiz.$id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">
  <assessment ident="${assessmentId}" title="${xml(quiz.title)}"><qtimetadata><qtimetadatafield><fieldlabel>quiz_type</fieldlabel><fieldentry>assignment</fieldentry></qtimetadatafield>${quiz.timeLimitMinutes ? `<qtimetadatafield><fieldlabel>time_limit</fieldlabel><fieldentry>${quiz.timeLimitMinutes}</fieldentry></qtimetadatafield>` : ''}</qtimetadata><section ident="root_section">${questions.map(questionXml).join('\n')}</section></assessment>
</questestinterop>`;
}

export function buildQuizCopyText(quiz: Quiz, questions: QuizQuestion[]): string {
  const body = questions.map((question, index) => {
    if (question.type === 'mc') {
      const options: string[] = JSON.parse(question.options || '[]');
      return `${index + 1}. ${question.questionText}\n${options.map((option, optionIndex) => `   ${String.fromCharCode(65 + optionIndex)}. ${option}`).join('\n')}\n   Answer: ${String.fromCharCode(65 + question.correctIndex)}`;
    }
    if (question.type === 'matching') {
      const data = parseMatching(question.matchingData);
      return `${index + 1}. ${question.questionText}\n${data.pairs.map((pair, pairIndex) => `   ${pairIndex + 1}. ${pair.definition}`).join('\n')}\n   Terms: ${data.terms.join(' · ')}\n   Answer key:\n${data.pairs.map((pair, pairIndex) => `   ${pairIndex + 1}. ${pair.term}`).join('\n')}`;
    }
    return `${index + 1}. ${question.questionText}\n   Answer: ${question.clozeAnswer}`;
  }).join('\n\n');
  return `${quiz.title}\n${'='.repeat(Math.max(3, quiz.title.length))}\n\n${body}`;
}

export async function buildQtiZip(quiz: Quiz, questions: QuizQuestion[]): Promise<Blob> {
  const assessmentId = `quiz_${quiz.$id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const assessment = buildQtiAssessmentXml(quiz, questions);
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${assessmentId}" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_v2p1">
  <organizations/><resources><resource identifier="${assessmentId}" type="imsqti_xmlv1p2" href="assessment.xml"><file href="assessment.xml"/></resource></resources>
</manifest>`;
  const zip = new JSZip();
  zip.file('imsmanifest.xml', manifest);
  zip.file('assessment.xml', assessment);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
