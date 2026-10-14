story 2
variable questioned = false hidden
variable family = false hidden
variable practical = 0 range 0 2 hidden
# Episode 4: Part I chapters 6–7. Seven local choices, fixed source events.
label classroom
scene classroom
show Hepting curious center
Hepting [curious]: Quixote is home, bruised and asleep. His friends have decided the books are to blame. Today the library goes on trial.
I: Mr. Hepting slides the journal toward me. Its tiny door has acquired a keyhole. Inside, someone is arguing about who has the key.
Hepting [happy]: One question. The journal is a door, not a search engine.
scene journal
I: I write: Can you change someone's mind by taking away the story they believe?
effect magic
scene passage
I: The keyhole fills with light. The page pulls me through, shoes first. I fall between fluttering sheets and land on a folded blanket beside a bookcase. Safe. Very dusty. Definitely not a graceful entrance.
label library
scene library
show Niece worried left
show Housekeeper angry right
camera wide
I: Morning in Quixote's house in rural La Mancha, Spain. He is still asleep after Pedro Alonso brought him home. His niece has handed over the library keys to the priest, Pero Pérez.
I: I am the visiting helper they remember from the doorway. My small task is to read titles and keep a record of the judgements. I do not get a vote over someone else's shelves.
Housekeeper [worried, hesitant]: Father, sprinkle the room with holy water first. We must not let the magicians inside these books bewitch us in revenge.
I: She has fetched water and a sprinkler. The priest laughs. Yet everyone here is treating a room full of paper as something dangerously alive.
Niece [angry]: Burn them all. Then we can have him back.
choice fear
option listen "Ask what frightens her most." -> fear-listen ; family = true
option separate "Ask whether every book can be responsible." -> fear-books
label fear-listen
I: What are you most afraid will happen if he keeps reading?
Niece [worried, hesitant]: That the next person who brings him home will not be able to wake him.
I: I look toward his bedroom. Her fear is not imaginary, even if this remedy is wrong.
goto scrutiny
label fear-books
I: All of them? Even a book he has never tried to act out?
Niece [frustrated]: I cannot stand beside him every hour deciding which sentence will send him out again.
I: She wants something certain because the last three days have been anything but certain.
goto scrutiny
label scrutiny
scene library
beat disagreement Priest Barber "The priest wants judgement; the barber starts handing him books one by one."
Priest [determined, explain]: Read the titles first. Some may not deserve the fire.
I: More than a hundred large, well-bound volumes fill the shelves, with smaller books among them. The barber, Master Nicolás, lifts the first: Amadís of Gaul.
act Barber give Priest "Nicolás presents the first volume for the priest to examine."
Barber [neutral, explain]: The four books of Amadís.
Priest [skeptical]: The first of its kind in Spain, they say. The others took their origin from it. Perhaps the founder deserves the first sentence.
Barber [determined]: Or the opposite. People also call it the best. Something excellent should not be condemned merely because other books followed it.
Priest [curious]: True. Spare it for the present.
choice judgement
option reason "Ask why the same fact supported opposite verdicts." -> origin ; questioned = true
option relief "Tell the barber I am glad he spoke before it was thrown out." -> spoke
label origin
I: Being the first made it guilty a moment ago. Now being exceptional helps save it. What changed?
Priest [neutral, explain]: Nicolás made a distinction worth hearing. Age and influence do not tell us everything about a book's quality.
Barber [skeptical]: Which is why I would prefer the window stayed closed until we finished speaking.
goto son
label spoke
I: You nearly lost the argument before it began. I am glad you spoke.
Barber [relieved]: A judgement should survive an answer. Otherwise we are only taking turns carrying things to the window.
I: I put a careful mark beside Amadís in my record: spared for now. Two small words do a lot of work.
goto son
label son
Priest [neutral]: Next?
Barber [neutral]: The exploits of Esplandián, son of Amadís.
Priest [determined, insist]: A father's merit is not his son's. That one goes to the yard.
I: The housekeeper throws it out of the window. My record now has a second column. The sound from outside makes the column feel less tidy.
I: Others follow. The priest condemns some for absurd invention, others for style. He praises Palmerín of England and sets it apart. These are literary opinions as well as a proposed cure.
I: His patience does not last. The housekeeper carries several volumes toward the window; one falls, and its title catches their attention: Tirant lo Blanc.
Barber [curious]: This one nearly went with the rest.
Priest [excited]: A treasury of enjoyment! Its knights eat and sleep, die in their beds, and make wills. Keep it at your house, Nicolás. Read it.
I: His praise is tangled with a harsh joke about its author deserving the galleys. This judge can love a book and still speak as if its maker belongs on trial.
label poetry
scene library
show Priest curious left
show Niece worried right
camera medium Priest
I: The smaller volumes include pastoral stories and poetry. The priest initially calls them harmless entertainment. The niece sees another possible escape route for her uncle.
Niece [worried]: He might become a shepherd instead, wandering through fields and singing. Or a poet. They say that complaint is incurable.
Priest [curious, explain]: We should remove the temptation. But Montemayor's Diana need not burn: take out the magic water and much of the long verse, and keep the prose.
I: Even the proposed cure involves editing a story into a version the reader is permitted to have. Other books are spared or condemned by different judgements.
move Niece exit
show Barber neutral right
camera wide
Barber [curious]: Here is Galatea, by Miguel de Cervantes.
I: I almost drop my record. Cervantes—the author whose world I am visiting—has put his own book on this shelf, under someone else's judgement.
Priest [neutral, explain]: He is an old friend. There is invention here, but it leaves matters unfinished. Let us wait for the promised second part. Keep it at your house meanwhile.
choice author
option fairness "Ask whether friendship affects the verdict." -> friend
option unfinished "Ask why an unfinished story gets more time." -> patience
label friend
I: Would you say the same if its author were a stranger?
Priest [skeptical]: Knowing the man does not keep me from naming a fault.
Barber [curious]: It may still make it easier to give him time.
I: I record the reason as well as the verdict. A fair-sounding decision can have more than one motive.
goto interrupted
label patience
I: You have sent other books out very quickly. Why wait for this one?
Priest [neutral]: There is something worth waiting for here, if its promise is fulfilled.
I: That is a judgement about the present—and a hope about what has not yet been written. This room contains more hope than the court language admits.
goto interrupted
label interrupted
I: The priest praises several works of heroic poetry. Then he tires and would send the unexamined remainder to the fire; even at that moment, another title earns a reprieve.
I: A shout from the bedroom interrupts the scrutiny. Quixote is awake, calling for the knights to fight in a tournament. Everyone hurries to him. Some books never receive a hearing.
scene home
show Priest worried left
show Quixote angry right
camera wide
I: He is out of bed, striking wildly around him. I stay in the doorway while the household restrains him and gets him back to bed. No tournament is taking place.
Priest [worried, reassure]: Rest, my friend. Fortune may turn tomorrow. Today you must take care of your health.
Quixote [angry]: Roland attacked me from envy! When I rise, I shall repay him. For now, bring something to eat.
I: They feed him. He sleeps again. His explanation has changed from the one he gave yesterday, but it still comes from the same store of heroes.
move Quixote exit
move Priest exit
scene journal
I: The journal turns a page. The household works while Quixote sleeps.
I: That night the housekeeper burns the books remaining in the yard and house. The account says some deserved lasting preservation. Haste and the examiner's weariness have helped decide what disappears.
I: The priest and barber have the library entrance walled up and plastered. Their plan is to remove the cause and tell Quixote that an enchanter carried the room away.
label missing-door
scene sealed
show Quixote confused left
show Housekeeper neutral right
camera wide
I: Two days later he gets up and searches for his books. From the courtyard I watch him feel along the plaster where the library entrance used to be. His hands find a wall.
act Quixote reach "Quixote reaches for the missing entrance, feeling for a door that is no longer there."
Quixote [confused, question]: Where is the room with my books?
Housekeeper [neutral]: What room? There are no books here now. The devil carried everything away.
move Housekeeper exit
show Niece worried right
Niece [worried, explain]: Not the devil. A magician came on a cloud, riding a serpent. He left smoke behind and said he had a grudge against you. His name was the Sage Muñatón.
Quixote [determined]: Fristón. That is who it must have been.
I: She invents the visitor. He supplies the familiar enemy and the reason. The missing room now fits his story better than an ordinary room ever did.
choice wall
option plaster "Point out that the plaster is new." -> plaster ; practical += 1
option motive "Ask why an enchanter would bother with a library." -> enchanter
label plaster
I: The plaster is fresh. Someone has worked on this wall.
Quixote [determined, insist]: And what prevents an enchanter from concealing his work beneath plaster?
I: The observation is real. It does not test his explanation, because his explanation can absorb almost anything.
goto enemy
label enchanter
I: If this magician is so powerful, why steal your books?
Quixote [proud]: He knows I shall defeat a knight he favours. He harms me now because he cannot change what is destined.
I: A loss has become evidence of future greatness. The story has supplied its own repair.
goto enemy
label enemy
Niece [pleading]: Why be mixed up in these quarrels at all? Stay here in peace. People go looking for gain and come back worse off.
act Quixote cross-arms "Quixote folds his arms as her warning meets his pride."
rest Quixote arms-crossed
Quixote [angry]: Before anyone touches a hair of mine, I shall deal with those who dare!
I: His anger rises. She and the housekeeper stop answering. The wall has ended access to the shelves. It has not ended the argument in his head.
label fortnight
scene sealed
show Priest neutral left
show Quixote determined right
I: For fifteen days he stays quietly at home, giving no outward sign of setting off again. He still argues with the priest and barber that the world needs wandering knights—and that he will restore them.
Priest [skeptical]: The world also needs you to recover.
Quixote [determined]: Recovery is preparation. There are wrongs waiting to be righted.
I: Sometimes the priest contradicts him, sometimes he agrees, hoping to keep the conversation possible. Meanwhile, another conversation is taking place.
label sancho
scene sealed
beat awkward-arrival Sancho Quixote "A farm labourer pauses at the gate. Quixote has an offer for his neighbour."
Sancho [curious, question]: A squire? And what would I get from being one?
Quixote [happy, explain]: An adventure may win us an island in a moment. You could govern it.
I: This is Sancho Panza, a neighbour with a wife and children. His everyday work is farming. Quixote offers him a future astonishingly different from that work.
Sancho [curious]: An island. Govern it. Those are large words for a man standing beside his donkey.
choice offer
option household "Ask what the promise would mean for his family." -> household ; family = true
option certainty "Ask whether an island is certain or only possible." -> possible ; questioned = true
label household
I: What would it change at home?
Sancho [happy, explain]: You do not spend your days working another person's land without wondering what a little authority might do for your own people.
I: His hope gives the promise a place to land. He does not need to mistake an inn for a castle to want a different life.
goto persuaded
label possible
I: Has an island been won already—or is that what you hope will happen?
Quixote [proud]: The histories show how knights reward their squires. A man must be ready when fortune offers him his opportunity.
Sancho [curious]: Then being ready is my part. I should not like to miss it by staying at home.
I: He hears uncertainty as a reason to be available, not a reason to refuse.
goto persuaded
label persuaded
I: Quixote's persuasion succeeds. Sancho agrees to leave his wife and children and serve him. The island is still only a promise; the agreement is real.
I: Quixote sells some possessions and pawns others, making bad bargains but gathering money. He borrows a shield, repairs his battered helmet, and gets shirts and other supplies the innkeeper recommended.
Quixote [determined, explain]: Bring saddlebags, Sancho. We must choose what is most necessary.
Sancho [neutral]: I will bring my donkey too. I am not fond of walking.
Quixote [confused, question]: A squire on a donkey? I cannot recall a precedent in the histories.
Sancho [skeptical]: I can recall my feet.
I: Quixote permits it, planning a more honourable mount later from the first discourteous knight he meets. The donkey keeps its appointment.
choice pack
option bags "Help check the bags against the practical supplies." -> bags ; practical += 1
option donkey "Back Sancho's case for taking the donkey." -> feet
label bags
I: Money. Shirts. Saddlebags. Ordinary nouns, carefully counted.
Sancho [relieved]: Put the useful things where we can reach them. A grand title will not patch a shirt.
I: He can insist on a sensible bag and still believe in the island. People are not consistent in the tidy way my record would prefer.
goto departure
label feet
I: A real donkey sounds more useful than a horse nobody has obtained.
Sancho [happy]: Exactly. This one has already agreed to be a donkey. That saves discussion.
Quixote [neutral, explain]: Until a suitable horse presents itself, it shall serve.
I: We have negotiated the animal. The much larger promise remains unexamined.
goto departure
label departure
scene sealed
show Sancho determined left
show Quixote proud right
camera wide
I: One night they leave unseen, without farewells: Sancho to his wife and children, Quixote to his niece and housekeeper. I follow to the edge of the village, carrying my record in the journal.
I: No triumphant crowd. Just saddlebags, a wine flask, the animals' feet, and two men anxious to be far away before anyone discovers them missing.
label road
scene road
show Sancho curious left
show Quixote happy right
prop Quixote lance
camera wide
I: By daylight they believe themselves beyond pursuit. They take the same route across the Campo de Montiel as Quixote's first journey. The morning sun is gentler than before.
Sancho [curious, question]: Do not forget the island. However big it is, I can manage it.
Quixote [proud, explain]: Knights have always rewarded squires with islands and kingdoms. I shall improve on their generosity. Perhaps in fewer than six days I could make you a king.
Sancho [surprised]: Then my wife would be a queen, and my children princes?
Quixote [happy]: Who doubts it?
Sancho [skeptical]: I do. I do not think a queen's crown would fit her. Countess would suit her better.
I: Sancho doubts the rank that would suit his wife, while accepting the imagined kingdom beneath it. His practicality has found an oddly narrow place to stand.
choice morning
option work "Ask what governing an island would involve." -> govern
option promise "Ask which promise he most wants Quixote to remember." -> remember
label govern
I: What would you do on the first day as governor?
Sancho [curious]: Find out who knows the place, I suppose. And where the food comes from. Kings must eat too.
I: A useful first question, attached to a place no one has yet found.
goto ranks
label remember
I: Of all these titles, what do you actually want him to keep his word about?
Sancho [determined]: That I shall not work and travel for nothing. If he wins what he says he can win, I want my part remembered.
I: I think of Andrés's unpaid wages on the earlier journey. Sancho's promise is a different one, but I write it down carefully.
goto ranks
label ranks
Quixote [neutral, reassure]: Leave it to God to give her what suits her. Do not value yourself so little that you settle for less than a governor's province.
Sancho [happy]: I shall trust a master of your quality to find what I can manage.
I: They go on together. One sees a revival of chivalry; the other sees an island and a place for his family. Their hopes travel on the same road without becoming the same hope.
prop Quixote none
I: The little door opens in my journal. I let the new squire take his place beside the knight and step through. The next adventure belongs to the next chapter.
label return
scene classroom
show Hepting curious center
camera medium Hepting
Hepting [curious, question]: Did removing the books remove the story?
I: No. They hid a door, and he found an enchanter. They kept him at home, and he found someone to leave with him.
if questioned == true -> questions-back else judgement-back
label questions-back
I: I kept asking what supported a judgement or a promise. Sometimes the question opened a distinction. Sometimes it only gave confidence another thing to answer.
goto family-back
label judgement-back
I: People heard what mattered to them: a book's merit, a chance to recover, an island. A sensible reply in one conversation did not settle the next.
goto family-back
label family-back
if family == true -> family-seen else family-unseen
label family-seen
I: The niece wanted her uncle safe. Sancho wanted a different future for his household. Listening to those wants helped me understand decisions I still could not call wise.
goto practical-back
label family-unseen
I: I was busy testing explanations. But fear and hope were working underneath them: the niece's fear of another return in pieces, Sancho's hope of something better.
goto practical-back
label practical-back
if practical >= 1 -> things-back else titles-back
label things-back
I: I noticed fresh plaster and practical supplies. Physical things were easier to check than the stories people built around them.
goto final
label titles-back
I: I wrote down verdicts and promises. Now I want to leave room beside each one for the reason, and for what might show it wrong.
goto final
label final
Hepting [neutral, explain]: A judicious reading keeps those distinctions. The priest is not simply against every book, and Sancho is not simply free of fantasy.
I: Cervantes puts Galatea on the shelf inside his own novel. Intertextuality becomes a joke with teeth: even the storyteller's work can face another reader's judgement.
I: The journal closes. Its little door is still there. Beyond it, two people are following a promise into the morning.
end
