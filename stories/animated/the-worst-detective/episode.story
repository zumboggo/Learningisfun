story 2
variable Accused = false hidden
variable Solved = false hidden
variable Routine = 0 range 0 2 hidden
label hamster_opening_v1
scene library
show Kevin curious left
rest Kevin crouched
I: A tiny trail of yellow paper. A dark gap. Kevin lowers his book and listens.
label opening
scene classroom
show Kevin proud left
show Hepting curious right
camera two Kevin Hepting cut
Kevin [proud]: Today I become the sort of person who casually finishes English novels.
Hepting [curious]: Have you found one you like?
Kevin [neutral]: I have found one that looks excellent under my arm.
I: It has eight hundred pages. So far, the most interesting thing that has happened is that I dropped it on my foot.
I: In our classroom book, I write: How do I find an English book I actually want to finish?
label taxi_arrival
I: The wall opens. A taxi rolls through the light. Our driver adjusts his sunglasses as if this is a perfectly normal library service.
label taxi_departure
I: We fly over the soccer field and into another bright doorway. I keep one hand on my enormous novel. It may be useful as a landing weight.
label club
scene library
show Kevin happy left
show Mei worried right
camera two Kevin Mei cut
I: We land at a small library book club. Mei is on her knees beside an empty hamster carrier. This is not the quiet, impressive entrance I planned.
Mei [worried]: Crumb is missing. I opened his carrier to check his water. Then someone called my name.
I: I close the room's door and put a rolled towel along the gap. The windows are shut. At least he cannot wander farther while we look.
Kevin [determined]: Nobody panic. I read detective novels.
Mei [skeptical]: You carry a detective novel.
I: A small but legally important difference.
show Lin curious center
camera wide
Lin [curious]: We checked the chairs and the empty boxes. Let's check the rest slowly. Don't move the heavy furniture.
Mei [worried]: He likes dark little spaces. And he takes paper to make a bed.
I: Lin sets down a thin book with a picture of a detective pigeon. I place my enormous novel beside it. Mine makes a much better noise.
move Mei exit
move Lin right
camera two Kevin Lin cut
choice choose_book
option grand "Try a page of the impressive detective novel." -> grand
option honest "Tell Lin I keep losing the story." -> honest
option sample "Ask why there is a pigeon wearing a tie." -> sample
label grand
Kevin [proud]: The perpetrator's ostensible alibi was rendered... something.
I: I understand that somebody has done something. Possibly to a dictionary.
Lin [happy]: In mine, somebody has stolen a sandwich. Want to try a page while I check behind these boxes?
Kevin [neutral]: For comparison. Scientifically.
goto first_page
label honest
Kevin [embarrassed]: I can understand little pieces. By the next sentence, I've forgotten who did what.
Lin [neutral]: That sounds exhausting. Try this one. You can tell me if the pigeon is annoying.
Kevin [curious]: Is he?
Lin [happy]: Deeply. That's why I like him.
goto first_page
label sample
Kevin [curious]: Why is the pigeon wearing a tie?
Lin [happy]: He thinks it makes witnesses respect him. They mostly ask whether he wants crumbs.
Kevin [skeptical]: An understandable professional difficulty.
Lin [happy]: Read this bit. I'll check behind the boxes.
goto first_page
label first_page
I: The page has short sentences and one picture. I know most of the words. For the first time today, I can see what is happening inside a book.
I: “Pip finds a red feather beside the empty plate. He arrests the red chicken. The chicken says, 'I made the sandwich. Why would I steal my own lunch?'”
Kevin [laughing]: Fair question, chicken.
I: Lin glances back. I stop smiling, professionally.
I: “The mouse waits beneath the bench. Pip looks at the empty seat. Nobody is there.” The picture shows two tiny feet under it.
Kevin [confused]: Beneath. I don't know that one.
choice stuck_word
option context "Use the picture and read the next sentence." -> context
option ask "Ask Lin what beneath means." -> ask
option lookup "Check that one word, then return to the story." -> lookup
label context
I: The next line says, “Pip bends down. Now he can see the mouse under the bench.” Beneath must mean under.
Kevin [happy]: Pip has arrested a chicken but has not tried bending his knees.
Lin [happy]: His tie is doing most of the work.
goto room_clues
label ask
Kevin [curious]: Does beneath mean behind?
Lin [neutral]: Under. See the feet? The mouse is under the bench.
Kevin [happy]: Then Pip is searching at the wrong height.
Lin [happy]: Keep going. He gets worse.
goto room_clues
label lookup
I: I check beneath: under. Then I go straight back to the mouse. I want to know whether it ate the sandwich.
Lin [curious]: Found it?
Kevin [happy]: Yes. One word. I refuse to investigate the whole dictionary.
goto room_clues
label room_clues
scene library
show Kevin curious left
show Mei worried right
camera two Kevin Mei cut
I: Mei has found a red gardening hat beside the door. Outside the glass, muddy boot marks cross the garden path. There are no muddy marks inside.
Mei [neutral]: The gardener left his hat here earlier. He went outside before I opened Crumb's carrier. The door stayed shut until you came.
I: In the pigeon book, there was a red feather. Now there is a red hat. My detective brain makes a very exciting noise.
choice suspect
option timing "Ask Mei to explain the timing again." -> timing
option theory "Suggest that the gardener took Crumb." -> theory ; Accused = true
option floor "Look for signs of Crumb near his carrier." -> floor
label timing
Kevin [curious]: The gardener had already left when Crumb got out?
Mei [neutral]: Yes. Crumb was still inside the carrier when the door closed.
Kevin [neutral]: Then the hat isn't enough. I was hoping it would be. It's a very suspicious hat.
goto relationship
label theory
Kevin [proud]: The gardener! The red hat! It fits!
Mei [angry]: Fits what? He left before Crumb got out. You aren't listening.
I: My exciting detective noise stops.
goto relationship
label floor
rest Kevin crouched
I: Beside the carrier, a yellow paper bookmark has tiny triangular pieces missing from its edge.
Kevin [curious]: Does Crumb eat books?
Mei [worried]: He tears paper for bedding. Please don't make this another joke.
rest Kevin relaxed
goto relationship
label relationship
camera two Kevin Mei cut
Mei [sad]: He is my pet, Kevin. I want him back, not a clever story about him.
express Kevin embarrassed
look Kevin down
camera listener Kevin over 0.65
I: I close the enormous book.
if Accused == true -> repair else promise
label repair
Kevin [embarrassed]: You're right. I blamed someone because it sounded interesting. I'm sorry. Tell me what we actually know.
Mei [neutral]: Thank you. Start here, by the carrier.
goto evidence
label promise
Kevin [neutral]: I know. I'm listening. Let's find him.
Mei [neutral]: Okay. Start here, by the carrier.
goto evidence
label evidence
look Kevin auto
camera two Kevin Mei cut
I: We look together. A yellow paper bookmark beside the carrier has fresh triangular bite gaps. Three little yellow scraps lie farther across the floor.
Mei [curious]: Those were not there when I put the carrier down.
I: I kneel without touching them. The pieces lead away from the door, toward a low teal cupboard.
rest Kevin crouched
Kevin [curious]: So the gardener's muddy path goes outside. Crumb's paper path goes this way.
Mei [determined]: Good. I'll check the cupboard doors. You check down low.
rest Kevin relaxed
move Mei exit
show Lin happy right
camera two Kevin Lin cut
Lin [happy]: No hamster behind the boxes. Also, you've still got my book.
I: My finger is holding the page. Pip has just discovered the sandwich beneath a flowerpot. The mouse is standing beside it with a tiny umbrella.
Kevin [curious]: Wait. Why does the mouse have an umbrella indoors?
Lin [happy]: Exactly.
choice missing_page
option next "Read the next short page to find out." -> next_page
option picture "Study the picture before turning the page." -> picture
option explain "Tell Lin my theory about the umbrella." -> explain
label next_page
I: I turn the page. “Water drips from a leaking pipe. The mouse has moved the sandwich to a dry place. Pip writes: CASE CLOSED. The chicken writes: GIVE IT BACK.”
Kevin [laughing]: He didn't steal it. He rescued lunch.
Lin [happy]: The chicken remains unconvinced.
goto trail
label picture
I: In the picture, water drops fall behind the mouse. The sandwich is dry beneath the flowerpot. I turn the page to check.
Kevin [curious]: He was keeping lunch dry?
Lin [happy]: Yes. Pip congratulates himself. The chicken wants her lunch.
goto trail
label explain
Kevin [curious]: Maybe the umbrella means water is coming from somewhere. Did the mouse move the sandwich so it wouldn't get wet?
Lin [happy]: Turn the page.
I: I do. I'm right. I understand the joke before Lin explains it, which is a very satisfying kind of right.
goto trail
label trail
Kevin [happy]: Does Pip ever become a good detective?
Lin [happy]: I'm on book four. There is no evidence yet.
I: She slips book two into my hand. I almost ask for three as well. Then something scratches very softly near the floor.
rest Kevin crouched
I: I crouch beside the low teal cupboard. The yellow paper scraps lead to the dark gap beneath it. I stop turning pages and listen.
Lin [curious]: Do you hear that?
I: A faint rustle. Beside the gap are two fresh sunflower-seed shells. Mei spilled a few of Crumb's seeds when she opened his carrier.
move Lin exit
show Mei curious right
camera two Kevin Mei cut
Mei [curious]: The cupboard doors are shut. The shelves inside are empty. What about below it?
I: I set down the book. Here is everything we know: no mud inside; yellow scraps leading away from the carrier; seed shells and a rustle at the cupboard's floor-level gap.
I: Before we look, where does the evidence point?
choice solve_case
option cupboard "Crumb is beneath the low cupboard." -> cupboard ; Solved = true
option garden "Crumb went into the garden with the gardener." -> garden
option shelf "Crumb climbed onto the high bookshelf." -> shelf
label cupboard
Kevin [determined]: Beneath the cupboard. Dark, low, paper, seeds. We should look underneath without moving it.
Mei [relieved]: That fits all the clues. Let me get down beside you.
goto rescue
label garden
Kevin [curious]: Could he have followed the gardener?
Mei [neutral]: The gardener left before Crumb got out, remember? And the scraps lead away from the door.
Kevin [neutral]: Right. My theory doesn't fit the timing. Let's check beneath the cupboard.
goto rescue
label shelf
Kevin [curious]: Maybe he's climbed onto the high shelf?
Mei [neutral]: But we heard the rustle down here. And the scraps and shells stop at this gap.
Kevin [neutral]: I'm looking at the wrong height. Like Pip. Let's check beneath the cupboard.
goto rescue
label rescue
rest Kevin crouched
rest Mei crouched
camera two Kevin Mei cut
I: We lower our heads and shine Mei's small torch into the gap. Two bright eyes look back. Crumb sits on a tiny yellow paper bed.
Mei [relieved]: There you are.
camera listener Mei over 0.65
I: Her shoulders drop. She stays still for a moment, watching him breathe.
I: We leave the cupboard where it is. Mei sets his open carrier beside the gap with his familiar food inside. We wait quietly.
camera two Kevin Mei cut
I: Crumb comes out, sniffs, and walks into the carrier. Mei closes it and checks the catch twice.
rest Kevin relaxed
rest Mei relaxed
if Solved == true -> solved_reply else revised_reply
label solved_reply
Mei [happy]: You found him.
Kevin [happy]: We did. And the cupboard has been cleared of all charges.
goto explanation
label revised_reply
Mei [happy]: Good thing we checked the clues again.
Kevin [happy]: A revised theory. Very professional. Please leave out the first one in my biography.
goto explanation
label explanation
I: The yellow scraps came from his bedding. The shells came from his snack. The rustling came from one extremely comfortable hamster.
Kevin [proud]: Case closed.
Mei [happy]: Carrier closed. That's the important part.
show Lin happy center
camera wide
Lin [curious]: And my book?
Kevin [embarrassed]: A complicated question. How many volumes are there?
Lin [happy]: Six. In the next one, the gardener owns seven identical hats.
Kevin [shocked]: Seven? Why seven?
Lin [happy]: You could find out.
I: I look at my eight-hundred-page novel. Then at the pigeon. I take the pigeon.
Kevin [happy]: I can follow this one. And I need to know about those hats.
choice next_book
option dinner "Read ten minutes after dinner and see if I want more." -> dinner ; Routine = 0
option bus "Keep book two in my bag for the bus ride." -> bus ; Routine = 1
option choice "Try book two, but choose another series if it stops being fun." -> change ; Routine = 2
label dinner
Lin [happy]: Fine. But return it when you're finished.
Kevin [neutral]: Ten minutes at a time. I cannot promise how many ten minutes.
goto return
label bus
Lin [happy]: Much easier to carry than your other book.
Kevin [happy]: My foot has already approved this decision.
goto return
label change
Lin [neutral]: Fair. I stopped reading a different series last week. I didn't care what happened next.
Kevin [happy]: I care extremely much about these hats. But I reserve the right to dislike hat eight.
goto return
label return
I: Mei waves with the securely closed carrier. Our driver takes me back to school. The mystery is solved; the hat problem is just beginning.
scene classroom
show Kevin happy left
show Hepting curious right
camera two Kevin Hepting cut
Hepting [curious]: Found a book you like?
Kevin [happy]: A professional pigeon. Six volumes. Serious literature.
I: Over the next few weeks, I keep reading little bits. Not every day is easy. Once I check a word because the ending makes no sense without it. Then I go back to the story.
if Routine == 0 -> dinner_echo else other_echo
label dinner_echo
I: After dinner, ten minutes sometimes becomes fifteen. Sometimes it stays ten. Either way, Pip makes another terrible decision.
goto progress
label other_echo
if Routine == 1 -> bus_echo else change_echo
label bus_echo
I: On the bus I finish a few pages at a time. One morning I reach my stop just as Pip arrests a scarecrow. I resent the stop.
goto progress
label change_echo
I: I try another series too. One loses me on page two, so I swap it. The next has a missing cake. I have several urgent questions.
goto progress
label progress
I: Familiar phrases keep turning up. Beneath the table. Beneath the stairs. I spend less time untangling those sentences and more time wondering what happens next.
Kevin [proud]: I have identified the secret to learning English.
Hepting [curious]: Books you understand and want to keep reading?
Kevin [proud]: A hamster nearby. Clearly.
I: I show him a drawing of Crumb beside my book. Under it I have written: ACADEMIC SUPERVISOR.
Hepting [happy]: Does your supervisor give homework?
Kevin [happy]: Mostly sunflower seeds. Very reasonable workload.
I: I open book two again. Seven identical hats. I still need an explanation.
I: Our driver taps his fare card: four questions, then one paragraph for the English Corner teacher. Crumb is not available to answer on my behalf.
end
