story 2
variable WaitedForAbsent = false hidden
variable Position = 0 range 0 2 hidden
variable CarriedObjection = false hidden
variable SharedWork = false hidden
label classroom
scene classroom
I: My hand rests on the Teaching Stone. A question forms: when a leader dies, who has the right to decide what comes next?
I: I write it in the classroom book. Beneath my pencil, a line of light opens across the page.
label taxi_arrival
I: A taxi emerges through the classroom wall. I climb in alone. My classmates stay behind as the driver closes the door.
label taxi_departure
I: We lift over the school field and pass into a bright opening. When it clears, the road below is a narrow lane between mudbrick walls.
label arrival
scene courtyard
show Hisham worried left
show Bashir sad right
camera two Hisham Bashir cut
I: Medina, 632. The taxi leaves me beside a courtyard. Two men are dividing bread for neighbouring households. Muhammad has died.
I: One man moves a piece from one tray to the other. Then back again.
Bashir [sad]: You counted that one, Hisham.
Hisham [worried]: I know.
I: He counts it again. Bashir puts his hand beneath the tray. For a moment neither lets go.
camera listener Bashir over 0.65
Hisham [sad]: I keep expecting someone to tell us he has recovered.
I: Bashir opens his mouth. Nothing comes.
camera two Hisham Bashir cut
I: I help carry the tray into the shade. They give me water and a task: take their neighbours' questions, bring back what I can establish, and help finish the deliveries.
Bashir [neutral]: I am Bashir. If you hear something, tell us who said it. There are enough rumours already.
I: Beyond the courtyard, voices hurry past. Hisham turns towards them.
Hisham [worried]: They are gathering at Saqifa.
Bashir [worried]: Already?
Hisham [determined]: At the covered meeting place of Banu Sa'ida. To discuss who will lead.
Bashir [sad]: We have not even—
I: He stops. Hisham waits, but Bashir does not finish.
I: The Ansar, Muslims of Medina who sheltered and supported Muhammad's community, have gathered there. They have their own claims and fears about leadership.
Bashir [worried]: Ali and members of the Prophet's family are occupied with his funeral. What happens if the decision is made without them?
Hisham [worried]: What happens if different groups each make a decision while everyone else waits? Our commitments reach far beyond this lane.
I: Hisham has turned towards the lane. Bashir still holds the tray. Both are waiting for me.
choice first_task
option gather "Go with Hisham to seek news of the gathering; ask Bashir to keep his question for my return." -> go_news
option absent "Stay to hear Bashir's question about those absent before going for news." -> hear_absent ; WaitedForAbsent = true
label go_news
Hisham [relieved]: Come. I need someone who will tell me what they actually hear, even if it makes my decision harder.
Bashir [sad]: Then I will finish this tray without you. When you come back, do not tell me that everyone agreed just because the first people you met did.
I: I promise to return. Bashir keeps the question; Hisham has my help sooner.
goto claims
label hear_absent
Bashir [determined]: Ask this: if someone has a rightful claim, can a meeting settle it while he is absent? I am not asking you to speak in Ali's name.
Hisham [worried]: I will seek news myself. I understand why you stay. But things may move before your question reaches anyone.
I: I help Bashir finish the tray and repeat his question accurately. Hisham leaves without my help.
goto claims
label claims
camera wide
I: When we are together again, the news has names: Abu Bakr, Umar and Abu Ubayda have joined the Ansar at Saqifa. Ali is not at that gathering. No whole-community vote is taking place.
I: The Ansar's service matters to their claim. Some want leadership from among themselves; a proposal for leaders from both groups also enters the discussion.
camera two Hisham Bashir cut
Hisham [determined]: They gave the emigrants a home when they needed one. Their fear of being pushed aside is not foolish. But two rival centres of command could pull us apart.
Bashir [skeptical]: Unity. Will you use that word when they ask why they were not there?
I: Both men believe in one God and regard Muhammad as God's messenger. Neither is looking for another prophet. They disagree about how his guidance should continue.
Hisham [neutral]: Abu Bakr was there early, when believing meant danger. Muhammad trusted him. People know his service, his judgement, his devotion.
Hisham [determined]: We hear that Muhammad entrusted him with leading the prayer during his illness.
Bashir [skeptical]: And you think that answers this?
Hisham [worried]: I think it means something.
Bashir [determined]: So do the words spoken about Ali.
I: Hisham sets down the bread.
Hisham [sad]: I have not forgotten them.
Bashir [curious]: Then tell me what you believe they ask of you.
Bashir [determined]: Ali grew up close to him. Learned from him. Served beside him. Yes, his cousin, and Fatima's husband—his daughter's husband. But it is not simply that a relative should inherit power.
Bashir [determined]: At Ghadir Khumm, Muhammad spoke of Ali as mawla to those for whom he himself was mawla. I understand that as designating Ali's authority. If God has guided that choice, we are meant to recognise it.
Hisham [determined]: Loyalty and affection. That is what I understand those words to require. I honour Ali, Bashir. I do not hear an appointment of the next ruler.
Hisham [worried]: We need someone people beyond Medina will recognise. Someone we trust to hold this community together. I believe Abu Bakr can do that.
I: The word mawla carries several meanings. Their disagreement concerns the meaning of Muhammad's words and the kind of authority he entrusted—not whether either man deserves respect.
choice test_reason
option appointment "Ask Bashir why designation should outweigh a gathering's acceptance." -> ask_designation
option recognition "Ask Hisham why broad recognition should count if a rightful claim is disputed." -> ask_acceptance
option knowledge "Ask what each thinks leadership must preserve beyond keeping order." -> ask_guidance
label ask_designation
Bashir [determined]: Because we do not create every duty by agreeing to it. If a trust has already been given, gathering quickly cannot give it to somebody else.
Hisham [curious]: I can follow that if the designation is established. But we disagree about that very point. How do we act while we disagree?
I: Hisham waits for an answer. Bashir brushes crumbs from the tray, then stops, as though he has caught himself delaying.
goto pressure
label ask_acceptance
Hisham [determined]: Recognition is not proof that someone is always right. It gives the community a way to act together under someone whose character and service we trust.
Bashir [skeptical]: But people can accept a decision because it is already made. That cannot be the whole test of whether it was rightful.
I: A voice calls from the lane, asking if we have heard anything more. Hisham looks towards it. Bashir keeps looking at him.
goto pressure
label ask_guidance
Bashir [determined]: Leadership means guiding people in the faith, interpreting its demands and doing justice. Ali's closeness to Muhammad is knowledge and responsibility, not merely family advantage.
Hisham [determined]: And I believe the community must keep faith through the Qur'an and Muhammad's teaching under a trustworthy leader. Choosing Abu Bakr is not choosing worldly convenience over religion.
I: They both lower their voices when they speak of what Muhammad taught. I have to lean closer to hear them.
goto pressure
label pressure
camera listener Hisham over 0.65
Bashir [worried]: If you pledge now, will you still hear me tomorrow? Or will my question become disloyalty?
express Hisham sad
I: Hisham looks at the tray Bashir finished for him. He does not answer at once.
Hisham [sad]: You held my hand steady this morning.
I: He looks up at Bashir.
Hisham [determined]: I will hear you. Tomorrow too.
camera two Hisham Bashir cut
Hisham [worried]: But if you ask me to wait, will you accept any responsibility for what delay allows? I cannot promise other people will wait with us.
Bashir [sad]: I cannot promise that.
I: He speaks more quietly.
Bashir [worried]: But if this trust belongs to Ali, what will an apology put back?
Hisham [worried]: If I give my allegiance—my promise of support—do you think I should give it to Abu Bakr?
I: He is asking me. Bashir's hands go still.
choice advise_pledge
option support "Advise supporting Abu Bakr: trusted service and common leadership justify acting now." -> support_now ; Position = 1
option withhold "Advise withholding support: Ali's claim must not be bypassed by a hurried decision." -> withhold_now ; Position = 2
option wider "Advise seeking wider consultation before committing, accepting the risk of delay." -> consult_first
label support_now
Hisham [determined]: Then come with me when people ask why. I may need help answering them.
I: I agree to help carry accurate news, including objections to the decision I support.
Bashir [sad]: You are asking me to live under an authority I believe should have belonged to Ali. Please do not describe that as a small disappointment.
goto result
label withhold_now
Bashir [relieved]: Then you hear what I am afraid of losing. A trust does not become ours to give away because keeping it is difficult.
I: I agree to carry the objection without claiming I have been authorised to speak for Ali or his family.
Hisham [worried]: And I still have to decide what to do today. Help me keep this lane working even if you cannot support the leader I recognise.
goto result
label consult_first
Hisham [skeptical]: Who must be heard, and when will you be ready to decide? 'More consultation' cannot mean waiting until nobody disagrees.
I: I name Ali, the family and people beyond this small gathering as missing voices. I cannot make everyone wait or promise agreement.
Bashir [determined]: Being heard matters. But if the appointment is already rightful, another meeting is not entitled to vote it away. Consultation does not settle every kind of claim.
goto result
label result
camera wide
I: Before we can say more, word reaches the courtyard: allegiance has been pledged to Abu Bakr at Saqifa. Umar has taken a leading part.
express Hisham relieved
camera listener Bashir over 0.65
I: Hisham releases a breath. Bashir sees it.
Bashir [sad]: You are relieved.
camera two Hisham Bashir cut
Hisham [worried]: That there is someone to lead? Yes.
look Bashir away
I: Bashir lowers his eyes to the tray. Hisham starts to speak, then waits.
Hisham [worried]: And I am frightened.
look Bashir auto
Bashir [sad]: So am I.
I: The report names a leader. It does not establish that every Muslim consented. Bashir is standing an arm's length from Hisham, and neither reaches for the bread.
I: I have not decided the succession. I must decide what account of it to carry to households that have been waiting while we argue.
camera two Hisham Bashir cut
Hisham [determined]: Tell them who has received allegiance. People need reliable news. Do not make it sound as though no decision exists.
Bashir [determined]: And tell them who was not there. Please. If you leave that out, who will ask?
choice carry_result
option outcome "Carry the confirmed outcome first, and say I cannot claim universal agreement." -> report_outcome
option objection "Carry the outcome with the objection that Ali and the family were absent." -> report_objection ; CarriedObjection = true
label report_outcome
I: I tell a waiting household that Abu Bakr has received allegiance and that I cannot speak for everyone. I do not repeat a dispute I have not fully explained to them.
Hisham [relieved]: They now know which report to act on. I will answer their next questions.
Bashir [worried]: I will go after you and explain the missing objection myself. Otherwise they may never know what your careful limit leaves out.
goto reckoning
label report_objection
I: I give the outcome and explain the absence, naming the objection as an objection rather than announcing that I have settled its truth.
Bashir [relieved]: That is the question I wanted carried. They can hear why assent is not simple for us.
Hisham [worried]: Now I must explain that disagreement does not mean the report of allegiance is false. I will go with you for the next household.
goto reckoning
label reckoning
if WaitedForAbsent == true -> absent_callback else early_callback
label absent_callback
Bashir [neutral]: You stayed to hear my question before the news hardened into a result. You kept the words accurately, even though the gathering did not wait for us.
I: I can still hear how he asked it, before we knew the result. I repeat it that way.
goto position_callback
label early_callback
Bashir [determined]: You promised to come back for the question. Here it is again: who has the right to settle a trust while its claimant is absent?
I: I had thought I would be back with an answer. I sit beside him and let him finish the question.
goto position_callback
label position_callback
if Position == 1 -> support_callback else other_position
label support_callback
Bashir [worried]: You supported acting now. Will you help me be heard even when my words challenge the decision you supported?
I: I remain beside him long enough to hear the full objection. Supporting the outcome has made this duty harder, not unnecessary.
goto meals
label other_position
if Position == 2 -> withhold_callback else wider_callback
label withhold_callback
Hisham [worried]: You supported withholding allegiance. Will you still help neighbours who recognise Abu Bakr, without treating them as people who sold their faith?
I: I agree that their need for food and reliable news remains my responsibility. Cooperation need not pretend agreement.
goto meals
label wider_callback
Bashir [curious]: You asked for wider consultation. Will you still carry an answer you dislike after you have heard it?
I: I say that listening cannot come with a promise that everyone will persuade me—or that I will persuade them.
goto meals
label meals
camera two Hisham Bashir cut
I: The trays are still waiting. Hisham wants to deliver them together so neighbours can see that the lane has not split into enemies. Bashir fears that walking together will be reported as agreement.
Hisham [determined]: We can say exactly what we are doing. If we stop every shared task, our disagreement will decide who gets help.
Bashir [worried]: And if people turn every shared task into a pledge, they make cooperation a way to silence refusal. I will not give you an assent I do not mean.
I: We can deliver together with a spoken limit, or take separate routes so neither appears to speak for the other. Separate routes need an extra trip; the waiting households still need both trays.
choice deliver
option together "Offer to explain our different positions while we deliver together." -> shared_delivery ; SharedWork = true
option separate "Help divide the deliveries and take the extra trip, preserving separate positions." -> separate_delivery
label shared_delivery
camera action Hisham Bashir cut
act Hisham give Bashir "Hisham passes Bashir a tray; I take the next load for our shared delivery."
Bashir [determined]: Then say it before someone says it for us: this is help for our neighbours, not my pledge of allegiance.
I: At the first door, I explain the limit. We finish the delivery together. One neighbour still asks whether Bashir has changed his mind, and I must correct that impression.
goto last_exchange
label separate_delivery
activity Hisham walk left slow
I: Hisham takes one route. I help Bashir divide the other load, then make the extra trip. The distance gives each room to speak, but the last household waits longer.
activity Hisham stop
Bashir [sad]: I wanted the distinction kept. I did not want the people at the last door to bear its cost.
Hisham [neutral]: They received the food. Tomorrow we must find a better arrangement. I will not call this easy just because nobody argued in the lane.
goto last_exchange
label last_exchange
camera two Hisham Bashir cut
Hisham [curious]: When you tell people about us, what will you say?
Bashir [worried]: Tell them why a person who loves this community could disagree with you. Can you do that?
I: I try to put the hardest objection to my advice into words they will recognise.
choice hardest_reason
option duty "Say that a rightful designation cannot be cancelled merely because another choice gains support." -> reason_duty
option community "Say that refusing workable common leadership can expose people to conflict they did not choose." -> reason_community
option limits "Say that acting without missing voices can weaken legitimacy, while waiting cannot guarantee agreement." -> reason_limits
label reason_duty
Hisham [curious]: I accept the principle. I still dispute whether the words designated a successor. Do not make my disagreement look like indifference to duty.
Bashir [neutral]: And do not reduce my conviction to disappointment that my preferred person was absent. That is why the evidence matters.
goto final_account
label reason_community
Bashir [curious]: I accept that the danger is real. But fear of division cannot make every established authority rightful. Do not make me choose between conscience and caring for people.
Hisham [neutral]: That is the danger I wanted you to feel. It does not give me permission to stop hearing your claim.
goto final_account
label reason_limits
Hisham [neutral]: Then judge the actual people and circumstances, not a perfect meeting nobody can assemble.
Bashir [determined]: And do not let the impossibility of perfection excuse an avoidable exclusion. A gathering can be imperfect in ways that matter.
goto final_account
label final_account
if CarriedObjection == true -> objection_payoff else outcome_payoff
label objection_payoff
I: The households I visited heard the result and the missing voices. Hisham has stayed to answer questions; Bashir no longer needs me to speak in his place.
goto work_payoff
label outcome_payoff
I: The households I visited received the confirmed result. Bashir has taken on the extra work of explaining the objection I left for a later conversation.
goto work_payoff
label work_payoff
if SharedWork == true -> shared_payoff else separate_payoff
label shared_payoff
Bashir [neutral]: We carried food together. Keep saying what that meant—and what it did not.
Hisham [neutral]: Tomorrow, ask me again whether I have kept my promise to listen.
goto departure_home
label separate_payoff
Bashir [neutral]: Thank you for taking the extra trip. Keeping my position distinct should not mean leaving all its practical costs to somebody else.
Hisham [neutral]: Tomorrow, let us agree on the deliveries before the trays are ready. We can still owe each other that.
goto departure_home
label departure_home
express Hisham sad
express Bashir sad
I: The food has reached the waiting households. I have an account to carry home, and neither man's reason has been erased from it.
camera two Hisham Bashir cut
I: Hisham lifts the empty tray. This time his hand is steady. He reaches for Bashir's.
camera listener Bashir over 0.65
I: Bashir holds it a moment longer.
camera action Hisham Bashir cut
act Bashir give Hisham "Then he lets Hisham take it."
I: Neither says anything.
camera wide
I: The taxi waits at the lane's end. I climb in safely. I came asking who should lead; I return asking what could make authority rightful to someone who does not accept my answer.
scene classroom
I: Back at the Teaching Stone, I open a history. After the pledge at Saqifa, broader allegiance follows. Abu Bakr becomes the first caliph.
I: I turn the page. Ali later becomes the fourth caliph. Later conflicts, including the killing of his son Husayn at Karbala in 680, deepen the divisions.
I: Sunni tradition recognises Abu Bakr's succession and honours Ali among the rightly guided caliphs. Shia traditions hold that Ali was the rightful designated successor and give the Prophet's family a special role in religious guidance.
I: These traditions develop over generations; each contains diversity. The people I met were not choosing between two fully formed denominations on a ballot.
I: I begin to write: they disagreed about who should lead. I stop. That is true, but I can still see Bashir's hand beneath Hisham's tray.
I: Beneath it I add: each feared that, by following the other, he might fail the person they both loved.
I: The driver adjusts his sunglasses. Four questions for the fare. I need to understand the claims, not declare one community the winner.
end
