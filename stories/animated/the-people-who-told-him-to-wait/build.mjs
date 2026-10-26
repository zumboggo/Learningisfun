import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validatePackage} from '../../../functions/learning-content/src/story-engine.js';
import {createCharacter} from '../../../functions/learning-content/src/character-builder.js';
import {packageBytes} from '../../../functions/learning-content/src/animated-episodes.js';
const root=new URL('../../../',import.meta.url),read=p=>readFile(new URL(p,root));
const prior=JSON.parse(await read('public/stories/animated/comeback-or-else/episode.json'));
const image=async p=>({src:'data:image/webp;base64,'+(await read(p)).toString('base64')});
const cast={};
for(const recipe of [
 {id:'King',name:'Dr. Martin Luther King Jr.',palette:{skin:'#98633f',hair:'#242322',shirt:'#394751'},appearance:{age:'adult',hair:'cropped',outfit:'suit',face:'broad',eyes:'gentle'}},
 {id:'Carter',name:'Mrs. Carter',palette:{skin:'#885634',hair:'#2b2524',shirt:'#6a6c81'},appearance:{age:'adult',hair:'bun',outfit:'cardigan',face:'oval',eyes:'keen'}},
 {id:'Ruth',name:'Ruth Carter',palette:{skin:'#a16b47',hair:'#2b2524',shirt:'#af976f'},appearance:{age:'teen',hair:'ponytail',outfit:'workshirt',face:'oval',eyes:'keen'}},
 {id:'Organizer',name:'Campaign organizer',palette:{skin:'#815438',hair:'#2a2421',shirt:'#796c57'},appearance:{age:'adult',hair:'side-part',outfit:'workshirt',face:'lean',eyes:'keen'}}
])cast[recipe.id]=createCharacter({...recipe,version:1,provenance:recipe.id==='King'?'Stylized historical character using supported polished SVG appearance; dialogue provenance is in episode sources.':'Authored supporting role for the historical drama; not an identified archival subject.'});
const pack={format:2,notice:'This episode blends real historical facts with imagined conversations. Artistic liberty is taken to provide an immersive narrative. Research the events in primary sources for the truest understanding of what happened.',title:'The People Who Told Him to Wait',description:'Birmingham, May 1963. Advise King through eight difficult decisions about pressure, young volunteers, police violence and negotiation. Historical fire-hose and dog-attack photographs, grounded responses to criticism, and an unresolved cost behind real gains. About 18–22 minutes plus four questions. AP Lang · October 27, 2026.',profile:'ap-language',script:await readFile(new URL('episode.story',import.meta.url),'utf8'),assets:{backgrounds:{meeting:await image('public/stories/shared/birmingham-letter/meeting-room-v2.webp'),classroom:prior.assets.backgrounds.classroom,workshop:await image('public/stories/animated/backgrounds/manga-v1/workshop.webp'),jail:await image('public/stories/shared/birmingham-letter/king-writing-v1.webp')},characters:{...cast,Hepting:prior.assets.characters.Hepting,Lin:prior.assets.characters.Lin,Driver:{...prior.assets.characters.Driver,name:'The taxi driver'}}},quiz:[
 {prompt:'A reader supports the goal but objects to the method. Which response best meets this episode’s learning goal?',options:['Repeat the goal more forcefully and avoid the method.','Describe the objection fairly, concede its reasonable concern, and use evidence to explain why the method can still serve the goal.','Assume the reader secretly opposes the goal.','Promise that the method cannot have costs.'],answer:1,explanation:'Answer the strongest version of the objection. A concession can acknowledge a valid concern without surrendering the claim; reasons and evidence must address the disputed connection.'},
 {prompt:'Why does King’s account of failed negotiations matter to the argument about nonviolent direct action?',options:['It proves that conversation is always useless.','It guarantees that every demonstration succeeds.','It shows that no local leader ever tried talking.','It challenges the assumption that another request alone will produce change and supports pressure intended to make genuine negotiation possible.'],answer:3,explanation:'The evidence gives a reason for pressure in this situation. The warrant connects the failure of ordinary appeals to the need to change the conditions for negotiation; it is not a universal guarantee.'},
 {prompt:'Which plan best uses the episode’s classical argument map?',options:['Connect with the audience, explain context and claim, support it, answer a serious objection, and close with a purposeful response.','Use ethos only in paragraph one, logos only in paragraph two, and pathos only in paragraph three.','List five facts without explaining their relevance.','Always place the claim last and never adapt the order.'],answer:0,explanation:'Connect–explain–support–answer–close names rhetorical jobs, not five compulsory paragraphs. Classical schemes vary; appeals such as ethos, logos and pathos can operate across the structure.'},
 {prompt:'What is the strongest conclusion supported by the dog-attack photograph and its archive record?',options:['It proves what everyone in the crowd intended.','It identifies Walter Gadsden and records police violence, but does not by itself establish his motives or every event outside the frame.','It proves that every decision made by campaign leaders was justified.','It proves that the campaign had already secured its demands.'],answer:1,explanation:'An image is evidence with limits. Naming the person and citing the record supports a precise claim; treating visible violence as proof of every motive or strategic judgment exceeds that evidence.'}
],sources:[
  "Primary assigned text: King, Letter from a Birmingham Jail, April 16, 1963, class text 6aa39a2e0031e7a13263. Read through authorized teacher access. April letter predates the May events. wait_or_act: election postponements, failed promises and critique of passive time; negotiate: concession to negotiation and constructive pressure; responsibility: rejection of blaming peaceful protesters for attackers; exposure: bringing concealed tension into public view; law_and_order: just/unjust laws and open nonviolent civil disobedience. These responses are condensed paraphrases, not transcripts of encounters with the player. Only the sentence beginning We merely bring and the archival opening maxim are verbatim excerpts. Other first-person King lines are authored applications, not purported undiscovered quotations. Full letter: https://okra.stanford.edu/link/document630416-040 .",
  "Chronology and decisions: https://kinginstitute.stanford.edu/birmingham-campaign . April 12 arrest, April 20 release, May 2 arrests, May 3 police violence, May 6 encouragement to parents, May 8 pause and dispute, May 10 agreement. King’s support for youth participation and confident reassurance to parents is retained, not replaced with a fictional promise of a fully safe or universally agreed process. Consultation branch deliberately does not invent an apology or consensus: King proceeded without Shuttlesworth’s participation. Settlement and backlash are not a claim that one letter caused national legislation.",
  "Local agency: https://kinginstitute.stanford.edu/bevel-james-luther and https://kinginstitute.stanford.edu/shuttlesworth-fred-lee . Bevel organized youth participation; Shuttlesworth and ACMHR built the local movement, invited SCLC and disputed the moratorium. https://www.nps.gov/articles/000/getaway-bicr.htm documents Birmingham setting and the campaign’s national significance. No Selma bridge events are conflated with Birmingham.",
  "Dramatic boundary: learner serves as an advising helper. Ruth, Mrs. Carter and the unnamed organizer, all encounters, family-contact list, message-carrying and scene blocking are authored fiction. They illustrate grounded tensions and do not assert a historical transcript, real family, specific King location at an exact hour, or player control of historical events. The church meeting-room backdrop is original simplified vector scenery, not a documentary reconstruction. Ruth is not identified as anyone in either archival photograph. No invented injuries or guaranteed survival are assigned to archival subjects.",
  "Photograph: firemen directing hoses near Parkview Inn, May 3, 1963. Alabama Media Group Collection, Birmingham News; copyright Alabama Department of Archives and History. Archive record https://crdl.usg.edu/record/aar_amg_206443 ; IIIF https://digital.archives.alabama.gov/iiif/2/amg:206443/manifest.json . Displayed complete at supplied web resolution for critical educational analysis, no generative alteration or animation. No public-domain or blanket reuse license claimed.",
  "Photograph: police dog attacking Walter Gadsden, May 1963. Alabama Media Group Collection, Birmingham News; copyright Alabama Department of Archives and History. Archive record https://crdl.usg.edu/record/aar_amg_14478 ; IIIF https://digital.archives.alabama.gov/iiif/2/amg:14478/manifest.json . Do not infer participation, consent, motive or an exact day from this record, which dates it to the month. Displayed complete at supplied web resolution for critical educational analysis; not an AI reconstruction. No open reuse license claimed.",
  "Structure: connect–explain–support–answer–close compresses classical arrangement, not Cicero’s five canons or the three rhetorical appeals. See https://rhetoric.byu.edu/Canons/Arrangement.htm . The map appears after the story. Weekly concepts: warrant and presupposition are enacted by testing whether reasons justify disputed methods. Eight unscored choices, three options each; four hidden booleans provide callbacks. Four knowledge questions, 25 points each, 75 to pass. No grade for agreeing with King and no required writing.",
  "Existing approved teaser retained: generated illustration and P-Video 2 Pro motion with authentic later King reading; reconstructed visuals, not jail footage. Full provenance and exact model prompt in media-provenance.json. No new paid generation for this revision. Authentic audio https://okra.stanford.edu/media/audio/630416001.mp3 at 767.9 seconds for 5.45 seconds. Fiction/historical adaptation notice appears before Accept; provenance is outside the dramatic dialogue. Shared taxi footage reused."
],planning:{
  "objective": "Answer a serious objection with reasons while recognizing unresolved costs and obligations.",
  "duration": "18–22 minutes plus quiz; eight key choices",
  "promise": "Advise King amid Birmingham’s May campaign, carry families’ concerns accurately, and produce a useful account of commitments rather than win his approval.",
  "payoff": "Family information and commitments sheet completed; May 10 gains acknowledged without erasing dissent.",
  "freshQuestion": "What remains owed to the people who bore the costs of an effective strategy?",
  "choices": [
    [
      "wait_or_act",
      "delay / conditions / local voice",
      "UrgedWait",
      "May 6 cost-of-waiting callback"
    ],
    [
      "negotiate",
      "pause / mechanism / prior evidence",
      "none",
      "youth risk remains"
    ],
    [
      "young_volunteers",
      "withdraw / informed voice / support roles",
      "AskedConsent",
      "revisit consent after new danger"
    ],
    [
      "responsibility",
      "halt / distinguish / care",
      "ProtectedPeople",
      "Carter thanks practical attention"
    ],
    [
      "exposure",
      "shock / names and demands / restraint",
      "none",
      "image cannot prove intent"
    ],
    [
      "law_and_order",
      "obey / principle / disciplined disobedience",
      "none",
      "principle remains examinable"
    ],
    [
      "pause_or_press",
      "accept / maintain pressure / consult",
      "DemandedConsultation",
      "Shuttlesworth dispute"
    ],
    [
      "closing_message",
      "victory / obligations / trust",
      "none",
      "useful commitments sheet"
    ]
  ],
  "signatures": {
    "King": "Measured distinctions and sustained convictions; listens but does not agree with every reasonable objection. Concern does not erase resolve.",
    "Carter": "Specific names, practical needs, short challenges. Concerned parent without a conversion scene.",
    "Ruth": "Asks to speak for herself; useful work accompanies anger and fear.",
    "Lin": "Tests assumptions and what a claim cannot establish. Learns to leave disagreement visible."
  }
}};
const {errors}=validatePackage(pack);if(errors.length)throw Error(JSON.stringify(errors,null,2));
const bytes=packageBytes(pack);if(bytes>5000000)throw Error('Episode exceeds 5 MB');
const dir=new URL('public/stories/animated/the-people-who-told-him-to-wait/',root);await mkdir(dir,{recursive:true});
const output=new URL('episode.json',dir),text=JSON.stringify(pack,null,2)+'\n';
if(process.argv.includes('--check')){if(await readFile(output,'utf8')!==text)throw Error('Birmingham package stale');}else await writeFile(output,text);
console.log('The People Who Told Him to Wait validates:',bytes,'bytes.');
