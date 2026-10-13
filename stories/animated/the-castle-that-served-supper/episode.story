story 2
variable practical = 0 range 0 3 hidden
variable warned = false hidden
# Part I chapters 2–3. Six local choices; canonical events reconverge.
label classroom
scene classroom
show Hepting happy center
Hepting [happy, explain]: Last time, you helped a man prepare to become a knight. Tonight, he wants someone to make it official.
I: Mr. Hepting sets the leather journal on my desk. The little door scratched into its cover has a new brass knocker. It knocks from the inside.
Hepting [curious]: One written question. Choose it carefully. The journal has never offered an unlimited data plan.
scene journal
I: I write: What happens when everyone plays along with Don Quixote?
I: Ink slips between the drawn stones. The door opens. A warm wind smells of hay, supper, and a horse that has had a very long day.
effect magic
scene passage
I: The page catches my sleeve. My chair tips; the classroom stretches into a ribbon. I tumble between enormous turning pages, trying very hard not to become a footnote.
label arrival
scene inn
show Quixote happy center
camera wide
I: I land behind an inn in a pile of straw. Nothing broken. Several things itchy. Above me: a brightening moon. Around me: rural La Mancha, Spain, in the world of Don Quixote.
I: Since our last visit, he has slipped out before dawn and ridden all day on Rocinante. No grand adventures. Just heat, hunger, and one alarming discovery: nobody has actually knighted him.
Quixote [happy, celebrate]: My faithful helper! You arrive at the very gates of glory!
I: I am myself, the visiting student he remembers. Tonight I can help with small tasks and speak up. I cannot make this grown man obey me. My immediate job: get him settled without trouble.
I: Rocinante has already voted for the stable. Quixote points at the low whitewashed building as if it has towers.
Quixote [determined, insist]: A splendid castle. Its lord will surely grant me the order of knighthood.
I: A horn sounds outside. A swineherd is gathering pigs. Quixote straightens: apparently the castle has announced his arrival.
choice gates
option practical "An inn can still have excellent supper." -> supper-first ; practical += 1
option flourish "Shall I announce your appetite, my lord?" -> appetite
label supper-first
Quixote [curious, question]: Supper? An admirable preliminary to glory.
I: I lead the conversation toward the doorway. Correcting the building seems less urgent than feeding its visitor.
goto welcome
label appetite
Quixote [happy, celebrate]: Announce my name first. The appetite will make itself known.
I: His stomach immediately demonstrates its qualifications as a herald.
goto welcome
label welcome
scene inn
show Quixote happy left
show Tolosa surprised right
camera wide
I: Two women travelling with carriers have stopped here on their way to Seville. One is La Tolosa, a cobbler's daughter from Toledo. The other is La Molinera, a miller's daughter from Antequera.
I: They first retreat from the strange armed visitor. Then he calls them noble ladies, and their alarm turns to laughter.
Tolosa [surprised, question]: Noble ladies? Here?
Quixote [embarrassed, insist]: I intend only to serve you with the greatest courtesy.
I: The innkeeper steps out before embarrassment can turn into an argument. He is wary of the weapons, but clearly interested in the entertainment.
move Tolosa exit
show Innkeeper happy right
Innkeeper [happy, reassure]: Food, yes. A bed, no. If you require sleeplessness, we can provide a magnificent quantity.
I: He takes Rocinante to the stable. The women help remove Quixote's breastplate and backpiece. His makeshift helmet is another matter: green ribbons hold it fast.
move Innkeeper exit
show Tolosa skeptical right
Tolosa [skeptical, question]: We could cut the knots.
Quixote [worried, insist]: Certainly not!
I: Supper arrives: poorly prepared dried fish and very unpromising bread. His helmet turns eating into an engineering problem.
choice supper
option steady "Offer to steady the plate for Tolosa." -> plate ; practical += 1
option ribbons "Ask whether glory really requires these ribbons." -> ribbons
label plate
Tolosa [relieved, reassure]: Thank you. A helper who understands plates. We may survive supper.
I: I hold it steady while she feeds him. My first service to chivalry involves crumbs.
goto reed
label ribbons
Quixote [determined, explain]: What is a little inconvenience beside a noble undertaking?
Tolosa [skeptical]: At the moment, a very large inconvenience beside a very small mouth opening.
goto reed
label reed
I: The innkeeper solves the drinking problem with a hollow reed. Quixote accepts all this rather than sacrifice a ribbon.
I: He adapts an old ballad about Lancelot to celebrate the ladies serving him. Intertextuality, alive at supper: another hero's story supplies the role he thinks he is playing.
I: A passing worker plays a reed pipe. Quixote hears castle music. Fish, bread, and roadside noises have received an astonishing promotion.
label request
scene inn
show Quixote determined left
show Innkeeper curious right
I: After supper, Quixote corners the innkeeper in the stable. I wait at the doorway. He drops to his knees and refuses to rise until the man grants a favour.
act Quixote bow "Quixote bends low before the bewildered innkeeper."
Innkeeper [confused, hesitant]: Very well. The favour is granted. Now, what is it?
Quixote [happy, explain]: Knight me. I shall watch my armour tonight in your chapel, then ride out to help those in distress.
I: The innkeeper decides to play along. He claims his own adventurous past makes him qualified. His stories sound suspiciously like a career in cheating people.
Innkeeper [happy, explain]: Our chapel is being rebuilt. The courtyard will do perfectly. First: have you brought money?
Quixote [confused]: None. The histories never mention knights carrying it.
Innkeeper [skeptical, explain]: They do not mention clean shirts every morning either. Authors leave out obvious necessities. Carry money, shirts, and something for wounds.
choice supplies
option list "Help make a short supplies list." -> list ; practical += 1
option books "Ask what else the books leave out." -> omissions
label list
I: I count on my fingers: money, shirts, ointment. No dragons. A refreshingly achievable list.
Quixote [curious]: I shall obtain them. Even the greatest undertaking may permit a clean shirt.
goto vigil
label omissions
Innkeeper [skeptical, explain]: Who pays for the oats. Who washes the linen. What happens when no magician arrives with a cure.
I: Quixote promises to carry the supplies. A useful revision of his plan, even if the castle remains a castle.
goto vigil
label vigil
scene inn
show Quixote determined left
camera wide
I: Quixote places his armour on the trough beside the well. Shield on his arm, lance in hand, he begins his solemn watch. Moonlight makes every movement visible.
I: The innkeeper tells the guests about the ceremony. They gather at a distance to watch. The trough, unfortunately, is still where working animals need to drink.
show Carrier neutral right
I: A carrier approaches. His job is hauling goods with pack animals. He has come to water his team, not challenge a knight.
Carrier [confused, question]: Whose metal is blocking the trough?
Quixote [angry, insist]: Rash knight! Do not lay hands upon my armour!
choice warning
option water "Tell the carrier why Quixote is guarding it." -> warn ; warned = true
option quixote "Tell Quixote the animals need water." -> water
label warn
I: I explain quickly: he thinks this is a sacred vigil. Please wait.
Carrier [skeptical, insist]: My animals have waited all day. I am moving equipment, not invading a kingdom.
goto first-blow
label water
I: I point toward the waiting animals. They need the trough; they are not enemies.
Quixote [determined, insist]: Then let their master respect the arms of a knight.
I: He hears my words, but fits them into the same story. The carrier reaches past him.
goto first-blow
label first-blow
I: The carrier grabs the straps and flings the armour aside. Quixote invokes Dulcinea, drops his shield, and lifts the lance with both hands.
act Quixote attack Carrier "Quixote swings his lance. The carrier reels from the blow."
move Carrier exit
I: The man falls out of my sight beside the trough and lies unconscious. This is no comic duel. Quixote could have killed someone who only wanted water for his animals.
I: He collects the armour and resumes his watch. The quiet is worse than the shouting.
label second-blow
scene inn
show Quixote determined left
show CarrierTwo neutral right
I: Soon a second carrier arrives, unaware of what happened. He also reaches for the armour to clear the trough. This time Quixote offers no warning.
act Quixote attack CarrierTwo "A second swing strikes the other carrier; he staggers out of view."
move CarrierTwo exit
I: He is badly hurt too. People rush into the yard. The wounded men's companions begin throwing stones from a distance.
react Quixote block
effect shake
I: Quixote shelters behind his shield, refusing to leave the armour. I get behind the thick doorway. Stone chips jump from the wall outside.
show Innkeeper worried right
Innkeeper [worried, insist]: Stop! Stay back from him! All of you!
I: His earlier amusement has vanished. Quixote threatens the crowd; the innkeeper keeps shouting for them to stop. Fear and persuasion finally end the stoning.
I: The companions are allowed to carry the wounded men away. Nobody is laughing now.
choice aftermath
option cloth "Bring clean cloth to the companions." -> cloth
option space "Keep the doorway clear for them." -> space
label cloth
I: I fetch folded cloth from inside and hand it over without getting in their way. I cannot undo a blow. I can stop standing here uselessly.
goto cost
label space
I: I shift a stool and hold the door. The men need room to carry their friends. For once, the most useful thing I can do is make space.
goto cost
label cost
if warned == true -> remembered-warning else remembered-water
label remembered-warning
I: My warning was sensible. It still did not stop him. The carrier was trying to finish his work; Quixote was defending an imagined honour. Knowing that does not make the injured man less real.
goto ceremony
label remembered-water
I: I thought the ordinary explanation would reach him. It did not. A thirsty animal meant one thing to me; a hand on his armour meant something entirely different to him.
goto ceremony
label ceremony
scene inn
show Innkeeper worried left
show Quixote happy right
camera wide
Innkeeper [worried, explain]: Your watch is complete. No chapel is necessary. We shall perform the ceremony immediately.
I: He wants this guest gone before anyone else gets hurt. Quixote hears confirmation that he has passed his test.
Quixote [happy, celebrate]: At last!
I: The innkeeper fetches the book where he records straw and barley charges. A boy holds a candle. The two women stand nearby, carefully serious.
act Quixote bow "Quixote bows for the improvised ceremony."
react Innkeeper reach
I: Muttering over his account book as if reading prayers, the innkeeper gives Quixote a blow on the neck and a sword-tap on the shoulder. A feed ledger has become a book of ceremony.
move Innkeeper exit
show Tolosa neutral left
react Tolosa reach
I: La Tolosa belts on his sword. She wishes him success, keeping her laughter firmly under control. What she has seen tonight makes that easier.
Quixote [happy, reassure]: I shall remember this honour, Doña Tolosa.
I: He asks her to use the grand title. La Molinera fastens his spur and receives the same request. Ordinary travellers become noble ladies again, because his story requires them.
choice farewell
option honest "Tell him that helping must include noticing harm." -> honest
option practical "Remind him about the money, shirts, and ointment." -> reminder
label honest
I: I speak quietly: I want you to help people. But tonight two people were hurt. Please remember them when you call this a victory.
Quixote [confused, hesitant]: My purpose is to defend the helpless.
I: He means it. That is what makes the answer so difficult to hear.
goto departure
label reminder
I: Before the next adventure: the supplies. Especially the ointment.
Quixote [determined, reassure]: I have not forgotten. A knight must be prepared.
I: Prepared for wounds, at least. I wish he were also prepared to question what causes them.
goto departure
label departure
scene inn
show Quixote happy left
show Innkeeper relieved right
I: Quixote saddles Rocinante, embraces his host, and offers magnificent thanks. The innkeeper replies much more briefly. He does not ask for payment. Getting the guest out is enough.
act Quixote bow "Quixote offers a final, grand farewell to his host."
move Quixote exit
I: He rides away believing he has gained the authority to protect strangers. Behind him, the inn has injured guests and a host who would like a very ordinary morning.
move Innkeeper exit
I: In my pocket, the journal grows warm. Its little door opens onto my classroom. I step through before the pages can decide to throw me again.
label return
scene classroom
show Hepting curious center
I: I arrive upright. Mostly. Straw falls out of my sleeve onto Mr. Hepting's desk.
Hepting [curious, question]: So—did everyone playing along make it harmless?
I: I shake my head. The ceremony was pretend. The consequences were not.
if practical >= 2 -> practical-return else observation-return
label practical-return
I: I kept trying practical help: food, plates, supplies. Those things mattered, but they could not control what Quixote believed.
goto final
label observation-return
I: At first I wanted a good reply. By the end I wanted him to look at the person in front of him before deciding what role they played.
goto final
label final
Hepting [neutral, explain]: That is close reading: setting the grand words beside the details they fail to explain.
I: The journal closes. On its last page are four questions. No second question from me—just the journey asking what I noticed.
I: On the way in, I wanted to help him become a knight. Now I wish he had spent longer learning how to be someone’s neighbour.
end
