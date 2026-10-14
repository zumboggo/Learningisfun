story 2
variable evidence = false hidden
variable care = false hidden
variable honest = false hidden
label opening
scene journal
I: The book from the airport gift shop is trembling again. I found it half hidden in shadow between the marmalade and a travel pillow. Neither of those, as far as I know, has ever opened a door to another century.
I: It was overpriced. But five journeys later, I am beginning to think the magical powers were included. Today a little wind stirs the pages, although the windows are closed.
I: I write one question in the journal: When does courage need someone who says no?
I: The door sketched on its cover opens. I jump into the book; the pages suck me through and drop me safely into a dusty wheel rut. My landing has very little dignity.
label plain
scene mills
show Quixote excited left
show Sancho neutral right
prop Quixote lance
camera wide
I: La Mancha, Spain. Quixote and his new squire have left home on their second journey. I catch up beside Sancho's donkey as thirty or forty windmills come into view across the plain.
Quixote [excited]: Fortune has arranged everything! Thirty monstrous giants, Sancho. We shall defeat them and begin our fortunes with their spoils.
Sancho [confused, question]: What giants?
Quixote [proud]: Those before us. Look at their enormous arms. Ridding the earth of them will be a righteous service.
Sancho [worried, explain]: Those are windmills, sir. The sails turn in the wind and make the millstones grind.
I: The same shapes have become two different stories. Quixote sees a glorious duty. Sancho sees machinery that can hurt someone.
choice look
option shapes "I ask Sancho how he knows they are mills." -> shapes ; evidence = true
option fortune "I ask what Quixote expects to win." -> fortune
label shapes
camera medium Sancho
Sancho [neutral, explain]: Look at the towers and the sails attached to them. Those are not shoulders. Grain goes in; flour comes out.
I: I look again. Naming a thing is easier when I can say what it does.
goto refusal
label fortune
camera medium Quixote
Quixote [proud]: Honour, first. Then the spoils of victory. A knight who finds evil must act against it.
Sancho [skeptical]: I would prefer an island that did not require fighting a flour mill first.
goto refusal
label refusal
camera wide
Quixote [angry]: You have little experience of adventures, Sancho. If you are afraid, stand aside and pray while I fight.
Sancho [worried]: Knowing what a thing is does not make me a coward.
I: Quixote calls the warning fear. Sancho is trying to keep his master alive; his master hears a failure of courage.
choice warning
option concrete "I call out: Look at the sails fixed to the tower!" -> concrete ; evidence = true
option pause "I ask him to stop long enough to hear Sancho." -> pause ; care = true
label concrete
I: I point to the wooden frame and stone tower. Quixote's attention is already ahead of us.
Sancho [worried]: Yes! Sir, they are mills! Mills!
goto departure
label pause
I: I call for a pause. The answer is the sound of hooves.
Sancho [pleading]: Please listen, sir! There is no giant there!
goto departure
label departure
move Sancho exit
I: Quixote spurs Rocinante onward, ignoring Sancho's repeated warnings. I stay beside the squire, clear of the charge.
Quixote [determined]: Do not flee, cowards! A single knight comes against you!
I: A breeze rises. The great sails begin to turn. Quixote takes their movement for a giant brandishing its arms.
Quixote [determined]: Even if you had more arms than Briareus, you must answer to me!
I: He calls on Dulcinea for support, covers himself with his buckler, and lowers his lance.
label charge
scene mills
show Quixote determined left
camera wide
I: Sancho is still shouting behind him. Quixote fixes his eyes on the first mill.
act Quixote mounted-charge "Rocinante gallops at the first windmill. Quixote rides behind his buckler, lance levelled at a sail."
label impact
scene mills
effect shake
I: The lance-point strikes the sail. The wind whirls it round, shatters the lance, and sweeps horse and rider over. They roll across the plain.
I: For a moment there is no heroic speech. Sancho hurries over as fast as his donkey can carry him and finds Quixote unable to move.
label aftermath
scene mills
show Sancho worried left
show Quixote sad right
rest Quixote kneeling
camera wide
act Sancho kneel "Sancho bends down beside his fallen master. The broken lance has given them no victory."
rest Sancho kneeling
I: I stop beside Sancho. The windmill has not become cruel or kind. It has simply kept being a windmill.
choice first-words
option concern "I ask Sancho what I can do to help." -> concern ; care = true
option certain "I say: You were right about the mills." -> certain
label concern
Sancho [worried, hesitant]: Give us a little room. I need to help him up. I wish being right had kept him from falling.
I: I step back. I can make space without pretending to be the person who knows how to move him.
goto explanation
label certain
Sancho [sad]: I would rather have been heard. Look at him.
I: The words I was ready to say feel much less useful now.
goto explanation
label explanation
Sancho [frustrated]: Did I not tell you to look? They were windmills all along!
Quixote [determined]: Be quiet, friend Sancho. The fortunes of war always change. Fristón, the very sage who carried away my study and books, has turned the giants into mills.
Quixote [angry]: He means to rob me of the glory of defeating them. But his wicked arts will not always prevail against my sword.
I: The missing library has become an explanation for this defeat too. The accident changes the story he tells; it does not change his belief that he is a knight facing enemies.
choice magician
option before "I ask: But Sancho called them mills before you charged." -> before ; evidence = true
option need "I ask Sancho why that explanation matters so much to him." -> need
label before
Quixote [determined, insist]: And an enemy skilled in enchantment can deceive the eye. This is not the end of our adventures.
I: My question does not shake his certainty. Every objection seems to leave another place for the magician.
goto assistance
label need
Sancho [worried, hesitant]: If it was a mill all along, he rode into a mill. If an enemy changed it, he was cheated of a victory.
I: Sancho looks back at his master. Understanding the explanation does not make it true.
goto assistance
label assistance
act Sancho steady Quixote "Sancho offers his arm from beside Quixote. Whatever caused the fall, his master still needs help."
I: Sancho helps Quixote rise and gets him back onto Rocinante. The horse has an injured shoulder too. They continue toward Puerto Lápice, where Quixote expects many adventures.
label road
scene road
show Quixote sad left
show Sancho worried right
camera wide
act Quixote wince "Quixote bends with a painful flinch. He is still sore from the fall."
Quixote [sad]: My lance is gone.
Sancho [worried]: And you are leaning to one side. Try to sit straighter, sir.
Quixote [curious, explain]: I remember Diego Pérez de Vargas. When his sword broke in battle, he tore a great branch from an oak and fought with it.
Quixote [determined]: At the first oak I find, I will take such a branch. You shall witness deeds people will scarcely believe.
I: Another story offers him a way forward. He has lost a lance, but not his supply of examples.
choice stories
option useful "I ask whether a book can help without being a set of orders." -> useful ; honest = true
option hope "I ask Sancho if he still hopes for the promised island." -> hope
label useful
Sancho [curious]: A branch could be useful. But I would like him to notice the horse, and his own back, before planning what to hit with it.
I: Perhaps the problem is not having a story. Perhaps it is letting the story refuse everything else.
goto pain
label hope
Sancho [skeptical]: A promised island is a fine thing. At present I would settle for a master who could sit comfortably.
I: His hope has not disappeared. Neither has his ability to notice an aching back.
goto pain
label pain
Quixote [determined]: If I make no complaint, it is because a knight-errant must not complain of a wound.
Sancho [worried, question]: I would rather you complained when something hurt. As for me, I shall complain about the smallest ache—unless this rule includes squires too?
Quixote [laughing]: Complain whenever and however you please, Sancho! I have read no rule against it for a squire.
I: Quixote laughs. The disagreement remains, but for a moment they can share something other than a warning.
choice permission
option honest "I tell Sancho I am glad he said that aloud." -> honest ; honest = true
option humorous "I ask if my dusty landing qualifies for a complaint." -> humorous
label honest
Sancho [relieved, reassure]: A person can be loyal and still say that something hurts.
I: He does not need to win the argument before he can speak plainly.
goto meal
label humorous
Sancho [laughing]: Certainly. Begin with the dust. If you run out of complaints, I can lend you some.
I: My career as a heroic witness may require a very comfortable cushion.
goto meal
label meal
camera wide
Sancho [neutral]: It is dinner-time, sir.
Quixote [neutral]: I want nothing now. Eat when you wish.
I: Sancho settles on his donkey, opens his saddlebags, and eats as they travel. For now he enjoys the journey without thinking of the promised reward.
I: I watch them go: one carried onward by the books in his head, the other by appetite, hope, and a stubborn concern for the man ahead.
if evidence == true -> evidence-return else care-check
label evidence-return
I: I tried to name the evidence. I learned that offering a fact and having it heard are different things.
goto care-check
label care-check
if care == true -> care-return else honest-check
label care-return
I: I also tried to make room for someone else. The help was small, but it belonged to the real situation in front of me.
goto honest-check
label honest-check
if honest == true -> honest-return else departure-door
label honest-return
I: Speaking honestly did not require abandoning either man. Sancho showed me that disagreement can stay inside a friendship.
goto departure-door
label departure-door
scene journal
I: The journal's door opens at the roadside. Quixote and Sancho have more adventures ahead. My visit to their story ends here.
I: I step through with dust on my shoes and a different picture of courage: not only the raised lance, but also the warning and the hand offered afterward.
label return
scene reflection
show Teacher curious center
camera medium Teacher
Teacher: What did the windmill change—and what did it fail to change?
I: It broke his lance and hurt both horse and rider. It did not persuade him that he had mistaken a mill for a giant.
Teacher [curious, question]: And Sancho?
I: He warned him, disagreed with him, and helped him. Seeing clearly did not mean he stopped caring.
Teacher [happy, explain]: Our adaptation ends here; Cervantes's novel continues. Close reading lets us keep the joke, the consequences, and the affection in view together.
I: Four questions appear on the journal's return-door. One last look at the evidence, then I can close the book.
end
