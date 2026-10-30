story 2
variable before = 0 range 0 2 hidden
variable basis = 0 range 0 2 hidden
variable after = 0 range 0 2 hidden
variable judgment = 0 range 0 2 hidden
label classroom
scene classroom
show Hepting curious left
show Kevin worried right
camera two Hepting Kevin cut
Hepting [curious]: You know how this part of Santiago's journey ends. He does not. Can you enter his decisions without lending him your knowledge?
scene journal
I: I write one question in my journal: What makes a decision wise before I know how it ends?
label taxi_arrival
I: The sketched door glows. A taxi comes through the classroom wall, and I climb aboard with my journal.
label taxi_departure
I: We lift over the school field and fly into the next opening. Spain waits on the other side.
label owned_opening_v1
I: A young shepherd stands alone in an empty marketplace. His hand searches a pouch that cannot give him back the morning.
label threshold
scene road
show Santiago curious center
camera medium Santiago
I: The journal opens. I am no longer watching Santiago. I am Santiago, on a road in Andalusia, with a flock that knows my voice.
I: I know which sheep needs patience and where to find water. A girl listened to my stories last year; soon I could see her again.
act Santiago reach "I reach toward a sheep straying from the path, guiding it back toward the flock."
I: These animals are my work, my company, and my freedom to travel. Leaving them would mean losing something I love, not escaping a life with nothing in it.
I: Before anyone offers me a treasure, what do I most want my next decision to protect?
choice values-before
option security "Security: enough to live on, and a way back if things go wrong." -> before-security
option freedom "Freedom: the chance to discover a life I cannot picture yet." -> before-freedom ; before = 1
option connection "Connection: people and creatures who know me and depend on me." -> before-connection ; before = 2
label before-security
I: I count the flock. I do not need certainty about every day, but I want enough beneath my feet to survive a mistake.
goto dream
label before-freedom
I: I look beyond the familiar path. I became a shepherd to see the world. A comfortable life could still become a boundary.
goto dream
label before-connection
I: I call a straggler by name. I want a wider world, but I want someone in that world to notice whether I come back.
goto dream
label dream
I: Twice I have dreamed of a child leading me to treasure at the Egyptian pyramids. A woman who interprets dreams tells me to go there. She asks for a tenth of whatever treasure I find.
I: I leave the flock safely with a friend and go into Tarifa. I would like an answer that costs less than changing my life.
scene plaza
show Santiago skeptical left
show Melchizedek neutral right
camera two Santiago Melchizedek cut
I: An old man interrupts my reading. He calls himself Melchizedek, king of Salem. Then he mentions the treasure I have not told him about.
Melchizedek [neutral]: Give me a tenth of your flock, and I will help you find it.
express Santiago worried
camera listener Santiago over 0.65
I: The woman asked for part of a possible future. He wants sheep I can count today. My thumb holds the page, but I am no longer reading.
camera two Santiago Melchizedek cut
I: I have two questions. Which do I put to him first?
choice price
option evidence "How could you know about a dream I have not told you?" -> price-evidence
option terms "What would I be buying with the sheep that keep me alive?" -> price-terms
label price-evidence
Santiago [skeptical]: Are you working with the woman who interpreted my dream?
Melchizedek [neutral]: Watch what I write.
I: I keep my attention on his hand. An extraordinary claim deserves a closer look.
goto sand
label price-terms
Santiago [worried]: She asked for treasure if I find it. You want payment before I know what your help is worth.
Melchizedek [skeptical]: You would rather offer what you do not yet possess?
I: He has challenged my offer, but he has not supplied a route. I keep the difference in mind.
goto sand
label sand
act Melchizedek reach "Melchizedek traces names and private details in the sand with a stick."
express Santiago shocked
camera listener Santiago over 0.65
I: My parents' names. My old seminary. Things I have never told anyone. I cannot explain how he knows.
I: I stop preparing my next objection. For a moment, all I can do is look.
camera two Santiago Melchizedek cut
Melchizedek [neutral]: A Personal Legend is what a person most deeply wants to accomplish. People can lose the courage to pursue it.
I: He speaks of a world that helps people pursue their calling. He points to a baker who once wanted to travel, but chose security and respectability.
I: His knowledge of my past is remarkable. His account of the future is still a promise. Both things can be true.
scene fort
show Santiago worried center
camera wide
ambience wind
activity Santiago walk right slow
I: A ticket across the strait costs less than a sheep. Africa is close enough to reach, and far enough to make me feel very small.
activity Santiago stop
I: I have already left one expected life: my family hoped I would become a priest. My father helped me buy sheep instead. Now even that hard-won freedom feels familiar.
I: I will make the crossing. Which thought will I carry with me as I prepare?
choice departure-plan
option return "Leaving can be an experiment. I can reconsider when I learn more." -> plan-return
option commitment "I need to give this a serious attempt instead of retreating at the first discomfort." -> plan-commitment
label plan-return
I: I picture returning as a shepherd who has seen Africa. Returning would cost me something, but it need not erase what I learned.
I: For now, I have sale money and a short sea crossing. I have not worked out the whole journey across the desert.
goto payment
label plan-commitment
I: I imagine how easy it would be to call every unfamiliar feeling a warning to go home. I want to stay long enough to learn.
I: But how will I tell ordinary discomfort from information that should change my plan? I have not answered that yet.
goto payment
label payment
scene plaza
show Santiago sad left
show Melchizedek neutral right
camera two Santiago Melchizedek cut
I: My friend buys the rest of the flock; he has wanted to become a shepherd. At noon I bring six sheep to the old man. When he notices one is lame, I explain how clever she is and how much wool she gives.
I: I have chosen to leave. I still want someone to understand what I am leaving.
Melchizedek [neutral]: Look near the pyramids. Learn to read the omens along your way.
express Santiago disappointed
camera listener Santiago over 0.65
I: The woman gave me that destination too. My payment has not bought the detailed directions I hoped for.
camera two Santiago Melchizedek cut
I: From a golden breastplate he takes a black stone and a white one: Urim and Thummim. Black means yes; white means no, for clear questions when I cannot read the signs. He also urges me to make my own decisions.
act Melchizedek give Santiago "Melchizedek places the two stones in my hand."
I: His final story is about exploring a palace while keeping two drops of oil on a spoon: noticing the wonders without forgetting what I carry.
I: Then he blesses me and takes the sheep. I leave with a pouch of money, my book, my jacket, two stones, and a destination.
scene fort
show Santiago determined center
camera wide
I: I cross the strait. I cannot see a future outcome from the deck. I can only decide with the knowledge I have brought aboard.
label tangier
scene market
show Santiago worried left
show Owner neutral right
camera two Santiago Owner cut
I: Tangier, Morocco. In a small café I order by pointing and receive bitter tea. I miss familiar speech. I have not prepared for how alone I would feel without it.
I: I catch myself treating unfamiliar customs as signs of danger. That tells me how frightened I am; it does not tell me whom I can trust.
show Guide happy center
Guide [happy]: You speak Spanish?
express Santiago relieved
camera listener Santiago over 0.65
I: A voice I understand. My shoulders loosen before I know anything about its owner.
camera two Santiago Guide cut
Santiago [relieved]: I want to get to the pyramids. I could pay you to guide me.
I: I keep the treasure to myself. He knows the language; I need help. What matters most in my first question?
choice guide-question
option route "What does the journey actually involve?" -> guide-route
option shared "How do you speak Spanish so easily?" -> guide-shared ; basis = 1
option money "How will we know whether I have enough to travel?" -> guide-money ; basis = 2
label guide-route
Guide [neutral]: You must cross the Sahara. You will need money.
I: At least I have named the question of distance. But I have not checked a route, a price, or this person's experience.
goto money
label guide-shared
Guide [happy]: Spain is only a short crossing away. Spanish is spoken here too.
I: Conversation becomes easy. That is a real relief. It is also easy to confuse understanding his words with knowing his intentions.
goto money
label guide-money
Guide [neutral]: Show me what you have. We need enough for the journey.
I: It sounds practical. I have not agreed on a price or how the money will be used, but I want the uncertainty to end.
goto money
label money
I: I show him the money. The café owner watches. The two exchange words in Arabic; the owner becomes angry. I cannot understand the argument.
Guide [worried]: We should leave.
act Owner reach "The owner catches my arm and speaks urgently in words I cannot understand."
express Santiago scared
camera listener Santiago over 0.65
I: I tense. Is this a warning, a demand, or something else? My new companion pulls me outside before I understand.
camera two Santiago Guide cut
Guide [neutral]: He wanted your money. Port cities have thieves.
I: I have his explanation of an exchange I could not follow. How do I answer?
choice warning
option accept "Thank you. I thought he might be threatening me." -> warning-accept
option uncertainty "I could not understand him. I don't actually know what he wanted." -> warning-uncertain
option need "I need your help. Tell me how we get out of the city." -> warning-need
label warning-accept
Santiago [relieved]: I am glad you were there.
Guide [happy]: Come. We need camels.
I: My relief makes his explanation feel confirmed. But relief is something happening inside me, not independent evidence about the owner.
goto market-walk
label warning-uncertain
Santiago [worried]: You could understand him. I could not.
Guide [neutral]: You are out now. We can arrange the journey.
I: He moves the conversation on. I have noticed a gap in my knowledge, but I still let him decide what happens next.
goto market-walk
label warning-need
Santiago [pleading]: Please, help me get to Egypt.
Guide [neutral]: We need two camels. I can arrange them.
I: I ask for a next step rather than an explanation. Something to do feels easier than another thing to doubt.
goto market-walk
label market-walk
I: He takes the money to buy camels and claims we could reach the pyramids by tomorrow. I follow him into the crowded marketplace.
I: I have heard that the Sahara must be crossed. Now I hear a promise of tomorrow. I let the promise stand without checking how those claims fit together.
if basis == 0 -> route-callback else basis-other
label route-callback
I: I asked about the route. Asking was useful, but an unanswered practical question is not the same as a checked plan.
goto watch
label basis-other
if basis == 1 -> shared-callback else money-callback
label shared-callback
I: His Spanish was the bridge I needed. I have let that bridge stand in for knowledge about the person crossing beside me.
goto watch
label money-callback
I: I wanted a practical answer about money. Now he holds all of it, and I still do not know the price of the journey.
goto watch
label watch
I: I think of asking for the money back. It might seem unfriendly. Instead, I decide to keep him in sight.
I: Then I see a sword: silver on its scabbard, stones in its handle. I imagine buying it on my triumphant return and ask him about its price.
express Santiago curious
I: For a few moments I look at the future I want to own.
move Guide exit
express Santiago shocked
camera close Santiago
I: When I turn, he is gone.
I: I wait where we became separated. Perhaps he will return. The market empties, the stalls close, and the light leaves the white walls.
label loss
scene market
show Santiago sad center
camera medium Santiago
rest Santiago downcast
I: This morning I knew how to earn my food. Tonight I cannot pay for the boat home. With nobody left to watch me, I cry.
I: The thief chose to steal. I can examine how I trusted him without making his action my fault, or treating everyone in this city as if they were him.
I: Hunger does not ask whether my dream was beautiful. I reach into the pouch: a book, a jacket, the two stones. No money.
I: Before I judge my past decision, what do I most want my next decision to protect?
choice values-after
option security "Security: enough to live on, and a way back if things go wrong." -> after-security
option freedom "Freedom: the chance to discover a life I cannot picture yet." -> after-freedom ; after = 1
option connection "Connection: people and creatures who know me and depend on me." -> after-connection ; after = 2
label after-security
I: A meal. A night's shelter. A way to earn. The next step has become smaller and more urgent than the pyramids.
goto compare
label after-freedom
I: I still want a world larger than the one I knew. But freedom without food or money has less room to move than I imagined.
goto compare
label after-connection
I: I miss being known. I want to hear my name spoken by someone who does not need me to prove I belong there.
goto compare
label compare
if before == 0 -> compare-security else compare-other
label compare-security
if after == 0 -> stayed-security else changed-security
label stayed-security
I: I wanted security before I left, and I want it now. I crossed believing I could afford a return. What did I fail to protect when I handed over the money?
goto judgment
label changed-security
I: Before leaving, I chose security. Now another need has become stronger. Have I discovered something about myself, or is this moment speaking loudest?
goto judgment
label compare-other
if before == 1 -> compare-freedom else compare-connection
label compare-freedom
if after == 1 -> stayed-freedom else changed-freedom
label stayed-freedom
I: I chose freedom before, and I still choose it. Does that value help me adapt, or make it hard to admit when a plan needs changing?
goto judgment
label changed-freedom
I: Before leaving, I chose freedom. With the money gone, another need comes first. Is this abandoning a value, or learning what that value requires?
goto judgment
label compare-connection
if after == 2 -> stayed-connection else changed-connection
label stayed-connection
I: I chose connection before, and I choose it again. I have lost familiar company. Must that make every new connection a danger?
goto judgment
label changed-connection
I: Before leaving, I chose connection. Now another need presses harder. I can acknowledge that change without pretending the flock never mattered.
goto judgment
label judgment
I: The pain tempts me to put the whole journey on trial at once. What verdict am I ready to give?
choice verdict
option outcome "The theft proves leaving Spain was a foolish decision." -> verdict-outcome
option process "Leaving and trusting this stranger were separate decisions. Examine each with what I knew then." -> verdict-process ; judgment = 1
option treasure "Only finding the treasure could prove that my decisions were wise." -> verdict-treasure ; judgment = 2
label verdict-outcome
I: If he had brought back camels, would the same unchecked arrangements suddenly have become careful? My loss is real, but it cannot answer every question about how I decided.
I: Before crossing, I had money, a destination, and reasons to want to travel. Before handing over the money, I also had unanswered questions about distance, cost, and a stranger's account.
goto stones
label verdict-process
I: I separate the crossing from the handover. Wanting to travel and having sale money gave me reasons to leave. Neither supplied evidence that this particular stranger should control all my funds.
I: I can learn from the loss by naming an avoidable weakness: I did not check the arrangement. I do not need to condemn every hope that brought me here.
goto stones
label verdict-treasure
I: Suppose I find treasure later. Would that make it sensible to trust every stranger who promises tomorrow? A later success could not repair the information missing from this decision.
I: Nor would a later failure automatically make every risk foolish. I need a way to judge the process before the ending arrives.
goto stones
label stones
I: The stones bring back the old man's confidence. I ask whether his blessing remains with me; the answer I draw is yes. When I reach in again to ask about the treasure, both stones fall through a hole in the pouch.
act Santiago reach "I bend to pick up Urim and Thummim from the ground."
express Santiago worried
I: I remember his advice to make my own decisions. I put the stones away. I choose to think of myself as an adventurer, though I am still someone who has been robbed.
I: Calling myself an adventurer does not fill the pouch. It helps me imagine a next action.
label morning
scene market
show Santiago worried left
show Candy happy right
camera two Santiago Candy cut
I: Morning wakes me in the marketplace. For an instant I look for the sheep. Then I remember.
act Santiago reach "I help a candy seller assemble his stall, following his gestures."
I: He speaks Arabic; I speak Spanish. We still manage the work together. When the stall is ready, he offers me the first sweet of the day.
Candy [happy]: Here.
express Santiago relieved
camera listener Santiago over 0.65
I: I accept it. Yesterday I could understand a man's words and misunderstood his purpose. Today I understand almost no words, and we finish a task together.
I: That does not guarantee this man's character either. It gives me a different kind of evidence: something we have actually done.
label shop
scene market
show Santiago worried left
show Merchant neutral right
camera two Santiago Merchant cut
I: I walk up a steep street. A crystal shop has dusty glasses in its window and a sign saying several languages are spoken. A man stands behind the counter.
I: I am hungry. I have no money, but I can see work that needs doing. How do I bring myself to ask?
choice work
option admit "Admit that I need food, and offer a useful task in exchange." -> work-admit
option ability "Begin with what I can do: point out the dusty glasses." -> work-ability
option temporary "Make this one small step. I do not have to decide the rest of my life today." -> work-temporary
label work-admit
I: I stop trying to look like a traveller who has everything arranged. Needing food is a fact I can say aloud.
goto request
label work-ability
I: I study the window instead of hiding my empty pouch. I no longer have a flock, but I have not lost the ability to notice and work.
goto request
label work-temporary
I: I let tomorrow remain unanswered. A task and a meal would give me room to make another decision with a clearer head.
goto request
label request
Santiago [worried, hesitant]: I can clean the glasses in your window. In exchange, could you give me something to eat?
express Merchant curious
camera listener Merchant over 0.65
I: He looks at me without answering.
I: I wait. I have made an offer. I do not yet know what it will bring.
label return
scene journal
I: The journal returns to my hands. I am myself again. Santiago remains at the shop, waiting for an answer.
label decision-review
I: My choice record holds what I wanted before the loss and after it. A changed priority is evidence to examine, not a score for courage or goodness.
scene classroom
show Hepting curious left
show Kevin worried right
camera two Hepting Kevin cut
Hepting [curious]: Poker players sometimes call it resulting: judging the quality of a decision by its outcome. A careful choice can lose. A careless one can win.
Hepting [neutral]: Outcomes still matter. They can reveal risks or missing information. Ask what was knowable then, what you checked, what you assumed, and what you would change next time.
if judgment == 1 -> process-return else review-return
label process-return
I: I separated the decisions. Now I need to say what made each stronger or weaker, rather than simply calling myself thoughtful.
goto fare
label review-return
I: I wanted an ending to settle the argument. Now I can ask whether I would judge the same reasoning differently if luck had changed the result.
goto fare
label fare
Hepting [curious]: Choose one decision to defend or revise using only the information Santiago had then. What additional evidence would have changed your mind?
I: The taxi driver has four questions for the fare home. Three correct will do; I can review and retry. My story choices have earned no right-or-wrong points.
end
