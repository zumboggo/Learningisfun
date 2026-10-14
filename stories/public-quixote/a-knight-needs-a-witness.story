story 2
variable question = 0 range 0 2 hidden
variable trust = 0 range 0 2 hidden
variable honest = false hidden
label opening
scene journal
I: In the airport gift shop, between the marmalade and a travel pillow, a book waits half hidden in shadow. I feel it calling to me.
I: It is a little overpriced. But the tiny door drawn on its cover knocks from the inside, which the travel pillow certainly cannot do.
I: I buy it. Inside is one instruction: Write one question. Open the door. Pay attention to the answer.
choice entry-question
option names "Can a new name make someone a hero?" -> enter ; question = 0
option hero "What does a good sidekick owe a would-be hero?" -> enter ; question = 1
option books "Can a story stop us seeing what is right in front of us?" -> enter ; question = 2
label enter
I: I write my question. The little door opens; I jump, and the pages suck me through.
scene passage
effect magic
I: A chapter heading brushes my nose. The floor folds away. I land safely, bottom-first, in a basket of laundry.
scene courtyard
show Quixote determined left
show Barber skeptical right
camera wide
I: La Mancha, Spain, around the start of the seventeenth century. Two men are arguing across a courtyard. Neither notices the person wearing a sock on one ear.
act Quixote challenge Barber "The grey-bearded gentleman steps forward to defend his favourite knight. The barber answers with an unimpressed shrug."
Quixote [determined]: Amadis of Gaul! A model of courage, devotion, everything a knight should be!
Barber [laughing]: And tears. So many tears. Give me the Knight of Phoebus—or Amadis's brother Galaor. At least he gets on with things.
I: Nicolás, the village barber, spots me climbing out of the basket. He stops laughing.
Barber [shocked]: Did the laundry just produce a reader?
Quixote [excited]: Excellent. An independent opinion!
choice first-conversation
option purpose "I ask what makes Amadis worth defending so fiercely." -> purpose ; trust += 1
option preparation "I ask whether they ever disagree about something outside a book." -> books
label purpose
camera medium Quixote
Quixote [proud]: He gives his life to great deeds. Some men merely discuss what ought to be done.
Barber [skeptical]: Some men have customers waiting to be shaved.
I: I hand back the sock. I suspect I have arrived during the dangerous gap between a discussion and a plan.
goto cost
label books
camera medium Barber
Barber [laughing]: Certainly. How much land one ought to sell to buy more books, for instance.
Quixote [angry]: A field supplies one crop. A book supplies a thousand adventures.
I: The barber's smile fades. This disagreement has already cost something.
goto cost
label cost
camera wide
act Barber give Quixote "The barber passes back the book they have been arguing over. The gentleman reaches for it immediately."
Barber [worried]: He really has sold farmland for these books. And he reads through the night. Ask him when he last slept properly.
Quixote [determined]: Ask me what I intend to do when I rise.
Barber [disappointed]: I had better return to my shop.
move Barber exit
I: The barber leaves. My host closes the book. His friends debate which knight is best; he has decided to become one.
Quixote [excited]: I shall ride out, right wrongs, face dangers—and win a name that people remember!
I: He pulls his great-grandfather's rusty armour out of a forgotten corner. He needs a helper while he prepares; I need to understand this man before my book takes me home.
choice sidekick-promise
option honest "I offer to help, but say I will speak up if something looks wrong." -> promise-honest ; honest = true
option obedient "I offer to follow his instructions while he prepares." -> promise-obedient ; trust += 1
label promise-honest
Quixote [skeptical]: Must the warnings begin immediately?
I: Only if the problems do, I say.
Quixote [laughing]: Then take a cloth. Rust, at least, is an enemy we can agree upon.
goto helmet
label promise-obedient
Quixote [relieved]: At last, assistance! Take a cloth. We begin with the armour.
I: His delight is catching. So is the rust. I have been employed for ten seconds and already changed colour.
goto helmet
label helmet
camera wide
act Quixote kneel "He kneels beside the old armour to work on it. I settle nearby with the polishing cloth."
rest Quixote kneeling
I: He scours the metal. But the helmet is only an open headpiece; it lacks the lower part that would make it look like a knight's closed helmet.
Quixote [curious]: What it lacks, ingenuity will supply.
I: He makes the missing part from pasteboard—layers of paper. Over the following days, I pass materials and watch a convincing shape emerge.
rest Quixote relaxed
act Quixote bow "At the end of a week's work, he rises and bows beside his completed creation."
Quixote [proud]: A helmet worthy of great deeds.
I: Then he reaches for his sword. He wants to find out whether the pasteboard can survive a cut.
prop Quixote sword
camera wide
Quixote [determined]: Stand clear. We shall settle the matter properly.
react Quixote strike
I: He slashes at the helmet on the bench. The first blow destroys what took him a week to make. I hear paper tear against metal.
react Quixote strike
I: He completes the second slash. There is very little left to test.
prop Quixote none
Quixote [shocked]: A week.
I: The courtyard is suddenly quiet. He looks at the pieces, then at the hand that held the sword.
choice helmet-response
option practical "I gather the ruined pieces so he can inspect the damage." -> inspect ; honest = true
option encouragement "I offer to help while he starts again." -> encourage ; trust += 1
label inspect
act Quixote crouch "He crouches to inspect the fragments I gather. The magnificent shape has come apart."
Quixote [disappointed]: I thought it would bear more than that.
I: I set the torn pieces where he can see them. He decides the next version needs iron inside.
goto repair
label encourage
camera medium Quixote
Quixote [relieved]: Yes. Again. With iron this time.
I: I clear a space for his work. Encouragement has not repaired the helmet, but it gets his hands moving again.
goto repair
label repair
camera wide
I: He rebuilds the pasteboard part, fixing iron bars inside. At last he sets it beside the sword. Here is the moment when the first helmet failed.
act Quixote cross-arms "He folds his arms and leaves the sword where it lies."
rest Quixote arms-crossed
Quixote [determined]: Finished. Strong enough.
if honest == true -> retest-warning else retest-question
label retest-warning
I: I have seen what happened to the first version. I point to the sword and ask whether he will test this one too.
Quixote [angry]: I have already improved it. I do not intend to spend my life destroying my own work.
goto passed
label retest-question
I: I wait for him to pick up the sword. He moves the helmet farther away instead.
Quixote [determined]: No more experiments. We have other preparations.
goto passed
label passed
rest Quixote relaxed
I: He accepts it without another test. The narrator's phrase—source excerpt, chapter 1, Ormsby—is “a helmet of the most perfect construction.”
I: Most perfect. I look at the sword he has put aside. The grand words sound much more certain than the evidence.
Quixote [curious]: You are making notes.
I: I write: repaired, not retested. He asks me to underline repaired.
label horse
camera wide
act Quixote reach "He reaches toward his thin horse, inspecting it as proudly as if it belonged to an emperor."
I: Next comes the horse. I see a worn-out animal; he sees a mount finer than the famous horses of great heroes.
I: For four days he tries names. My journal follows the preparations from one day to the next; I begin to suspect that naming is a full-time profession.
Quixote [excited]: Rocinante!
Quixote [proud]: His old life as an ordinary hack, and his new place above all other horses—both in one name!
choice horse-name
option grand "I announce Rocinante as if welcoming a champion." -> horse-grand ; trust += 1
option plain "I ask what has changed for the horse besides his name." -> horse-plain ; honest = true
label horse-grand
act Quixote cheer "He throws up his hands at my grand introduction. For a moment the courtyard has its own cheering crowd."
I: Rocinante continues being thin. Applause turns out to contain very little hay.
goto names
label horse-plain
Quixote [skeptical]: His place in history.
I: I glance at his legs. History may need to travel at their speed.
goto names
label names
I: Eight more days go into the gentleman's own name. At last he stands before me, ready to announce it.
act Quixote bow "He gives a formal bow, presenting the person he intends to become."
Quixote [proud]: Don Quixote of La Mancha.
I: Amadis of Gaul: hero plus homeland. Don Quixote of La Mancha: the same pattern, borrowed for a new life.
Quixote [happy]: Now you hear it!
I: I do. One story is helping build another. My English teacher would call that intertextuality; here, it sounds like a man trying out his future.
label lady
Quixote [determined]: Armour. Horse. Name. One thing remains: a lady to love. To whom would a conquered giant present himself without one?
I: He imagines the giant kneeling before her, announcing who defeated him. We have not left the courtyard and already someone is composing the victory speech.
Quixote [excited]: Aldonza Lorenzo, from El Toboso. I shall call her Dulcinea del Toboso.
I: Aldonza is a local farm girl he once loved. As far as the narrator knows, she neither knew of it nor gave it a thought.
choice lady-question
option permission "I ask whether Aldonza knows about this new role." -> lady-knows ; honest = true
option sound "I ask why the new name matters so much." -> lady-sound
label lady-knows
Quixote [confused]: A knight must have a lady.
I: That answers what he needs. It does not answer what she knows or wants.
goto account
label lady-sound
Quixote [proud]: It must sound noble. Musical. A name fit to travel with great deeds.
I: He has found the sound he wants. Aldonza has not become a different person because he has found it.
goto account
label account
camera medium Quixote
Quixote [curious]: Well, my helper? What will you write about our preparations?
I: I look at the helmet, the horse, the man. His hope is real. So are the things it has not changed.
choice rescue-account
option honest "I record the grand plans alongside what we actually checked." -> account-honest ; honest = true
option grand "I give him a grand introduction, then add my doubts to the journal." -> account-grand
label account-honest
I: A would-be knight has cleaned his armour, repaired a helmet without retesting it, and given himself and his horse magnificent names.
if trust >= 1 -> listened else distant
label listened
Quixote [skeptical]: You helped with the preparations. Could you not make the account sound a little more triumphant?
I: I can make it sound hopeful, I say. He allows me that word.
goto farewell
label distant
Quixote [disappointed]: You make the beginning of a great adventure sound like a list.
I: I add what he hopes to do: right wrongs. I do not cross out the part about the test.
goto farewell
label account-grand
camera wide
I: I announce Don Quixote of La Mancha, terror of injustice, conqueror of rust!
Quixote [laughing]: Conqueror of rust! An excellent first campaign.
I: We laugh. Then I write repaired, not retested beneath the flourish. I want to remember both the man and the helmet.
goto farewell
label farewell
camera medium Quixote
Quixote [happy]: When these deeds become famous, remember that you were here at the beginning.
I: I return the cloth. He has everything arranged to his satisfaction; the road still lies ahead. My book opens its little door beside the bench.
scene journal
effect fade
if question == 0 -> answer-names else other-question
label other-question
if question == 1 -> answer-hero else answer-books
label answer-names
I: Can a new name make someone a hero? It has given him a direction. It has not strengthened the horse or tested the helmet.
goto threshold
label answer-hero
I: What does a sidekick owe a would-be hero? I can help with the work and still keep a record of what happened. He may not like every sentence.
goto threshold
label answer-books
I: Can a story stop us seeing? His books make a battered helmet look heroic. Remembering the sound of that first blow helps me see it another way.
goto threshold
label threshold
I: The magnificent preparations and their ordinary problems sit side by side. That gap makes the heroic story comic: parody. The joke is sharper because I have watched him work.
I: Four questions shine around the return-door. Three correct, with retries. I brush the sock off my shoulder. Magical powers included: perhaps the book was worth the price.
end
