// Source/rubric bundle for own-english v4; v1/v2/v3 builds and their scoring evidence are archived. Dialogue is fictional unless labelled quotation.
export const YOUNG_ID='own-english';
export const YOUNG_VERSION=4;
export const sourceUrl='https://artsci.tamu.edu/english/_files/_documents/research/use-they-own.pdf';
export const sourceNotes=[
 {id:'A',title:'Attitudes and prejudice',quote:'But dont nobody’s language, dialect, or style make them “vulnerable to prejudice.” It’s ATTITUDES.',note:'Young relocates the cause of linguistic discrimination from a speaker’s dialect to powerful listeners’ attitudes.'},
 {id:'B',title:'A proposal, not only a rejection',quote:'Code meshing is the new code switching',note:'Young proposes blending dialects and languages within communication. His essay performs that practice. He opposes requiring home and school varieties to stay separate.'},
 {id:'C',title:'Objection and response',note:'Near the end, Young imagines an objection that his examples do not belong in scholarship, then points to academic writers and his own essay. He follows another objection about earning permission with a response about blended writing’s legitimacy.'},
 {id:'D',title:'Craft still matters',note:'The conclusion includes instruction in punctuation, meaning, word choice, sentence structures, and some standard English. Code-meshing is not a demand to stop learning writing craft.'},
 {id:'E',title:'Beyond the essay · Young’s faculty statement',url:'https://uwaterloo.ca/english/profiles/vershawn-young',note:'In his first-person faculty biography, Young describes code-meshing as enabling minoritized language users to blend cultural and heritage languages in academic, professional, and public communication. He also describes work as a teacher, principal, performer, and diversity consultant. This statement supports the breadth of his educational purpose; it does not predict his answer to every contemporary dilemma.'}
];
export const assignmentPrompt='Write 150–250 words advising Lin about the school magazine editor’s request. Explain how Young answers an objection in one specific passage, then develop your own recommendation. Represent the editor’s accessibility concern fairly, support your reasoning with precise textual details, and explain what your proposal gains and what difficulty remains. Agreement with Young is not required. Use the linked full article to extend beyond the source cards.';
export const rubric=['Rhetorical situation: audience, purpose, context and constraints (25).','Claims and evidence: accurate, relevant support and fair representation (25).','Reasoning and organization: explanation, qualification and answering objections while advancing a claim (25).','Style: purposeful, clear expression and rhetorical choices, without requiring one dialect (25).'];
export const characters={lin:'Lin · student writer',jordan:'Jordan · university zine editor',young:'Young · scholar and teacher'};
// Points are pedagogical evidence, separate from narrative indicator changes and publication outcome.
export const scenes=[
  {
    "title": "The ride that wouldn’t autocorrect",
    "background": "classroom",
    "cast": [
      "lin"
    ],
    "speaker": "lin",
    "text": [
      "I am in our AP Language classroom at CDIS, with Young’s essay open on my desk and a pencil that has already survived one argument with the sharpener. Today’s question is practical: when someone objects to my argument, how can I answer them and still move my own claim forward?",
      "Lin, my classmate and writing partner, slides a draft toward me. She has written about belonging at a multilingual school: the strange feeling of having several ways to speak, but being asked to sound like only one person. Last week she helped me rescue a paragraph with three beginnings and no destination. I owe her at least one useful sentence.",
      "Her opening reads: ‘At lunch, we pull up another chair. Come, eat, sit a while. There is room at this table.’ The invitation echoes the English she hears at home. Its rhythm—the pattern of pauses and repeated stresses—makes the welcome sound like a person speaking, rather than a notice pinned to a wall.",
      "Lin is hoping for her first byline in Friday’s school magazine. Students, teachers, and families will read it. The editor likes her argument but has sent a request: the magazine’s policy calls for a consistent formal register. Lin shows me the message on her phone.",
      "‘Some readers may not follow the home-language expressions. Could you replace them?’ the message says. Lin touches the opening with her pencil. ‘If I change all of it, will the person inviting them still sound like me?’ Her chance to reach those readers is at stake. So is the voice in the invitation.",
      "Mr. Hepting stops beside us. ‘That sounds like a question for Vershawn Ashanti Young. He’s a scholar and teacher of language and writing. In “Should Writers Use They Own English?”, published in 2010, he challenges the demand that writers leave their home varieties of English outside academic writing.’",
      "He opens WeChat. His secret mini-program has a dumpling for an icon. A gold wheel turns inside it. Then a Didi glides through our classroom window. The glass ripples like water; the car settles at the front of the room, between the board and the first row. Its tyres leave little rings of starlight on the floor. My pencil drops. The driver, wearing sunglasses indoors, looks as if this is all perfectly normal parking.",
      "‘Chicago. United States. Autumn 2011. University writing workshop,’ he says. The door opens onto an aisle longer than the car. Our whole class fits inside. ‘Four questions before the ride home. Three correct. Learning is the fare.’ Mr. Hepting picks up my pencil. ‘Seat belts first. Philosophical disagreements second.’",
      "Lin asks me to advise her during the visit; the draft and its final wording remain hers. She saves the editor’s message beside the draft. Before I board, what do I want my help to protect?"
    ],
    "choices": [
      {
        "id": "reach",
        "label": "I help Lin reach the magazine’s readers, while checking each proposed edit.",
        "response": "“Thank you,” Lin says. “Help me reach them without editing on autopilot.” She opens a copy of the editor’s proposed changes. I have committed to checking what each change does. The byline matters, but it cannot decide every sentence for us.",
        "points": [
          3,
          0,
          0,
          2
        ],
        "reactions": [
          "happy"
        ],
        "delta": [
          5,
          0,
          0,
          0
        ]
      },
      {
        "id": "voice",
        "label": "I help Lin preserve the voice, while looking for ways to orient unfamiliar readers.",
        "response": "Lin smiles and slides her spare chair closer. We mark places where unfamiliar readers might need context. I have promised to preserve a voice and do the work of helping people enter it. Neither is a guarantee of publication.",
        "points": [
          3,
          0,
          0,
          2
        ],
        "reactions": [
          "happy"
        ],
        "delta": [
          0,
          0,
          0,
          5
        ]
      },
      {
        "id": "decide",
        "label": "I promise to persuade Lin to reject every change before seeing the edits.",
        "response": "“Even a change that helps?” Lin asks. She leaves the draft open but waits for an explanation. I have chosen a position before inspecting the evidence. I can still investigate and revise my advice.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "sad"
        ],
        "delta": [
          -3,
          -4,
          0,
          0
        ]
      }
    ],
    "kind": "decision"
  },
  {
    "title": "Through the rift, into a conversation",
    "background": "hall",
    "cast": [
      "jordan"
    ],
    "speaker": "jordan",
    "text": [
      "Once we are seated, the driver aims at the classroom window. It ripples again, and we float through. Ahead, above the CDIS soccer field, a bright seam opens in the sky. The grass bends toward it. One football pauses halfway through a bounce. ‘The space-time continuum,’ Mr. Hepting says, ‘has apparently booked the field.’",
      "The Didi accelerates toward the rift. The goalposts stretch into white ribbons. For a moment I see sunlight, stars, and the same cloud at three different ages. Then—pop—we are beside a red-brick university building in Chicago. A portable radio near the entrance is playing Adele’s ‘Rolling in the Deep.’ The dashboard still says 2011. My phone has no signal. My seat belt, mercifully, belongs to the present.",
      "We step onto the pavement. Mr. Hepting leads our class through the entrance into a lecture hall, where a small writing workshop is gathering around tables. We are visiting because Young’s essay addresses the conflict in Lin’s draft: whose language counts as appropriate, who decides, and what readers actually need.",
      "Jordan waves us toward three empty seats. They are a university student who edits a zine—a small independently produced magazine, often made by students. Their bag contains folded copies, a stapler, and enough pencils to equip a minor expedition. They hand me one. ‘You look like somebody who has lost an argument with stationery.’",
      "Lin explains the school magazine problem. Jordan nods. ‘Our editors sometimes fix the voice and leave the weak evidence. Very tidy. Still unconvincing.’ They put a marked-up page beside Lin’s draft. We have arrived early enough to talk before Young joins us. I can start with the part I’m curious about."
    ],
    "choices": [
      {
        "id": "clarify",
        "label": "“What does a zine editor actually do with a writer’s voice?”",
        "response": "Jordan opens a zine to a page with handwritten notes. ‘I ask what the writer means to do, then what a reader needs to follow it. I might suggest context or question a claim. If I replace a voice without asking what it does, I may remove the best part of the piece.’ Lin marks the invitation as something to examine, not automatically erase.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "engage",
        "label": "“Why can a polished sentence still make a weak argument?”",
        "response": "‘Smooth sentences can connect unsupported claims,’ Jordan says. ‘I once corrected every comma in a piece before noticing its main example contradicted its conclusion.’ They tap the example in their draft. Style matters, but a coherent line of reasoning needs relevant evidence and an explanation of how it supports the claim.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "correct",
        "label": "“Who reads your zine, and how do you learn what they understand?”",
        "response": "‘Students, mostly, but not all with the same background,’ Jordan says. ‘I ask a reader what they think a passage means, rather than asking only whether they like it.’ Lin notes the distinction. Approval can tell us something about taste or expectations; an explanation can reveal what the reader actually understood.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "Young joins our table",
    "background": "hall",
    "cast": [
      "young"
    ],
    "speaker": "young",
    "text": [
      "Young arrives at our table carrying the essay, a notebook, and a cup whose lid seems to be negotiating independence. Jordan introduces us: Lin is writing for our school magazine, and I am helping her think through the editor’s request. Young pulls up a chair. ‘Show me the sentence everyone is worried about.’",
      "Lin reads her invitation and shows Young the editor’s message. He asks whether a reader has actually misunderstood it, or whether someone expects that a particular kind of language will sound wrong. Those are different problems. We can investigate one without pretending the other does not exist.",
      "He opens his essay to the argument with Stanley Fish, a critic who advocates teaching standard written English. Fish’s concern includes the real disadvantage students can face when powerful readers reject their language. Young does not deny that prejudice exists; he disputes where to locate its cause and how to respond.",
      "I notice the capital letters in ATTITUDES. Young uses emphatic positioning—giving a point a prominent, forceful place—to redirect attention. The word makes me stop at the question of who is doing the judging. It is more than decoration: it supports his claim about the source of harm.",
      "‘Before I decide what to change,’ Lin says, ‘I want to understand what this argument actually says.’ Young turns the essay so we can both see. Which thread do I follow first?"
    ],
    "choices": [
      {
        "id": "test",
        "label": "“How is Young’s explanation of prejudice different from Fish’s?”",
        "response": "Young draws two arrows beside the passage. ‘Fish worries that a nonstandard dialect can leave students vulnerable to prejudice. I locate the cause in people’s attitudes toward its speakers.’ Lin follows the arrows. If the language itself is treated as defective, replacement seems like the solution. If powerful listeners’ attitudes cause the harm, teaching a replacement alone leaves that cause unchallenged.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "compare",
        "label": "“What work does the word ATTITUDES do in the argument?”",
        "response": "Young taps ATTITUDES. ‘The emphasis redirects the question: what is producing the prejudice?’ Its position and capitalization make the causal claim hard to pass over. I can explain the rhetorical effect precisely: the emphasis asks a reader to reconsider the source of vulnerability, rather than merely adding volume to the sentence.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "vote",
        "label": "“Can readers impose a real cost without proving a dialect is inferior?”",
        "response": "‘An editor can reject a piece,’ Young says, ‘and that rejection has a real cost.’ He points back to the passage about attitudes. The existence of the cost does not establish that the dialect is inherently less capable. Lin writes two headings: what the institution can do, and what that proves. They are not the same heading.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "Two openings, different effects",
    "background": "hall",
    "cast": [
      "young"
    ],
    "speaker": "young",
    "text": [
      "Jordan lays two versions of Lin’s opening side by side. The proposed edit reads: ‘Students should welcome others into an inclusive community.’ The claim is recognizable. But the spare chair, the invitation to eat, and the voice addressing me have disappeared. I can understand both versions while experiencing them differently.",
      "‘The original lets me hear someone making room,’ I say. Lin nods. ‘That is what I wanted it to evoke.’ To evoke is to bring an image, feeling, or association to mind. The small pauses in ‘Come, eat, sit a while’ create rhythm; the sentence does something that the abstract replacement does not.",
      "Young points to his own blending of language varieties. He calls this code-meshing: drawing on more than one dialect or language within communication, rather than keeping home and school varieties in separate boxes. His essay demonstrates the practice while arguing for it.",
      "‘So the question isn’t just which sentence looks more formal,’ Jordan says. ‘It’s what each one helps a particular reader do.’ Lin draws a line between the two drafts. We stay at the same table, moving from the cause of prejudice to the possibilities of a revision. What do I want to ask about those possibilities?"
    ],
    "choices": [
      {
        "id": "mix",
        "label": "“What would code-meshing look like in Lin’s draft?”",
        "response": "Young suggests putting a useful contextual clue beside an expression Lin wants to retain, then seeing whether the reader can follow it. Lin can blend home-language resources with other registers in the same piece. This is not a promise that any mixture always works. We still ask what the language does for this audience and purpose.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "rules",
        "label": "“Why does the original invitation feel different from the edit?”",
        "response": "Lin reads both versions aloud. The original’s short invitations and pauses create a spoken rhythm; the spare chair gives the welcome a concrete image. The edit states inclusion abstractly. Both communicate a claim, but they evoke different experiences. Naming that difference gives me evidence for a recommendation instead of a vague preference for the ‘better’ sentence.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "reader",
        "label": "“How can a writer help readers enter an unfamiliar context?”",
        "response": "Lin asks Lin for one sentence explaining the local reference, not a replacement for every expression. Young asks us to compare the result with the original. A context clue can help unfamiliar readers while preserving a voice. If the clue still fails, we have another specific revision problem to work on, not proof that every home-language feature must disappear.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "What a reader actually needs",
    "background": "hall",
    "cast": [
      "young"
    ],
    "speaker": "young",
    "text": [
      "Young places a finger under a local expression later in Lin’s draft. ‘Suppose a reader knows the lunch table but doesn’t know what this refers to. What clue would help?’ Lin explains the family context. I write a short clue in the margin and read the sentence again. This time its connection to the invitation is clearer.",
      "Young asks us to notice the difference between adding a useful clue and replacing every distinctive expression in advance. The first responds to evidence about a reader. The second assumes a whole variety of language is the problem before anyone has tested that assumption.",
      "He turns to his conclusion, where instruction in punctuation, meaning, word choice, sentence structures, and some standard English still matters. Blending language resources does not make revision disappear. It gives us more resources to revise with.",
      "Jordan tries the contextual clue aloud. ‘That makes the sentence coherent. I can follow how the parts fit together.’ Lin circles the invitation she wants to keep. Our discussion has reached a productive difficulty: respect for voice and responsibility to readers both require work. I have another question."
    ],
    "choices": [
      {
        "id": "clarity",
        "label": "“Does code-meshing mean conventions no longer matter?”",
        "response": "Young opens his conclusion. It still discusses punctuation, meaning, word choice, sentence structures, and some standard English. Code-meshing expands the resources a writer can use; it does not abolish craft. Jordan returns to the zine page. ‘Good. My commas were hoping to remain employed.’",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "power",
        "label": "“How would we tell confusion apart from a dislike of someone’s voice?”",
        "response": "We ask a reader to explain the passage before judging its register. Where does the explanation break down? Which added clue helps? Lin notes that a complaint about how something ‘sounds’ is not the same evidence as a demonstrated misunderstanding. Neither test is perfect, but a specific inquiry is more useful than assuming the answer.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "dissent",
        "label": "“Can I disagree with Young while representing his argument fairly?”",
        "response": "Young nods. ‘State the objection fairly, then explain what your evidence establishes.’ I can disagree about the best policy for this magazine while accurately representing his claim about attitudes and his proposal for code-meshing. Sophistication includes distinguishing a context-specific recommendation from a universal judgment about a language.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "An objection opens the next step",
    "background": "hall",
    "cast": [
      "young"
    ],
    "speaker": "young",
    "text": [
      "Mr. Hepting pulls a spare chair toward the table. ‘Let’s connect this to our AP objective: answer an objection while advancing a claim.’ We are still in the Chicago workshop, with Lin’s two drafts between us. Nobody has been transported into a new argument without a map.",
      "Near the end of the essay, Young anticipates an objection: perhaps his examples do not belong in academic writing. He answers by pointing to academic writers and to what his own essay is doing. Then another objection suggests writers must earn permission before blending varieties. His response challenges that condition instead of simply repeating his preference.",
      "Lin sketches the progression on the back of a zine: concern, answer, next claim. This is a line of reasoning—the connected steps by which an argument leads a reader toward a conclusion. A reply can acknowledge a real concern while refusing an assumption hidden inside it.",
      "‘And sophistication?’ Lin asks. Mr. Hepting taps the space between the drafts. ‘Here it means handling tensions and distinctions thoughtfully. It does not mean asking a thesaurus to put on a bow tie.’ Lin laughs, then looks at her phone. The final page allocation is still pending. We have time for one more thread before she needs my advice."
    ],
    "choices": [
      {
        "id": "china",
        "label": "“What changes when we bring this argument back to a multilingual school?”",
        "response": "Mr. Hepting asks whose languages, audiences, and school expectations are involved at CDIS. We can connect Young’s argument to our multilingual school without pretending its racial and institutional context in the United States is identical to ours. Lin’s draft offers a local case to investigate; it does not replace the essay’s context.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "revise",
        "label": "“How does answering an objection move Young’s claim forward?”",
        "response": "Young traces the sequence near the essay’s end: an objection excludes his examples from scholarship; his response supplies academic examples and his own writing. A further objection makes permission depend on first earning approval; he challenges that condition. The reply adds grounds for the legitimacy of blended writing, so the line of reasoning advances rather than circling one assertion.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "assess",
        "label": "“What makes a response sophisticated rather than just complicated?”",
        "response": "Lin compares two replies. ‘Everyone who objects is wrong’ overlooks the concern. ‘Readers may need context, but that doesn’t justify erasing every distinctive expression’ distinguishes a legitimate need from an excessive conclusion. That qualification creates a next step: test context and selected edits. Sophistication is the developed distinction, not the number of impressive words.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "A response I can stand behind",
    "background": "hall",
    "cast": [
      "lin"
    ],
    "speaker": "lin",
    "text": [
      "The workshop takes a short break. Young and Jordan remain within earshot while Lin and I move our chairs to the end of the same table. I now know more about the essay, the drafts, and the person relying on my advice. That knowledge has not made the disagreement disappear.",
      "Lin reads the editor’s strongest concern carefully: ‘Our readers need to understand each other. One shared standard seems the fairest way to achieve that.’ The editor is responsible for readers who may not share Lin’s home context. Lin wants to keep an invitation that means something to her. I need to answer the concern fairly, rather than win an argument against a cartoon version of it.",
      "The editor can still refuse an exception. A thoughtful proposal may fail. Lin’s first byline matters to her, but she does not want me to treat publication as proof that one voice is superior. I can acknowledge a concern, qualify what follows from it, and propose something we can actually try.",
      "Lin opens a reply to the editor and passes me the pencil. ‘How should I answer this?’ This is a choice about the respect I give an opposing concern while protecting something I value. What response am I willing to stand behind?"
    ],
    "choices": [
      {
        "id": "bridge",
        "label": "“Shared understanding matters. Let’s test the confusing passages and add context where needed, rather than assuming every distinctive expression blocks understanding.”",
        "response": "Lin adds a request for a reader test to her reply. She agrees to explain who the invitation includes. I acknowledged the purpose, questioned the assumption, and proposed a way to act. The editor may still disagree, but there is now a specific proposal to consider.",
        "points": [
          5,
          3,
          8,
          5
        ],
        "reactions": [
          "happy"
        ],
        "delta": [
          8,
          5,
          8,
          4
        ]
      },
      {
        "id": "qualify",
        "label": "“I want this readership, so I’ll discuss selected changes with Lin. But accepting an edit here wouldn’t prove the original voice is inferior.”",
        "response": "Lin marks a few passages she is willing to discuss individually. I made a context-specific recommendation while preserving a distinction the objection had blurred. Selected changes for a particular readership would not prove that her original voice is inferior.",
        "points": [
          5,
          3,
          8,
          5
        ],
        "reactions": [
          "happy"
        ],
        "delta": [
          7,
          5,
          8,
          2
        ]
      },
      {
        "id": "dismiss",
        "label": "“Anyone who needs a shared standard is prejudiced, so the magazine should publish the original immediately.”",
        "response": "Lin stops writing. “Which passage did a reader misunderstand? How would this help them?” Naming a possible prejudice has not answered the concrete concern. I can return to the evidence instead of treating disagreement as proof of bad faith.",
        "points": [
          0,
          0,
          0,
          1
        ],
        "reactions": [
          "sad"
        ],
        "delta": [
          -5,
          -5,
          -6,
          1
        ]
      }
    ],
    "kind": "decision"
  },
  {
    "title": "The computer over there",
    "background": "hall",
    "cast": [
      "jordan"
    ],
    "speaker": "jordan",
    "text": [
      "Young checks the time. ‘I have to go to the bathroom, but don’t worry: I’ve uploaded a facsimile of my consciousness into that computer over there. Feel free to ask it a question.’ Jordan looks at the old desktop. ‘That machine takes three minutes to open a document. Your consciousness may need patience.’",
      "Lin and I cross to the computer at the side of the lecture hall. It has a sturdy keyboard, a humming fan, and a reading companion that offers to help us think through the essay. Jordan follows with the spare pencil. ‘Keep the page beside the screen,’ they say. ‘A good question deserves evidence.’",
      "While Young is away, I can ask the reading companion a question of my own, or explore one of the threads below. Neither option obliges me to agree with its answer. Lin keeps the two drafts open beside us; this is a breathing space before my final publication recommendation.",
      "The pencil rests across the essay. It has travelled from Jordan’s bag to my hand and now to the space between a question and its evidence. What would help me take the next step?"
    ],
    "choices": [
      {
        "id": "check",
        "label": "“How would I test a confident answer against the essay?”",
        "response": "Jordan points from the answer to the essay. I look for the passage the answer depends on, check whether it says what the answer claims, and separate paraphrase from inference. If support is missing, I can keep the question open. Credibility comes from that check, not from the smoothness of a voice.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "follow",
        "label": "“What question could help me see a missing step in my reasoning?”",
        "response": "I try: ‘Which assumption connects my evidence about one reader to my recommendation for the whole magazine?’ The question exposes a possible missing step. One reader’s confusion may justify a clue in that passage; it does not by itself justify replacing every home-language feature. A sharper question can make an argument more coherent.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "authority",
        "label": "“Where does the essay leave room for my own judgment?”",
        "response": "The essay gives me claims, examples, and a proposal to evaluate. It does not choose Lin’s publication strategy for her. I can defend preservation, negotiation, or adaptation by explaining the particular audience, purpose, evidence, and cost. My recommendation belongs to me; it still owes the text a fair reading.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  },
  {
    "title": "Friday’s issue",
    "background": "hall",
    "cast": [
      "lin"
    ],
    "speaker": "lin",
    "text": [
      "Young returns and rejoins us at the workshop table. ‘I know I’ve talked a lot. I want to hear what you think now.’ Lin puts the editor’s message beside her draft. The page allocation is still pending. We have enough information to make a recommendation, but not enough to guarantee publication.",
      "Lin has not asked me to rescue her from choosing. She wants help understanding the choice. Preserving the original may cost this readership. Negotiation takes work and may still be refused. Adapting the register can satisfy the language policy while changing the piece’s voice. An unrelated production problem could delay any version.",
      "‘I want that first byline,’ Lin says. ‘I also want the invitation to sound like someone means it.’ I remember her helping with my wandering paragraph. This time, helping means offering a coherent reason and naming a cost, rather than offering certainty I do not possess.",
      "My first priority still matters, but it does not have to freeze my thinking. The evidence may have changed how I would carry it out. What recommendation do I give Lin for this issue?"
    ],
    "choices": [
      {
        "id": "preserve",
        "label": "I keep the distinctive language and decline blanket replacement, accepting that this issue may go ahead without the piece.",
        "response": "Lin accepts my recommendation and tells Lin she will decline blanket replacement. The current policy remains an obstacle. Preserving the original has a real possible cost; I can help Lin name it honestly.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "sad"
        ],
        "delta": [
          -2,
          0,
          3,
          8
        ]
      },
      {
        "id": "negotiate",
        "label": "I offer contextual clues and selected edits, with Lin approving every change.",
        "response": "Lin approves a contextual explanation while retaining the invitation. She prepares the request to the editor. Our earlier discussion matters to how well we can support it, but the decision belongs to someone else.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          5,
          0,
          3,
          5
        ]
      },
      {
        "id": "adapt",
        "label": "I adapt this piece for the magazine’s preferred register, while retaining the original for another use.",
        "response": "Lin approves an adapted version for this readership and saves the original beside it. The new version satisfies the stated language policy. We have solved that part of the problem, not taken control of the whole issue.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          5,
          0,
          3,
          -2
        ]
      }
    ],
    "kind": "decision"
  },
  {
    "title": "One last question before home",
    "background": "classroom",
    "cast": [
      "lin"
    ],
    "speaker": "lin",
    "text": [
      "We leave the table, cross the lecture hall, and walk back through the university entrance. Jordan comes to the door to see us off. ‘Good luck with the piece,’ they tell Lin, handing back the spare pencil. ‘Keep the evidence. We always need more of that.’ The radio by the entrance is still playing music from 2011. Beyond it, our Didi waits with a faint constellation moving across its windscreen.",
      "I board with Lin, Mr. Hepting, and the class. The driver taps the meter with one finger. We are at the Chicago curb, not home yet. His four questions will unlock the return trip. Lin’s phone is silent: the editor’s answer will reach us when we return to our own time.",
      "Lin opens the draft on her lap. ‘What do you want to remember from all this?’ There is no new crisis to solve. I can follow one last question, or revisit the other questions before the fare check. Our conversation has moved from an invitation, through a disagreement about language, to a recommendation with a gain and a difficulty.",
      "The words that travelled with us are useful tools now: rhythm and evoke for the invitation’s effect; emphatic positioning for Young’s shift in focus; coherent and line of reasoning for the connected argument; sophistication for handling a real tension. Which connection do I want to make clearer before we go?"
    ],
    "choices": [
      {
        "id": "revisit",
        "label": "“How did the evidence change the advice I can give?”",
        "response": "Lin and I compare what we knew at the classroom desk with what we know now. We can distinguish an attitude from a comprehension problem, explain the invitation’s effect, and answer the accessibility objection with a concrete proposal. A defensible recommendation may still meet a refusal. The evidence supports the reasoning; it cannot control the editor.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "defend",
        "label": "“How can the same priority lead to a better method?”",
        "response": "I can keep caring most about reaching readers, or about preserving a voice, while changing my method. I now have a reader test, a contextual clue, and a distinction between institutional power and linguistic worth. Lin says, ‘That sounds more useful than just telling me to be brave.’ She returns the pencil to my hand.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "winning",
        "label": "“Which vocabulary words help me explain this particular argument?”",
        "response": "I use rhythm and evoke to describe what the invitation does; emphatic positioning to explain Young’s stress on ATTITUDES; line of reasoning and coherent to trace objection, response, and next claim; sophistication to name the qualifications that keep the advice honest. Each term helps explain a detail. Listing them without that detail would tell Lin much less.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ],
    "kind": "question"
  }
];
export function publicationEvent(attemptId='standalone'){
 let hash=2166136261;for(const ch of attemptId){hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;}
 return hash%3; // 0: production delay; 1: strict policy review; 2: room to negotiate.
}
export function ending(choices,attemptId='standalone'){
 const event=publicationEvent(attemptId),careful=choices[6]!=='dismiss';
 const delayed='The magazine printer has failed, and Friday’s issue is postponed. Lin shows me the production message. None of our language choices caused it. A delay cannot prove that the argument succeeded or failed.';
 const common='I close the draft beside Lin. Our recommendation has a gain and a difficulty. I can explain both. She puts the reply beside the original invitation, and I set Jordan’s pencil between them. There is still a cost to name and an argument I can explain.';
 if(choices[8]==='preserve')return {title:event===0?'An original, and an unexpected delay':'The invitation stays; the slot does not',paragraphs:[event===0?delayed:'The editor keeps the formal-register policy. Lin’s original does not enter Friday’s issue. Keeping the voice has not magically restored the lost byline.', 'Lin reads the invitation aloud to our row: the rhythm still evokes the lunch table. She asks me to help outline a short explanation of why that effect matters. Jordan’s advice about evidence gives us something useful to do, without promising another publication.',common]};
 if(choices[8]==='adapt')return {title:event===0?'An approved draft, an unopened issue':'A byline with a different rhythm',paragraphs:[event===0?delayed:'The adapted piece enters the issue. The language-policy check is complete, and Lin reaches the magazine’s readers.', 'Lin reads both openings to me. The formal version states the claim clearly; the original lets me hear someone making room at a table. Acceptance does not settle which effect matters most. I help Lin annotate that difference rather than call one version universally better.',common]};
 if(event===0)return {title:'Good preparation, bad timing',paragraphs:[delayed, 'Even our careful revision cannot repair a printer. Lin and I use the interruption to put the two versions beside each other and mark the evidence for each choice. The recommendation can be defensible without producing the hoped-for Friday byline.',common]};
 if(event===1)return {title:'An objection survives the answer',paragraphs:['The editor refuses an exception to the current policy. Lin shows me the response to our proposal; a careful reply could not control the decision. Lin is disappointed, even if we prepared our case well.', 'Lin asks me to turn our advice into a concise note for a policy discussion. I must state the accessibility objection fairly, explain the effect of the invitation, and propose a test. Failure has opened another writing problem, not proved that evidence was pointless.',common]};
 return careful?{title:'A negotiated page, with a cost',paragraphs:['The editor allows context and selected edits. Lin’s invitation stays in the piece. The editor spends extra time checking the explanation, and one reader still asks what a local reference means. Negotiation has helped; it has not made every difficulty disappear.', 'Lin smiles at the byline, then asks me to read our note aloud. We can show a coherent line of reasoning from the reader concern to the revision. The approval depended on an editor willing to make room as well as on our work.',common]}:{title:'Room to negotiate, but no workable proposal',paragraphs:['The editor permits exceptions, but asks exactly how our proposal helps unfamiliar readers. We have not supplied enough evidence to answer. The editor postpones the piece rather than invent a justification.', 'Lin asks me to return to the draft and design the reader test we skipped. A favourable opening in the policy could not do that reasoning for us. I can still make the next revision more precise.',common]};
}
export function assessYoung(choices,attemptId='standalone'){
 if(!Array.isArray(choices)||choices.length>scenes.length)throw new Error('Invalid choice history');
 const scores=[0,0,0,0],indicators=[50,50,50,50];
 choices.forEach((id,i)=>{const choice=scenes[i].choices.find(c=>c.id===id);if(!choice)throw new Error('Illegal episode choice');choice.points.forEach((n,j)=>scores[j]+=n);choice.delta.forEach((n,j)=>indicators[j]=Math.max(0,Math.min(100,indicators[j]+n)));});
 // Normalize independent domain evidence to 25 points; publication choices score equally.
 const maxima=[0,1,2,3].map(j=>scenes.reduce((sum,s)=>sum+Math.max(...s.choices.map(c=>c.points[j])),0));
 scores.forEach((n,j)=>scores[j]=Math.round(n/maxima[j]*25));
 return {complete:choices.length===scenes.length,scores,total:scores.reduce((a,b)=>a+b,0),indicators,ending:choices.length===scenes.length?ending(choices,attemptId):null};
}

export const driverQuestions=[
 {prompt:'According to Young, what makes a dialect vulnerable to unfair treatment?',options:['The dialect’s inherent lack of reasoning','People’s attitudes toward its speakers','Every unfamiliar expression'],answer:1,note:'Card A places the problem in attitudes and prejudice, not an inherently defective language.'},
 {prompt:'Which revision best illustrates code-meshing?',options:['Keep a home-language expression and add context that helps this audience follow it','Remove every home-language feature before beginning the argument','Refuse all revision because conventions never matter'],answer:0,note:'Cards B and D support blending resources purposefully while continuing to attend to readers and craft.'},
 {prompt:'Which reply answers an objection while advancing the claim?',options:['Anyone who asks about clarity is prejudiced','Some readers may need context; test a clarification before requiring the writer to erase the expression','A writer should never think about unfamiliar readers'],answer:1,note:'Cards A–D distinguish a genuine comprehension problem from blanket judgement. The reply acknowledges the concern and proposes a next step.'},
 {prompt:'What can the magazine outcome establish?',options:['A rejected submission proves that its dialect cannot communicate','A later opportunity is guaranteed if the writer preserves every feature','An institution can impose a real cost without proving the writer’s language inferior'],answer:2,note:'Card A helps distinguish institutional judgement from linguistic inferiority. A publication result cannot settle that distinction.'}
];
export function assessDriver(attempts=[]){
 if(!Array.isArray(attempts)||attempts.length>50)throw new Error('Invalid driver attempts');
 let passed=false,score=0;
 for(const answers of attempts){
  if(passed||!Array.isArray(answers)||answers.length!==4||answers.some(n=>!Number.isInteger(n)||n<0||n>2))throw new Error('Invalid driver answers');
  score=answers.reduce((sum,n,i)=>sum+Number(n===driverQuestions[i].answer),0);passed=score>=3;
 }
 return {passed,score};
}
