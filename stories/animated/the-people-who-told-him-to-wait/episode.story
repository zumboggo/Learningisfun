story 2
variable StartedWithWait = false hidden
variable AskedAboutRisk = false hidden
label birmingham_opening_v1
scene jail
I: Birmingham, April 1963. An imagined illustration shows King writing. The short archival excerpt is his later reading of the letter, not a recording made in this cell: “Justice too long delayed is justice denied.”
label classroom_start
scene classroom
show Lin curious left
show Hepting neutral right
camera two Lin Hepting cut
I: My notebook has a neat heading: Different Ways to Argue. Underneath it, Lin has written a less neat question: What if they agree with you and still say no?
Lin [skeptical]: Suppose someone says your goal is right, but your method makes everything worse. You cannot just repeat the goal louder.
Hepting [curious]: Good. Today your task is to answer that person's strongest objection. Bring back an explanation that survives a fair challenge.
choice first_instinct
option wait "I would try a calmer conversation first." -> instinct_wait ; StartedWithWait = true
option evidence "I would ask what they have already tried." -> instinct_evidence
option pressure "I would ask whether the objection protects the people who can delay." -> instinct_pressure
label instinct_wait
Lin [relieved]: That is my instinct too. If the door is open, why push it?
Hepting [curious]: Hold on to that image. We need to find out whether the door really is open.
goto boarding
label instinct_evidence
Lin [curious]: You want the history before choosing the method. Fine. I am putting a question mark beside my advice.
Hepting [happy]: A question mark is often the most useful thing in the notebook.
goto boarding
label instinct_pressure
Lin [skeptical]: Maybe. But someone can worry about a method sincerely. I want us to answer the worry, not decide their motive for them.
Hepting [determined]: Keep both possibilities in view. We can examine a claim without pretending to read minds.
goto boarding
label boarding
prop Hepting phone
Hepting [determined]: Birmingham, Alabama. April 1963. We are visiting the history, not rewriting King's letter for him.
label taxi_arrival
I: A vortex opens in the classroom wall. The magical taxi parks, and the sunglasses-wearing driver steps out. Mr. Hepting asks whether we are ready.
label taxi_departure
I: Our taxi flies past the school's red stripe, banks over the soccer field and disappears through a second vortex.
label birmingham_context_v1
I: BIRMINGHAM, ALABAMA · APRIL 1963. Racial segregation denies Black residents equal access and opportunity. Local activists and King's organization campaign for change through nonviolent protest. Arrested on April 12, King encounters criticism from eight white religious leaders. They urge restraint and negotiation. He begins a reply in jail. Our question: how can an argument answer people who say the method undermines the goal?
label first_evidence
scene workshop
show Lin neutral left
show Hepting neutral right
rest Hepting attentive
camera two Lin Hepting cut
I: The taxi leaves us in an imagined reading room beside the historical scene. The pages are evidence; our conversation here is fiction.
Hepting [determined]: One boundary: the letter records King's account. Our choices test our understanding; they do not decide what happened in Birmingham.
Lin [curious]: Here is the objection in my own words: Negotiation is better than demonstrations that create tension. Stop the demonstrations and give talks a chance.
I: I almost write “They hate justice.” Lin puts her finger on the blank space where the evidence would have to go.
Lin [skeptical]: That would be an easier opponent. It would not answer this objection.
choice opening_move
option shared "Start with the shared goal of a negotiated solution." -> opening_shared
option facts "Start with evidence that negotiations have already been attempted." -> opening_facts
option urgency "Start with the harm people experience while they wait." -> opening_urgency
label opening_shared
Hepting [happy]: That gives a hesitant reader a reason to keep listening. King's opening addresses fellow religious leaders and treats their concern as answerable.
Lin [curious]: We can grant that negotiation matters without granting that stopping protest will produce it.
goto connect
label opening_facts
Hepting [curious]: That directly challenges the picture of protesters who have never tried talking. A reader may still need a reason to trust the account.
Lin [determined]: So we should give the evidence clearly and show what part of their concern we understand.
goto connect
label opening_urgency
Hepting [determined]: That can show why the timetable matters. King gives human consequences of waiting, not just a calendar.
Lin [worried]: But we still owe the reader an answer about the method. Urgency cannot do all the work by itself.
goto connect
label connect
camera two Lin Hepting cut
Hepting [curious]: Our first move is CONNECT: establish a reason for this audience to listen. Classical rhetoric calls the opening an exordium.
Lin [skeptical]: Not “say something nice and hope they forget the disagreement.”
Hepting [happy]: Exactly. Then EXPLAIN: supply the situation and state what you are arguing. Context is narratio; the central proposition tells the reader what you will defend.
I: I make two spaces in the notebook: situation and claim. Lin refuses to let the claim eat the evidence space.
Lin [determined]: Our working claim: nonviolent pressure can be necessary to make serious negotiation possible when ordinary appeals have been ignored.
label evidence_walk
scene workshop
show Lin curious left
show Hepting neutral right
camera wide
activity Lin walk right slow
I: Lin paces across our imagined reading room, weighing three details from King's account. We keep the original letter open beside our notes.
Hepting [determined]: First, local leaders had already sought negotiation. Second, merchants' promises about segregation signs were not kept. Third, the campaign had postponed action around the city election.
activity Lin pause
Lin [confused]: So “be patient and try talking” presupposes something: that these options have not already been given a chance.
choice choose_evidence
option promises "Use the broken promises to explain why another promise may not be enough." -> evidence_promises
option delays "Use the election delays to challenge the charge of reckless impatience." -> evidence_delays
option invitation "Use the local invitation to challenge the outsider objection." -> evidence_invitation
label evidence_promises
Lin [determined]: That is the closest fit for our claim. Earlier talks produced promises, but the result did not last.
Hepting [curious]: Explain the connection: pressure may change the cost of ignoring another agreement. That bridge from evidence to claim is a warrant.
goto evidence_join
label evidence_delays
Lin [relieved]: This answers the claim that they refused to wait at all. They had already changed the timetable.
Hepting [curious]: Useful. To explain why pressure might enable negotiation, pair it with the failed promises. Evidence must answer the particular claim we make.
goto evidence_join
label evidence_invitation
Lin [curious]: King says a local affiliated organization invited him. That answers a different objection: why he is there.
Hepting [determined]: Keep it for that purpose. For our claim about negotiation, the earlier talks and failed promises are the stronger evidence.
goto evidence_join
label evidence_join
activity Lin stop
camera two Lin Hepting cut
Hepting [determined]: SUPPORT is our third move: confirmation, or confirmatio. Give reasons and evidence, then explain why they support the claim.
Lin [skeptical]: If I write “a promise was broken; therefore every protest always works,” I have crossed the bridge and jumped off the other side.
Hepting [happy]: Yes. One case does not prove every tactic effective. Keep the claim proportionate to the evidence.
label the_objection
scene jail
I: In the imagined cell, the page rests on King's knee. His letter turns toward the objection itself: why use direct action instead of negotiation?
scene workshop
show Lin worried left
show Hepting neutral right
camera two Lin Hepting cut
Lin [worried]: Here is the strongest version I can make: even if earlier talks failed, public pressure could harden attitudes or put people at risk. How does making tension help?
Hepting [curious]: Now we have an objection worth answering. King argues for nonviolent pressure that makes an ignored problem impossible to set aside.
choice answer_objection
option mechanism "Concede that negotiation is the goal; explain how pressure can bring unwilling parties to the table." -> answer_mechanism
option limit "Acknowledge the risk, then distinguish nonviolent pressure from violence." -> answer_limit ; AskedAboutRisk = true
option question "Ask what would make another round of talks different from the failed promises." -> answer_question
label answer_mechanism
Lin [curious]: That changes my picture. The choice is not necessarily protest OR negotiation. One can be a means to the other.
Hepting [determined]: You conceded the shared goal, then refuted the assumption that pressure must oppose it. That is an answer, not a surrender.
goto answer_join
label answer_limit
Lin [worried]: I appreciate that you did not promise nobody could be harmed. Nonviolence describes the method; it does not make the response of others predictable.
Hepting [determined]: Good. Now add the mechanism: pressure can make refusal costly enough that negotiation becomes possible. The danger remains a serious consideration.
goto answer_join
label answer_question
Lin [confused]: Without some changed condition, another request could be ignored again. Your question exposes the assumption in my advice.
Hepting [curious]: Then answer it. A question alone may leave the reasoning unfinished; explain what nonviolent pressure is intended to change.
goto answer_join
label answer_join
camera listener Lin cut
Lin [determined]: I can now explain his reasoning without pretending the method has no risks. That is harder than writing “the other side is wrong.”
camera two Lin Hepting cut
Hepting [determined]: ANSWER is the fourth move: refutation, or refutatio. Represent the objection fairly, grant what is reasonable, then show why your claim still holds—or revise it.
Lin [curious]: The letter asks a possible reader's question and then answers it. Is that this week's hypophora?
Hepting [happy]: Yes. A rhetorical question may leave an answer implied; hypophora supplies the answer. Here the question organizes the reasoning, not merely the tone.
I: My five spaces are nearly full. The fourth one takes the most room.
label what_wait_costs
scene jail
I: The writing continues. The opening quotation returns to me: a delay can itself be a denial. This is a claim we have to examine, not a slogan that proves itself.
scene workshop
show Lin sad left
show Hepting neutral right
camera two Lin Hepting cut
Hepting [determined]: King describes the injuries of segregation, including a parent trying to explain exclusion to a child. Waiting is time spent living under those conditions.
Lin [sad]: I called waiting a pause. For the people affected, the harm keeps happening during it.
if StartedWithWait == true -> callback_wait else callback_evidence
label callback_wait
camera listener Lin cut
Lin [curious]: We both began with calmer conversation. That advice depended on a door being open. Now we have evidence that asking again may leave the same people waiting outside.
goto ending_move
label callback_evidence
camera listener Lin cut
Lin [curious]: You asked us to examine the situation before giving advice. Now I see what the missing history changes: “wait” has a cost, and another request may meet the same refusal.
goto ending_move
label ending_move
camera two Lin Hepting cut
Hepting [determined]: Our fifth move is CLOSE: draw the reasoning together and make the stakes or desired response clear. The classical term is peroratio.
Lin [curious]: Does every ending need to shout an instruction?
Hepting [happy]: No. It can invite reconsideration or renew a relationship. King's ending looks toward fellowship across the division. An ending needs a purpose, not a compulsory volume.
choice closing
option invitation "Invite the reader to support real negotiation, including pressure when repeated appeals fail." -> closing_invitation
option cost "Ask the reader to weigh the continuing harm of delay against the risks of action." -> closing_cost
option promise "End with a confident promise that this argument will change every reader's mind." -> closing_promise
label closing_invitation
Lin [relieved]: That follows from our reasoning. It asks for a change in judgment and action without pretending that one paragraph will make it happen.
goto assemble
label closing_cost
Lin [determined]: That makes the stakes visible. I would add the specific claim so the reader knows what we want them to reconsider.
goto assemble
label closing_promise
Lin [skeptical]: Every reader? We have evidence for the argument, not control over the audience.
Hepting [determined]: Replace that promise with a clear invitation to reconsider the method. Persuasion is a purpose, not a guaranteed result.
goto assemble
label assemble
I: On my page, the parts now connect: shared purpose; failed talks; a qualified claim; evidence and its warrant; a fair objection and answer; a purposeful ending.
Lin [proud]: Connect. Explain. Support. Answer. Close. Five jobs, not five compulsory paragraphs.
Hepting [happy]: Classical schemes divide these jobs in several ways. This is our practical map, not a claim that King followed a rigid template.
Lin [curious]: And ethos, logos and pathos can work throughout those moves. They are ways persuasion operates; this map helps arrange the argument.
label transfer
scene classroom
show Lin curious left
show Hepting neutral right
camera two Lin Hepting cut
I: The taxi returns us safely. Hepting slides over a new practice case: students request a quieter study room; a coordinator worries that moving an activity will leave its members without space.
Hepting [determined]: This small school problem is not equivalent to segregation. Transfer the reasoning skill, not the historical stakes. What would you do with the objection?
choice transfer_reply
option concede "Acknowledge the space problem; propose a trial that protects both groups and gather evidence." -> transfer_concede
option inspect "Ask what rooms and times are available before claiming a workable solution." -> transfer_inspect
option dismiss "Say that anyone who opposes a quiet room does not care about learning." -> transfer_dismiss
label transfer_concede
Lin [happy]: You have answered the actual concern and made the proposal testable. We would still need to check whether the trial is feasible.
goto payoff
label transfer_inspect
Lin [determined]: You are finding the evidence the claim needs. Once we know the options, we can answer the concern rather than wish it away.
goto payoff
label transfer_dismiss
Lin [skeptical]: That replaces a practical objection with an accusation about motives. The other group still needs space.
Hepting [curious]: Try again in your head: concede that need, then investigate a solution. The strongest objection can make your proposal better.
goto payoff
label payoff
camera listener Lin cut
Lin [relieved]: I can finally answer the question in your notebook. Someone may share a goal and still reject the method. I have to defend the connection between the two.
if AskedAboutRisk == true -> callback_risk else final_question
label callback_risk
Lin [determined]: And the risk you raised stays on the page. A strong answer does not erase a real cost just because we have reached the ending.
goto final_question
label final_question
camera two Lin Hepting cut
Hepting [curious]: We have completed our explanation. Here is the next problem it creates: if someone understands the reasoning and still refuses to act, what else is holding the refusal in place?
I: Lin leaves a blank space below our answer. This time the blank is a question we have earned.
show Driver determined center
camera wide
Driver [determined]: Four questions pay the fare. Three correct, and you are home. Review and try again if you need to.
end
