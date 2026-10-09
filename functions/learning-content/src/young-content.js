// Source/rubric bundle for own-english v3; v1/v2 builds and v2 feedback evidence are archived. Dialogue is fictional unless labelled quotation.
export const YOUNG_ID='own-english';
export const YOUNG_VERSION=3;
export const sourceUrl='https://artsci.tamu.edu/english/_files/_documents/research/use-they-own.pdf';
export const sourceNotes=[
 {id:'A',title:'Attitudes and prejudice',quote:'But dont nobody’s language, dialect, or style make them “vulnerable to prejudice.” It’s ATTITUDES.',note:'Young relocates the cause of linguistic discrimination from a speaker’s dialect to powerful listeners’ attitudes.'},
 {id:'B',title:'A proposal, not only a rejection',quote:'Code meshing is the new code switching',note:'Young proposes blending dialects and languages within communication. His essay performs that practice. He opposes requiring home and school varieties to stay separate.'},
 {id:'C',title:'Objection and response',note:'Near the end, Young imagines an objection that his examples do not belong in scholarship, then points to academic writers and his own essay. He follows another objection about earning permission with a response about blended writing’s legitimacy.'},
 {id:'D',title:'Craft still matters',note:'The conclusion includes instruction in punctuation, meaning, word choice, sentence structures, and some standard English. Code-meshing is not a demand to stop learning writing craft.'},
 {id:'E',title:'Beyond the essay · Young’s faculty statement',url:'https://uwaterloo.ca/english/profiles/vershawn-young',note:'In his first-person faculty biography, Young describes code-meshing as enabling minoritized language users to blend cultural and heritage languages in academic, professional, and public communication. He also describes work as a teacher, principal, performer, and diversity consultant. This statement supports the breadth of his educational purpose; it does not predict his answer to every contemporary dilemma.'}
];
export const assignmentPrompt='Write 150–250 words advising Lin and magazine editor Mei. Explain how Young answers an objection in one specific passage, then develop your own recommendation. Represent Mei’s accessibility concern fairly, support your reasoning with precise textual details, and explain what your proposal gains and what difficulty remains. Agreement with Young is not required. Use the linked full article to extend beyond the source cards.';
export const rubric=['Rhetorical situation: audience, purpose, context and constraints (25).','Claims and evidence: accurate, relevant support and fair representation (25).','Reasoning and organization: explanation, qualification and answering objections while advancing a claim (25).','Style: purposeful, clear expression and rhetorical choices, without requiring one dialect (25).'];
export const characters={lin:'Lin · student writer',jordan:'Jordan · university zine editor',mei:'Mei · magazine editor',young:'Young · fictionalized encounter'};
// Points are pedagogical evidence, separate from narrative indicator changes and publication outcome.
export const scenes=[
  {
    "title": "The ride that wouldn’t autocorrect",
    "background": "classroom",
    "cast": [
      "lin",
      "mei"
    ],
    "speaker": "lin",
    "text": [
      "I am in our AP Language classroom in China, with Young’s essay open on my desk and a pencil that has already survived one argument with the sharpener. Today’s question is practical: when someone objects to my argument, how can I answer them and still move my own claim forward?",
      "Lin, my classmate and writing partner, slides a draft toward me. She has written about belonging at a multilingual school: the strange feeling of having several ways to speak, but being asked to sound like only one person. Last week she helped me rescue a paragraph with three beginnings and no destination. I owe her at least one useful sentence.",
      "Her opening reads: “At lunch, we pull up another chair. Come, eat, sit a while. There is room at this table.” The invitation echoes the English she hears at home. Its rhythm—the pattern of pauses and repeated stresses—makes the welcome sound like a person speaking, rather than a notice pinned to a wall.",
      "Mei sits across from us. She is another student at our school, and the editor responsible for Friday’s magazine. Students, teachers, and families will read it. She likes Lin’s argument, but the magazine’s current policy asks writers to use a consistent formal register. She can suggest edits; the supervising editor still approves the final issue.",
      "“I want to publish this,” Mei says, turning her laptop so we can see her message. “But some readers may not follow the home-language expressions. Could you replace them?” Lin touches the opening with her pencil. “If I change all of it, will the person inviting them still sound like me?”",
      "Mr. Hepting pauses beside us. “That sounds like a question for Vershawn Ashanti Young. He is a scholar and teacher of language and writing, and the author of ‘Should Writers Use They Own English?’ In that 2010 essay, he challenges the idea that everyone must leave their home varieties of English outside academic writing.”",
      "“Luckily,” Mr. Hepting adds, opening WeChat, “my secret mini-program has a guest-lecture option.” The icon is a dumpling. Apparently time travel has excellent branding. Outside, a Didi arrives. Its serious driver wears sunglasses beneath an overcast sky. The car has room for our whole class, which seems ambitious for a vehicle with four doors.",
      "The destination screen reads: CHICAGO, UNITED STATES · 2011 · UNIVERSITY WRITING WORKSHOP. “Anywhere, any time,” the driver says. “Today, one year after the essay appeared.” He taps the meter. “Four questions before the ride home. Three correct. Learning is the fare.”",
      "Lin asks me to advise her during the visit; the draft and the final decision remain hers. Mei comes too, carrying the reader concern we must actually answer. Before I board, I need to decide what kind of help I am offering."
    ],
    "choices": [
      {
        "id": "reach",
        "label": "I help Lin reach the magazine’s readers, while checking each proposed edit.",
        "response": "“Thank you,” Lin says. “Help me reach them without editing on autopilot.” Mei opens a shared copy. I have committed to checking what each change does. The byline matters, but it cannot decide every sentence for us.",
        "points": [
          3,
          0,
          0,
          2
        ],
        "reactions": [
          "happy",
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
        "response": "Lin smiles and slides her spare chair closer. Mei asks me to mark places where unfamiliar readers need context. I have promised to preserve a voice and do the work of helping people enter it. Neither is a guarantee of publication.",
        "points": [
          3,
          0,
          0,
          2
        ],
        "reactions": [
          "happy",
          "sad"
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
        "response": "“Even a change that helps?” Lin asks. Mei leaves the draft open but waits for an explanation. I have chosen a position before inspecting the evidence. I can still investigate and revise my advice.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          -3,
          -4,
          0,
          0
        ]
      }
    ]
  },
  {
    "title": "The seat beside you",
    "background": "hall",
    "cast": [
      "jordan",
      "lin"
    ],
    "speaker": "jordan",
    "text": [
      "The car pulls away from our school in China. Familiar buildings blur; then the driver parks on a tree-lined street in Chicago, in the United States. The dashboard says 2011. A sign outside the university building announces a writing workshop with Vershawn Ashanti Young. We have travelled a long way to argue about one paragraph.",
      "Mr. Hepting leads us through the entrance and into a lecture hall. Rows of seats face a projector. Our class sits together, Lin beside me and Mei across the aisle. The essay travels with us; Friday’s magazine deadline does too. Apparently the magical Didi can bend time, but cannot persuade an editor to leave a blank page.",
      "A student in the row ahead moves a bag so I can sit. “I’m Jordan. I help edit the student zine here.” Jordan is a university student attending this workshop, not one of our classmates. Their folder contains stapled pages, drawings, and enough pencil marks to suggest the pages have fought back.",
      "“I been working on our zine all week. Folks keep fixing the voice and leaving the weak evidence. That part needs work too.” Jordan offers Lin a spare pencil before asking about her draft. “First possible publication?” Lin nods. “I remember that,” Jordan says. “You want the page to look grown-up. You also want it to sound like somebody lives there.”",
      "Jordan points to a sentence in their own draft: it makes a claim about campus life without any support. I follow that problem, but I am not yet sure what “zine” means. Here is my first small choice: do I ask about meaning and evidence, or treat an unfamiliar way of speaking as the main problem?"
    ],
    "choices": [
      {
        "id": "clarify",
        "label": "“What kind of publication is your zine? And what evidence would strengthen this claim?”",
        "response": "“Small independent magazine,” Jordan explains, then shows a source. Asking about one unfamiliar term kept the idea at the centre. Lin starts comparing the drafts.",
        "points": [
          3,
          3,
          0,
          2
        ],
        "reactions": [
          "happy",
          "happy"
        ],
        "delta": [
          8,
          3,
          0,
          2
        ]
      },
      {
        "id": "engage",
        "label": "“You’re separating voice from support. Show me the claim you think needs evidence.”",
        "response": "Jordan points to the missing support. I have followed the main point. I can still ask about the publication later; understanding need not mean pretending to know every word.",
        "points": [
          3,
          3,
          0,
          2
        ],
        "reactions": [
          "happy",
          "neutral"
        ],
        "delta": [
          6,
          3,
          0,
          2
        ]
      },
      {
        "id": "correct",
        "label": "“You mean ‘I have been.’ You’ll sound more credible if you fix that first.”",
        "response": "“You understood me,” Jordan says. “Do you want to talk about the evidence?” Lin waits with her pencil ready. I have redirected attention to grammar before considering Jordan’s useful point. I can still return to the claim.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          -3,
          -6,
          -2,
          -3
        ]
      }
    ]
  },
  {
    "title": "What the room hears",
    "background": "hall",
    "cast": [
      "young",
      "jordan"
    ],
    "speaker": "young",
    "source": "A",
    "text": [
      "The conversation settles as the lecturer walks to the front. Vershawn Ashanti Young—the author Mr. Hepting introduced in our classroom—sets the essay beside the projector. He looks from our marked-up pages to the screen. “You brought questions,” he says. “Good. We have something to work with.”",
      "He begins by explaining the disagreement behind the essay. Stanley Fish, another writer and critic, argued for teaching a dominant standard of English in composition classes. Young challenges the assumption that other dialects themselves cause their speakers to suffer prejudice. That matters here: blaming an expression is different from examining the listener’s attitude toward it.",
      "Young projects the short excerpt on card A. The capitalized word at the end has emphatic positioning: its placement and visual emphasis focus attention on what he identifies as the cause. The question is not merely “What device is that?” It is “What does the emphasis make a reader reconsider?”",
      "“Where does this sentence put the cause of harm?” Young asks. “What changes when we move the cause?” Jordan raises a hand. “If I’m responsible for helping someone follow my argument, are they responsible for trying to follow it?”",
      "Mei turns toward our row. “I agree that unfamiliar does not mean inferior. But I still need to know where a reader actually loses the meaning.” Lin opens her draft to the lunch-table invitation. The lecturer invites us to try a small investigation with volunteers in the room. I can gather evidence before advising her."
    ],
    "choices": [
      {
        "id": "test",
        "label": "I ask two unfamiliar readers to paraphrase Lin’s claim and identify exactly where they lose the meaning.",
        "response": "I ask two workshop volunteers to paraphrase Lin’s claim. They follow the welcome but ask who “we” includes. This gives us a specific question to address. It is evidence about these readers, not a verdict on an entire voice.",
        "points": [
          4,
          5,
          3,
          0
        ],
        "reactions": [
          "happy",
          "happy"
        ],
        "delta": [
          8,
          5,
          5,
          0
        ]
      },
      {
        "id": "compare",
        "label": "I compare the original and an edited version: what meaning, emphasis or relationship changes?",
        "response": "I place the openings side by side. Mei’s revision names inclusion directly; Lin’s evokes it through a chair, an invitation, and rhythm. Now I can explain a gain and a loss using details, rather than declare that one version simply sounds better.",
        "points": [
          4,
          5,
          3,
          0
        ],
        "reactions": [
          "happy",
          "neutral"
        ],
        "delta": [
          5,
          5,
          5,
          4
        ]
      },
      {
        "id": "vote",
        "label": "I ask which version sounds more intelligent, without asking readers what they understood.",
        "response": "The room produces preferences. I still cannot tell whether the problem is unclear meaning, unfamiliarity, or a judgement about the speaker.",
        "points": [
          1,
          0,
          0,
          0
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          0,
          -3,
          -3,
          -3
        ]
      }
    ]
  },
  {
    "title": "Question round 1 · understand",
    "background": "hall",
    "cast": [
      "young",
      "lin"
    ],
    "speaker": "young",
    "source": "B",
    "text": [
      "We stay in the lecture hall. Young writes CODE-MESHING on the board and points us to card B. His proposal is to bring language varieties together within communication, rather than require home and school voices to stay in separate boxes.",
      "Lin lays the original opening beside Mei’s proposed revision: “Students should welcome others into an inclusive community.” The revision is concise. It is also a long way from somebody pulling up a chair. Lin asks, “Does that sentence evoke the same welcome?” Evoke means to call a feeling or image into the reader’s mind.",
      "This is our chance to move from naming a technique to explaining its effect. Adding an explanation might help a reader while preserving the spoken invitation. Replacing the invitation might change its relationship with the audience. I do not have to settle the whole argument yet; I can choose the question that would improve my advice."
    ],
    "choices": [
      {
        "id": "mix",
        "label": "I ask, “What does code-meshing ask a writer to try?”",
        "response": "“Put the sentence on the desk,” the imagined Young replies. “Try keeping the home-language expression while giving unfamiliar readers a way into its meaning. What does that let you do?” See card B for the published proposal.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “Does this mean conventions no longer matter?”",
        "response": "“Show me the edit,” the imagined Young replies. “What does it help a reader understand? What does it change about the voice? Give those questions separate answers.” Read card D before treating code-meshing as the end of revision.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “What work could a reader do?”",
        "response": "“What did you do when you met Jordan?” the imagined Young asks. “I could infer, ask, look something up—or make a judgement before listening. Which action gives you evidence?” Return to card A.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "title": "Question round 2 · challenge",
    "background": "hall",
    "cast": [
      "young",
      "mei"
    ],
    "speaker": "mei",
    "source": "D",
    "text": [
      "The lecturer pauses for questions. We are still considering Lin’s magazine submission, not starting a new problem. Mei lifts the two versions of the opening. “I like the chair and the invitation,” she says. “I just need a plan that works for readers who do not already know the writer.”",
      "Her objection is not that Lin has nothing worth saying. It is that some readers may need help understanding it. Answering the weaker claim would be easier, but it would leave Mei’s real concern untouched. Lin watches me: she needs an ally who can listen, not just someone who agrees loudly.",
      "Young points to the conclusion of the essay, summarized on card D. Writing craft still matters. The workshop has not offered us a permission slip to stop revising. I can explore genuine confusion, the pressure of an institution’s rules, or how to disagree with Young on defensible grounds."
    ],
    "choices": [
      {
        "id": "clarity",
        "label": "I ask, “What if the reader genuinely cannot understand a phrase?”",
        "response": "“Then we have work to do,” the imagined Young replies. “Try context, an explanation, or a different example. Ask the reader again. Did the change solve the confusion you actually found?”",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “What if the evaluator still insists on a single standard?”",
        "response": "“Whose risk are you choosing?” the imagined Young asks. “Lin has to live with Friday. Ask what that opportunity means before deciding what someone else should give up. Then explain what my advice does—and cannot do.”",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “Can I question the argument without dismissing it?”",
        "response": "“Give the disagreement something to stand on,” the imagined Young replies. “State the limit, support it, then tell me what follows. I want an argument I can answer—not a smaller version of my claim that is easier to knock down.”",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "title": "Question round 3 · transfer",
    "background": "hall",
    "cast": [
      "young",
      "jordan"
    ],
    "speaker": "jordan",
    "source": "C",
    "text": [
      "Jordan turns back a few pages in the essay. “Here. He imagines somebody objecting, then answers them.” Young asks us to follow the sequence near the end, using card C as a guide. We can open the full article for the surrounding passage.",
      "I trace the line of reasoning: a claim develops through connected reasons and evidence. Young does not just list examples and stop. He anticipates a limit someone might place on them, answers it, then meets another objection about who has earned permission to blend language varieties. I need to explain how the responses advance the claim.",
      "“A coherent argument gives the reader a route,” Mr. Hepting says from our row. “A suitcase full of device names is still a suitcase.” Jordan grins and draws an arrow between two notes. Lin writes the magazine objection at the start of her page. Where should our route lead?",
      "Before the workshop moves to a smaller room, I can ask how this thinking transfers to our school, to an actual revision, or to assessment. These applications are ours to test. They are not proof that every multilingual situation has the same history as the essay’s discussion of race and language in the United States."
    ],
    "choices": [
      {
        "id": "china",
        "label": "I ask, “How could we explore this in our multilingual school in China?”",
        "response": "“Start with examples people choose to share,” the imagined Young suggests. “Who is speaking to whom, for what purpose? Then ask where the comparison helps and where it breaks.” This application does not equate multilingual school experiences with the essay’s racial history.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “What would a useful magazine revision actually change?”",
        "response": "The imagined Young folds a page down the middle. “Here: what the edit helps readers understand. There: what it changes about the voice. Give Lin both columns, not just my conclusion.”",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
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
        "label": "I ask, “What should fair assessment reward?”",
        "response": "“Try assessing the argument before admiring its suit,” the imagined Young replies. “Where is the evidence? What connects it to the claim? Who can follow it? Now ask what the language choices are doing.”",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "neutral",
          "neutral"
        ],
        "delta": [
          0,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "title": "A reply that goes somewhere",
    "background": "room",
    "cast": [
      "mei",
      "lin"
    ],
    "speaker": "mei",
    "text": [
      "The lecture ends, and Young invites our group through a door beside the hall into a seminar room. We walk there together: Lin and Mei carry the draft, Jordan brings the zine folder, and Mr. Hepting follows with our class. The projector has become a computer on a table. The problem has not changed just because the chairs are less comfortable.",
      "Mei spreads out the magazine’s policy, Lin’s original, and the proposed edit. “Our readers need to understand each other,” she says. “One shared standard seems the fairest way to achieve that.” This is the objection my advice must answer.",
      "I can concede the need for understanding without conceding that all distinctive expressions prevent it. Or I can recommend selected changes for this particular audience without declaring Lin’s original inferior. Sophistication here means handling those distinctions and tensions thoughtfully; it does not mean decorating a weak argument with longer words.",
      "Lin taps the lunch-table sentence again. The invitation is where we began. If I use it now, it needs to do more than make us sentimental: I must explain what the wording helps readers imagine, where context is needed, and how that supports my recommendation.",
      "Mei’s phone lights up. The final page allocation has not arrived. “The supervising editor can still change the space or reject an exception,” she says. “I can take forward a clear proposal. I cannot promise the outcome.” Now I need to draft the first move in a response that actually goes somewhere."
    ],
    "choices": [
      {
        "id": "bridge",
        "label": "“Shared understanding matters. Let’s test the confusing passages and add context where needed, rather than assuming every distinctive expression blocks understanding.”",
        "response": "Mei agrees to mark actual moments of confusion. Lin agrees to explain who the invitation includes. I acknowledged the purpose, questioned the assumption, and proposed a way to act.",
        "points": [
          5,
          3,
          8,
          5
        ],
        "reactions": [
          "happy",
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
        "response": "Mei can work with selected changes. Lin asks to review them individually. I made a context-specific recommendation while preserving a distinction the objection had blurred.",
        "points": [
          5,
          3,
          8,
          5
        ],
        "reactions": [
          "happy",
          "neutral"
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
        "response": "Mei asks which passage a reader misunderstood and how my proposal helps. Lin still needs an answer. Naming a possible prejudice has not answered the concrete concern.",
        "points": [
          0,
          0,
          0,
          1
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          -5,
          -5,
          -6,
          1
        ]
      }
    ]
  },
  {
    "title": "The computer over there",
    "background": "room",
    "cast": [
      "young",
      "lin"
    ],
    "speaker": "young",
    "text": [
      "We remain at the seminar table. Young has been helping us question the drafts; now he checks the time. “I have to go to the bathroom, but don’t worry: I’ve uploaded a facsimile of my consciousness into that computer over there. Feel free to ask it a question.”",
      "Lin looks at the computer. “Is that included in the university Wi-Fi?” The screen replies with a label: DEFINITELY NOT A CONSCIOUSNESS. Under it: “AI reading companion. I interpret identified source cards. I am not Young, cannot speak for him, and may get things wrong.”",
      "Young’s departure is brief; nobody has changed location again. I may ask the companion one question while we wait. It is optional and does not earn points. If it is unavailable, I can keep reading and continue the story.",
      "Jordan puts the spare pencil between the screen and the essay. “The confident voice is over here. The evidence is over there.” The joke returns us to our first conversation: correcting a surface feature or admiring a voice cannot replace checking what supports a claim. I need to decide how I would use an answer."
    ],
    "choices": [
      {
        "id": "check",
        "label": "I check the answer against a source card and separate evidence from an inference.",
        "response": "Lin writes “verify” beside the answer. A useful interpretation still needs support; a cautious refusal can be more faithful than an invented certainty.",
        "points": [
          0,
          7,
          3,
          2
        ],
        "reactions": [
          "happy",
          "happy"
        ],
        "delta": [
          2,
          7,
          4,
          0
        ]
      },
      {
        "id": "follow",
        "label": "I use the answer to form a sharper question for the article, even if it does not settle my view.",
        "response": "Lin adds a question mark to the margin. I have turned an answer into a reading task and left room for another interpretation.",
        "points": [
          0,
          7,
          3,
          2
        ],
        "reactions": [
          "neutral",
          "happy"
        ],
        "delta": [
          2,
          5,
          4,
          3
        ]
      },
      {
        "id": "authority",
        "label": "I treat the answer as Young’s final view because the computer sounds confident.",
        "response": "The screen’s label has not disappeared. A simulation’s confidence cannot make its words the author’s own.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          0,
          -7,
          -3,
          0
        ]
      }
    ]
  },
  {
    "title": "Friday’s issue",
    "background": "room",
    "cast": [
      "lin",
      "mei"
    ],
    "speaker": "lin",
    "text": [
      "Young returns to the seminar room. “I know I’ve talked a lot. I want to hear what you think now.” Mei closes the policy document and opens Lin’s draft. The page allocation is still pending. The three of us have enough information to make a recommendation, but not enough to guarantee a publication.",
      "Lin has not asked me to rescue her from making a choice. She wants me to help her understand it. Preserving the original may cost this particular readership. Negotiating takes work and may still be refused. Adapting the register can secure a place under the language policy while changing the piece’s voice—and an unrelated production problem could still delay any version.",
      "“I want that first byline,” Lin says. “I also want the invitation to sound like someone means it.” I remember her helping with my wandering paragraph. This time, helping means offering a coherent reason, not offering certainty I do not possess.",
      "I can recommend any of these paths if I explain the gain and the remaining difficulty. The policy and the production decision belong to other people. My evidence and reasoning belong to me."
    ],
    "choices": [
      {
        "id": "preserve",
        "label": "I keep the distinctive language and decline blanket replacement, accepting that this issue may go ahead without the piece.",
        "response": "Lin accepts my recommendation and tells Mei she will decline blanket replacement. The current policy remains an obstacle. Preserving the original has a real possible cost; I can help Lin name it honestly.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "sad",
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
        "response": "Lin approves a contextual explanation while retaining the invitation. Mei prepares the request. Our earlier investigation matters to how well we can support it, but the supervising editor still controls the decision.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "neutral",
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
        "response": "Lin approves an adapted version for this readership and saves the original beside it. Mei can accept the language under the current policy. We have solved that part of the problem, not taken control of the whole issue.",
        "points": [
          3,
          0,
          3,
          5
        ],
        "reactions": [
          "neutral",
          "happy"
        ],
        "delta": [
          5,
          0,
          3,
          -2
        ]
      }
    ]
  },
  {
    "title": "The ride home",
    "background": "classroom",
    "cast": [
      "lin",
      "jordan"
    ],
    "speaker": "lin",
    "text": [
      "We leave the seminar room, cross the same lecture hall, and walk back through the university entrance. Jordan comes to the door to see us off. “Good luck with the piece,” they tell Lin. They do not promise a zine acceptance or a miraculous new audience. They hand back the spare pencil. “Keep the evidence. We always need more of that.”",
      "The magical Didi is waiting exactly where we left it. I board with Lin, Mei, Mr. Hepting, and our class. The serious driver taps the meter with one finger. We are at the Chicago workshop’s curb, not home yet; his four questions will unlock the return trip.",
      "Lin opens the draft on her lap. “Before we find out what happened to the issue, will you leave me a note?” I can name the evidence that changed my advice, or explain how I would now carry out my original priority more carefully.",
      "I think of the words that travelled with us: rhythm, evoke, emphatic positioning, line of reasoning, coherent, sophistication. They are useful if they help me explain what a sentence or an argument does. Before the driver checks the fare, what belongs in my note?"
    ],
    "choices": [
      {
        "id": "revisit",
        "label": "I name what changed my advice, what I still value, and one cost the decision does not solve.",
        "response": "Lin has a record of my reasoning, not just my verdict. Jordan can disagree with my recommendation and still follow how I reached it.",
        "points": [
          4,
          4,
          8,
          4
        ],
        "reactions": [
          "happy",
          "happy"
        ],
        "delta": [
          4,
          4,
          6,
          4
        ]
      },
      {
        "id": "defend",
        "label": "I keep my initial priority, but explain how evidence changed the way I would carry it out.",
        "response": "A revision in method can matter as much as a reversal of position. Lin can see both the continuity and the new understanding.",
        "points": [
          4,
          4,
          8,
          4
        ],
        "reactions": [
          "happy",
          "neutral"
        ],
        "delta": [
          4,
          4,
          6,
          4
        ]
      },
      {
        "id": "winning",
        "label": "I say the best decision is whichever gets the most applause.",
        "response": "Lin asks whose response counts and what the applause proves. A crowd’s approval cannot answer those questions by itself.",
        "points": [
          0,
          0,
          0,
          0
        ],
        "reactions": [
          "sad",
          "sad"
        ],
        "delta": [
          0,
          -3,
          -3,
          0
        ]
      }
    ]
  }
];
export function publicationEvent(attemptId='standalone'){
 let hash=2166136261;for(const ch of attemptId){hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;}
 return hash%3; // 0: production delay; 1: strict policy review; 2: room to negotiate.
}
export function ending(choices,attemptId='standalone'){
 const event=publicationEvent(attemptId),careful=['test','compare'].includes(choices[2])&&choices[6]!=='dismiss';
 const delayed='The magazine printer has failed, and Friday’s issue is postponed. Mei shows me the production message. None of our language choices caused it. A delay cannot prove that the argument succeeded or failed.';
 const common='I close the draft beside Lin. Our recommendation has a gain and a difficulty. I can explain both. This journey’s outcome stays here; the next episode starts fresh, carrying what I learned rather than a debt or punishment.';
 if(choices[8]==='preserve')return {title:event===0?'An original, and an unexpected delay':'The invitation stays; the slot does not',paragraphs:[event===0?delayed:'The supervising editor keeps the formal-register policy. Lin’s original does not enter Friday’s issue. Keeping the voice has not magically restored the lost byline.', 'Lin reads the invitation aloud to our row: the rhythm still evokes the lunch table. She asks me to help outline a short explanation of why that effect matters. Jordan’s advice about evidence gives us something useful to do, without promising another publication.',common]};
 if(choices[8]==='adapt')return {title:event===0?'An approved draft, an unopened issue':'A byline with a different rhythm',paragraphs:[event===0?delayed:'The adapted piece enters the issue. Mei’s language-policy check is complete, and Lin reaches the magazine’s readers.', 'Lin reads both openings to me. The formal version states the claim clearly; the original lets me hear someone making room at a table. Acceptance does not settle which effect matters most. I help Lin annotate that difference rather than call one version universally better.',common]};
 if(event===0)return {title:'Good preparation, bad timing',paragraphs:[delayed, 'Even our careful revision cannot repair a printer. Lin and I use the interruption to put the two versions beside each other and mark the evidence for each choice. The recommendation can be defensible without producing the hoped-for Friday byline.',common]};
 if(event===1)return {title:'An objection survives the answer',paragraphs:['The supervising editor refuses an exception to the current policy. Mei explains that she took our proposal forward; she did not control the final decision. Lin is disappointed, even if we prepared our case well.', 'Lin asks me to turn our advice into a concise note for a policy discussion. I must state the accessibility objection fairly, explain the effect of the invitation, and propose a test. Failure has opened another writing problem, not proved that evidence was pointless.',common]};
 return careful?{title:'A negotiated page, with a cost',paragraphs:['The supervising editor allows context and selected edits. Lin’s invitation stays in the piece. Mei spends extra time checking the explanation, and one reader still asks what a local reference means. Negotiation has helped; it has not made every difficulty disappear.', 'Lin smiles at the byline, then asks me to read our note aloud. We can show a coherent line of reasoning from the reader concern to the revision. The approval depended on an editor willing to make room as well as on our work.',common]}:{title:'Room to negotiate, but no workable proposal',paragraphs:['The supervising editor permits exceptions, but asks exactly how our proposal helps unfamiliar readers. We have not supplied enough evidence to answer. Mei postpones the piece rather than invent a justification.', 'Lin asks me to return to the draft and design the reader test we skipped. A favourable opening in the policy could not do that reasoning for us. I can still make the next revision more precise.',common]};
}
export function assessYoung(choices,attemptId='standalone'){
 if(!Array.isArray(choices)||choices.length>scenes.length)throw new Error('Invalid choice history');
 const scores=[0,0,0,0],indicators=[50,50,50,50];
 choices.forEach((id,i)=>{const choice=scenes[i].choices.find(c=>c.id===id);if(!choice)throw new Error('Illegal episode choice');choice.points.forEach((n,j)=>scores[j]+=n);choice.delta.forEach((n,j)=>indicators[j]=Math.max(0,Math.min(100,indicators[j]+n)));});
 // Normalize independent domain evidence to 25 points; publication choices score equally.
 scores.forEach((n,j)=>scores[j]=Math.round(n/[22,22,25,20][j]*25));
 return {complete:choices.length===scenes.length,scores,total:scores.reduce((a,b)=>a+b,0),indicators,ending:choices.length===scenes.length?ending(choices,attemptId):null};
}

export const driverQuestions=[
 {prompt:'According to Young, what makes a dialect vulnerable to unfair treatment?',options:['The dialect’s inherent lack of reasoning','People’s attitudes toward its speakers','Every unfamiliar expression'],answer:1,note:'Card A places the problem in attitudes and prejudice, not an inherently defective language.'},
 {prompt:'Which revision best illustrates code-meshing?',options:['Keep a home-language expression and add context that helps this audience follow it','Remove every home-language feature before beginning the argument','Refuse all revision because conventions never matter'],answer:0,note:'Cards B and D support blending resources purposefully while continuing to attend to readers and craft.'},
 {prompt:'Which reply answers an objection while advancing the claim?',options:['Anyone who asks about clarity is prejudiced','Some readers may need context; test a clarification before requiring the writer to erase the expression','A writer should never think about unfamiliar readers'],answer:1,note:'Cards A–D distinguish a genuine comprehension problem from blanket judgement. The reply acknowledges the concern and proposes a next step.'},
 {prompt:'What can the magazine outcome establish?',options:['A rejected submission proves that its dialect cannot communicate','A later opportunity is guaranteed if the writer preserves every feature','An institution can impose a real cost without proving the writer’s language inferior'],answer:2,note:'The episode’s outcomes are fictional applications, not evidence from Young’s life. Card A helps distinguish institutional judgement from linguistic inferiority.'}
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
