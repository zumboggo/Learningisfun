import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCharacter} from '../../../functions/learning-content/src/character-builder.js';
import {validatePackage} from '../../../functions/learning-content/src/story-engine.js';
import {packageContentBytes} from '../../../functions/learning-content/src/acting-library.js';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),read=p=>readFile(new URL(p,root));
const rounds=JSON.parse(await readFile(new URL('rounds.json',here),'utf8'));
const image=async p=>({src:'data:image/webp;base64,'+(await read(p)).toString('base64')});
const stage=()=>`scene studio\nshow Vex determined left\nshow Sora curious right\ncamera two Vex Sora\n`;
let script=`story 2
variable Recognised = 0 range 0 7 hidden
variable Explained = 0 range 0 7 hidden
variable Recovered = 0 range 0 7 hidden
label opening
scene classroom
show Hepting curious left
show Lin excited right
camera two Hepting Lin
Hepting [curious]: Today we ask how a writer's choices affect an audience.
Lin [excited]: Does the audience have to be awake?
I: Mr. Hepting opens his secret WeChat mini-program. A Didi passes through the classroom window and settles at the front without touching a desk.
Hepting [determined]: Excellent. A music-industry example.
effect magic
scene rift
show Driver neutral center
camera medium Driver
Driver [determined]: Seat belts. No eating. No describing my fare as highway robbery unless you can explain the figure of speech.
I: Lin and I buckle in. The Didi lifts over the CDIS soccer field and dives into a spacetime rift.
scene studio
show Vex determined left
show Sora worried right
camera wide
I: Seoul, 2026. An entirely fictional recording studio. We step out expecting a backstage visit. Someone locks the door behind us.
Vex [determined]: Welcome to NEON ALIBI. We require a global English-language hit. Our lyricist has disappeared.
Sora [worried]: He left a note saying he was going to find himself. That was six choruses ago.
show Manager worried center
Manager [determined]: Our debut stream starts in seven countdown slides. You cannot leave until the lyrics work.
I: I check the handle. Locked. I have been kidnapped by people whose emergency plan is a presentation.
prop Vex rubber-duck
act Vex reach "Vex presents a yellow rubber duck as though unveiling a terrifying secret weapon."
Vex [determined]: You will make us unforgettable.
I: Squeak.
move Manager exit
show Lin skeptical center
Lin [skeptical]: We could have stayed in class and been confused for free.
Sora [determined]: We know English. We need help with connotation, idiom, and why a line lands. Please judge our writing, not our accents.
Vex [angry]: THIS IS SERIOUS.
I: The duck is wearing a more convincing expression of authority than he is.
prop Vex none
move Lin exit
I: Each round offers three original lyrics. I choose my favourite, identify a device, then explain its effect for this audience. Taste has no wrong answer; analysis needs evidence.
I: A wrong analysis brings a ridiculous foam-prop interruption and a teaching clue. Nothing here is timed, nobody is injured, and the four-question fare home comes later.
`;
for(const [ri,r] of rounds.entries()){
 const next=ri===rounds.length-1?'debut':rounds[ri+1].id;
 script+=`label ${r.id}\n${stage()}I: ROUND ${ri+1} OF 7. ${r.context}\n${r.intro}\nI: Which of these three lyrics is my favourite?\nchoice lyric_${r.id}\n`;
 for(const [li,l] of r.lyrics.entries())script+=`option line${li+1} "${l.text}" -> ${r.id}_${li}\n`;
 for(const [li,l] of r.lyrics.entries()){
  const p=`${r.id}_${li}`,prop=r.gag==='duck'?'rubber-duck':'pool-noodle';
  script+=`label ${p}\n${l.reaction}\nI: My choice is saved for the debut lyric sheet. There is no taste score.\nSora [curious]: ${r.prompt}\nI: My line: ${l.text}\nchoice identify_${p}\n`;
  const answers=[{id:'right',text:r.device+': '+l.evidence+'.',to:p+'_recognised',change:' ; Recognised += 1'},...r.distractors.map((text,i)=>({id:'other'+i,text,to:p+'_confused',change:''}))];
  const offset=(ri+li)%3;for(const a of [...answers.slice(offset),...answers.slice(0,offset)])script+=`option ${a.id} "${a.text}" -> ${a.to}${a.change}\n`;
  script+=`label ${p}_recognised\nSora [happy]: Yes. You located the pattern: ${l.evidence}. Now explain why it belongs in this song.\ngoto ${p}_memory\nlabel ${p}_confused\nprop Vex ${prop}\ncamera wide\nact Vex reach "${r.gagText}"\n${r.gagLine}\nprop Vex none\nI: I need to look at the wording again. A memory interrupts the studio's purple glare.\ngoto ${p}_memory\nlabel ${p}_memory\nscene memory\nshow Hepting curious left\nshow Lin curious right\ncamera two Hepting Lin cut\nI: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.\nHepting [determined]: ${r.definition}\nHepting [curious]: ${r.memory}\n${r.memoryJoke}\n${stage()}Sora [curious]: Back to our lyric: ${l.text}\nI: Which explanation connects its wording to this audience and purpose?\nchoice explain_${p}\n`;
  const effects=[{id:'right',text:l.effect,to:p+'_explained',change:' ; Explained += 1'}, {id:'overclaim',text:r.wrongEffect,to:p+'_support',change:''},{id:'vague',text:r.genericEffect,to:p+'_support',change:''}];
  const eoff=(ri+li+1)%3;for(const a of [...effects.slice(eoff),...effects.slice(0,eoff)])script+=`option ${a.id} "${a.text}" -> ${a.to}${a.change}\n`;
  script+=`label ${p}_explained\nSora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.\ngoto ${r.id}_outro\nlabel ${p}_support\nprop Vex ${prop}\nact Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless ${r.gag==='duck'?'squeak beside his own ear':'pink foam curl against his own cheek'}."\nVex [frustrated]: How can a device be correct but my explanation be wrong?\nSora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.\nI: I can correct my explanation now. No taste choice is lost.\nchoice recover_${p}\noption grounded "${l.effect}" -> ${p}_recovered ; Recovered += 1\noption insist "Naming the device alone guarantees the song will be a hit." -> ${p}_guided\nlabel ${p}_recovered\nSora [relieved]: Exactly. The explanation is grounded in this line.\nprop Vex none\ngoto ${r.id}_outro\nlabel ${p}_guided\nSora [determined]: A device cannot guarantee a hit. Here is the link: ${l.effect}\nI: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.\nprop Vex none\ngoto ${r.id}_outro\n`;
 }
 script+=`label ${r.id}_outro\nscene studio\nshow Manager worried left\nshow Sora curious right\nshow Vex worried center\ncamera wide\n${r.outro}\ngoto ${next}\n`;
}
script+=`label debut
scene studio
show Vex scared left
show Sora determined right
camera wide
I: My seven favourite lines appear on the debut sheet below. The band performs them in that order as one magnificently excessive comeback medley.
Sora [determined]: We begin with the repeated opening, turn through contrast and imagery, and save the bitter compliment for the finish.
activity Vex walk right brisk
Vex [scared]: What if the audience asks what the song means?
activity Vex pause
Sora [skeptical]: Then, for the first time in your career, you will answer the question.
activity Vex stop
if Explained >= 5 -> confident else coached
label confident
Vex [determined]: Your explanations gave us something more useful than impressive names. I can point to the words and explain an effect.
goto press
label coached
Sora [determined]: We needed a few clues. Keep the useful part: identify the words, explain a plausible effect, and connect it to the audience.
goto press
label press
show Manager shocked center
camera wide
Manager [shocked]: A journalist says our repeated chorus is lazy. Answer before Vex calls it international diplomacy.
Vex [determined]: It is international diplo—
Sora [angry]: No.
I: This is this week's objection skill in a new situation. What should I recommend for the interview?
choice press_response
option concession "Acknowledge repetition can become empty; explain how our repeated opening invites the crowd to join." -> press_reasoned
option attack "Say that anyone who dislikes repetition does not understand music." -> press_attack
option certainty "Promise that repetition makes every listener love the song." -> press_certainty
label press_reasoned
Sora [determined]: Repetition can become empty. Here, the recurring opening gives listeners an entrance they can learn and share.
I: She concedes a reasonable concern, then answers it with a specific purpose. She does not concede that our chorus is necessarily lazy.
goto press_finish
label press_attack
Manager [worried]: Now the journalist wants to know why we insulted the audience.
Sora [determined]: Criticising the person does not answer the objection. Repetition can become empty; our reason for using it is audience participation.
goto press_finish
label press_certainty
Vex [proud]: Every listener will love it. We guarantee—
Sora [worried]: We cannot guarantee that. Repetition can invite participation; some listeners may still find it excessive.
I: A qualifier makes the claim more defensible. Confidence does not require a promise we cannot support.
goto press_finish
label press_finish
camera two Vex Sora
Sora [curious]: In the next interview, we could anticipate that objection before anyone asks. That would be procatalepsis.
Vex [confused]: Is Procatalepsis our new distributor?
I: The manager finally stops refreshing the audience counter. We have made a performance we can explain, not a guaranteed hit.
move Manager exit
show Lin relieved center
Lin [relieved]: The door is open. Nobody move until I have confirmed that leaving is literal.
show Driver neutral left
move Vex exit
camera two Driver Sora
Driver [determined]: Your Didi is here. Four questions pay the fare. Three correct gets us home; you can review and retry.
I: Before we leave, I save my lyric sheet. It is somehow both a rhetorical revision guide and evidence.
scene classroom
show Hepting curious left
show Manager embarrassed right
camera two Hepting Manager
I: The Didi returns through the classroom window. The manager follows us out, carrying a rubber duck and an apology.
Hepting [skeptical]: Was the kidnapping necessary?
Manager [determined]: It was an extended metaphor.
camera close Hepting
Hepting [determined]: No. That is not what that means.
show Lin curious center
camera wide
Lin [curious]: Can we at least keep the duck?
Hepting [worried]: Only if it can explain its rhetorical purpose.
I: Squeak. A small sound, entirely literal. The driver holds up the fare questions.
end
`;
const recipes=[
 {id:'Vex',name:'Vex · dramatic frontman',palette:{skin:'#e8bd9d',hair:'#a7a1c6',shirt:'#55446f',trim:'#dcc5ec'},appearance:{age:'adult',hair:'tousled',face:'angular',outfit:'suit'}},
 {id:'Sora',name:'Sora · songwriter and vocalist',palette:{skin:'#e7c2a2',hair:'#343143',shirt:'#398a8d',trim:'#c6e6df'},appearance:{age:'adult',hair:'ponytail',face:'oval',outfit:'cardigan'}},
 {id:'Manager',name:'Director Moon · frantic manager',palette:{skin:'#d6ab89',hair:'#48403e',shirt:'#75534e',trim:'#e5d3be'},appearance:{age:'adult',hair:'side-part',face:'broad',glasses:'round',outfit:'suit'}},
 {id:'Driver',name:'The Didi driver',palette:{skin:'#c99673',hair:'#2e2e32',shirt:'#363a42',trim:'#d7dde0',glasses:'#20242b'},appearance:{age:'adult',hair:'cropped',face:'lean',glasses:'round',outfit:'suit'}}
].map(r=>({...r,version:1,finish:'polished',provenance:'Original fictional character for NEON ALIBI, an invented group with no real band or performer portrayed. Generic contemporary stage/studio clothes.'}));
const characters=Object.fromEntries(recipes.map(r=>[r.id,createCharacter(r)]));
const pack={format:2,title:'COMEBACK OR ELSE',description:'A fictional K-pop group has kidnapped your AP Language expertise. Pick seven favourite lyrics, identify their devices, and explain why they work. Rubber-duck interrogations, hazy teaching flashbacks, a disastrous press interview, and your own debut lyric sheet. Seven rounds; roughly 15–20 minutes plus the four-question fare home. Comic peril and harmless foam-prop slapstick; no injuries or real performers.',profile:'ap-language',script,keepsake:{title:'NEON ALIBI · My debut lyric sheet',revealAt:'debut',choices:rounds.map(r=>({id:'lyric_'+r.id,label:r.device}))},assets:{backgrounds:{classroom:await image('public/stories/animated/backgrounds/manga-v1/classroom.webp'),memory:{...await image('public/stories/animated/backgrounds/manga-v1/classroom.webp'),vignette:'memory'},studio:await image('stories/animated/comeback-or-else/studio.webp'),rift:await image('public/stories/animated/backgrounds/manga-v1/rift.webp')},characters:{...characters,Hepting:JSON.parse(await read('public/stories/animated/rigs/pre-angles/hepting-cartoon.json')),Lin:JSON.parse(await read('public/stories/animated/rigs/pre-angles/lin-cartoon.json'))}},quiz:[
 {prompt:'The driver asks: Which distinction is accurate?',options:['Anaphora repeats clause openings; alliteration repeats consonant sounds.','Anaphora means any repeated consonant; alliteration repeats a whole paragraph.','Both devices require matching end-rhymes.','Both devices guarantee that an audience agrees.'],answer:0,explanation:'We own… repeated across clauses is anaphora. Repeated consonant sounds in silk smiles sell are alliteration. Either can serve a purpose without guaranteeing a response.'},
 {prompt:'The driver asks: In “You wanted silence; I became thunder,” which analysis is best supported?',options:['There is no contrast because both clauses concern sound.','The sentence proves the singer literally controls the weather.','Silence and thunder form antithesis; becoming thunder also supplies a metaphor for loud resistance.','It is a simile because every comparison uses like or as.'],answer:2,explanation:'One line can use more than one device. Contrast and metaphor work together here; accurate analysis connects both to the speaker’s defiance.'},
 {prompt:'The driver asks: Which explanation correctly connects device, wording and purpose?',options:['A million phone checks is a verified count; an unanswered song question is necessarily a survey.','A million checks exaggerates anxious waiting; “why are you still singing?” can challenge denial without requesting information.','Any large number proves a claim, and every question is hypophora.','Hyperbole always produces sadness, and rhetorical questions always produce agreement.'],answer:1,explanation:'Hyperbole stretches scale for effect. A rhetorical question can challenge or provoke thought rather than seek information; context and audience matter.'},
 {prompt:'The driver asks: When is “Perfect timing—you left on my birthday” verbal irony?',options:['Whenever birthdays are mentioned.','Only if its opening repeats three times.','Even when the speaker sincerely welcomes the departure and means the praise literally.','When the hurt, frustrated speaker uses apparent praise to convey criticism of the timing.'],answer:3,explanation:'The intended meaning reverses the literal praise in that context. Comic props or an unhappy event alone do not establish verbal irony.'}
],sources:[
 'Teaching references: Gideon O. Burton, Silva Rhetoricae, Brigham Young University: https://rhetoric.byu.edu/Figures/Schemes.htm (anaphora, antithesis, alliteration); https://rhetoric.byu.edu/Figures/Tropes.htm (metaphor, hyperbole, rhetorical question, irony). Definitions paraphrased; original examples and all lyrics written for this episode. No existing song lyrics or real performers are used.',
 'AP Language focus: identify a language choice using textual evidence and explain a plausible effect in relation to audience and purpose. A line can contain multiple devices. Distractors target the foregrounded feature, not an assertion that other devices cannot coexist. Taste is ungraded. Correct explanations acknowledge uncertainty rather than promising universal audience responses.',
 'Saved curriculum checked October 19, 2026: CORE_VOCAB_BY_WEEK.txt, AP W10 October 19–23, Answering the objection: procatalepsis, concession, refutation, qualifier, untenable, specious. The finale practises concession, qualification and answering objections. The seven main devices are the user-requested review set, not a claim that they are the W10 list. Previous AP episode The Last Chair uses Young’s language argument; this episode continues attention to audience and purpose without pretending its fictional dialogue is an assigned reading.',
 'Live app schedule checked October 19, 2026 for the AP English class used by The Last Chair: October 20 — Letter from a Birmingham Jail and 5 Science Backed Ways to write better; October 22 — The Age of the Essay. This original-fiction review supports rhetorical analysis alongside those readings; it does not adapt or quote them.',
 'Fiction: Seoul, 2026 is a broad contemporary setting. NEON ALIBI, Vex, Sora, Director Moon, the recording deadline, studio, lyricist and kidnapping are invented comic fantasy. No real performer or label is represented. The group’s uncertainty concerns rhetorical effect and idiom, not intelligence or ethnicity. No accents are imitated. The student and Lin return safely; foam/duck contact is theatrical and non-injurious.',
 'Feedback: preference choices have no correct answer. Identification and effect choices provide immediate response, a labelled white-haze teacher flashback, application, and bounded correction after mistakes. Hidden recognition/explanation counters select only encouraging callbacks; no narrative score enters grades or rankings. Four knowledge questions award 25 each; 75 permits completion with retry.',
 'Art: generated studio background, OpenAI image generation October 19, 2026; original exec-6e51840f-68ba-4a78-9719-68c1b0137af9.png, encoded to WebP. Approved hybrid Hepting and Lin reused; fictional adults built with the shared polished SVG builder. Rubber duck and pool noodle are reusable SVG held props. Hazy memory vignette is static and persists in reduced motion. Duck squeaks are written captions; this classroom episode includes no generated speech, singing, or music.',
 'The seven chosen lyrics are reconstructed from saved choice history, displayed from the debut onward, and downloadable as text. A replay creates a new set; teacher previews do not create grades. Companion teaching notes are included beside the downloadable package. Publication is unassigned.'
]};
const {errors}=validatePackage(pack);if(errors.length)throw Error(JSON.stringify(errors));if(packageContentBytes(pack)>5000000)throw Error('Package exceeds 5 MB');
const out=new URL('public/stories/animated/comeback-or-else/',root);await mkdir(out,{recursive:true});
for(const [url,text] of [[new URL('episode.story',here),script],[new URL('episode.json',out),JSON.stringify(pack,null,2)+'\n']]){if(process.argv.includes('--check')){if(await readFile(url,'utf8')!==text)throw Error('Stale COMEBACK source/package');}else await writeFile(url,text);}
if(!process.argv.includes('--check'))await writeFile(new URL('teaching-guide.html',out),await readFile(new URL('teaching-guide.html',here)));
console.log('COMEBACK OR ELSE validates:',packageContentBytes(pack),'bytes;',script.length,'script characters.');
