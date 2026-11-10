story 2
variable first = 0 range 0 1 hidden
variable route = 0 range 0 2 hidden
variable aid = 0 range 0 1 hidden
label institution_opening_v1
scene office
I: A hand closes the folder over the score sheet. For a moment it rests on the cover, as though paper might keep a promise.
label classroom
scene classroom
show Kevin curious left
show Hepting curious right
camera two Kevin Hepting cut
Kevin [curious]: Last time, a father stole a sheep. Today I would like an ethical problem with fewer relatives.
Hepting [happy]: What if an organization protects its own people?
Kevin [skeptical]: A family with a logo. Excellent. We have improved the stationery.
I: The Teaching Stone glows beside our book. I write: When should loyalty mean speaking against the people who helped you?
label taxi_arrival
I: The taxi rolls through the classroom wall. The driver opens the door before I can add a request for an easy answer.
I: Mr. Hepting comes with me. The book sits between us, open to the question.
label taxi_departure
I: We sweep over the school field and through the next bright opening, toward the Bridge Scholarship Trust.
label arrival
scene office
show Mara happy left
show Kevin happy right
camera two Mara Kevin cut
perform Mara reach repeat 2 steady
I: Director Mara is packing school bags. One zip catches. She works it loose, then checks it again before passing the bag on.
Mara [happy]: Nobody should arrive at school carrying our good intentions in a broken bag. Thank you for helping today.
Kevin [curious]: You give out scholarships as well?
Mara [proud]: Twenty this year. The committee scores numbered applications before it sees names. You are helping check the final totals against the signed score sheets.
I: She gives me the limited audit folder and explains what I may read. Private family documents stay in the locked cabinet. Mr. Hepting joins the packing volunteers next door.
Kevin [happy]: So who you know can't help you.
Mara [happy]: That's the promise.
I: My friend Rafi told me about this place. They once paid his bus fares. This year he applied for tuition support and missed the final scholarship by one place.
I: I compare the two authorized sheets. Application 41 has 78 on the committee's signed total and 86 on the final list. Rafi's application, 17, has 84 on both.
I: There is no correction note. The extra eight points move application 41 above the funding line. My pen stops over the tick box.
choice first_check
option private "Ask Mara privately to explain the mismatch before making an accusation." -> check_private ; first = 0
option record "Leave the total unchecked and ask for the signed record of the change." -> check_record ; first = 1
label check_private
Kevin [curious]: Could this be a copying error? These totals disagree.
Mara [worried]: No. I changed the final list. I should have told the committee.
Kevin [worried]: Then I need to understand why before I sign anything.
Mara [sad]: Thank you for asking me here, before the whole room heard.
goto admission
label check_record
Kevin [determined]: I can't mark this as checked. Who approved the extra points?
Mara [worried]: Nobody approved them. I entered them myself.
Kevin [worried]: I'll keep both totals visible in the audit note. A neat tick would hide the difference.
Mara [sad]: Yes. It would.
label admission
Mara [worried]: Application 41 is Aya. Her mother has volunteered here for eleven years. Last month she lost her job. Aya may have to leave school.
Kevin [confused]: Did the scoring rules allow you to add points for that?
Mara [sad]: No. Hardship is already part of the committee's score. I wanted to recognize what her family has given us.
camera listener Kevin over 0.65
I: A minute ago I liked this room because the rules kept names outside. Now a name has walked straight through them.
camera two Mara Kevin cut
Kevin [worried]: Rafi also needs the money. The list says he wasn't selected.
Mara [pleading]: Our renewal decision is next week. A sponsor might withdraw if this becomes a scandal. Then next year's students could lose support too.
perform Mara reach repeat 1 steady
I: Mara closes the folder over the score sheet. Her hand rests on it, then moves away. She leaves it with me.
Mara [worried]: Think of everyone you'll hurt by telling the truth.
camera listener Mara over 0.65
Kevin [sad]: And everyone we might hurt by keeping this arrangement?
I: Mara looks toward the school bags. Neither of us can see next year's students. Rafi is waiting outside.
label friend
scene office
show Rafi worried left
show Kevin worried right
camera two Rafi Kevin cut
Rafi [worried]: Did they explain my result? I need to answer another school's offer tomorrow.
Kevin [sad]: I found a score change that affected the final place. Mara admits making it outside the rules. I haven't seen all the applications.
Rafi [angry]: Then send me the folder. If we ask politely, they'll politely lose it.
Kevin [worried]: It has another student's identity. She may not know what happened.
Rafi [determined]: I don't need her life story. I need something they cannot wave away.
choice evidence
option summary "Offer a factual summary and ask Rafi what outcome he needs." -> evidence_summary
option joint "Offer to request the original records together through the appeals contact." -> evidence_joint
label evidence_summary
Kevin [determined]: I'll write what I actually checked: both totals, the missing approval, and Mara's admission. No private family details.
Rafi [worried]: Put your name on it too. Don't leave me looking like a disappointed applicant inventing excuses.
Kevin [determined]: I will. And what do you need first?
Rafi [sad]: An answer before tomorrow. An apology cannot pay a deposit.
goto aya
label evidence_joint
Kevin [determined]: Let's ask the appeals contact to preserve both versions and give you the record of how your result was decided.
Rafi [skeptical]: Together? You won't disappear once the meeting becomes awkward?
Kevin [determined]: Together. I'll state what I saw. You decide what you want to ask for.
Rafi [worried]: A decision before tomorrow. I can't keep another school waiting forever.
label aya
show Aya worried center
camera wide
I: Aya arrives carrying a borrowed calculator for the packing team. Rafi steps aside so she can put it down. Being angry has not made him forget the doorway.
Aya [worried]: Mara called me. She says there is a problem with my award. I didn't ask her to change my score.
Rafi [sad]: I didn't say you did.
camera two Aya Rafi cut
Aya [sad]: I've already told my mother. She cried. Now I have to go home and explain that somebody helped us without asking us.
Rafi [worried]: I need the scholarship too. I can't make this fair by pretending I don't.
I: Aya puts the calculator beside the bags. Nobody has offered her a sensible place to put her shame.
label decision
scene office
show Mara worried left
show Kevin determined right
camera two Mara Kevin cut
I: Mara brings the folder back open. She will pause the disputed payment while we act today. Rafi's deadline is tomorrow; the other nineteen awards are already funded.
Mara [worried]: There is an appeals contact on the board, separate from me. An outside reviewer can also examine the scores. I don't control either decision.
Kevin [curious]: Has the sponsor actually threatened to leave?
Mara [sad]: No. That is my fear, not a message from them. Their renewal is undecided.
I: Three routes are possible. None guarantees silence, speed, or continued donations. None gives me the right to choose the scholarship winner myself.
choice response
option internal "Seek a documented correction today, with board oversight and notice to affected students." -> internal ; route = 0
option review "Request an independent review before releasing the disputed award." -> review ; route = 1
option disclose "Give affected applicants a redacted account and help them request a board hearing." -> disclose ; route = 2
label internal
Mara [relieved]: I can show the original sheets to the appeals contact now. The committee can verify the correction. I won't describe it as a typing mistake.
Kevin [determined]: Rafi and Aya need the real explanation, and a record they can challenge.
Mara [worried]: Yes. This keeps the first response inside the organization. It still means telling people I failed them.
I: The board contact requests both versions and checks the committee signatures. We stay until she confirms she has them. This route is fast, but asks students to trust the institution that let the change happen.
goto cost
label review
Mara [worried]: The outside reviewer charges for urgent work. The board will have to use our small administration reserve.
Kevin [determined]: That cost matters. So does having someone beyond your team examine the decision.
Mara [sad]: I'll send the unchanged originals and my written admission. The reviewer gets to ask questions we didn't choose.
I: The reviewer agrees to examine this award today and the full scoring process afterward. Rafi gets a confirmed response time before his other offer expires. A separate reviewer can reduce one conflict of interest; she still needs evidence and a process people can challenge.
goto cost
label disclose
Mara [worried]: Once applicants have that account, we cannot decide where it travels.
Kevin [determined]: They have a stake in the process. I'll state the verified change and leave out names and private hardship records. I won't claim the whole competition was rigged.
Mara [sad]: I will confirm the account and give them the board's appeals contact.
I: Applicants receive the redacted facts through the charity's contact channel. Several request an urgent board hearing. Their questions are harder to contain; the record is also harder to bury. Rafi receives a response time before tomorrow's deadline.
label cost
scene office
show Aya sad left
show Kevin worried right
camera two Aya Kevin cut
I: While the decision is checked, Aya waits with me. The bags are packed now. Her mother is still volunteering in the next room.
Aya [sad]: If the points go back, I lose the place. I know that's not Rafi's fault. Knowing doesn't make school cheaper.
Kevin [worried]: Mara says the emergency fund has a little money. It is separate from these twenty awards, but other students need it too.
Aya [determined]: Then don't quietly put my name on top of another list.
choice help
option fund "Ask for an emergency-fund application open to everyone under the same criteria." -> fund ; aid = 0
option other "Offer to help Aya seek other support, without changing this award's rules." -> other ; aid = 1
label fund
Kevin [curious]: Could everyone affected be told how to apply? Someone without a connection here should get the same chance.
Aya [determined]: I'll apply. I want them to read what I need, not who my mother knows.
I: The board sends all applicants the fund's criteria and deadline. Aya receives a route to ask for help, not a replacement award promised behind a door.
goto result
label other
Kevin [curious]: I can help you list other bursaries and ask the school about payment time. Only if you want me to.
Aya [relieved]: Help me make the call. Please don't make it for me.
I: We prepare her questions together. There is no instant scholarship in my pocket. I can offer useful work without pretending that an unfair decision was her fault.
label result
scene office
show Rafi worried left
show Mara sad right
camera two Rafi Mara cut
if route == 0 -> result_internal else result_check
label result_check
if route == 1 -> result_review else result_disclose
label result_internal
I: That afternoon, the committee and board contact verify the original scores. The extra eight points are removed. Rafi receives the twentieth award and a written explanation; Aya receives the correction and an appeal route.
Rafi [relieved]: I can accept the place now. But your own people checked your own people. What will stop this next year?
Mara [sad]: I can't ask this letter to prove more than it does. The board will require two approvals and a visible reason for any score change.
goto shared_result
label result_review
I: That afternoon, the reviewer confirms the unauthorized change. The board restores the committee's ranking: Rafi receives the twentieth award. Aya receives a written explanation and an appeal route. The wider review is still underway.
Rafi [relieved]: I can answer the school. Will the review report be available to applicants, or only the board?
Mara [determined]: The board has agreed to share the findings without private application details. You'll be able to ask what remains unanswered.
goto shared_result
label result_disclose
I: At the urgent hearing, the board checks the original scores and Mara's admission. It restores the committee's ranking: Rafi receives the twentieth award. Aya receives the explanation and an appeal route. Applicants can question the board's account.
Rafi [relieved]: I can accept the place. Someone has already called Aya a cheat. She didn't change those points.
Mara [sad]: I'll correct that claim without exposing her family circumstances. Telling the truth also means refusing the extra accusation.
label shared_result
I: Rafi reads the award twice. His problem has a concrete answer. Aya's money problem does not. The sponsor has not made its renewal decision; no route lets us announce what it will do.
Mara [sad]: The board has taken me off award decisions while it reviews my conduct. I can keep packing bags. I cannot approve my own return.
express Rafi worried
camera listener Rafi over 0.65
Mara [worried]: I am sorry I made you choose between gratitude and a fair hearing.
I: Rafi folds the letter carefully. He does not offer forgiveness to make the room less awkward.
camera two Rafi Mara cut
Rafi [sad]: The bus fares helped me. This hurt me. I need you to let both things be true.
label message
scene office
show Mara worried left
show Kevin curious right
camera two Mara Kevin cut
Mara [worried]: The sponsor needs an update. I want to begin with the twenty students we support.
Kevin [skeptical]: That matters. It cannot do all the talking.
choice statement
option facts "Lead with the verified failure, its correction, and what is still being reviewed." -> statement_facts
option affected "Include the affected students' concerns, with their permission and privacy protected." -> statement_people
label statement_facts
Kevin [determined]: Say who changed the score, how it was corrected, and who checks the new safeguards. Don't promise that one correction solved everything.
Mara [sad]: That is a less comfortable letter.
Kevin [curious]: It is one somebody can check.
I: She removes a sentence calling the incident a misunderstanding. The remaining sentence has a subject and a verb: she changed the score.
goto loyalty
label statement_people
Kevin [determined]: Ask Rafi and Aya what they consent to share. The sponsor should hear the costs without receiving their private files.
Mara [worried]: What if their comments make us look worse?
Kevin [sad]: Then we learn something our own report was leaving out.
I: Neither student is asked to praise the charity. Rafi permits a short account of his deadline; Aya declines to share her family's circumstances. Both choices are respected.
label loyalty
if first == 0 -> first_private else first_record
label first_private
Mara [sad]: You began by giving me room to explain. I tried to turn that room into a place where the problem could stay.
Kevin [worried]: Asking privately wasn't a promise to keep it private forever.
goto closing_choice
label first_record
Mara [sad]: You left the box unticked. I wanted your check mark more than your question.
Kevin [worried]: I nearly gave it to you. I liked what you were doing here.
label closing_choice
Mara [curious]: Would you volunteer here again?
choice return
option conditions "Offer to return if students can check that the safeguards actually happen." -> return_yes
option distance "Step back from volunteering while continuing to support the affected students." -> return_no
label return_yes
Kevin [determined]: I might. Show applicants the review and keep the appeal route open. I want to help the work, not certify that the people doing it never fail.
Mara [sad]: Then I need to earn your next afternoon. I cannot claim it because you gave me this one.
I: I leave my name for a follow-up after the review. My promise has conditions now. So does my trust.
goto home
label return_no
Kevin [sad]: Not yet. I'll help Rafi and Aya with what they ask for. I need distance before I choose another afternoon here.
Mara [worried]: I hope you come back.
Kevin [determined]: You can hope. You can't make staying the price of caring.
I: I leave the audit folder with the board contact and keep the reference number. Leaving the room does not make the unfinished review disappear.
label home
scene classroom
show Hepting curious left
show Kevin worried right
camera two Hepting Kevin cut
I: The taxi brings us safely home. The driver asks four knowledge questions. Three correct answers pay the fare; I can review and retry. Moral magnificence is not on the price list.
Hepting [curious]: Did moving loyalty beyond the family solve the problem?
Kevin [skeptical]: It gave the problem an office. People who aren't related can still decide that their own group matters more.
Hepting [curious]: Henrich studies how cooperation can grow beyond kin. That doesn't guarantee that every institution treats outsiders fairly.
Kevin [worried]: Mara kept pointing to everyone the charity might help. Rafi was standing right there. I needed to consider both, without pretending I knew the sponsor's decision.
if aid == 0 -> aid_fund else aid_other
label aid_fund
I: I write down the emergency-fund deadline. A fair chance to ask is not the same thing as enough money for everyone.
goto finish
label aid_other
I: I write down the questions Aya wants to ask her school. Helping her speak is something I can do. Promising what the school will say is not.
label finish
Hepting [curious]: What should loyalty protect: the people, the reputation, or the purpose?
I: I draw a school bag beside the question. This time, I check the zip.
end
