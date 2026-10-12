story 2
# The Last Chair — AP Language, 13 October 2026.
variable Trust = 1 range 0 3 hidden
variable ReaderEvidence = false hidden
variable KeepVoice = true hidden
variable PublicReply = false hidden
label opening
scene classroom
show Lin worried center
camera medium Lin
I: Lin puts two openings on my desk. Both have her name on them. Only one sounds like her.
Lin: You're my submission partner today. Please help me choose what actually goes to the magazine.
I: We're in AP Language at CDIS. Lin is my classmate; the magazine publishes student writing for students, teachers, and families.
I: Her piece argues that newcomers need invitations they can actually hear themselves accepting. The deadline is this afternoon.
camera close Lin
Lin [worried, hesitant]: My opening: “Come, eat, sit a while. At our table, we pull up another chair.”
Lin: The suggested edit: “Our community promotes inclusive social interaction.”
I: The second version sounds as if a committee has tried to hug me.
show Lin sad center
Lin: My grandmother always says the first one. When I was new here, I used to rehearse every sentence before lunch. Sometimes lunch ended first.
Lin: I want someone new to read this and come sit with us. I also want my first byline. Is that greedy?
I: The editor's note says, “Some families may not understand the home expressions. Could you use a consistent formal register?”
choice promise
option listen "I ask which words she most wants to protect." -> listen ; Trust += 1
option practical "I offer to help secure the byline first." -> practical
label listen
camera close Lin
Lin [sad, hesitant]: “Sit a while.” It means you aren't being tolerated until someone more interesting arrives. You can stay.
I: I circle those three words. Now I know what an edit could cost.
goto summon
label practical
show Lin neutral center
Lin [skeptical, question]: Okay. But if the finished thing could have been written by anyone, I don't know what my name is doing there.
I: I put her original beside the edited version. Getting published and being heard may not be the same problem.
goto summon
label summon
camera wide
show Hepting happy center
Hepting [happy, explain]: Young's essay gives us a useful way to test that objection. Luckily, my transport app has a “deadline emergency” button.
I: Mr. Hepting opens a secret WeChat mini-program. Its dumpling icon unfolds into a golden wheel.
effect magic
I: A silver Didi pushes through the classroom window. The glass stretches like a soap bubble, then snaps back without a crack.
I: The car settles between the board and the front row. Its headlights briefly illuminate tomorrow. Tomorrow appears to contain homework.
Hepting [determined, reassure]: Bring both drafts and the essay. Your job is still to help Lin submit something she can stand behind.
I: The driver lowers his sunglasses: “Chicago, autumn 2011. University writing workshop. Four questions before the ride home. Three correct pays the fare.”
scene rift
effect magic
I: We buckle in. The bonnet tilts toward the soccer field, where a blue seam has opened across the sky.
I: We shoot between the goalposts. Grass becomes green ribbons; the rift folds around us like a page turning inside out.
show Lin surprised center
move Lin recoil
Lin: I would like to withdraw my earlier complaints about the school bus.
I: For one impossible second, the window shows every autumn on the same tree. Then the tyres slap wet pavement.
label arrival
scene workshop
effect fade
show Lin neutral center
I: Chicago, 2011. A university writing workshop, one year after Young's essay appeared. Brick walls, paper drafts, and a printer large enough to have opinions.
I: Mr. Hepting takes the class to the next table. Lin and I have a workbench, the two drafts, and Young's essay to help us answer the editor.
I: A wall notice offers visiting writers one sample printing. Final files close in fifteen minutes. Our school submission can travel home in the Didi.
Lin: So: choose an opening, answer the objection, and get one clean proof. No pressure except literally all the pressure.
choice investigate
option readers "I inspect the workshop readers' sticky notes." -> readers ; ReaderEvidence = true
option source "I examine how Young answers his opponent." -> source
label readers
I: One note asks, “Does ‘sit a while’ mean I have to stay a long time?” Another says, “The first opening sounds like a person making room.”
Lin: One reader misses the meaning. One feels the welcome. “Everyone understands” would be a very convenient lie.
I: I slide the notes under the editor's objection. We have a specific confusion to solve, not a reason to delete everything unfamiliar.
goto essay
label source
I: In the essay, Young takes up Stanley Fish's argument that students need standard English to avoid prejudice. Young challenges where that explanation places the blame.
Lin: So if I answer “Readers are stupid,” I've dodged the actual concern. I need to answer the concern and keep my own claim moving.
I: I draw two arrows: what the objection worries about, then what our response proposes. A line of reasoning needs a route, not just a loud ending.
goto essay
label essay
I: Young argues that prejudice lies in people's attitudes toward language, rather than in a dialect itself. That raises a harder question than “Which opening sounds formal?”
Lin: What are we calling unclear—and what are we just unused to hearing?
I: His discussion of code-meshing offers a possibility: different varieties of language can work together in one text. We don't have to put “home” and “school” in separate boxes.
Lin: My school experience isn't the same as the racial history he's writing about. But I can test what a change does to my own piece.
I: We spread out the drafts. I need to help build an opening now; the printer's clock has no interest in our personal growth.
choice opening_style
option mesh "I keep her invitation and add a sentence of context." -> mesh ; KeepVoice = true
option formal "I use a formal opening and preserve her invitation later." -> formal ; KeepVoice = false
label mesh
show Lin happy center
react Lin nod
Lin: “Come, eat, sit a while. At our table, that means you don't have to earn your place before someone makes room.”
I: Her invitation now sits beside its explanation. The different registers work inside the same paragraph, rather than taking turns in separate settings.
Lin: It still has the rhythm of someone pulling out a chair. That's what I wanted the words to evoke.
goto test_opening
label formal
show Lin neutral center
Lin: “New students need more than an available seat; they need an invitation to belong.” Then I can bring in my grandmother's words as an example.
I: The opening states the argument immediately. The familiar voice arrives later, with more explanation around it.
Lin: It reaches the point quickly. But it doesn't reach out its hand quite as quickly. I can live with that tradeoff if we don't pretend it's free.
goto test_opening
label test_opening
I: I read the new paragraph aloud. In the middle, Lin's strongest claim is buried between two descriptions of the canteen.
choice emphasis
option finish "I move the claim to the end, where it can land." -> finish_claim
option begin "I put the claim first, so readers know our direction." -> begin_claim
label finish_claim
I: I place “A school belongs to its newcomers only when somebody makes room” at the end. Everything before it now builds toward that sentence.
Lin: Emphatic positioning. It feels like the chair finally scraping back from the table.
goto reply
label begin_claim
I: I begin with “A school belongs to its newcomers only when somebody makes room.” The invitation becomes the evidence readers meet next.
Lin: Emphatic positioning. They know what we're arguing before they decide what they think of the voice.
goto reply
label reply
show Lin worried center
Lin: The opening is better. But the editor asked a question. A prettier paragraph isn't automatically an answer.
I: The reply box waits. We can request a public note about language choices, or explain our edits privately and let the article speak for itself.
I: A public note could challenge the policy. It could also turn Lin's first article about belonging into an argument about Lin.
choice response
option public "I propose a public note: acknowledge confusion, then explain our solution." -> public_note ; PublicReply = true
option private "I answer the editor privately and keep the article's focus." -> private_note ; PublicReply = false
label public_note
Lin: I want the note, but I don't want to announce that every reader is prejudiced. Let me say exactly what we changed.
I: We write: “Some phrases may be unfamiliar. We have added context so readers can follow them; unfamiliarity alone shouldn't decide which voices belong.”
Lin: That's a concession, not a surrender. We admit the reader's difficulty without abandoning the invitation.
goto proof
label private_note
Lin: Yes. The story is about making room, and I want people to reach that story before reaching a debate about me.
I: We write privately: “We agree that readers need a way in. The revision explains the invitation while preserving the language doing its welcoming work.”
Lin: A concession can advance the claim. “We hear your concern” doesn't have to mean “Please erase us.”
goto proof
label proof
I: We connect the examples to the claim and remove a sentence that belongs to a different argument. The line of reasoning is finally coherent.
Lin: I thought sophistication meant sounding like the person least likely to be corrected. This is harder: keeping the complication without losing the reader.
if ReaderEvidence == true -> evidence_reply else limited_reply
label evidence_reply
I: I attach the sticky note about “sit a while” and show how our new context answers it. We can name one actual confusion we've addressed.
Lin: That's stronger than saying our new version is obviously clear. We still haven't tested every reader.
goto breakdown
label limited_reply
I: We haven't gathered reader feedback. I change “The revision solves the problem” to “The revision offers context; we welcome feedback on what remains unclear.”
Lin: I hate that it sounds less certain. I also hate being caught pretending. This is the better kind of uncomfortable.
goto breakdown
label breakdown
I: The proof begins printing. Lin stands so close that I worry she intends to encourage it by breathing on it.
chance production 50 -> jam else cut
label jam
effect shake
show Lin surprised center
move Lin recoil
I: The printer makes a noise like a stapler swallowing a spoon. Our page jams halfway out. There isn't time for another print run.
Lin: We have the digital file, but the workshop display needs a paper copy. The damaged proof has a whole paragraph folded into its teeth.
I: We can rescue the proof and hand-correct it, or submit the digital file and give up today's display. Neither option changes our argument.
choice salvage
option patch "I repair the proof with Lin; we accept the visible corrections." -> patched ; Trust += 1
option digital "I submit the clean digital file; we let the display go." -> digital ; Trust += 1
label patched
I: I hold the torn edge while Lin tapes the sheet. She writes the missing lines in the margin. Our beautiful proof now resembles a small archaeological site.
Lin: At least the repairs are honest. Please don't call them “rustic typography.”
goto final_control
label digital
I: I save the clean file twice and send it. The workshop board gets an empty space where Lin's page would have been.
show Lin sad center
Lin: I really wanted to see it on that wall. I know the file matters more. I'm allowed to be disappointed anyway.
goto final_control
label cut
effect shake
show Lin surprised center
I: A workshop notice changes: the display must close early because another event needs the room. Our proof is clean; our audience is disappearing.
Lin: We can pin it up for the few people still here, or spend the remaining minutes preparing the digital submission. We can't bring everyone back.
choice salvage_early
option display "I put up the proof with Lin, even for a smaller audience." -> displayed ; Trust += 1
option file "I help finish the digital submission and let the display go." -> filed ; Trust += 1
label displayed
I: We pin up the page. Three visitors pause; a fourth walks past. I resist giving the fourth person an unsolicited education about open-mindedness.
Lin: Three readers are real readers. Still. I pictured more.
goto final_control
label filed
I: We save the clean file, check the title, and attach our reply. The workshop board empties while we work.
Lin: I wanted the little moment on the wall. Thank you for not telling me it doesn't matter just because it didn't happen.
goto final_control
label final_control
show Lin worried center
I: The submission is ready. Lin's hand hovers over Send. She asks me to make the final click: “If you choose it, at least I won't have chosen wrong.”
if Trust >= 2 -> trusted else cautious
label trusted
Lin: You've listened. I trust you. That's partly why I'm trying to hand you the terrifying part.
goto consent
label cautious
Lin: I know we said getting published mattered. It does. But I need a moment to know that these are still words I want beside my name.
goto consent
label consent
choice ownership
option stand "I stay beside her while she chooses when to press Send." -> beside
option checklist "I read back our tradeoffs, then return the final choice to her." -> checklist
label beside
I: I move my hand away from the mouse, but keep my chair beside hers. There is a long, unheroic silence.
Lin: Okay. Stay there.
I: She presses Send herself. No trumpet sounds. The printer, perhaps sensing a lack of ceremony, beeps.
goto result
label checklist
I: I name what we preserved, what we changed, and what we couldn't guarantee. Then I turn the screen toward her.
Lin: Right. An informed risk is still a risk. But it's mine.
I: She reads the opening once more and presses Send. I discover I have been holding my breath over a piece of punctuation.
goto result
label result
if PublicReply == true -> public_result else private_result
label public_result
I: The reply arrives: the editor will consider the article, but the public policy note needs a separate review. Today's submission isn't a promise of publication.
show Lin neutral center
Lin: I wanted to say it publicly. I'm glad I asked. I'm not going to pretend “separate review” feels like a victory parade.
goto voice_result
label private_result
I: The reply arrives: the editor accepts the file for consideration and will check the revised context. There is still no promise of publication.
show Lin neutral center
Lin: The article gets considered without the public note. That's the risk I chose. It doesn't tell us what the editor will decide.
goto voice_result
label voice_result
if KeepVoice == true -> voice_kept else voice_moved
label voice_kept
Lin: At least my first sentence still pulls up a chair. And now a reader can see what that chair means.
goto departure
label voice_moved
Lin: The claim comes first and my grandmother's invitation comes later. Different emphasis, still a choice I can explain.
goto departure
label departure
I: Lin folds the proof and puts it beside the saved file. We have submitted a real argument, answered an objection, and left a decision with the person whose name is on it.
scene rift
effect magic
I: The Didi waits outside. Through its windows I can see the CDIS soccer field, impossibly bright on the other side of the rain.
show Lin happy center
react Lin nod
Lin: I used to think a good edit made it impossible for anyone to object. Apparently an editor is not a wizard. Present company excepted.
I: The driver adjusts his sunglasses and holds up four fingers. “Understanding first. Home second.” The portal hums behind him.
I: I buckle in with Lin's draft safely between us. I can't promise her a byline. I can explain the choices that brought her words this far.
end
