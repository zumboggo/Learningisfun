story 2
variable heard = false hidden
variable checked = false hidden
variable policy = 0 range 0 2 hidden
variable followup = false hidden
label opening
scene classroom
show Hepting curious left
show Lin skeptical right
camera wide
I: The Teaching Stone warms beside my notebook. A tiny doorway appears in its surface. Someone on the other side is asking not to be sent home.
Hepting [worried]: Two kingdoms have promised peace. One person wants to know whether the promise includes him.
Lin [skeptical]: Please tell me the stone has a customer-service department.
camera close Hepting
Hepting [embarrassed]: It has us.
camera wide
I: I touch the doorway. The classroom dissolves into hot air and the scratch of a reed pen.
effect magic
scene courtyard
show Dedu worried left
show Aruna scared right
camera wide
I: Egypt, around 1259 BCE. I am helping Dedu, an Egyptian official handling messages after a peace treaty. A man waits by the gate.
Dedu [determined]: You will help me decide what to recommend about his return. I can delay his departure briefly. I cannot rewrite the kings' agreement.
Aruna [pleading]: My name is Aruna. Please write that before you write anything else.
camera close Aruna
I: His mouth tightens. The word on Dedu's board is fugitive: someone who has fled. It contains no name at all.
camera wide
Dedu [neutral]: Egypt's Ramesses II and Hatti's Hattusili III have agreed to stop fighting and help one another. Hatti is a kingdom to our north.
Dedu [worried]: Returning people who fled is part of their agreement. The Hittite envoy is waiting for our answer.
choice first_voice
option person "Hear Aruna before discussing his return." -> hear ; heard = true
option terms "Read the treaty before making any promise." -> terms
label hear
camera medium Aruna
Aruna [worried]: I fled after a dispute with a powerful household. I fear what happens when the royal messenger leaves.
Aruna [sad]: My brother is still there. If I return, I may see him. If I return without protection, he may have to watch what happens to me.
camera close Dedu
react Dedu sigh
I: Dedu stops writing. For a moment the next word has to wait for the person it describes.
goto shared_terms
label terms
camera medium Dedu
Dedu [neutral]: Good. We must know what we have promised before we tell him what we can do.
camera close Aruna
react Aruna sigh
I: Aruna looks toward the gate. Careful reading is taking time from someone who has already spent the morning afraid.
Aruna [worried]: Read the part about what happens after I cross it.
label shared_terms
camera wide
show Dedu curious left
show Aruna worried right
Dedu [neutral]: Here is the important point. The return provisions include protection against punishment and harm to the returned person's household.
I: He explains the treaty in ordinary words. Return and protection belong in the same discussion; the document is not simply permission to hand someone over.
Aruna [skeptical]: A king can promise that. Can the people in my village hear him from here?
Dedu [worried]: That is a question about implementation: how words become actions. I cannot honestly promise that a royal order controls every person.
I: My task has changed. I am not choosing whether peace is good. I am asking what responsible peace requires in this case.
move Aruna exit
show Tili determined right
Dedu [neutral]: Tili is the Hittite envoy. Aruna will wait in the shade while we examine the request.
Tili [determined]: Our king's promise matters. If every local officer refuses to act until all fear disappears, no agreement can function.
Dedu [curious]: And if we act without checking anything, the promise can become a convenient excuse.
choice evidence
option check "Compare the request and ask who will receive Aruna." -> investigate ; checked = true
option testimony "Record Aruna's account and ask the envoy to answer it." -> testimony
label investigate
act Dedu give Tili "Dedu offers the request for Tili to examine; the papers are mimed."
Tili [neutral]: The request identifies Aruna. But it names the escort, not the official responsible after arrival.
Dedu [worried]: Then we know who takes him away. We do not yet know who answers if the protection fails.
I: I mark that gap. It is evidence of missing information, not proof that Tili intends harm.
goto hearing
label testimony
move Dedu exit
show Aruna worried left
show Tili neutral right
Aruna [worried]: The household I fear has local influence. A promise given far away may not stop it.
Tili [worried]: I cannot investigate that household from this courtyard. I can send your account with the return request.
I: We now have his specific concern on record. It is testimony worth taking seriously, but it has not been independently confirmed.
goto hearing
label hearing
scene courtyard
show Tili neutral left
show Dedu worried right
camera wide
Tili [sad]: My cousin never returned from an earlier campaign. I carry messages because I would rather count journeys than funerals.
camera close Dedu
react Dedu nod
I: Dedu's expression softens. The envoy is protecting people too; most of them cannot stand in this courtyard.
camera wide
Dedu [neutral]: Egypt also has families who need this peace. A dispute over one return does not automatically mean war, but repeated broken commitments can destroy trust.
Tili [skeptical]: Your suspicion has a cost. So does my confidence. I would prefer a small, clearly stated request to a limitless demand.
I: The treaty is already an agreement between rulers. Our local handling can support it or strain it; we are not voting to erase history.
choice approach
option direct "Explain Aruna's fear plainly and request a named protector." -> direct
option formal "Ask Tili to restate the protections formally in the record." -> formal
label direct
Dedu [worried]: He fears the gap between the royal promise and the people who meet him. Who will take responsibility there?
camera close Tili
react Tili sigh
Tili [worried]: I hear the distinction. I can request a name. I cannot produce an honest answer by inventing one.
goto decision_setup
label formal
Dedu [determined]: Please confirm that the return includes the treaty's protections. We will keep your answer with his account.
camera close Tili
react Tili nod
Tili [neutral]: I confirm the commitment. But recording it again does not give me eyes in every village.
goto decision_setup
label decision_setup
camera wide
move Tili exit
show Dedu worried left
show Aruna worried right
I: Tili steps away to prepare his message. Aruna returns, holding a piece of cord between his fingers.
Aruna [sad]: My brother tied this around my bundle so it would not fall apart. He is better at knots than advice.
camera close Dedu
Dedu [curious]: What was his advice?
camera medium Aruna
Aruna [embarrassed]: Do not get into trouble. He gave it after I had already left.
camera wide
I: I almost laugh. Aruna does, once. Then he asks which road he will be taking.
Dedu [neutral]: We speak of ma'at: truth, justice and right order. Keeping peace matters. So does being truthful about a person's protection.
Dedu [worried]: Naming that ideal does not settle which action serves it. We still owe reasons to the people who carry the risk.
if heard == true -> personal_callback else document_callback
label personal_callback
Aruna [worried]: You heard about my brother first. Do not let that become a reason to forget everyone else's family.
goto evidence_callback
label document_callback
Aruna [worried]: You read before promising. Tell me where the promise stops, too.
goto evidence_callback
label evidence_callback
if checked == true -> gap_callback else witness_callback
label gap_callback
Dedu [neutral]: Your check found an unnamed receiving official. That gives us a specific question, not an unlimited excuse to wait.
goto options
label witness_callback
Dedu [neutral]: Your record preserves his concern. We still lack independent confirmation and a named receiving official.
label options
I: Three recommendations lie before me. Each protects something real and asks someone to bear a cost.
Dedu [neutral]: Return now under the treaty, and we keep the commitment while accepting uncertainty. Delay briefly for a named protector, and Aruna remains here while trust and time are spent.
Dedu [worried]: Or refuse this return and seek a higher ruling. He stays out of the feared place, but we openly challenge the request and may prolong his separation from home.
choice recommendation
option return "Recommend return now, with the protection and concern recorded." -> return_now ; policy = 0
option delay "Recommend a short delay to seek a named receiving protector." -> delay_now ; policy = 1
option refuse "Recommend refusing this return and asking a higher official to review." -> refuse_now ; policy = 2
label return_now
move Dedu exit
show Tili neutral left
show Aruna scared right
Tili [relieved]: I will carry the concern with the protection. I will not describe fear as consent.
camera close Aruna
react Aruna sigh
Aruna [worried]: I wanted a different answer. At least let my brother know someone here remembers my name.
I: Dedu accepts the recommendation. Aruna leaves with the escort. The gate closes quietly; quiet is not evidence that he is safe.
goto after_decision
label delay_now
move Dedu exit
show Tili worried left
show Aruna relieved right
Tili [skeptical]: I will request the name. Tell me when you will review the delay. A short wait must not become an unspoken refusal.
camera close Aruna
react Aruna nod
Aruna [relieved]: Tonight I can sleep without waiting for that gate to open. Tomorrow I will still want an answer.
I: Dedu grants a brief delay and a review the next morning. We have bought time with an explanation; we have not bought certainty.
goto after_decision
label refuse_now
move Dedu exit
show Tili disappointed left
show Aruna worried right
Tili [determined]: I will report the refusal accurately. You must explain why you believe this case justifies it.
camera close Aruna
react Aruna sigh
Aruna [worried]: I can breathe. I also do not know when I will see my brother. Please do not call this a happy ending for me yet.
I: Dedu holds the return for a higher ruling. Aruna remains under local protection. The dispute is now larger and more visible.
label after_decision
scene courtyard
show Dedu worried left
show Tili neutral right
camera wide
I: By evening, the reply from the destination has not arrived. A message takes time to travel. None of our choices could make the road shorter.
Dedu [neutral]: We can still decide what responsibility continues after today's answer.
Tili [curious]: You have one remaining messenger before night. What should that messenger carry?
choice responsibility
option follow "Ask for a later welfare report and record who must follow up." -> welfare ; followup = true
option reasons "Send our reasons to the reviewing authority and request a written answer." -> review
label welfare
Dedu [determined]: I will be responsible for checking the reply. If it fails to arrive, the absence will remain in the record.
Tili [worried]: That may help us discover a problem. It cannot undo harm already done, or guarantee that a report tells the whole truth.
I: We send a question that will outlast our conversation. Accountability needs a person who must answer, not just a hopeful sentence.
goto morning
label review
Dedu [determined]: I will send the competing reasons, including the strongest argument against our own recommendation.
Tili [curious]: That gives the next official something better than an accusation. It does not tell us how Aruna is doing tonight.
I: We make our reasoning open to challenge. A defensible account matters, but it cannot substitute for news of a person.
label morning
scene courtyard
show Dedu neutral left
show Tili worried right
camera wide
I: The next morning, Tili brings confirmation that the message was received. There is still no independent report about conditions at the destination.
if policy == 0 -> return_result else other_result
label return_result
Dedu [worried]: Aruna is on the journey. Our responsibility does not end because the courtyard is empty.
I: The return went ahead. We do not know yet whether the protection will hold. The absence of news cannot prove that we chose wisely or badly.
goto responsibility_callback
label other_result
if policy == 1 -> delay_result else refuse_result
label delay_result
Dedu [worried]: Aruna is still here. At today's review we must decide whether the missing answer justifies more delay.
I: The delay protected him overnight and prolonged uncertainty. It has made our next decision more informed about the gap, not magically easy.
goto responsibility_callback
label refuse_result
Dedu [worried]: The higher official has received our request. Aruna stays here while it is considered; Tili's objection travels with it.
I: Our refusal has held for now. We have prevented this immediate return, not settled what either kingdom owes him.
label responsibility_callback
if followup == true -> follow_callback else reasons_callback
label follow_callback
Tili [neutral]: Your welfare question is still outstanding. Dedu's name stands beside the duty to pursue it.
I: A blank space in the record now means unfinished work. Yesterday it might have meant that nobody asked.
goto last_choice
label reasons_callback
Tili [neutral]: Your explanation includes the other side fairly. The reviewing official can see what your recommendation costs.
I: Our record contains reasons, not a claim that everyone agreed. News about Aruna's future still needs someone to seek it.
label last_choice
Dedu [curious]: Before you go, change one fact in your mind. That is how we discover what our reasons actually depend on.
choice test_principle
option safer "Suppose reliable witnesses confirm that returned people are protected." -> safer
option danger "Suppose reliable witnesses report recent harm to returned people." -> danger
label safer
Dedu [neutral]: Stronger evidence of protection could support return. Would it change your recommendation, or is your objection about something else?
I: I do not have to abandon my principle. I have to explain whether this new fact changes the reason it applies.
goto home
label danger
Dedu [worried]: Credible reports of harm could support delay or refusal. What evidence would be strong enough, and who would carry the cost of waiting?
I: I do not have to abandon my principle. I have to explain whether this new fact changes the reason it applies.
label home
effect magic
scene classroom
show Hepting curious left
show Lin worried right
camera wide
I: The Teaching Stone cools. My notebook is still open. The tiny doorway has become an ordinary dark line.
Lin [curious]: Did you save the peace?
I: I helped with one person's case inside a much larger peace. It would be comforting to make the story simpler than that.
camera close Lin
react Lin nod
I: Lin waits instead of supplying an answer. I find that more helpful than I expected.
camera wide
Hepting [neutral]: The historical treaty joined Egypt and Hatti in peace and mutual obligations. Its return provisions also addressed protection. Our courtyard case explored the difficulty of acting on those promises.
Hepting [curious]: Your choice is not your quiz score. Know what the agreement said, distinguish evidence from a promise, and compare what each response protects and risks.
Lin [determined]: And remember the name. Aruna, not just a problem successfully filed.
I: I write the name first. Then I leave room for the reason someone could disagree with me.
end
