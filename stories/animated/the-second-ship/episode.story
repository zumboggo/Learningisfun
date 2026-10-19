story 2
variable Lives = 0 range 0 28 visible
variable Security = 0 range 0 28 visible
variable Justice = 0 range 0 28 visible
variable Trust = 0 range 0 28 visible
label opening
scene classroom
show Hepting worried left
show Lin curious right
camera two Hepting Lin
I: A small ship moves inside the Teaching Stone. Behind it, words glow: THE ORDER HAS ALREADY LEFT.
Lin [worried]: That seems like information we should have received before touching it.
Hepting [determined]: Athens, 427 BCE. A city has rebelled. Yesterday's decision is travelling faster than today's doubts.
I: I touch the stone. My notebook becomes a writing tablet, and the classroom opens into a dusty hillside.
effect magic
scene assembly
show Niko worried left
show Thaleia determined right
camera wide
I: I am a visiting messenger helping Niko prepare arguments for an Athenian citizen. I cannot vote here. Neither can Thaleia, a woman from Mytilene.
Niko [worried]: Yesterday the assembly ordered every adult man in Mytilene killed, and the women and children enslaved. The order is already at sea.
Thaleia [determined]: My father repairs roofs. Write that before you write the name of his city.
I: Niko holds out his tablet. There is space for a few arguments. Behind us, citizens climb toward the assembly.
Niko [determined]: Today they will reconsider. Help me make a case someone will hear before another ship loses its chance.
I: The stone marks four priorities: Human lives, Athenian security, Justice, and Public trust. Seven decisions add points to these priorities, with equal weight in the total.
I: These are the game's estimates of my recommendations, not numbers of people saved or predictions. Athens's historical vote and the ships' arrival will remain fixed.
label evidence
camera two Niko Thaleia
Niko [skeptical]: Mytilene sought help from Sparta, our enemy. Its leaders were not asking politely to leave a club.
Thaleia [angry]: And Athens calls other cities allies while taking their freedom. Ask why anyone wanted to leave.
Niko [worried]: We have time for one first inquiry. I want proof of danger. She wants you to see a person. We need both, but where do we begin?
choice evidence
option military "Check the revolt and Spartan assistance first." -> evidence_military ; Lives += 1, Security += 4, Justice += 2, Trust += 2
option families "Hear how the blanket order affects families first." -> evidence_families ; Lives += 4, Security += 1, Justice += 3, Trust += 1
option compare "Compare both accounts, openly marking what remains uncertain." -> evidence_compare ; Lives += 2, Security += 2, Justice += 4, Trust += 3
label evidence_military
Niko [determined]: The danger is real. Mytilene had ships and sought outside military support.
Thaleia [sad]: Now you know why Athens is frightened. You still do not know what my father did.
I: Security gains the strongest attention. Evidence about the revolt cannot establish every person's guilt.
goto anger
label evidence_families
Thaleia [pleading]: Enslavement means losing control of your own life. A child cannot undo an assembly's anger.
Niko [worried]: I will carry that account. But a frightened voter will still ask who stops the next revolt.
I: Lives and individual treatment gain attention. I still owe an answer about military danger.
goto anger
label evidence_compare
act Niko give Thaleia "Niko offers the tablet; Thaleia points to a claim that needs checking."
Thaleia [skeptical]: Keep the uncertainty. Do not turn my hopes into evidence.
Niko [worried]: We have a fairer account, but less time to rehearse it. No witness can speak for an entire city.
I: The game rewards scrutiny and openness. It gives fewer immediate security and protection points because our information remains incomplete.
goto anger
label anger
camera wide
show Damon angry center
I: Damon, an Athenian citizen whose brother serves at sea, stops beside us. His hand closes around the strap of his travelling bag.
Damon [angry]: We fight, we pay, and an ally joins our enemies. Why should we listen to another speech?
Thaleia [determined]: Because your first decision reaches people who never chose that war.
Niko [worried]: He will speak to other voters. I need a reply he can repeat without turning it into a threat.
choice anger
option acknowledge "Acknowledge his fear, then ask which punishment actually protects Athens." -> anger_acknowledge ; Lives += 2, Security += 3, Justice += 2, Trust += 4
option challenge "Challenge collective punishment directly, even if he walks away." -> anger_challenge ; Lives += 3, Security += 1, Justice += 4, Trust += 1
option resolve "Emphasise firm punishment to keep angry citizens listening." -> anger_resolve ; Lives += 1, Security += 4, Justice += 1, Trust += 3
label anger_acknowledge
Damon [worried]: My brother should not have to fight this siege again. Show me how your answer prevents that.
I: He stays. Listening has opened a conversation; it has not settled the question.
goto responsibility
label anger_challenge
Damon [angry]: You speak as if caring about our own people were shameful.
move Damon right
I: He steps away. Thaleia holds her ground beside me.
Thaleia [determined]: He heard the objection. That matters, even when it does not persuade him.
goto responsibility
label anger_resolve
Damon [determined]: Good. No reward for rebellion.
camera close Thaleia
Thaleia [worried]: Will he hear the limits you add later? Or only the punishment you promised first?
I: I have gained a hearing by making restraint harder to explain.
goto responsibility
label responsibility
scene assembly
show Niko worried left
show Thaleia sad right
camera two Niko Thaleia
I: Niko rehearses a sentence, scratches it out, then tries again. Each version begins with the same dangerous word: everyone.
Niko [curious]: During the siege, Mytilene's common people were armed. They then pressed their leaders toward surrender. What should we infer?
Thaleia [skeptical]: Not that every ordinary person was innocent. Not that every ordinary person was guilty either.
I: A collective punishment treats membership of a group as enough reason to punish. Individual responsibility asks what a person actually did.
choice responsibility
option leaders "Separate alleged organisers for inquiry; reject punishment by citizenship." -> responsibility_leaders ; Lives += 3, Security += 2, Justice += 4, Trust += 2
option pressure "Recommend broad penalties short of death, to share the cost of revolt." -> responsibility_pressure ; Lives += 2, Security += 4, Justice += 1, Trust += 2
option pardon "Recommend a broad pardon to end retaliation, accepting unresolved responsibility." -> responsibility_pardon ; Lives += 4, Security += 1, Justice += 2, Trust += 2
label responsibility_leaders
Niko [determined]: Alleged organisers. I will keep that word. An accusation is not a finding.
Thaleia [worried]: Who conducts the inquiry? The same people who condemned everyone yesterday?
I: A fair procedure needs more than a fair-sounding name. My recommendation cannot guarantee one.
goto argument
label responsibility_pressure
Niko [determined]: Some voters will accept restraint if Mytilene still pays a price.
Thaleia [sad]: My father did not choose the revolt. If you take his livelihood, will you call that restraint?
I: Less lethal punishment can still distribute suffering unfairly.
goto argument
label responsibility_pardon
Thaleia [relieved]: That would leave more families together.
Niko [worried]: And those who organised the war? You will need to explain why ending retaliation matters more than holding them responsible.
I: Forgiveness may protect lives while leaving a real claim for accountability unanswered.
goto argument
label argument
scene assembly
show Niko determined left
show Damon skeptical right
camera wide
I: Near the assembly, Niko listens as the positions of Cleon and Diodotus are reported. Their arguments here are paraphrases of Thucydides, not verbatim speeches.
Niko [determined]: Cleon warns that reversing the order makes Athens weak. He argues that firm punishment will discourage rebellion.
Damon [skeptical]: Diodotus answers that harsh threats do not reliably stop desperate people. If surrender cannot save them, rebels may fight longer.
Niko [worried]: Diodotus centres Athens's advantage. He does not ask the assembly to decide this as a trial about Mytilene's deserts.
I: I must recommend the main reason for our citizen speaker to use. A useful argument and a just argument may overlap without being the same thing.
choice argument
option principle "Lead with the injustice of punishing people without individual responsibility." -> argument_principle ; Lives += 3, Security += 1, Justice += 4, Trust += 2
option interest "Lead with Athens's interests: future rebels need a reason to surrender." -> argument_interest ; Lives += 3, Security += 4, Justice += 1, Trust += 2
option transparent "Explain both reasons and admit they might conflict in another case." -> argument_transparent ; Lives += 2, Security += 2, Justice += 3, Trust += 4
label argument_principle
Damon [skeptical]: Suppose killing them really did make Athens safer. Would you still refuse?
I: My argument says there are limits to what security can justify. That is a commitment, not a promise that restraint is easy.
goto security
label argument_interest
Damon [curious]: So a city that can surrender may cost fewer Athenian lives to defeat.
Niko [worried]: That may persuade him. But if cruelty became useful tomorrow, would your argument still protect anyone?
I: An argument can help save people without treating their rights as its foundation.
goto security
label argument_transparent
Niko [determined]: I can say both. I cannot pretend that justice always arrives with a financial saving.
Damon [skeptical]: Honest. Harder to shout across a crowded hillside.
I: We gain openness and lose the simplicity of a single appeal.
goto security
label security
camera two Niko Damon
Damon [worried]: I am listening. Now tell me what happens when another city considers revolt.
Niko [determined]: We can recommend a policy. We cannot promise how every future city will respond.
I: Deterrence means trying to prevent an action by making its costs frightening. The debate asks whether harsher punishment always deters more effectively.
choice security
option oversight "Recommend tighter military oversight to reduce immediate danger." -> security_oversight ; Lives += 1, Security += 4, Justice += 1, Trust += 2
option surrender "Keep a credible route to surrender; pursue responsibility separately." -> security_surrender ; Lives += 4, Security += 3, Justice += 2, Trust += 2
option grievances "Recommend negotiations over allied grievances, accepting short-term uncertainty." -> security_grievances ; Lives += 3, Security += 1, Justice += 4, Trust += 3
label security_oversight
Damon [determined]: Fewer weapons turned against our crews. I can support that.
Niko [worried]: More control may also mean more resentment. Immediate security is not the same as lasting peace.
I: The security points reflect the game's short-term emphasis, not proof that coercion works forever.
goto coalition
label security_surrender
Damon [curious]: Give them a reason to stop fighting before every wall is broken.
Niko [worried]: Yes. But some will hear that as permission to gamble on rebellion. We must explain the remaining accountability.
I: This balances protection and strategy without making either certain.
goto coalition
label security_grievances
Damon [frustrated]: Negotiation while we are at war? What if they use the breathing space to arm?
Niko [determined]: That risk is real. So is the risk of ignoring why allies fear us.
I: I prioritise a less coercive relationship over an immediate guarantee of control.
goto coalition
label coalition
scene assembly
show Thaleia worried left
show Niko worried right
camera two Thaleia Niko
I: The debate is narrowing. Niko returns with a proposal from citizens who will support cancelling the blanket order but insist that accused leaders remain liable to punishment.
Thaleia [pleading]: If the first order stands, my family is lost. But do not ask me to call every replacement just.
Niko [worried]: We need enough support to change today's order. What promise should our speaker make?
choice coalition
option limited "Support the narrow reversal now; openly keep objections to later punishment." -> coalition_limited ; Lives += 4, Security += 3, Justice += 2, Trust += 3
option guarantee "Insist on a stronger promise of individual hearings before offering support." -> coalition_guarantee ; Lives += 2, Security += 1, Justice += 4, Trust += 3
option quiet "Avoid arguing about later penalties to hold the immediate coalition together." -> coalition_quiet ; Lives += 3, Security += 3, Justice += 1, Trust += 1
label coalition_limited
Thaleia [sad]: Then say what you have saved, and what you have not.
Niko [determined]: We can support this reversal without calling the rest finished.
I: Compromise may prevent a catastrophe while leaving serious wrongs unresolved.
goto vote
label coalition_guarantee
Niko [worried]: Some supporters may leave. Your condition asks them to commit beyond today's vote.
Thaleia [determined]: At least someone has asked what happens after the cheering.
I: I press for stronger justice, accepting a risk to the immediate agreement. My voice does not control the historical vote.
goto vote
label coalition_quiet
Niko [worried]: Fewer disagreements before the vote. More unspoken disagreements afterward.
Thaleia [skeptical]: When you say we agree, remember who never agreed to the silence.
I: Avoiding the issue preserves support but weakens accountability.
goto vote
label vote
camera wide
I: The assembly votes again. In Thucydides' account, the decision is close: Diodotus's proposal wins. A second ship must carry the revised order.
Niko [relieved]: The vote has changed. The sea has not.
Thaleia [worried]: Then stop looking at the hill. Look at the harbour.
activity Niko walk right brisk
I: Niko sets off toward the ships. I follow with the tablet. A changed decision still needs people willing to carry it out.
activity Niko stop
scene harbour
show Niko determined left
show Damon worried right
camera wide
I: At the harbour, Damon helps organise supplies. The first ship has roughly a day's head start. In the historical account, Mytilenean envoys provide food and promise a reward.
Damon [worried]: The crew needs food, a clear order, and a reason to push on. We can help organise all three. What should we prioritise?
Niko [determined]: Our specific arrangements are a simulation. The historical crew will row with extraordinary urgency; we choose what our help emphasises.
choice ship
option endurance "Prioritise food and relief arrangements so effort can continue." -> ship_endurance ; Lives += 4, Security += 3, Justice += 2, Trust += 3
option verify "Prioritise checking the revised order and explaining it to the crew." -> ship_verify ; Lives += 2, Security += 2, Justice += 4, Trust += 4
option reward "Prioritise the promised reward and immediate departure." -> ship_reward ; Lives += 3, Security += 4, Justice += 1, Trust += 2
label ship_endurance
act Niko give Damon "Niko and Damon pass a mimed bundle of provisions between them."
Damon [determined]: People cannot row on speeches. We make sure the food reaches the boat.
I: Sustained effort gains priority. Another helper must confirm the order; my preparation alone cannot secure arrival.
goto crossing
label ship_verify
act Niko give Damon "Niko hands Damon the mimed tablet and asks him to repeat the destination and revised order."
Damon [determined]: The message is clear. Now we need the speed to make it matter.
I: Verification supports trust and lawful action. It uses time while other helpers load supplies.
goto crossing
label ship_reward
Damon [determined]: The promised reward catches their attention. The crew prepares to leave at once.
Niko [worried]: A reward can mobilise effort. It cannot make exhaustion disappear.
I: Speed and motivation gain priority. Fair treatment and practical support still need attention.
goto crossing
label crossing
camera wide
I: Thucydides describes the rowers eating while rowing and taking turns to sleep. The first crew, reluctant to carry its terrible order, has made slower progress.
I: The second ship arrives just in time to prevent the first order being carried out. The rescue depends on more than a good argument: timing, effort, and other people's actions matter.
show Thaleia relieved center
camera close Thaleia
Thaleia [relieved]: My father's life is no longer forfeit simply because of his city.
camera wide
I: Then the stone shows the part that does not fit a celebration. Athens executes men sent as chiefly responsible for the revolt and imposes further controls on Mytilene.
Thaleia [sad]: Do not turn the people who remain punished into a footnote.
I: The blanket catastrophe is prevented. The story does not end with universal pardon, equal power, or proof that every later punishment is just.
if Lives >= 20 -> lives_high else lives_low
label lives_high
Thaleia [determined]: Again and again, you tried to keep people alive. Now ask whose life your plan still left exposed.
goto trust_check
label lives_low
Thaleia [worried]: Other concerns often came first in your recommendations. Explain what made those costs worth risking.
goto trust_check
label trust_check
if Trust >= 19 -> trust_high else trust_low
label trust_high
Niko [determined]: You usually made the difficult parts visible. That lets someone challenge your reasons after the crisis.
goto home
label trust_low
Niko [worried]: Some of our agreements left too much unsaid. A crowd's support is not the same as informed trust.
goto home
label home
scene classroom
show Hepting curious left
show Lin worried right
effect fade
camera two Hepting Lin
I: The tablet becomes my notebook again. Seven marks remain beside four columns. Lin looks at the total, then at the names of the columns.
Lin [skeptical]: Who decided that one point of security equals one point of justice?
Hepting [determined]: We did, when we designed this game. Your score measures success under the game's stated priorities, not an objective measure of moral goodness.
Hepting [curious]: The points are debatable estimates of your recommendations. They are not lives counted, historical measurements, or your grade.
Lin [curious]: So I can improve the total—and still argue that its priorities are wrong?
Hepting [happy]: Exactly. Replay for a different balance. Then explain what your higher score cost, and whether you would choose it outside the game.
I: Which category should count most? Would changing its weight change my choices? What important interest is missing entirely?
end
