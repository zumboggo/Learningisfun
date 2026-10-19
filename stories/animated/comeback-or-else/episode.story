story 2
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
label anaphora
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 1 OF 7. Vex wants a chorus that a stadium can join before the second repetition.
Vex [determined]: Our chorus must unite fifty thousand people. Ideally without requiring fifty thousand dictionaries.
I: Which of these three lyrics is my favourite?
choice lyric_anaphora
option line1 "We own the night. We own the noise. We own tomorrow." -> anaphora_0
option line2 "Let them stare. Let them doubt. Let them hear us now." -> anaphora_1
option line3 "Still I stumble. Still I sparkle. Still I take the stage." -> anaphora_2
label anaphora_0
Vex [proud]: Excellent. We have acquired tomorrow. Finance will be delighted.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by repeating the opening words?
I: My line: We own the night. We own the noise. We own tomorrow.
choice identify_anaphora_0
option right "Anaphora: We own begins each clause." -> anaphora_0_recognised ; Recognised += 1
option other0 "Epistrophe: repetition at the ends of successive clauses." -> anaphora_0_confused
option other1 "Antithesis: a contrast between opposing ideas." -> anaphora_0_confused
label anaphora_0_recognised
Sora [happy]: Yes. You located the pattern: We own begins each clause. Now explain why it belongs in this song.
goto anaphora_0_memory
label anaphora_0_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gives my shoulder one absurdly gentle rubber-duck boop. The duck squeaks as though filing a complaint."
Vex [angry]: THIS IS SERIOUS.
Sora [skeptical]: Then stop delegating discipline to bath equipment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto anaphora_0_memory
label anaphora_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Anaphora repeats an opening across successive clauses. Epistrophe repeats an ending. Locate the pattern before naming it.
Hepting [curious]: I need a pen. I need a plan. I need a class that stops hiding ducks in my desk.
Lin: Is the duck part of the definition?
Hepting [determined]: The duck is under investigation.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: We own the night. We own the noise. We own tomorrow.
I: Which explanation connects its wording to this audience and purpose?
choice explain_anaphora_0
option overclaim "It proves every audience member already agrees with the singer." -> anaphora_0_support
option vague "It sounds good, so we do not need to identify any particular wording." -> anaphora_0_support
option right "The repeated We own gives fans a predictable entrance and turns the chorus into a claim of collective confidence." -> anaphora_0_explained ; Explained += 1
label anaphora_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto anaphora_outro
label anaphora_0_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_anaphora_0
option grounded "The repeated We own gives fans a predictable entrance and turns the chorus into a claim of collective confidence." -> anaphora_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> anaphora_0_guided
label anaphora_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto anaphora_outro
label anaphora_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The repeated We own gives fans a predictable entrance and turns the chorus into a claim of collective confidence.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto anaphora_outro
label anaphora_1
Sora [determined]: I can hear the audience joining the final command.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by repeating the opening words?
I: My line: Let them stare. Let them doubt. Let them hear us now.
choice identify_anaphora_1
option other0 "Epistrophe: repetition at the ends of successive clauses." -> anaphora_1_confused
option other1 "Antithesis: a contrast between opposing ideas." -> anaphora_1_confused
option right "Anaphora: Let them begins each clause." -> anaphora_1_recognised ; Recognised += 1
label anaphora_1_recognised
Sora [happy]: Yes. You located the pattern: Let them begins each clause. Now explain why it belongs in this song.
goto anaphora_1_memory
label anaphora_1_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gives my shoulder one absurdly gentle rubber-duck boop. The duck squeaks as though filing a complaint."
Vex [angry]: THIS IS SERIOUS.
Sora [skeptical]: Then stop delegating discipline to bath equipment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto anaphora_1_memory
label anaphora_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Anaphora repeats an opening across successive clauses. Epistrophe repeats an ending. Locate the pattern before naming it.
Hepting [curious]: I need a pen. I need a plan. I need a class that stops hiding ducks in my desk.
Lin: Is the duck part of the definition?
Hepting [determined]: The duck is under investigation.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Let them stare. Let them doubt. Let them hear us now.
I: Which explanation connects its wording to this audience and purpose?
choice explain_anaphora_1
option vague "It sounds good, so we do not need to identify any particular wording." -> anaphora_1_support
option right "The repeated Let them builds a defiant invitation to keep going despite an audience of doubters." -> anaphora_1_explained ; Explained += 1
option overclaim "It proves every audience member already agrees with the singer." -> anaphora_1_support
label anaphora_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto anaphora_outro
label anaphora_1_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_anaphora_1
option grounded "The repeated Let them builds a defiant invitation to keep going despite an audience of doubters." -> anaphora_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> anaphora_1_guided
label anaphora_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto anaphora_outro
label anaphora_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The repeated Let them builds a defiant invitation to keep going despite an audience of doubters.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto anaphora_outro
label anaphora_2
Vex [relieved]: Finally, choreography that includes my actual abilities.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by repeating the opening words?
I: My line: Still I stumble. Still I sparkle. Still I take the stage.
choice identify_anaphora_2
option other1 "Antithesis: a contrast between opposing ideas." -> anaphora_2_confused
option right "Anaphora: Still I begins each clause." -> anaphora_2_recognised ; Recognised += 1
option other0 "Epistrophe: repetition at the ends of successive clauses." -> anaphora_2_confused
label anaphora_2_recognised
Sora [happy]: Yes. You located the pattern: Still I begins each clause. Now explain why it belongs in this song.
goto anaphora_2_memory
label anaphora_2_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gives my shoulder one absurdly gentle rubber-duck boop. The duck squeaks as though filing a complaint."
Vex [angry]: THIS IS SERIOUS.
Sora [skeptical]: Then stop delegating discipline to bath equipment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto anaphora_2_memory
label anaphora_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Anaphora repeats an opening across successive clauses. Epistrophe repeats an ending. Locate the pattern before naming it.
Hepting [curious]: I need a pen. I need a plan. I need a class that stops hiding ducks in my desk.
Lin: Is the duck part of the definition?
Hepting [determined]: The duck is under investigation.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Still I stumble. Still I sparkle. Still I take the stage.
I: Which explanation connects its wording to this audience and purpose?
choice explain_anaphora_2
option right "The repeated Still I makes persistence the pattern, giving anxious listeners a refrain they can claim themselves." -> anaphora_2_explained ; Explained += 1
option overclaim "It proves every audience member already agrees with the singer." -> anaphora_2_support
option vague "It sounds good, so we do not need to identify any particular wording." -> anaphora_2_support
label anaphora_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto anaphora_outro
label anaphora_2_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_anaphora_2
option grounded "The repeated Still I makes persistence the pattern, giving anxious listeners a refrain they can claim themselves." -> anaphora_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> anaphora_2_guided
label anaphora_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto anaphora_outro
label anaphora_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The repeated Still I makes persistence the pattern, giving anxious listeners a refrain they can claim themselves.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto anaphora_outro
label anaphora_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Manager [worried]: Six sections left. Our launch countdown has begun.
Lin [skeptical]: Is it measured in minutes?
Manager [embarrassed]: Slides. We could not afford the timer subscription.
goto antithesis
label antithesis
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 2 OF 7. Sora wants a comeback verse that turns rejection into defiance.
Sora [determined]: The verse needs a turn: what they wanted from us against what we become.
I: Which of these three lyrics is my favourite?
choice lyric_antithesis
option line1 "You wanted silence; I became thunder." -> antithesis_0
option line2 "They count our failures; we count our chances." -> antithesis_1
option line3 "Your palace feels empty; our basement feels alive." -> antithesis_2
label antithesis_0
Vex [excited]: I will become actual thunder.
Sora [worried]: Please leave the electrical panel alone.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by setting opposing ideas against one another?
I: My line: You wanted silence; I became thunder.
choice identify_antithesis_0
option other0 "Anaphora: repeated openings across successive clauses." -> antithesis_0_confused
option other1 "A simile explicitly comparing two things with like or as." -> antithesis_0_confused
option right "Antithesis: silence contrasts with thunder." -> antithesis_0_recognised ; Recognised += 1
label antithesis_0_recognised
Sora [happy]: Yes. You located the pattern: silence contrasts with thunder. Now explain why it belongs in this song.
goto antithesis_0_memory
label antithesis_0_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex reaches toward me with a foam pool noodle. It folds around his own elbow before its tip taps my sleeve."
Vex [angry]: FEAR MY AUTHORITY.
Lin [curious]: Your authority appears to be tied in a bow.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto antithesis_0_memory
label antithesis_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Antithesis puts contrasting ideas beside each other. Parallel phrasing can make the contrast clearer, but parallel structure alone is not an opposition.
Hepting [curious]: Small props. Enormous consequences.
Lin [skeptical]: That is also the title of your classroom equipment policy.
Hepting [proud]: A document with range.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: You wanted silence; I became thunder.
I: Which explanation connects its wording to this audience and purpose?
choice explain_antithesis_0
option vague "It persuades because all parallel sentences contain opposing ideas." -> antithesis_0_support
option right "The contrast turns an attempt to silence the speaker into loud resistance; thunder also supplies a metaphor." -> antithesis_0_explained ; Explained += 1
option overclaim "It establishes that the contrast is a proven fact about every listener." -> antithesis_0_support
label antithesis_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto antithesis_outro
label antithesis_0_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_antithesis_0
option grounded "The contrast turns an attempt to silence the speaker into loud resistance; thunder also supplies a metaphor." -> antithesis_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> antithesis_0_guided
label antithesis_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto antithesis_outro
label antithesis_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The contrast turns an attempt to silence the speaker into loud resistance; thunder also supplies a metaphor.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto antithesis_outro
label antithesis_1
Manager [worried]: Can we count our invoices next?
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by setting opposing ideas against one another?
I: My line: They count our failures; we count our chances.
choice identify_antithesis_1
option other1 "A simile explicitly comparing two things with like or as." -> antithesis_1_confused
option right "Antithesis: failures contrasts with chances in matching clauses." -> antithesis_1_recognised ; Recognised += 1
option other0 "Anaphora: repeated openings across successive clauses." -> antithesis_1_confused
label antithesis_1_recognised
Sora [happy]: Yes. You located the pattern: failures contrasts with chances in matching clauses. Now explain why it belongs in this song.
goto antithesis_1_memory
label antithesis_1_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex reaches toward me with a foam pool noodle. It folds around his own elbow before its tip taps my sleeve."
Vex [angry]: FEAR MY AUTHORITY.
Lin [curious]: Your authority appears to be tied in a bow.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto antithesis_1_memory
label antithesis_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Antithesis puts contrasting ideas beside each other. Parallel phrasing can make the contrast clearer, but parallel structure alone is not an opposition.
Hepting [curious]: Small props. Enormous consequences.
Lin [skeptical]: That is also the title of your classroom equipment policy.
Hepting [proud]: A document with range.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: They count our failures; we count our chances.
I: Which explanation connects its wording to this audience and purpose?
choice explain_antithesis_1
option right "The balanced contrast reframes the same setbacks as opportunities, inviting fans to adopt the group's resilience." -> antithesis_1_explained ; Explained += 1
option overclaim "It establishes that the contrast is a proven fact about every listener." -> antithesis_1_support
option vague "It persuades because all parallel sentences contain opposing ideas." -> antithesis_1_support
label antithesis_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto antithesis_outro
label antithesis_1_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_antithesis_1
option grounded "The balanced contrast reframes the same setbacks as opportunities, inviting fans to adopt the group's resilience." -> antithesis_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> antithesis_1_guided
label antithesis_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto antithesis_outro
label antithesis_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The balanced contrast reframes the same setbacks as opportunities, inviting fans to adopt the group's resilience.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto antithesis_outro
label antithesis_2
Sora [happy]: A room can be small without the life inside it being small.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by setting opposing ideas against one another?
I: My line: Your palace feels empty; our basement feels alive.
choice identify_antithesis_2
option right "Antithesis: empty palace contrasts with lively basement." -> antithesis_2_recognised ; Recognised += 1
option other0 "Anaphora: repeated openings across successive clauses." -> antithesis_2_confused
option other1 "A simile explicitly comparing two things with like or as." -> antithesis_2_confused
label antithesis_2_recognised
Sora [happy]: Yes. You located the pattern: empty palace contrasts with lively basement. Now explain why it belongs in this song.
goto antithesis_2_memory
label antithesis_2_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex reaches toward me with a foam pool noodle. It folds around his own elbow before its tip taps my sleeve."
Vex [angry]: FEAR MY AUTHORITY.
Lin [curious]: Your authority appears to be tied in a bow.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto antithesis_2_memory
label antithesis_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Antithesis puts contrasting ideas beside each other. Parallel phrasing can make the contrast clearer, but parallel structure alone is not an opposition.
Hepting [curious]: Small props. Enormous consequences.
Lin [skeptical]: That is also the title of your classroom equipment policy.
Hepting [proud]: A document with range.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Your palace feels empty; our basement feels alive.
I: Which explanation connects its wording to this audience and purpose?
choice explain_antithesis_2
option overclaim "It establishes that the contrast is a proven fact about every listener." -> antithesis_2_support
option vague "It persuades because all parallel sentences contain opposing ideas." -> antithesis_2_support
option right "The contrast makes belonging seem more valuable than status, appealing to listeners who feel overlooked." -> antithesis_2_explained ; Explained += 1
label antithesis_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto antithesis_outro
label antithesis_2_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_antithesis_2
option grounded "The contrast makes belonging seem more valuable than status, appealing to listeners who feel overlooked." -> antithesis_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> antithesis_2_guided
label antithesis_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto antithesis_outro
label antithesis_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The contrast makes belonging seem more valuable than status, appealing to listeners who feel overlooked.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto antithesis_outro
label antithesis_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
I: The manager advances the countdown slide. The next number is larger.
Manager [determined]: That is a design error. Feel more urgency anyway.
goto metaphor
label metaphor
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 3 OF 7. Sora wants a heartbreak line that makes a feeling concrete without explaining every detail.
Sora [sad]: I want to show the feeling. Vex keeps suggesting that I announce the feeling through a megaphone.
I: Which of these three lyrics is my favourite?
choice lyric_metaphor
option line1 "Your goodbye is a city I still live in." -> metaphor_0
option line2 "My heart is a nightclub with your name on every door." -> metaphor_1
option line3 "Your promise was a paper umbrella in the rain." -> metaphor_2
label metaphor_0
Vex [confused]: Does this city have affordable rent?
Sora [sad]: Emotionally, no.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device treats one thing as another rather than describing it literally?
I: My line: Your goodbye is a city I still live in.
choice identify_metaphor_0
option other1 "A rhetorical question addressed to the listener." -> metaphor_0_confused
option right "Metaphor: goodbye becomes a city inhabited by the speaker." -> metaphor_0_recognised ; Recognised += 1
option other0 "Epistrophe: the same ending repeated across clauses." -> metaphor_0_confused
label metaphor_0_recognised
Sora [happy]: Yes. You located the pattern: goodbye becomes a city inhabited by the speaker. Now explain why it belongs in this song.
goto metaphor_0_memory
label metaphor_0_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex presents the rubber duck directly toward me, as if its painted eyes can extract an answer. It gives my sleeve a squeaky tap."
Vex [determined]: THE DUCK KNOWS.
Lin [skeptical]: Then why is it not enrolled in AP Language?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto metaphor_0_memory
label metaphor_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A metaphor presents one thing as another. Explain what the comparison lets a reader imagine. The comparison is not a literal fact.
Hepting [curious]: My inbox is a swamp. Notice: I do not need to write like a swamp to make the comparison.
Lin [worried]: Is that why you have not answered my email?
Hepting [determined]: Rescue operations are ongoing.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Your goodbye is a city I still live in.
I: Which explanation connects its wording to this audience and purpose?
choice explain_metaphor_0
option right "The place metaphor makes lingering grief feel like an environment the speaker cannot simply leave." -> metaphor_0_explained ; Explained += 1
option overclaim "It supplies scientific evidence that feelings literally become physical objects." -> metaphor_0_support
option vague "It appeals only because all metaphors mean the same thing: love." -> metaphor_0_support
label metaphor_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto metaphor_outro
label metaphor_0_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_metaphor_0
option grounded "The place metaphor makes lingering grief feel like an environment the speaker cannot simply leave." -> metaphor_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> metaphor_0_guided
label metaphor_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto metaphor_outro
label metaphor_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The place metaphor makes lingering grief feel like an environment the speaker cannot simply leave.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto metaphor_outro
label metaphor_1
Manager [curious]: At least the venue has multiple exits.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device treats one thing as another rather than describing it literally?
I: My line: My heart is a nightclub with your name on every door.
choice identify_metaphor_1
option right "Metaphor: the heart becomes a nightclub marked by one person's name." -> metaphor_1_recognised ; Recognised += 1
option other0 "Epistrophe: the same ending repeated across clauses." -> metaphor_1_confused
option other1 "A rhetorical question addressed to the listener." -> metaphor_1_confused
label metaphor_1_recognised
Sora [happy]: Yes. You located the pattern: the heart becomes a nightclub marked by one person's name. Now explain why it belongs in this song.
goto metaphor_1_memory
label metaphor_1_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex presents the rubber duck directly toward me, as if its painted eyes can extract an answer. It gives my sleeve a squeaky tap."
Vex [determined]: THE DUCK KNOWS.
Lin [skeptical]: Then why is it not enrolled in AP Language?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto metaphor_1_memory
label metaphor_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A metaphor presents one thing as another. Explain what the comparison lets a reader imagine. The comparison is not a literal fact.
Hepting [curious]: My inbox is a swamp. Notice: I do not need to write like a swamp to make the comparison.
Lin [worried]: Is that why you have not answered my email?
Hepting [determined]: Rescue operations are ongoing.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: My heart is a nightclub with your name on every door.
I: Which explanation connects its wording to this audience and purpose?
choice explain_metaphor_1
option overclaim "It supplies scientific evidence that feelings literally become physical objects." -> metaphor_1_support
option vague "It appeals only because all metaphors mean the same thing: love." -> metaphor_1_support
option right "The image makes private longing vivid through a familiar social space, suggesting that every route leads back to one person." -> metaphor_1_explained ; Explained += 1
label metaphor_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto metaphor_outro
label metaphor_1_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_metaphor_1
option grounded "The image makes private longing vivid through a familiar social space, suggesting that every route leads back to one person." -> metaphor_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> metaphor_1_guided
label metaphor_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto metaphor_outro
label metaphor_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The image makes private longing vivid through a familiar social space, suggesting that every route leads back to one person.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto metaphor_outro
label metaphor_2
Sora [determined]: A promise that looked useful until the weather changed. That hurts.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device treats one thing as another rather than describing it literally?
I: My line: Your promise was a paper umbrella in the rain.
choice identify_metaphor_2
option other0 "Epistrophe: the same ending repeated across clauses." -> metaphor_2_confused
option other1 "A rhetorical question addressed to the listener." -> metaphor_2_confused
option right "Metaphor: the promise becomes an inadequate umbrella." -> metaphor_2_recognised ; Recognised += 1
label metaphor_2_recognised
Sora [happy]: Yes. You located the pattern: the promise becomes an inadequate umbrella. Now explain why it belongs in this song.
goto metaphor_2_memory
label metaphor_2_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex presents the rubber duck directly toward me, as if its painted eyes can extract an answer. It gives my sleeve a squeaky tap."
Vex [determined]: THE DUCK KNOWS.
Lin [skeptical]: Then why is it not enrolled in AP Language?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto metaphor_2_memory
label metaphor_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A metaphor presents one thing as another. Explain what the comparison lets a reader imagine. The comparison is not a literal fact.
Hepting [curious]: My inbox is a swamp. Notice: I do not need to write like a swamp to make the comparison.
Lin [worried]: Is that why you have not answered my email?
Hepting [determined]: Rescue operations are ongoing.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Your promise was a paper umbrella in the rain.
I: Which explanation connects its wording to this audience and purpose?
choice explain_metaphor_2
option vague "It appeals only because all metaphors mean the same thing: love." -> metaphor_2_support
option right "The fragile protection suggests that the promise failed when needed, giving disappointment a concrete image." -> metaphor_2_explained ; Explained += 1
option overclaim "It supplies scientific evidence that feelings literally become physical objects." -> metaphor_2_support
label metaphor_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto metaphor_outro
label metaphor_2_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_metaphor_2
option grounded "The fragile protection suggests that the promise failed when needed, giving disappointment a concrete image." -> metaphor_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> metaphor_2_guided
label metaphor_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto metaphor_outro
label metaphor_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The fragile protection suggests that the promise failed when needed, giving disappointment a concrete image.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto metaphor_outro
label metaphor_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Sora [curious]: You keep making us say what the image does, not just what it is called.
I: Yes. The device name is the doorway. We still have to enter the room.
goto hyperbole
label hyperbole
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 4 OF 7. Vex wants recognisable, ridiculous heartbreak for listeners who have waited for a reply.
Vex [pleading]: I need a line that says I am normal about this breakup.
Sora [skeptical]: Your draft contains nine exclamation marks and a weather warning.
I: Which of these three lyrics is my favourite?
choice lyric_hyperbole
option line1 "I checked my phone a million times before the chorus." -> hyperbole_0
option line2 "I cried enough to put the moon underwater." -> hyperbole_1
option line3 "I would cross a thousand galaxies for one unread message." -> hyperbole_2
label hyperbole_0
Manager [worried]: Your screen-time report has requested a lawyer.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device deliberately exaggerates the amount or scale?
I: My line: I checked my phone a million times before the chorus.
choice identify_hyperbole_0
option right "Hyperbole: a million checks within one short musical interval." -> hyperbole_0_recognised ; Recognised += 1
option other0 "A concession acknowledging a reasonable opposing point." -> hyperbole_0_confused
option other1 "Alliteration: repetition of consonant sounds." -> hyperbole_0_confused
label hyperbole_0_recognised
Sora [happy]: Yes. You located the pattern: a million checks within one short musical interval. Now explain why it belongs in this song.
goto hyperbole_0_memory
label hyperbole_0_confused
prop Vex pool-noodle
camera wide
act Vex reach "The foam noodle droops against my shoulder. Vex tries to lift it dramatically and nearly tickles his own ear."
Vex [angry]: THIS WILL BE THE MOST TERRIFYING MOMENT IN ALL HUMAN HISTORY.
Lin [curious]: Was that our next example?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto hyperbole_0_memory
label hyperbole_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Hyperbole deliberately stretches scale for an effect. In a lyric, an impossible quantity can convey feeling without pretending to be a measured fact.
Hepting [curious]: I have explained this a billion times. Not a verified statistic. A very tired teacher's emphasis.
Lin [curious]: Would a million still count?
Hepting [worried]: Please do not turn this into a spreadsheet.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: I checked my phone a million times before the chorus.
I: Which explanation connects its wording to this audience and purpose?
choice explain_hyperbole_0
option overclaim "It proves the singer's literal claim by supplying a large number." -> hyperbole_0_support
option vague "It must make every listener sad because exaggeration has only one possible effect." -> hyperbole_0_support
option right "The impossible frequency makes anxious checking recognisable through comic exaggeration." -> hyperbole_0_explained ; Explained += 1
label hyperbole_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto hyperbole_outro
label hyperbole_0_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_hyperbole_0
option grounded "The impossible frequency makes anxious checking recognisable through comic exaggeration." -> hyperbole_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> hyperbole_0_guided
label hyperbole_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto hyperbole_outro
label hyperbole_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The impossible frequency makes anxious checking recognisable through comic exaggeration.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto hyperbole_outro
label hyperbole_1
Vex [proud]: Finally, an affordable concept for the music video.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device deliberately exaggerates the amount or scale?
I: My line: I cried enough to put the moon underwater.
choice identify_hyperbole_1
option other0 "A concession acknowledging a reasonable opposing point." -> hyperbole_1_confused
option other1 "Alliteration: repetition of consonant sounds." -> hyperbole_1_confused
option right "Hyperbole: tears impossibly flooding as high as the moon." -> hyperbole_1_recognised ; Recognised += 1
label hyperbole_1_recognised
Sora [happy]: Yes. You located the pattern: tears impossibly flooding as high as the moon. Now explain why it belongs in this song.
goto hyperbole_1_memory
label hyperbole_1_confused
prop Vex pool-noodle
camera wide
act Vex reach "The foam noodle droops against my shoulder. Vex tries to lift it dramatically and nearly tickles his own ear."
Vex [angry]: THIS WILL BE THE MOST TERRIFYING MOMENT IN ALL HUMAN HISTORY.
Lin [curious]: Was that our next example?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto hyperbole_1_memory
label hyperbole_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Hyperbole deliberately stretches scale for an effect. In a lyric, an impossible quantity can convey feeling without pretending to be a measured fact.
Hepting [curious]: I have explained this a billion times. Not a verified statistic. A very tired teacher's emphasis.
Lin [curious]: Would a million still count?
Hepting [worried]: Please do not turn this into a spreadsheet.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: I cried enough to put the moon underwater.
I: Which explanation connects its wording to this audience and purpose?
choice explain_hyperbole_1
option vague "It must make every listener sad because exaggeration has only one possible effect." -> hyperbole_1_support
option right "The impossible scale makes grief extravagantly large, inviting listeners to enjoy the melodrama rather than calculate the water." -> hyperbole_1_explained ; Explained += 1
option overclaim "It proves the singer's literal claim by supplying a large number." -> hyperbole_1_support
label hyperbole_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto hyperbole_outro
label hyperbole_1_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_hyperbole_1
option grounded "The impossible scale makes grief extravagantly large, inviting listeners to enjoy the melodrama rather than calculate the water." -> hyperbole_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> hyperbole_1_guided
label hyperbole_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto hyperbole_outro
label hyperbole_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The impossible scale makes grief extravagantly large, inviting listeners to enjoy the melodrama rather than calculate the water.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto hyperbole_outro
label hyperbole_2
Sora [skeptical]: Or you could put the phone down.
Vex [shocked]: We are writing fiction, Sora.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device deliberately exaggerates the amount or scale?
I: My line: I would cross a thousand galaxies for one unread message.
choice identify_hyperbole_2
option other1 "Alliteration: repetition of consonant sounds." -> hyperbole_2_confused
option right "Hyperbole: vast travel exchanged for a tiny and disappointing reward." -> hyperbole_2_recognised ; Recognised += 1
option other0 "A concession acknowledging a reasonable opposing point." -> hyperbole_2_confused
label hyperbole_2_recognised
Sora [happy]: Yes. You located the pattern: vast travel exchanged for a tiny and disappointing reward. Now explain why it belongs in this song.
goto hyperbole_2_memory
label hyperbole_2_confused
prop Vex pool-noodle
camera wide
act Vex reach "The foam noodle droops against my shoulder. Vex tries to lift it dramatically and nearly tickles his own ear."
Vex [angry]: THIS WILL BE THE MOST TERRIFYING MOMENT IN ALL HUMAN HISTORY.
Lin [curious]: Was that our next example?
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto hyperbole_2_memory
label hyperbole_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Hyperbole deliberately stretches scale for an effect. In a lyric, an impossible quantity can convey feeling without pretending to be a measured fact.
Hepting [curious]: I have explained this a billion times. Not a verified statistic. A very tired teacher's emphasis.
Lin [curious]: Would a million still count?
Hepting [worried]: Please do not turn this into a spreadsheet.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: I would cross a thousand galaxies for one unread message.
I: Which explanation connects its wording to this audience and purpose?
choice explain_hyperbole_2
option right "The exaggerated effort turns longing into comic excess, especially beside the anticlimax of an unread message." -> hyperbole_2_explained ; Explained += 1
option overclaim "It proves the singer's literal claim by supplying a large number." -> hyperbole_2_support
option vague "It must make every listener sad because exaggeration has only one possible effect." -> hyperbole_2_support
label hyperbole_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto hyperbole_outro
label hyperbole_2_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_hyperbole_2
option grounded "The exaggerated effort turns longing into comic excess, especially beside the anticlimax of an unread message." -> hyperbole_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> hyperbole_2_guided
label hyperbole_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto hyperbole_outro
label hyperbole_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The exaggerated effort turns longing into comic excess, especially beside the anticlimax of an unread message.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto hyperbole_outro
label hyperbole_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Manager [worried]: Three sections left. The livestream waiting room is open.
Sora [worried]: How many viewers?
Manager [embarrassed]: One. My mother. She has already asked us to stand up straight.
goto question
label question
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 5 OF 7. The bridge addresses a doubting listener; the singer leaves the question hanging rather than answering it.
Sora [determined]: This bridge should make a doubter confront something. No customer-service reply form.
I: Which of these three lyrics is my favourite?
choice lyric_question
option line1 "If we meant nothing, why are you still singing?" -> question_0
option line2 "Who said a broken voice cannot fill a stadium?" -> question_1
option line3 "How can you call this goodbye when you know every word?" -> question_2
label question_0
Vex [determined]: The audience has been cross-examined. In harmony.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this song context, which device asks in order to challenge or provoke thought rather than obtain an answer?
I: My line: If we meant nothing, why are you still singing?
choice identify_question_0
option other0 "Hypophora: asking a question and then immediately answering it." -> question_0_confused
option other1 "Anaphora: repeated openings across successive clauses." -> question_0_confused
option right "Rhetorical question: the unanswered question challenges the claim that the relationship meant nothing." -> question_0_recognised ; Recognised += 1
label question_0_recognised
Sora [happy]: Yes. You located the pattern: the unanswered question challenges the claim that the relationship meant nothing. Now explain why it belongs in this song.
goto question_0_memory
label question_0_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gently boops my sleeve with the duck, then holds it to his ear as if waiting for expert advice."
Vex [angry]: DO YOU THINK THIS IS A GAME?
Lin [curious]: Are you requesting information, or demonstrating the device?
Vex [confused]: I require a moment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto question_0_memory
label question_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A rhetorical question does something beyond requesting information. Context matters: the same words could become a genuine question in an interview. Hypophora supplies the speaker's own answer.
Hepting [curious]: Who needs another worksheet? In this memory, I am protesting the pile, not conducting a survey.
Lin [happy]: I vote no.
Hepting [skeptical]: That response was suspiciously prepared.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: If we meant nothing, why are you still singing?
I: Which explanation connects its wording to this audience and purpose?
choice explain_question_0
option vague "It is automatically hypophora because any question answers itself." -> question_0_support
option right "It uses the listener's continued singing as a challenge to their denial, inviting them to reconsider their attachment." -> question_0_explained ; Explained += 1
option overclaim "It requires every concertgoer to submit a factual written answer." -> question_0_support
label question_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto question_outro
label question_0_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_question_0
option grounded "It uses the listener's continued singing as a challenge to their denial, inviting them to reconsider their attachment." -> question_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> question_0_guided
label question_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto question_outro
label question_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: It uses the listener's continued singing as a challenge to their denial, inviting them to reconsider their attachment.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto question_outro
label question_1
Sora [happy]: That one lets people sing before they feel perfect.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this song context, which device asks in order to challenge or provoke thought rather than obtain an answer?
I: My line: Who said a broken voice cannot fill a stadium?
choice identify_question_1
option other1 "Anaphora: repeated openings across successive clauses." -> question_1_confused
option right "Rhetorical question: the question challenges an assumed limit without seeking a named person." -> question_1_recognised ; Recognised += 1
option other0 "Hypophora: asking a question and then immediately answering it." -> question_1_confused
label question_1_recognised
Sora [happy]: Yes. You located the pattern: the question challenges an assumed limit without seeking a named person. Now explain why it belongs in this song.
goto question_1_memory
label question_1_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gently boops my sleeve with the duck, then holds it to his ear as if waiting for expert advice."
Vex [angry]: DO YOU THINK THIS IS A GAME?
Lin [curious]: Are you requesting information, or demonstrating the device?
Vex [confused]: I require a moment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto question_1_memory
label question_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A rhetorical question does something beyond requesting information. Context matters: the same words could become a genuine question in an interview. Hypophora supplies the speaker's own answer.
Hepting [curious]: Who needs another worksheet? In this memory, I am protesting the pile, not conducting a survey.
Lin [happy]: I vote no.
Hepting [skeptical]: That response was suspiciously prepared.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Who said a broken voice cannot fill a stadium?
I: Which explanation connects its wording to this audience and purpose?
choice explain_question_1
option right "It pushes back against exclusion and invites imperfect singers to imagine belonging in a huge shared space." -> question_1_explained ; Explained += 1
option overclaim "It requires every concertgoer to submit a factual written answer." -> question_1_support
option vague "It is automatically hypophora because any question answers itself." -> question_1_support
label question_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto question_outro
label question_1_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_question_1
option grounded "It pushes back against exclusion and invites imperfect singers to imagine belonging in a huge shared space." -> question_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> question_1_guided
label question_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto question_outro
label question_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: It pushes back against exclusion and invites imperfect singers to imagine belonging in a huge shared space.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto question_outro
label question_2
Manager [worried]: Please do not make goodbye legally impossible. We need the studio by nine.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this song context, which device asks in order to challenge or provoke thought rather than obtain an answer?
I: My line: How can you call this goodbye when you know every word?
choice identify_question_2
option right "Rhetorical question: the unanswered challenge contrasts departure with remembered lyrics." -> question_2_recognised ; Recognised += 1
option other0 "Hypophora: asking a question and then immediately answering it." -> question_2_confused
option other1 "Anaphora: repeated openings across successive clauses." -> question_2_confused
label question_2_recognised
Sora [happy]: Yes. You located the pattern: the unanswered challenge contrasts departure with remembered lyrics. Now explain why it belongs in this song.
goto question_2_memory
label question_2_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex gently boops my sleeve with the duck, then holds it to his ear as if waiting for expert advice."
Vex [angry]: DO YOU THINK THIS IS A GAME?
Lin [curious]: Are you requesting information, or demonstrating the device?
Vex [confused]: I require a moment.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto question_2_memory
label question_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: A rhetorical question does something beyond requesting information. Context matters: the same words could become a genuine question in an interview. Hypophora supplies the speaker's own answer.
Hepting [curious]: Who needs another worksheet? In this memory, I am protesting the pile, not conducting a survey.
Lin [happy]: I vote no.
Hepting [skeptical]: That response was suspiciously prepared.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: How can you call this goodbye when you know every word?
I: Which explanation connects its wording to this audience and purpose?
choice explain_question_2
option overclaim "It requires every concertgoer to submit a factual written answer." -> question_2_support
option vague "It is automatically hypophora because any question answers itself." -> question_2_support
option right "It invites the listener to notice a tension between claiming to leave and still knowing the shared song." -> question_2_explained ; Explained += 1
label question_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto question_outro
label question_2_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_question_2
option grounded "It invites the listener to notice a tension between claiming to leave and still knowing the shared song." -> question_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> question_2_guided
label question_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto question_outro
label question_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: It invites the listener to notice a tension between claiming to leave and still knowing the shared song.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto question_outro
label question_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Sora [curious]: Earlier we repeated an opening. Now we leave an unanswered challenge. Different tools, different reasons to use them.
I: The manager has begun rehearsing our apology in the corner.
goto alliteration
label alliteration
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 6 OF 7. Sora wants a line whose sound is noticeable and whose words still serve its meaning.
Sora [determined]: Vex has written seventeen words beginning with B. It is less a lyric than a malfunctioning printer.
I: Which of these three lyrics is my favourite?
choice lyric_alliteration
option line1 "Silk smiles sell beautiful lies." -> alliteration_0
option line2 "Bright beats break the bedroom gloom." -> alliteration_1
option line3 "Cold coffee keeps your company." -> alliteration_2
label alliteration_0
Vex [skeptical]: My smile objects to being investigated.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by the repeated consonant sound near the starts of words?
I: My line: Silk smiles sell beautiful lies.
choice identify_alliteration_0
option other1 "Antithesis: juxtaposition of opposing ideas." -> alliteration_0_confused
option right "Alliteration: Silk, smiles and sell repeat the s sound." -> alliteration_0_recognised ; Recognised += 1
option other0 "Rhyme: matching sounds at word endings." -> alliteration_0_confused
label alliteration_0_recognised
Sora [happy]: Yes. You located the pattern: Silk, smiles and sell repeat the s sound. Now explain why it belongs in this song.
goto alliteration_0_memory
label alliteration_0_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex advances with the foam noodle. It brushes my sleeve, then flops across his own face like a pink moustache."
Vex [angry]: PERFECTLY PROFESSIONAL PUNISHMENT.
Lin [laughing]: Your prop appears to support your point.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto alliteration_0_memory
label alliteration_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Alliteration repeats consonant sounds, often at word beginnings. Listen to sounds, not just spelling. A sound pattern can support a tone, but it does not dictate one universal emotion.
Hepting [curious]: Clever kittens conquer chaos. The repeated k sound crosses the different spellings c and k.
Lin [curious]: Have the kittens submitted a plan?
Hepting [worried]: They have eaten the plan.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Silk smiles sell beautiful lies.
I: Which explanation connects its wording to this audience and purpose?
choice explain_alliteration_0
option right "The s pattern links smooth appearance with deception; in these words it can support a sleek, suspicious tone." -> alliteration_0_explained ; Explained += 1
option overclaim "The repeated consonant guarantees the same emotion for every audience." -> alliteration_0_support
option vague "It must be rhyme because any repeated sound occurs at a word ending." -> alliteration_0_support
label alliteration_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto alliteration_outro
label alliteration_0_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_alliteration_0
option grounded "The s pattern links smooth appearance with deception; in these words it can support a sleek, suspicious tone." -> alliteration_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> alliteration_0_guided
label alliteration_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto alliteration_outro
label alliteration_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The s pattern links smooth appearance with deception; in these words it can support a sleek, suspicious tone.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto alliteration_outro
label alliteration_1
Sora [happy]: The sound has a job. It is not just wearing a costume.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by the repeated consonant sound near the starts of words?
I: My line: Bright beats break the bedroom gloom.
choice identify_alliteration_1
option right "Alliteration: Bright, beats, break and bedroom repeat the b sound." -> alliteration_1_recognised ; Recognised += 1
option other0 "Rhyme: matching sounds at word endings." -> alliteration_1_confused
option other1 "Antithesis: juxtaposition of opposing ideas." -> alliteration_1_confused
label alliteration_1_recognised
Sora [happy]: Yes. You located the pattern: Bright, beats, break and bedroom repeat the b sound. Now explain why it belongs in this song.
goto alliteration_1_memory
label alliteration_1_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex advances with the foam noodle. It brushes my sleeve, then flops across his own face like a pink moustache."
Vex [angry]: PERFECTLY PROFESSIONAL PUNISHMENT.
Lin [laughing]: Your prop appears to support your point.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto alliteration_1_memory
label alliteration_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Alliteration repeats consonant sounds, often at word beginnings. Listen to sounds, not just spelling. A sound pattern can support a tone, but it does not dictate one universal emotion.
Hepting [curious]: Clever kittens conquer chaos. The repeated k sound crosses the different spellings c and k.
Lin [curious]: Have the kittens submitted a plan?
Hepting [worried]: They have eaten the plan.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Bright beats break the bedroom gloom.
I: Which explanation connects its wording to this audience and purpose?
choice explain_alliteration_1
option overclaim "The repeated consonant guarantees the same emotion for every audience." -> alliteration_1_support
option vague "It must be rhyme because any repeated sound occurs at a word ending." -> alliteration_1_support
option right "The repeated b gives the phrase an audible pattern that can reinforce its energetic movement out of gloom." -> alliteration_1_explained ; Explained += 1
label alliteration_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto alliteration_outro
label alliteration_1_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_alliteration_1
option grounded "The repeated b gives the phrase an audible pattern that can reinforce its energetic movement out of gloom." -> alliteration_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> alliteration_1_guided
label alliteration_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto alliteration_outro
label alliteration_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The repeated b gives the phrase an audible pattern that can reinforce its energetic movement out of gloom.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto alliteration_outro
label alliteration_2
Manager [sad]: That is the first lyric to represent my working conditions.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: Which device is foregrounded by the repeated consonant sound near the starts of words?
I: My line: Cold coffee keeps your company.
choice identify_alliteration_2
option other0 "Rhyme: matching sounds at word endings." -> alliteration_2_confused
option other1 "Antithesis: juxtaposition of opposing ideas." -> alliteration_2_confused
option right "Alliteration: Cold, coffee, keeps and company repeat the k sound." -> alliteration_2_recognised ; Recognised += 1
label alliteration_2_recognised
Sora [happy]: Yes. You located the pattern: Cold, coffee, keeps and company repeat the k sound. Now explain why it belongs in this song.
goto alliteration_2_memory
label alliteration_2_confused
prop Vex pool-noodle
camera wide
act Vex reach "Vex advances with the foam noodle. It brushes my sleeve, then flops across his own face like a pink moustache."
Vex [angry]: PERFECTLY PROFESSIONAL PUNISHMENT.
Lin [laughing]: Your prop appears to support your point.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto alliteration_2_memory
label alliteration_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Alliteration repeats consonant sounds, often at word beginnings. Listen to sounds, not just spelling. A sound pattern can support a tone, but it does not dictate one universal emotion.
Hepting [curious]: Clever kittens conquer chaos. The repeated k sound crosses the different spellings c and k.
Lin [curious]: Have the kittens submitted a plan?
Hepting [worried]: They have eaten the plan.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Cold coffee keeps your company.
I: Which explanation connects its wording to this audience and purpose?
choice explain_alliteration_2
option vague "It must be rhyme because any repeated sound occurs at a word ending." -> alliteration_2_support
option right "The repeated k links the small details of lonely routine into a compact, noticeable phrase." -> alliteration_2_explained ; Explained += 1
option overclaim "The repeated consonant guarantees the same emotion for every audience." -> alliteration_2_support
label alliteration_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto alliteration_outro
label alliteration_2_support
prop Vex pool-noodle
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless pink foam curl against his own cheek."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_alliteration_2
option grounded "The repeated k links the small details of lonely routine into a compact, noticeable phrase." -> alliteration_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> alliteration_2_guided
label alliteration_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto alliteration_outro
label alliteration_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The repeated k links the small details of lonely routine into a compact, noticeable phrase.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto alliteration_outro
label alliteration_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Manager [worried]: Final section. The launch button is now pulsating.
Sora [skeptical]: You are moving the mouse over it.
Manager [determined]: I am creating stakes.
goto irony
label irony
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
I: ROUND 7 OF 7. The singer is openly frustrated, not sincerely pleased. Deliver each line with that context in mind.
Vex [proud]: The last line must communicate that I am completely fine.
Sora [skeptical]: You have labelled the folder ABSOLUTELY NOT FINE.
I: Which of these three lyrics is my favourite?
choice lyric_irony
option line1 "Perfect timing—you left on my birthday." -> irony_0
option line2 "How thoughtful—you forgot my name again." -> irony_1
option line3 "What a generous gift: another excuse." -> irony_2
label irony_0
Manager [worried]: We should clarify that leaving on birthdays is not company policy.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this context of obvious frustration, which device makes the literal praise mean its opposite?
I: My line: Perfect timing—you left on my birthday.
choice identify_irony_0
option right "Verbal irony: Perfect praises timing that the hurt singer plainly resents." -> irony_0_recognised ; Recognised += 1
option other0 "A literal compliment sincerely celebrating the situation." -> irony_0_confused
option other1 "Anaphora: the same opening repeated in successive clauses." -> irony_0_confused
label irony_0_recognised
Sora [happy]: Yes. You located the pattern: Perfect praises timing that the hurt singer plainly resents. Now explain why it belongs in this song.
goto irony_0_memory
label irony_0_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex offers the duck its final intimidating entrance. Its squeak is so small that he apologises to it."
Vex [worried]: We rehearsed this, Mr. Quackers.
Lin [skeptical]: A flawless demonstration of overwhelming power.
Sora [curious]: That reply, with this context, is verbal irony.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto irony_0_memory
label irony_0_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Verbal irony can use praise to convey criticism when context reverses the literal meaning. A ridiculous situation alone is not enough. Ask what the speaker intends.
Hepting [curious]: Wonderful. The projector has frozen for the third time. My words praise it; my evident frustration does not.
Lin [skeptical]: Is your earlier THIS IS SERIOUS joke automatically verbal irony?
Hepting [determined]: No. If Vex means it sincerely, the comic mismatch is not verbal irony. Intention and context matter.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: Perfect timing—you left on my birthday.
I: Which explanation connects its wording to this audience and purpose?
choice explain_irony_0
option overclaim "It sincerely thanks the other person; the frustrated context is irrelevant." -> irony_0_support
option vague "It is irony only because any unhappy event automatically reverses the meaning of words." -> irony_0_support
option right "The reversal turns apparent praise into a bitter complaint, inviting listeners to recognise the speaker's hurt beneath controlled wording." -> irony_0_explained ; Explained += 1
label irony_0_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto irony_outro
label irony_0_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_irony_0
option grounded "The reversal turns apparent praise into a bitter complaint, inviting listeners to recognise the speaker's hurt beneath controlled wording." -> irony_0_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> irony_0_guided
label irony_0_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto irony_outro
label irony_0_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The reversal turns apparent praise into a bitter complaint, inviting listeners to recognise the speaker's hurt beneath controlled wording.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto irony_outro
label irony_1
Sora [sad]: The again makes the neglect a pattern.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this context of obvious frustration, which device makes the literal praise mean its opposite?
I: My line: How thoughtful—you forgot my name again.
choice identify_irony_1
option other0 "A literal compliment sincerely celebrating the situation." -> irony_1_confused
option other1 "Anaphora: the same opening repeated in successive clauses." -> irony_1_confused
option right "Verbal irony: thoughtful describes behaviour the speaker experiences as thoughtless." -> irony_1_recognised ; Recognised += 1
label irony_1_recognised
Sora [happy]: Yes. You located the pattern: thoughtful describes behaviour the speaker experiences as thoughtless. Now explain why it belongs in this song.
goto irony_1_memory
label irony_1_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex offers the duck its final intimidating entrance. Its squeak is so small that he apologises to it."
Vex [worried]: We rehearsed this, Mr. Quackers.
Lin [skeptical]: A flawless demonstration of overwhelming power.
Sora [curious]: That reply, with this context, is verbal irony.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto irony_1_memory
label irony_1_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Verbal irony can use praise to convey criticism when context reverses the literal meaning. A ridiculous situation alone is not enough. Ask what the speaker intends.
Hepting [curious]: Wonderful. The projector has frozen for the third time. My words praise it; my evident frustration does not.
Lin [skeptical]: Is your earlier THIS IS SERIOUS joke automatically verbal irony?
Hepting [determined]: No. If Vex means it sincerely, the comic mismatch is not verbal irony. Intention and context matter.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: How thoughtful—you forgot my name again.
I: Which explanation connects its wording to this audience and purpose?
choice explain_irony_1
option vague "It is irony only because any unhappy event automatically reverses the meaning of words." -> irony_1_support
option right "The ironic compliment criticises repeated neglect while allowing the singer to sound controlled rather than openly pleading." -> irony_1_explained ; Explained += 1
option overclaim "It sincerely thanks the other person; the frustrated context is irrelevant." -> irony_1_support
label irony_1_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto irony_outro
label irony_1_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_irony_1
option grounded "The ironic compliment criticises repeated neglect while allowing the singer to sound controlled rather than openly pleading." -> irony_1_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> irony_1_guided
label irony_1_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto irony_outro
label irony_1_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The ironic compliment criticises repeated neglect while allowing the singer to sound controlled rather than openly pleading.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto irony_outro
label irony_2
Vex [confused]: Should I keep the receipt?
Sora [determined]: Especially for the excuse.
I: My choice is saved for the debut lyric sheet. There is no taste score.
Sora [curious]: In this context of obvious frustration, which device makes the literal praise mean its opposite?
I: My line: What a generous gift: another excuse.
choice identify_irony_2
option other1 "Anaphora: the same opening repeated in successive clauses." -> irony_2_confused
option right "Verbal irony: generous gift praises an excuse the speaker does not welcome." -> irony_2_recognised ; Recognised += 1
option other0 "A literal compliment sincerely celebrating the situation." -> irony_2_confused
label irony_2_recognised
Sora [happy]: Yes. You located the pattern: generous gift praises an excuse the speaker does not welcome. Now explain why it belongs in this song.
goto irony_2_memory
label irony_2_confused
prop Vex rubber-duck
camera wide
act Vex reach "Vex offers the duck its final intimidating entrance. Its squeak is so small that he apologises to it."
Vex [worried]: We rehearsed this, Mr. Quackers.
Lin [skeptical]: A flawless demonstration of overwhelming power.
Sora [curious]: That reply, with this context, is verbal irony.
prop Vex none
I: I need to look at the wording again. A memory interrupts the studio's purple glare.
goto irony_2_memory
label irony_2_memory
scene memory
show Hepting curious left
show Lin curious right
camera two Hepting Lin cut
I: FLASHBACK — Mr. Hepting's classroom. White haze softens the edges of the memory.
Hepting [determined]: Verbal irony can use praise to convey criticism when context reverses the literal meaning. A ridiculous situation alone is not enough. Ask what the speaker intends.
Hepting [curious]: Wonderful. The projector has frozen for the third time. My words praise it; my evident frustration does not.
Lin [skeptical]: Is your earlier THIS IS SERIOUS joke automatically verbal irony?
Hepting [determined]: No. If Vex means it sincerely, the comic mismatch is not verbal irony. Intention and context matter.
scene studio
show Vex determined left
show Sora curious right
camera two Vex Sora
Sora [curious]: Back to our lyric: What a generous gift: another excuse.
I: Which explanation connects its wording to this audience and purpose?
choice explain_irony_2
option right "The reversal exposes an excuse as an inadequate substitute for care, inviting the listener to share the criticism." -> irony_2_explained ; Explained += 1
option overclaim "It sincerely thanks the other person; the frustrated context is irrelevant." -> irony_2_support
option vague "It is irony only because any unhappy event automatically reverses the meaning of words." -> irony_2_support
label irony_2_explained
Sora [happy]: That connects a feature of these words to a plausible response. It does not promise every listener will react identically.
goto irony_outro
label irony_2_support
prop Vex rubber-duck
act Vex reach "Vex attempts another stern prop demonstration. It ends with a harmless squeak beside his own ear."
Vex [frustrated]: How can a device be correct but my explanation be wrong?
Sora [determined]: A label is not an explanation. We need the actual wording, a plausible effect, and this audience.
I: I can correct my explanation now. No taste choice is lost.
choice recover_irony_2
option grounded "The reversal exposes an excuse as an inadequate substitute for care, inviting the listener to share the criticism." -> irony_2_recovered ; Recovered += 1
option insist "Naming the device alone guarantees the song will be a hit." -> irony_2_guided
label irony_2_recovered
Sora [relieved]: Exactly. The explanation is grounded in this line.
prop Vex none
goto irony_outro
label irony_2_guided
Sora [determined]: A device cannot guarantee a hit. Here is the link: The reversal exposes an excuse as an inadequate substitute for care, inviting the listener to share the criticism.
I: I rehearse that connection: wording, likely effect, audience. I can use it in the next scene.
prop Vex none
goto irony_outro
label irony_outro
scene studio
show Manager worried left
show Sora curious right
show Vex worried center
camera wide
Manager [shocked]: The stream is live.
Vex [shocked]: We have not rehearsed.
Manager [determined]: Then it will look spontaneous.
I: The door clicks open. Apparently the key was under the emergency choreography mat.
goto debut
label debut
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
