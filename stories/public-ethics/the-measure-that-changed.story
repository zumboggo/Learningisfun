story 2
variable checked = false hidden
variable private = false hidden
variable policy = 0 range 0 2 hidden
variable review = false hidden
label opening
scene path
I: Beside the path, something catches the light: a dark stone with a thin gold circle running through it. I pick it up. It is warm, although it has been lying in the shade.
I: Inside the circle I see a courtyard, a grain store, and people waiting with empty baskets. Someone needs help. I touch the circle.
effect magic
I: The path folds into light. Warm wind brushes my face. I step through, still myself, still holding the stone.
label arrival
scene village
show Seneb happy center
camera medium Seneb
I: The light opens into sunlight. I stand beside a grain store in a fictional Egyptian village, around 1900 BCE. A line of people waits in the courtyard.
I: Seneb, the store's scribe, puts a wooden measure into my hands. Apparently I am his assistant. Apparently assistants are expected to know things.
Seneb [happy, explain]: Fill to the line. Level the top. Tell me the amount. If you can do those three things, we may survive the morning.
I: I ask whether looking confident counts as a fourth thing.
Seneb [laughing]: Only until someone counts again.
I: He steadies my wrist as I pour. The scratched line inside the measure is crooked. The rim is smooth from years of hands.
Seneb [neutral]: Today each household on our list receives two measures. Different households need different amounts; this emergency rule is simply what the village agreed for this morning.
Seneb [worried]: The reserve is small. Anything extra must come from somewhere. Record what leaves, even when the reason is a good one.
show Iset worried right
camera wide
I: Iset reaches the front. Seneb recognizes her before she gives her name. His hand rests on her shoulder for a moment.
Iset [worried, hesitant]: My sister is still ill. I could not take work yesterday.
I: Seneb fills her second measure above the line. He pours another half measure into her bag, then writes two on the account.
I: When he catches me watching, his smile disappears. The measure suddenly feels heavier.
choice first-look
option records "Compare the account with what actually left the store." -> inspect ; checked = true
option household "Ask Iset what the extra grain means for her household." -> listen
label inspect
camera medium Seneb
I: I count the pours again. Two measures and a half left the store; the record says two. I quietly point to the difference.
Seneb [embarrassed, hesitant]: Your counting is better than your timing.
I: Iset folds the mouth of her bag. I have learned something important, but she looks as if I have accused her.
goto first-join
label listen
camera medium Iset
Iset [sad]: It means I can stay with my sister this afternoon instead of leaving her alone to look for work.
I: Her answer makes the extra grain feel obvious. Then I look down the line. I cannot see the lives waiting inside the other bags.
goto first-join
label first-join
scene village
beat awkward-arrival Kha Seneb "Kha waits beside the doorway, turning an empty bag in his hands. Seneb reaches for the next familiar name."
Kha [embarrassed, hesitant]: I repair baskets. We arrived here recently. My little brother has been ill too.
Seneb [worried]: You are on today's list. Two measures.
Kha [confused]: I am not asking you to remember me. I am asking whether the same need counts.
I: He has seen Iset's bag. He has not seen the account. He thinks I understand the rule better than he does.
choice confrontation
option quietly "Ask Seneb to step aside before the accusation spreads." -> private-talk ; private = true
option openly "Ask about the unequal measures where everyone can hear." -> public-talk
label private-talk
beat private-confession Seneb Kha "I ask Kha to give us a moment. He stays by the door, close enough to know that his question has not disappeared."
move Kha exit
camera medium Seneb
Seneb [sad, hesitant]: When my mother was ill, Iset brought food before anyone asked. I remember the bowl she carried. I remember being hungry.
I: I ask whether he would have helped a stranger with the same need.
Seneb [embarrassed]: I would like to say yes. But I didn't ask the stranger.
goto confession-join
label public-talk
beat disagreement Kha Seneb "My question carries across the courtyard. Seneb stiffens; Kha stops twisting his bag."
Seneb [angry, insist]: Do you think I am feeding a friend for pleasure?
Kha [worried]: I think you know what her hunger looks like.
I: Seneb lowers his hand. He says Iset once fed his family when his mother was ill. People in the line begin offering judgments before he finishes.
Seneb [sad]: You have made this visible. Help me keep it from becoming a punishment for her.
goto confession-join
label confession-join
show Seneb worried left
show Kha worried right
camera wide
if checked == true -> checked-account else discover-account
label checked-account
I: I show Seneb the entry I checked. I can defend helping Iset and still refuse to call two and a half measures two.
goto account-join
label discover-account
I: I compare the record with the pours. Two and a half measures left the store; only two were recorded. Listening to Iset did not make this discrepancy disappear.
goto account-join
label account-join
Seneb [worried]: Correcting it may cost me this work. Leaving it false makes the next person answer for missing grain.
Kha [determined]: I don't want her food taken away. I want to know why my brother's illness weighs less.
I: I want an easy villain. Instead, I have a kind act, a false entry, and someone who was never asked.
choice evidence
option together "Hear both households, with permission, and check the reserve." -> compare-needs
option stock "Count the reserve first, then hear the households separately." -> count-stock
label compare-needs
show Iset worried left
show Kha worried right
I: I ask whether they are willing to describe their needs without giving private details to the whole queue. Both agree to speak beside the doorway.
Iset [determined]: Help him too. But please don't make me prove my sister is suffering more than his brother.
Kha [relieved]: I don't want a competition either.
I: Their circumstances differ, but both report illness and lost work. We still need to know what the store can provide.
goto evidence-join
label count-stock
show Seneb neutral center
camera medium Seneb
I: Together we count what remains after today's promised shares. There is one spare measure. Knowing the limit makes every proposal less comfortable.
I: Then I hear Iset and Kha separately. Both report illness and lost work. Neither wants their relative's suffering discussed by the whole line.
Seneb [sad]: A record can show how much we have. It cannot decide whose need matters.
goto evidence-join
label evidence-join
show Seneb worried left
show Kha worried right
camera wide
I: After today's promised shares, one spare measure remains. Iset's extra half has already left. The official responsible for the store is away until tomorrow.
I: We can leave today's allocations as they stand, give Kha the same extra half and keep half in reserve, or make a limited emergency fund open to everyone who meets stated criteria.
I: None of these creates more grain. None guarantees that the next person through the door will need less.
choice allocation
option fixed "Keep today's remaining shares fixed; take exceptions to tomorrow's review." -> fixed-rule ; policy = 0
option matching "Give Kha an extra half too; preserve the remaining half for emergencies." -> matching-rule ; policy = 1
option open "Use the spare measure for a small, openly explained emergency fund." -> open-rule ; policy = 2
label fixed-rule
beat quiet-aftermath Kha Seneb "Seneb puts the lid on the reserve. Kha watches the movement without interrupting."
I: I explain that today's common rule will stand for the remaining distributions. Iset keeps what she received; her exception will be recorded, not quietly repeated.
Kha [disappointed]: So the first person keeps the advantage, and the next person gets a better explanation.
I: He is right about the cost. I help arrange a request for tomorrow, knowing a request is not food tonight.
goto policy-join
label matching-rule
beat reassurance Kha Seneb "Seneb measures another half for Kha. This time I watch him write the amount that actually leaves."
Kha [relieved]: Thank you. And the next household?
I: Half a measure remains. I have answered the visible unfairness between these two people. I have not yet made a rule for everyone else.
Seneb [worried]: We should not have to know a person's story by accident.
goto policy-join
label open-rule
beat disagreement Kha Seneb "We explain a small emergency fund. The first objection comes from someone who has already waited all morning."
I: We propose a limited supplement for households facing illness and lost work, checked privately by two people. We explain the remaining stock and the possibility of a reduced supplement if more qualify.
Kha [worried]: Some cannot wait here to ask. Someone needs to tell them.
I: We set aside time to reach absent households before releasing the final reserve. That makes the process more open, but slows help people need now.
goto policy-join
label policy-join
scene village
show Iset worried left
show Seneb sad right
I: The queue begins moving again. Iset returns without her grain bag. For a dreadful moment, I think she has brought it back.
Iset [sad]: People are saying I asked him to lie.
Seneb [determined]: You didn't. I chose the amount. I chose the entry.
choice correction
option together "Ask Seneb to correct the account with a witness and explain his decision." -> owned-correction
option independent "Write my observation for an independent review alongside his explanation." -> separate-correction
label owned-correction
beat private-confession Seneb Iset "Seneb names his own decision. Iset listens without reaching to comfort him."
I: We preserve the original entry and add the actual amount with an explanation and a witness. The correction does not make the first entry true.
Seneb [sad]: I wanted to spare you a difficult afternoon. I made you carry my secret instead.
Iset [worried]: Then stop asking your good intention to carry the whole answer.
goto correction-join
label separate-correction
beat quiet-aftermath Seneb Iset "I place my separate account beside Seneb's. For once, he does not tell me where to write."
I: I record what I saw and ask that both accounts go to tomorrow's review. Iset's private circumstances stay out of the public explanation.
Seneb [disappointed]: You do not trust me to tell it.
I: I say that an independent account can protect his explanation as well as test it. He nods, but the distance between us remains.
goto correction-join
label correction-join
if private == true -> privacy-callback else public-callback
label privacy-callback
Seneb [relieved]: You gave me room to speak before the whole courtyard spoke for me.
I: Kha reminds us that a private conversation must still produce an answer the waiting people can question.
goto legacy
label public-callback
Iset [worried]: People heard the accusation. Make sure they hear the correction too.
I: We explain that the altered entry was Seneb's decision, not Iset's request. I cannot make everyone forget the first version.
goto legacy
label legacy
show Kha curious left
show Seneb worried right
camera wide
Seneb [curious]: We speak of ma'at: truth, justice, right order. I made the line quiet. That did not make the account true.
Kha [determined]: Or make me heard.
I: The Teaching Stone warms in my pocket. I have time to leave one practical arrangement before it takes me home.
choice leaving
option review "Leave a record, two named reviewers, and a way to raise a concern privately." -> shared-review ; review = true
option promise "Ask Seneb to explain and uphold the rule personally each morning." -> personal-promise
label shared-review
beat reconciliation Kha Seneb "Seneb offers Kha the account to check. Kha takes his time before accepting it."
I: They agree that two people will review exceptions and explain available help, including to households not waiting at the store. Anyone can ask for a private correction.
Seneb [worried]: This takes time we could spend distributing grain.
Kha [determined]: Then we will have to share the work. A door no one has time to open is not much of an appeal.
goto return
label personal-promise
beat reassurance Kha Seneb "Seneb promises to explain the rule every morning. Kha looks from his face to the account."
Seneb [determined]: I know what I missed. I will ask, not assume.
Kha [worried]: And when you are ill? Or when the complaint is about you?
I: His promise matters. It still leaves too much resting on one person's memory and courage. I say that aloud before I leave.
goto return
label return
I: Seneb offers me the measure. I leave it in his hands and touch the scratched line once more. Earlier it told me where to stop pouring. Now it reminds me to ask who drew it—and who can question it.
effect magic
scene path
I: I step back onto the path. The grain dust is gone from my hands. I still rub my fingers together as though I could feel it.
I: Did I make everyone happy? No. Someone waited, someone felt exposed, and someone still had to decide what happened tomorrow.
I: Then what changed?
if policy == 0 -> reflect-fixed else reflect-other
label reflect-fixed
I: I learned that a consistent rule can preserve an earlier advantage. Explaining a cost does not remove it.
goto final-reflection
label reflect-other
if policy == 1 -> reflect-match else reflect-open
label reflect-match
I: I learned that correcting unfairness between two people does not tell you what to do for the third.
goto final-reflection
label reflect-open
I: I learned that opening help to more people also requires time, information and a way to reach those who are absent.
goto final-reflection
label final-reflection
if review == true -> final-review else final-promise
label final-review
I: We left something people could use after the helpful stranger disappeared. Whether they use it well is still their work.
goto closing
label final-promise
I: I left a sincere promise. I also left a question: who makes the rule answerable when the person promising is the problem?
goto closing
label closing
I: Compassion helped me notice a person. Fairness asked me to notice the people I had missed. Truth kept the record open to both.
I: I turn the stone over. Its circle has no beginning and no end. Next time someone asks for help, I want to remember the people outside my circle too.
end
