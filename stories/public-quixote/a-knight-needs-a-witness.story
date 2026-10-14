story 2
variable question = 0 range 0 2 hidden
variable trust = 1 range 0 3 hidden
variable rope = false hidden
variable honest = false hidden
# Harmon: You / Need — I want to help, but helpful to whom?
label opening
scene journal
I: I found the book in an airport gift shop, between the marmalade and a travel pillow. It was tucked a little way into shadow, as if it had chosen the one place nobody would look.
I: I felt it calling to me. Not with a voice. More like the feeling that someone has just said your name, although nobody has.
I: It was a little overpriced, if you ask me. But it turned out to have magical powers, so I suppose it all balances out. The travel pillow could hardly compete.
I: There was no title on the cover. Only a small door, drawn in faded ink. When I touched its brass handle, something knocked from the other side.
I: Inside, most pages were blank. One instruction wasn't: Write one question. Open the door. Pay attention to the answer.
I: A smaller line appears underneath: Four questions will open the return door. Three correct answers. Retries welcome. Apparently it is a door, not a monster.

camera wide
I: The little brass handle feels warm. I choose one question and write it on the first page.
choice entry-question
option names "Can a new name make someone a hero?" -> enter ; question = 0
option hero "What does a good sidekick owe a would-be hero?" -> enter ; question = 1
option books "Can a story stop us seeing what is right in front of us?" -> enter ; question = 2
# Go — one question, one magical threshold.
label enter
I: My ink drains into the sketched door. The leather ripples like water touched by a fingertip; the door opens far deeper than the book is thick.
effect magic
scene passage
camera wide
I: I jump. The pages catch my shoes, pull me sideways, and sweep me down a tunnel that smells of dust and summer grass.
I: Commas rush past like tadpoles. A chapter heading narrowly misses my nose. Then the paper floor folds away.
effect magic
scene courtyard
show Quixote surprised center
camera wide
I: I land bottom-first in a basket of clean laundry. A grey-bearded man looks down at me, holding one extremely surprised sock.
Quixote [surprised, question]: Have you come to assist me, or to be washed?
I: I scramble out. I am in a village courtyard in La Mancha, Spain, around the beginning of the seventeenth century. Fields lie beyond the gate.
I: The gentleman wears plain brown clothes. Old armor waits on a bench; his thin horse noses a bucket nearby. Everything looks ordinary except his expectations.
camera medium Quixote
Quixote [happy, explain]: Don Quixote of La Mancha, at your service. Soon a knight-errant: a wandering knight who rights wrongs. I could use an assistant before I set out.
I: He gives me a cloth and points to a little handcart of books. My job is clear: help with his preparations, keep his belongings safe, and get home before he leaves.
Quixote [determined]: We shall begin with the essential equipment. A great adventure must have a proper beginning.
# Search — a practical choice and curiosity reveal his beliefs.
label equipment
I: A coil of rope lies beside a splendid book. The rope could secure the load; the book could help me understand what he expects of me.
choice sidekick-kit
option practical "I take the rope and check the cart." -> kit-rope ; rope = true
option stories "I open the book and look for his model of a hero." -> kit-book ; trust += 1
label kit-rope
I: I loop the rope around the book crate. One cart wheel rests against a small stone. Beyond it, the paving slopes toward a shallow muddy ditch.
Quixote [skeptical]: A necessary precaution, though chronicles seldom begin with knots.
I: I suggest that a good knot may explain why a chronicler lives long enough to write. He considers this a surprisingly strong argument.
goto model
label kit-book
I: The book describes knights, enchanted dangers, impossible victories. He points to Amadis of Gaul as if introducing a trusted colleague.
Quixote [happy, explain]: A man should learn from the finest examples. Why aim for an ordinary life when the extraordinary has already been described?
I: I set the book on the cart. The load leans slightly downhill; a small stone is doing all the work of keeping it still.
goto model
label model
Quixote [determined]: Amadis of Gaul. Don Quixote of La Mancha. Do you hear it? A name large enough to travel in.
I: One story is shaping another: intertextuality, right here in his borrowed pattern. His name changes the place, but keeps the heroic rhythm.
I: It might sound derivative—copied too closely—but this adaptation of another hero’s title matters deeply to him.
choice first-conversation
option purpose "I ask what he hopes this new life will let him do." -> purpose
option preparation "I ask what the books have already changed." -> books
label purpose
camera close Quixote
Quixote [determined, hesitant]: There are wrongs to put right. I have spent long enough reading about men who act.
I: He rubs a thumb over the book's worn edge. I had expected a man showing off. I find a man frightened of remaining merely a reader.
Quixote [worried]: If I wait until everyone thinks I am ready, I may never begin.
goto cost
label books
camera close Quixote
Quixote [happy]: My shelves, for a start. A fine collection. Expensive, of course. I sold land for some of it.
I: I glance through the gate: fields on one side, books on the other. His devotion has a cost I can actually point to.
Quixote [worried]: You make that face as if I had bought nothing at all.
goto cost
label cost
camera medium Quixote
I: A remembered line from chapter 1 comes into focus: he sold farmland to buy books of chivalry. That action is evidence; what it tells me about his priorities is an inference.
Quixote [curious, question]: You will stand beside me, won't you? An assistant who doubts everything is a very slow assistant.
I: The question matters. If I only flatter him, I may be easy company and poor help. If I question every word, he may stop listening when it counts.
choice sidekick-promise
option honest "I promise support, including a warning when something looks wrong." -> promise-honest
option obedient "I promise to follow his lead and keep my doubts to myself." -> promise-obedient ; trust += 1
label promise-honest
Quixote [skeptical]: Even in the middle of a heroic moment?
I: Especially then, I say. He hands me the polishing cloth, but his fingers hold it for an extra second.
Quixote [neutral]: Very well. Try to make your warnings concise.
goto helmet
label promise-obedient
Quixote [relieved, reassure]: At last. Someone who understands loyalty.
I: His relief makes me stand taller. Then I notice that I have promised silence before finding out what I might need to say.
goto helmet
# Find — apparent readiness; close reading reveals the weakness.
label helmet
camera medium Quixote
Quixote [happy, explain]: Observe the helmet. Improved construction. You may admire it without striking it.
I: On the bench sits an old metal helmet with a homemade pasteboard addition. Pasteboard is layered paper: useful for shaping, less reassuring for stopping a sword.
I: He tells me his first test destroyed a week's work. He rebuilt it with iron bars inside, then chose not to test it again.
Quixote [determined, insist]: We have spent enough time proving that things can break.
I: I remember the narrator's phrase—source excerpt, Cervantes, chapter 1, Ormsby: “a helmet of the most perfect construction.”
I: Close reading catches the wobble: “most perfect” sounds gloriously certain beside an avoided retest. The diction makes the mismatch comic.
Quixote [curious]: Why are you looking at the helmet and then at me?
I: I say I am trying to be judicious: careful in my judgment. A convincing shape is not the same thing as evidence of strength.
react Quixote sigh
Quixote [skeptical]: You have an alarming talent for making short words take a long time.
I: He leaves the helmet on the bench. I do not test it or change it. The cloth in my hand is for polishing, not for rewriting his equipment.
label names
camera wide
I: Rocinante lifts his head from the bucket. Quixote announces the name as if a trumpet section should follow.
Quixote [happy, explain]: Four days for his name. Eight for mine. One should never rush the important work.
I: I look from the grand name to the thin horse. The name declares an ambition; it has not changed the animal's abilities.
Quixote [happy]: And my victories shall belong to Dulcinea del Toboso.
I: That is his new name for Aldonza Lorenzo. The chapter says she did not, as far as anyone knew, even know of his love. He cannot name her agreement into existence.
I: His world is almost assembled: knight, horse, lady. Then a hot gust catches the loose laundry, and the courtyard stops following his plan.
# Take — a local invented mishap; help requires action and has a cost.
label gust
react Quixote recoil
I: A sheet snaps across the paving. Rocinante shies sideways. The stone beneath the cart wheel skitters loose.
I: The book cart begins rolling toward the muddy ditch. Quixote steps after it, straight into the trailing sheet; his foot catches and he staggers.
Quixote [surprised, insist]: The books! Catch the books!
camera wide
I: I cannot reach both him and the cart at once. He is near the hard edge of the bench; the books are near the mud.
choice first-rescue
option person "I catch his arm and steady him. The books may fall." -> catch-person
option cart "I go after the cart and shout for him to grab the bench." -> catch-cart
label catch-person
I: I catch his forearm and brace my feet. He rights himself against the bench. His sleeve tears; neither of us falls.
Quixote [angry]: My books! Do you know what those cost?
I: I do. The cart is still moving. Keeping him upright has bought safety, not his gratitude.
if rope == true -> rope-person else loose-person
label rope-person
I: I seize the trailing rope and pull from the side. The tied crate stays together, though the wheel is already at the ditch.
goto fortune
label loose-person
I: Without a rope to hold it, I can only push a laundry basket into the cart's path. It might turn the wheel; it might collapse.
goto fortune
label catch-cart
I: I run beside the cart, clear of its wheels. Behind me comes a thump: Quixote catches the bench, bruising his palm.
Quixote [worried]: I have it. Keep going!
I: He is upright, but the sound stays with me. I chose the books and trusted him to save himself.
if rope == true -> rope-cart else loose-cart
label rope-cart
I: I pull the rope sideways toward a flat patch. The secured crate holds; the moving wheel is still trying to drag it into the ditch.
goto fortune
label loose-cart
I: I push at the cart's side, trying to turn it across the slope. The untied books slide toward the rim.
goto fortune
label fortune
chance wheel-rut 50 -> wheel-catches else wheel-slips
label wheel-catches
I: The wheel catches in a rut and stops. My plan gets help from a piece of ground I never noticed.
if rope == true -> dry-books else spilled-books
label dry-books
I: The rope keeps the crate in place. Dusty covers, startled horse, torn dignity—but every book is dry.
Quixote [relieved]: A victory. An unconventional one.
goto after-rescue
label spilled-books
I: The cart stops, but two loose books tumble into the mud. I lift them out by their boards and lay them open on the dry bench.
Quixote [sad]: That one took me weeks to find.
goto after-rescue
label wheel-slips
I: The wheel slips through the rut and jolts into the ditch. Preparation has not persuaded the ground to cooperate.
if rope == true -> wet-crate else wet-books
label wet-crate
I: The rope holds the crate together, but muddy water splashes the bottom book. I pull the load onto dry ground; its pages will need careful drying.
Quixote [sad]: The rope was a good thought. I wish good thoughts were enough.
goto after-rescue
label wet-books
I: Three books spill into the ditch. I recover them, but mud darkens their pages. I can save them from more water, not undo the first soaking.
Quixote [sad]: Please. Set them down gently.
goto after-rescue
# Local outcomes are remembered without awarding learning points.
label after-rescue
if rope == true -> check-dry else repair
label check-dry
# The stable event has already determined what the student saw.
I: The rope still circles the crate. I leave it there while we work; one useful decision does not make the whole afternoon safe.
goto repair
label repair
camera close Quixote
I: We carry the books to the bench. His earlier boast has disappeared. He smooths a corner with extraordinary care.
Quixote [sad, hesitant]: They made the world seem larger. You must understand that much.
I: I do. I can see both the land they cost and what he hoped to find in them. Neither fact erases the other.
Quixote [worried]: Was that a heroic rescue?
I: I want to give him an answer that helps. It would be easy to give him one that merely sounds good.
choice rescue-account
option honest "I describe what we actually saved, what went wrong, and what remains uncertain." -> account-honest ; honest = true
option grand "I announce a glorious victory over the treacherous courtyard." -> account-grand ; trust += 1
label account-honest
I: I say we kept each other upright and recovered the books. The rest belongs in the account too: the loose stone, our hurried choices, and the ground's inconvenient opinion.
Quixote [skeptical]: It sounds very small when you put it like that.
I: I point to his hands. They are still here to turn the pages. Small is not the same as worthless.
if trust >= 2 -> listened else distant
label listened
Quixote [neutral, hesitant]: You took my books seriously before the trouble. I suppose I should hear you now.
I: He listens without agreeing to all of it. The warmth I built earlier has made room for a harder answer.
goto farewell
label distant
Quixote [sad]: I had hoped you would see more than a muddle.
I: He turns to the books. My honest answer has not earned the reaction I wanted; I still help him carry them inside.
goto farewell
label account-grand
react Quixote laugh
Quixote [happy, celebrate]: Yes! A treacherous courtyard, nobly defeated. That has the proper sound.
I: He laughs, and for a moment we are splendid companions. Then a muddy mark on the bench catches my eye.
I: The grand version leaves out the mishap it claims to explain. I keep the laughter, but make a quiet revision in my own journal: names cannot do the work of evidence.
goto farewell
# Return / Change — keep canonical preparations and future events intact.
label farewell
camera medium Quixote
Quixote [curious]: Before you go, an assistant deserves a title. Guardian of the Books? Conqueror of Unhelpful Slopes?
I: I ask for Sidekick. It has room for carrying things and asking awkward questions.
Quixote [happy]: An unusually modest ambition. Very well, Sidekick.
I: I carry the final book inside. He returns to his preparations; the repaired helmet and his great plans remain his own.
I: The comedy echoes heroic romances while exposing their limits: parody. I can laugh at the gap without forgetting the man who lives inside it.
scene journal
camera wide
effect fade
if question == 0 -> answer-names else other-question
label other-question
if question == 1 -> answer-hero else answer-books
label answer-names
I: My one question returns: can a new name make someone a hero? It can organize a hope. It cannot strengthen a helmet, improve a horse, or guarantee a deed.
goto threshold
label answer-hero
I: My one question returns: what does a sidekick owe a would-be hero? Today I had to care about his purpose and still notice the things his purpose made him miss.
goto threshold
label answer-books
I: My one question returns: can a story stop us seeing? His romances give the courtyard a heroic shape. Watching the actual details helps me see what that shape leaves out.
goto threshold
label threshold
I: The little door opens beneath my hand.
if honest == true -> return-honest else return-revision
label return-honest
I: I carry back an account that leaves room for both his hope and the facts. He did not have to like every word for the visit to matter.
goto return-door
label return-revision
I: I keep my revision beside the grand speech. Next time I tell this story, I want the person and the facts to fit on the same page.
goto return-door
label return-door
I: Four questions shine along the frame. Beyond them is the reading corner. I brush one final sock off my shoulder and step toward home.
end
