story 2
variable entry = 0 range 0 1 hidden
variable evidence = false hidden
variable care = false hidden
variable cost = false hidden
label classroom
scene classroom
show Hepting curious center
Hepting [curious]: A stranger offers to help you find treasure. His fee is part of the life you already love. What would you need to know?
scene journal
I: The door sketched on my question journal trembles. Something on the other side is chewing.
choice entry-question
option trust "How can I tell a calling from a convincing story?" -> question-trust
option risk "What makes a dream worth risking a good life for?" -> question-risk ; entry = 1
label question-trust
I: I write my one question: How can I tell a calling from a convincing story?
goto enter
label question-risk
I: I write my one question: What makes a dream worth risking a good life for?
goto enter
label enter
effect magic
scene passage
I: The ink opens into a doorway. I jump—and the pages suck me through. I land safely on a folded sack, with one shoe full of straw.
label outskirts
scene road
show Santiago surprised center
camera wide
I: Outside Tarifa in Andalusia, southern Spain. A young shepherd, Santiago, is taking his flock to a friend's stable. I am the unexpected helper keeping the gate clear.
Santiago [happy]: You arrived with the straw. Excellent timing. Watch that one; she is interested in your sleeve.
act Santiago reach "Santiago reaches past me to guide a curious sheep away from my sleeve."
I: I rescue the sleeve. Santiago calls the animal by name. These sheep are his livelihood, his company, and the reason he can travel.
Santiago [curious]: I have dreamed the same thing twice. A child takes me to the pyramids in Egypt and tells me there is treasure. I wake before seeing the exact spot.
I: He has just visited a woman who interprets dreams. She told him to go to Egypt and asked for a tenth of whatever treasure he finds.
Santiago [frustrated]: No directions. No treasure yet. At least she has asked for nothing in advance.
choice life
option know "Ask what he would miss about being a shepherd." -> know ; care = true
option travel "Ask why he became a shepherd in the first place." -> travel
label know
I: If you left, what would you miss first?
Santiago [worried, hesitant]: Knowing what to do. I know when one is ill, where the water is, which animal needs patience. They trust me.
I: He checks the gate once more. Competence can be a kind of home.
goto girl
label travel
I: How did you end up with a flock instead of staying in a town?
Santiago [happy, explain]: My family hoped I would become a priest. I wanted to see the world. My father gave me coins to buy sheep—and his blessing.
I: So he has already taken one difficult step toward a life he wanted. This new dream asks for another.
goto girl
label girl
Santiago [embarrassed]: There is also a merchant's daughter. I hope to see her in a few days. She listened to my stories last year.
I: He smooths his hair, then notices a piece of straw in it. The pyramids have competition.
Santiago [determined]: Come on. The flock is safe here. I need a book, and a little peace to read it.
label plaza
scene plaza
show Santiago neutral left
show Melchizedek curious right
camera two Santiago Melchizedek cut
I: Later, in the town square, an old man interrupts Santiago's reading. He asks about the book, then about the flock. Santiago's peace lasts approximately one page.
Santiago [skeptical]: Who are you?
Melchizedek [neutral]: Melchizedek. The king of Salem.
Santiago [skeptical]: A king. Here. Asking a shepherd questions.
Melchizedek [neutral, explain]: Give me a tenth of your sheep, and I will help you find the hidden treasure.
express Santiago worried
rest Santiago guarded
camera listener Santiago over 0.6
I: Santiago stops turning the page. The woman asked for a share of a possible future. This stranger wants animals that exist now.
camera two Santiago Melchizedek cut
choice evidence-question
option proof "Ask how he knows about the treasure." -> proof ; evidence = true
option price "Ask why his help costs real sheep." -> price ; cost = true
label proof
I: Santiago did not tell you about treasure. How do you know?
Santiago [determined]: Yes. And how do I know you are not working with the woman I met?
Melchizedek [neutral]: Look here.
goto sand
label price
I: Those sheep keep him fed. Why should he pay before he has found anything?
Santiago [determined]: I could promise you a share of the treasure instead.
Melchizedek [skeptical]: You would be offering something you do not yet possess.
goto sand
label sand
camera wide
act Melchizedek reach "Melchizedek bends to trace words in the sand with a stick."
I: Something beneath his cloak flashes in the sun. He covers it quickly. Santiago looks down at the writing.
express Santiago shocked
rest Santiago attentive
camera listener Santiago over 0.6
I: The stranger has written his parents' names, the name of his old seminary, and things Santiago has never told anyone.
Santiago [surprised, hesitant]: Those are not guesses.
camera two Santiago Melchizedek cut
Melchizedek [neutral, explain]: You are close to abandoning your Personal Legend: what you most deeply want to accomplish.
Santiago [confused]: Even if I want to travel? Even if I want to marry the merchant's daughter?
Melchizedek [neutral]: The calling belongs to the person. It need not impress a crowd.
I: He speaks as though desire connects a person to the whole world, and the world can help that person pursue it.
choice reading-sign
option limit "Say the names are remarkable, but the treasure is still untested." -> limit ; evidence = true
option meaning "Ask whether a Personal Legend is the same as becoming rich." -> meaning
label limit
I: Knowing those names is extraordinary. But it does not show us what is under the sand in Egypt.
Santiago [curious]: No. It gives me a reason to listen. It does not give me a map.
Melchizedek [neutral]: You still have a decision to make.
goto baker
label meaning
I: Is a Personal Legend just a grand name for getting rich?
Melchizedek [neutral, explain]: You asked about wealth. I spoke about what someone longs to accomplish.
Santiago [curious]: I became a shepherd to travel, not because sheep were going to make me a king.
goto baker
label baker
camera wide
I: Melchizedek points toward the bakery. He says its owner once wanted to travel, but chose a shop, security, and a more respectable position first.
Melchizedek [skeptical]: Other people's approval can grow louder than a person's own wish.
Santiago [worried]: Parents would rather their daughter marry a baker than a shepherd.
I: His eyes go to the shop. For a moment this is less about distant pyramids than a girl in a familiar town.
Melchizedek [neutral]: Bring a tenth of your flock here tomorrow, at this hour.
move Melchizedek exit
I: He returns the book and leaves. Santiago tries reading again. His eyes reach the same sentence three times.
Santiago [frustrated]: I only came here to have a dream explained. Now the rest of my life seems to require an answer.
label fort
scene fort
show Santiago worried center
camera wide
ambience wind
I: Santiago buys bread, passes a ticket window, and nearly decides to return to shepherding. Then he climbs the fort's ramp. I follow him to the wall.
activity Santiago walk right slow
Santiago [worried]: A ticket across the strait costs less than one sheep. Getting to Africa is possible. That makes it worse.
I: He paces. Beyond the water is a continent he has never visited. Behind him are fields he knows well enough to cross in darkness.
activity Santiago stop
look Santiago down
camera medium Santiago
Santiago [sad, hesitant]: I know which sheep is lame, which will have a lamb, which is always last to wake. You cannot simply replace knowing all that.
choice fort-question
option responsibility "Ask who will care for the flock if he leaves." -> responsibility ; care = true
option regret "Ask what staying might cost him." -> regret ; cost = true
label responsibility
I: If you go, who will look after them?
Santiago [worried]: Someone who wants to be a shepherd. They learned my ways; they could learn another person's.
Santiago [sad]: I do not like how possible that sounds.
goto decide
label regret
I: You can count the sheep you might lose. What might you lose by staying?
Santiago [worried, hesitant]: I might keep wondering. Or I might stop wondering and call that wisdom.
I: He looks across the strait. Neither answer makes him comfortable.
goto decide
label decide
look Santiago front
camera close Santiago
Santiago [determined]: I left my family once. They learned to live without me there every day. The flock can adjust too.
I: The wind presses his clothes against him. He cannot take the familiar life and the unexplored one in his arms at the same time.
Santiago [determined]: I am going to find out.
label six
scene plaza
show Santiago worried left
show Melchizedek neutral right
camera wide
I: At noon the next day, Santiago returns with six sheep. His friend has bought all the others; the friend had wanted to become a shepherd himself.
Santiago [surprised]: He bought them immediately. He thought it was a good omen.
Melchizedek [happy]: An encouraging beginning. Sometimes the first success gives us courage to continue.
act Melchizedek reach "Melchizedek reaches toward the flock as he inspects the six sheep."
I: He notices that one is lame. Santiago answers immediately.
Santiago [determined]: That one is the cleverest, and she gives the most wool.
express Melchizedek curious
I: Six is an easy number to write. Santiago knows six individual animals.
if care == true -> care-return else flock-return
label care-return
Santiago [worried]: You asked about their care. My friend wants the others. And this one needs someone who notices more than the limp.
goto payment
label flock-return
I: Yesterday he wanted answers about a treasure. Today he is still making sure a sheep is understood.
goto payment
label payment
Santiago [determined]: Now tell me where it is.
Melchizedek [neutral]: In Egypt, near the pyramids. To find it, learn to notice omens: signs that help you read the way.
express Santiago disappointed
camera listener Santiago over 0.6
I: Santiago's face falls. The location is the answer the woman already gave him.
Santiago [disappointed]: Six sheep. And I still do not know where to dig.
camera two Santiago Melchizedek cut
Melchizedek [neutral, explain]: I have also helped you make the decision to begin.
I: A butterfly passes between them. Santiago remembers his grandfather calling butterflies good omens. Melchizedek seems to know that memory too.
I: The old man opens his cloak, revealing a golden breastplate set with stones. He takes out one black stone and one white stone.
act Melchizedek give Santiago "Melchizedek places the two stones, Urim and Thummim, in Santiago's hand."
Melchizedek [neutral, explain]: Black means yes; white means no. When you cannot read the omens, ask a clear, objective question. But make your own decisions when you can.
choice stones
option ask "Ask why a guide gives advice to decide for yourself." -> own
option count "Ask what the payment actually bought." -> bought ; cost = true
label own
I: You give him stones to help decide, then tell him to decide for himself?
Santiago [curious]: Perhaps help is not the same as having someone live the journey for me.
I: He puts the stones away instead of asking them whether to board the boat.
goto spoon
label bought
I: Did the six sheep buy directions—or the courage to leave?
Santiago [worried]: I thought I was buying the first. He says he helped with the second. I will have to live with the difference.
I: He puts the stones in his pouch. They are small enough to carry. The decision is not.
goto spoon
label spoon
Melchizedek [neutral]: Before you go, a story.
I: He tells of a boy exploring a wise man's palace while carrying a spoon with two drops of oil.
Melchizedek [neutral, explain]: Watching only the oil, the boy misses the palace's wonders. Looking only at the wonders, he spills the oil. He needs to learn to attend to both.
Santiago [curious]: A shepherd can love travelling and still remember his sheep.
I: The story does not make his decision painless. It gives him something to carry into it: wonder does not erase responsibility.
if evidence == true -> evidence-return else unknown-return
label evidence-return
Santiago [determined]: You kept asking what we actually knew. I know he knew my secrets. I do not yet know what waits in Egypt.
goto farewell
label unknown-return
Santiago [determined]: I have a destination, two stones, and the money from my flock. I do not have a promise that every day will be easy.
goto farewell
label farewell
camera wide
act Melchizedek bow "Melchizedek makes a blessing over Santiago before taking charge of the sheep."
I: One sheep noses toward Santiago before following the others. He starts to reach out, then lets his hand fall.
express Santiago sad
camera listener Santiago over 0.6
I: For a moment he has nothing to do with his hands. Yesterday there was always something to check.
if cost == true -> cost-return else departure
label cost-return
Santiago [worried]: We talked about the cost. Now I can feel it. That does not tell me whether I am wrong.
goto departure
label departure
scene fort
show Melchizedek curious center
camera wide
ambience wind
I: The journal's pages lift in the wind. As Santiago leaves for the harbour, they give me one last glimpse from the fort: Melchizedek watching a small ship leave port.
I: Even the mysterious king hopes the boy will succeed. The sea has not become a road with answers written on it.
scene journal
if entry == 1 -> ending-risk else ending-trust
label ending-risk
I: My question returns: What makes a dream worth risking a good life for? Santiago has chosen. I have seen why the life he leaves is worth something too.
goto return
label ending-trust
I: My question returns: How can I tell a calling from a convincing story? The stranger has shown extraordinary knowledge. The journey still has to test his promise.
goto return
label return
I: Four small locks appear on the return door. Three correct answers will open it; if I miss, the journal will let me review and try again.
I: I have reached the edge of Santiago's familiar world. To learn what happens on the other shore, I will have to read on.
end
