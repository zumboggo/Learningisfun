import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildQtiAssessmentXml, buildQtiZip } from '@/services/qti-export';
import type { Quiz, QuizQuestion } from '@/types';

const quiz: Quiz = { $id:'quiz-1',classId:'a',sourceClassId:'a',createdBy:'teacher',title:'World Lit <Quiz>',sourceType:'flashcards',notesWeight:0,flashcardWeight:100,questionCount:2,timeLimitMinutes:10,status:'draft',publishedAt:null,createdAt:'2026-01-01T00:00:00Z',syncStatus:'synced' };
const questions: QuizQuestion[] = [
  {$id:'q1',quizId:'quiz-1',type:'mc',questionText:'Who speaks?',options:JSON.stringify(['Odysseus','<Cyclops>']),correctIndex:0,clozeAnswer:'',explanation:'',sortOrder:0},
  {$id:'q2',quizId:'quiz-1',type:'cloze',questionText:'The hero is ___.',options:'[]',correctIndex:0,clozeAnswer:'Odysseus',clozeVariants:JSON.stringify(['Ulysses']),explanation:'',sortOrder:1},
];
describe('QTI export',()=>{it('creates a QTI 1.2 package with a manifest and both question types',async()=>{const zip=await JSZip.loadAsync(await buildQtiZip(quiz,questions).then(b=>b.arrayBuffer()));expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['imsmanifest.xml','assessment.xml']));const xml=await zip.file('assessment.xml')!.async('string');expect(xml).toContain('multiple_choice_question');expect(xml).toContain('short_answer_question');expect(xml).toContain('Odysseus');expect(xml).toContain('Ulysses');expect(xml).toContain('&lt;Quiz&gt;');expect(xml).toContain('<fieldentry>10</fieldentry>');});});
describe('QTI text export',()=>{it('returns the same readable assessment XML used by the ZIP',()=>{const assessment=buildQtiAssessmentXml(quiz,questions);expect(assessment).toContain('<questestinterop');expect(assessment).toContain('World Lit &lt;Quiz&gt;');expect(assessment).toContain('multiple_choice_question');});});
