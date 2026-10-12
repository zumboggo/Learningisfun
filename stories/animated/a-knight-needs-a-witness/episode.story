story 1
variable question = 0 range 0 2 hidden
variable promise = 0 range 0 2 hidden
variable evidence = false hidden
variable honest = false hidden
label opening
scene classroom
show Hepting happy center
Hepting: I bought this journal in an airport in Peru. I asked it why boarding groups exist. Three days later, I still had no satisfactory answer.
I: He puts the book on my desk. A little door is drawn on its leather cover; the handle casts a shadow it has no business casting.
Hepting: One question on a new line. Then jump through. Ask people anything you like, but the journal gets just one question per visit.
Hepting: Its return door checks what you understand. You do not have to persuade everyone you meet.
scene journal
I: I want to bring back an answer worth sharing, preferably without spending three days in an airport. I choose my one question.
choice entry-question
option names "How much can a name change a person?" -> enter ; question = 0
option hero "What makes a hero before the first adventure?" -> enter ; question = 1
option books "Can a story change what we see?" -> enter ; question = 2
label enter
I: I write my question once. Ink runs into the drawing, and the little door swings inward onto a road of fluttering pages.
effect magic
I: I jump. The book sucks me through, turns me sideways, and deposits me safely in a basket of clean washing.
scene courtyard
show Quixote neutral center
I: I am in a village courtyard in La Mancha, Spain, in the early modern world of Don Quixote. A gentleman in old armor extracts a sock from my shoulder.
Quixote: A messenger from distant lands! Or the laundry. Both are welcome.
I: He is preparing to become a knight-errant: a wandering knight who seeks adventures and rights wrongs. His horse investigates a patch of grass with less complicated ambitions.
Quixote: I call myself Don Quixote of La Mancha. I need a chronicler. Someone must write the beginning before the victories make it difficult to catch up.
I: A chronicler records events. My journal opens to a blank introduction; its return door has become an outline with no handle.
Quixote: Give me one introduction I can hear aloud. Tell them why I am worth remembering.
I: I have a task: write his introduction before returning. I have never met someone who needs a first sentence quite this badly.
I: He holds out a quill, then draws it back to straighten the feather. His hand lingers over it.
choice first-conversation
option purpose "I ask why being remembered matters to him." -> purpose
option preparation "I ask what he has done to prepare." -> preparation
label purpose
Quixote: There are wrongs waiting to be put right. What use is a life spent arranging tomorrow until there are no tomorrows left?
I: I came looking for an amusing story. Suddenly I am holding someone's fear of wasting his life.
Quixote: Also, the introduction should mention my horse. He has waited patiently for his importance to be recognized.
goto commission
label preparation
Quixote: Armor restored. Horse named. My own name perfected. A lady chosen. I have attended to the essentials.
I: Each item comes with a little lift of his shoulders. He has worked hard at becoming the sort of person his books taught him to admire.
I: The horse eats a weed. I decide to leave that out of my first question about preparation.
goto commission
label commission
Quixote: Will your account be grand?
I: I remember a time someone laughed before I finished explaining an idea. I want to give him room to speak; I also want my account to be true.
I: The quill waits between us. My promise will shape the sentence he expects from me.
choice chronicler-promise
option hope "I promise to begin with his purpose, while checking his claims." -> promise-hope ; promise = 0
option details "I promise to put ordinary details beside heroic claims." -> promise-details ; promise = 1
option praise "I promise a splendid introduction with no awkward details." -> promise-praise ; promise = 2
label promise-hope
Quixote: Begin with the purpose. Yes. The armor can follow after a suitable pause.
I: He gives me the quill carefully. I have promised kindness, but I still owe him accuracy.
goto books
label promise-details
Quixote: Ordinary details? Even great chronicles must have somewhere to put the furniture, I suppose.
I: He gives me the quill with a watchful look. I have permission to be specific, though he may dislike the specifics.
goto books
label promise-praise
Quixote: At last, a chronicler who understands the scale of the undertaking!
I: His relief feels like a reward. Then I look at the empty page and realize how much I have agreed not to see.
goto books
label books
I: Through an open door I see shelves crowded with books of chivalry: romances about knights and extraordinary adventures. Outside, fields stretch away from the village.
Quixote: A man needs examples. How else can he know what greatness looks like?
I: On my page, a passage appears: Source excerpt — Cervantes, Don Quixote I.1, translated by John Ormsby: “he sold many an acre of tillageland to buy books of chivalry to read”.
I: Land has become books. That is an action the narrator reports; what it tells me about the man's priorities is an inference I must defend.
Quixote: You are staring at the shelves as if they have eaten something.
I: I look again at the fields. Characterization can happen through a purchase, not just through a narrator calling someone brave or foolish.
I: My quill starts a sentence about devotion. There is room for the cost beside it, if I make room.
choice record-cost
option both "I record the books and the land sold to buy them." -> record-both ; evidence = true
option dream "I record only his love of heroic stories." -> record-dream
label record-both
I: I write: His devotion to stories is strong enough to change what he owns. I leave space to ask whether that devotion helps him judge the world.
Quixote: The land was not going to read itself.
I: He smiles, then glances toward the fields. The joke does not make the sale disappear.
goto helmet
label record-dream
I: I write that he loves heroic stories. It is true, and it sounds generous.
I: But someone reading only my sentence would never know what the books cost. A true detail can still give an incomplete picture.
Quixote: A fine beginning. You have captured the spirit of it.
I: I keep the source passage in the margin. His approval is comfortable; the missing land is less so.
goto helmet
label helmet
move Quixote nod
Quixote: Now, the helmet. You may admire the workmanship.
I: He raises an old open helmet fitted with a homemade visor. Pasteboard is layered paper or cardboard; it does not become steel because someone needs it to.
I: The page shows the sequence: his first sword test destroyed a week's work. He repaired the helmet with iron bars, then decided not to test it again.
I: Source excerpt — Cervantes, Don Quixote I.1, Ormsby: “not caring to try any more experiments with it, he passed it and adopted it as a helmet of the most perfect construction.”
I: “Most perfect” is a magnificent phrase. The avoided test stands beside it like a small person coughing during a royal speech.
Quixote: You may put that in your introduction. Perfect construction has a reassuring sound.
I: Diction is word choice. Here those confident words ask me to accept more than the testing history establishes.
I: I set my draft on the table. A breeze lifts the corner; I reach for a book to hold it down.
chance loose-page 50 -> page-turns else page-stays
label page-turns
I: Too late. The wind flips the sheet over, exposing my rough note: GRAND WORDS; QUESTIONABLE HELMET.
move Quixote recoil
Quixote: Is that what you intend to remember?
I: The wind has made a private doubt public. Even a careful account can arrive in the wrong way.
goto explain
label page-stays
I: The book catches the page. My rough note about the helmet stays hidden; he sees only the fine heading.
Quixote: Excellent lettering. It already looks like history.
I: A lucky gust has spared me an awkward moment. It has not made the helmet reliable.
goto explain
label explain
I: The sentence is still mine to choose. I can explain the joke without reducing him to it, or let his favorite word do the work.
choice helmet-response
option explain "I explain why the grand phrase and the avoided test belong together." -> helmet-honest ; honest = true
option reassure "I say that perfect is an excellent word and move on." -> helmet-flatter
label helmet-honest
I: I tell him that the phrase sounds like a heroic romance, but the homemade repair and avoided retest make its certainty doubtful.
Quixote: You think the contrast makes me ridiculous.
I: I say the contrast makes the preparation comic. It also shows how much he wants to believe he is ready; I cannot certify the helmet from that wish.
I: Parody imitates a genre's habits while exposing their limits. The joke needs the heroic claim and the stubborn ordinary detail together.
Quixote: I would prefer a smaller ordinary detail.
I: He sets the helmet down gently. I have kept the evidence, but lost the easy warmth of his first welcome.
goto names
label helmet-flatter
I: I praise the sound of the word. He straightens, delighted.
Quixote: I thought so. A helmet of adequate construction would hardly deserve a chronicler.
I: The joke is right there: heroic certainty rests on an avoided retest. By flattering the phrase, I have helped it cover the problem.
I: Parody exposes the gap between a genre's grand habits and ordinary reality. My introduction is beginning to hide the gap it should help a reader notice.
goto names
label names
Quixote: You must hear the names. Rocinante took four days. Don Quixote took eight. Greatness is not a hurried business.
I: He introduces the horse with ceremony. Rocinante continues eating, unmoved by twelve days of human administration.
I: Source excerpt — Cervantes, Don Quixote I.1, Ormsby: “a distinguished and full-sounding one, befitting the new order and calling he was about to follow.”
I: The wording describes the name he seeks for his horse. The name announces a new identity; it does not establish new abilities.
Quixote: And my lady is Dulcinea del Toboso. A knight must have someone to whom his victories may be dedicated.
I: The chapter identifies her as Aldonza Lorenzo, a farm-girl, and says that, as far as is known, she never knew of his love. His beautiful name does not give me her agreement.
I: I nearly write that everyone is ready for the adventure. Then I cross out “everyone.” His account cannot speak for her.
I: I have enough for a grand introduction now. I also have enough to know what a grand introduction might conceal.
if evidence == true -> kept-cost else missing-cost
label kept-cost
I: My earlier note still contains the land beside the books. It gives me a concrete way to show both devotion and its cost.
goto remember-promise
label missing-cost
I: My earlier note left the land out. The source in the margin lets me restore it; I do not have to protect my first draft.
goto remember-promise
label remember-promise
if promise == 2 -> break-promise else keep-promise
label break-promise
I: I promised to leave out awkward details. An honest introduction now means admitting that I made the wrong promise.
Quixote: You have become very quiet for a chronicler.
goto final-choice
label keep-promise
I: I promised an account with room for evidence. Keeping that promise may cost me the delighted reaction I wanted.
Quixote: Read it. A beginning cannot spend its whole life in preparation.
goto final-choice
label final-choice
choice introduction
option tender "I read a hopeful introduction that includes the land, helmet, and limits of naming." -> tender
option sharp "I lead with the comic gap, then acknowledge his wish to do something useful." -> sharp
option flatter "I declare him a perfect knight and leave out the contradictions." -> flatter
label tender
I: I read: Here is a man who wants his life to serve a heroic purpose. He gives land for stories and days to names, while his repaired helmet remains untested.
I: His new names announce the life he wants; they cannot prove his readiness or another person's consent.
if promise == 2 -> apology else tender-reaction
label apology
I: I tell him I should never have promised praise without awkward details. He folds his arms; the apology does not oblige him to forgive me.
goto tender-reaction
label tender-reaction
Quixote: You have made my beginning smaller than I imagined.
I: I tell him I have tried to make it large enough to contain the man, not only the title. He studies the page without taking it.
goto farewell
label sharp
I: I read: A self-appointed knight equips an enormous ambition with a homemade helmet and impressive names. The details expose the gap between heroic language and tested ability.
I: I add that his wish to put wrongs right deserves attention, even when his preparations invite laughter.
Quixote: That last sentence might have come first.
I: He turns away. My account has evidence, but its order has made it harder for him to hear the care in it.
goto farewell
label flatter
I: I proclaim him a perfect knight, ready for every adventure. He beams and asks me to read it again.
I: My journal places the source passages beside my sentence. The sold land, refused retest, and imagined names have all vanished from my account.
I: I have won his approval by making my introduction less trustworthy. I draw a line beneath it: this is praise I cannot support.
goto farewell
label farewell
if honest == true -> farewell-truth else farewell-doubt
label farewell-truth
I: The helmet rests where our difficult conversation left it. I do not run another test, change his plans, or invent a victory for him.
goto question-return
label farewell-doubt
I: The helmet still rests on the table. Avoiding a difficult conversation has changed my visit, not the strength of his equipment.
goto question-return
label question-return
Quixote: Whatever else you write, remember that I meant to begin.
I: I can remember that. I can also remember what the beginning leaves uncertain.
scene journal
effect fade
if question == 0 -> answer-names else other-question
label other-question
if question == 1 -> answer-hero else answer-books
label answer-names
I: My original question returns: How much can a name change a person? Here, it organizes a hope and a performance; it cannot supply proof that the hope has been fulfilled.
goto threshold
label answer-hero
I: My original question returns: What makes a hero before the first adventure? This opening gives me aspiration and preparation to examine, not achievements to assume.
goto threshold
label answer-books
I: My original question returns: Can a story change what we see? His romances give ordinary objects heroic identities; the narrator's details let me see the gap.
goto threshold
label threshold
I: A handle appears on the drawn door. Through it I glimpse my classroom, where a chair has never looked so welcoming.
I: I carry back a better way to read: place the action beside the claim, then explain the difference. I leave his future adventures on the other side of the page.
I: Four questions glow on the threshold. I must answer three correctly to return; if I miss them, I can review and try again.
end
