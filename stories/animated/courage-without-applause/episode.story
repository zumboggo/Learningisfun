story 2
variable Safety = 15 range 0 30 visible
variable Trust = 10 range 0 20 visible
variable Honour = 8 range 0 20 visible
variable Turns = 6 range 0 6 visible
label courage_context_v1
I: Near Athens, in the fourth century BCE, Aristotle asks how repeated choices shape a person's character. Beyond the city, a storm has left a crossing unsafe.
label courage_opening_v1
I: Aristotle asks: What kind of person are you practising becoming?
label classroom
scene classroom
show Hepting curious left
show Lin skeptical right
camera two Hepting Lin cut
Lin: If I do something brave and nobody notices, does it still count?
Hepting: Count for what? Your reputation—or the person who needs help?
I: The Teaching Stone warms beside our book. I write: What if helping well makes me look cowardly?
label taxi_arrival
I: A golden taxi rolls through the classroom wall. The driver opens the door. We climb in.
label taxi_departure
I: The taxi sails over the school field and into a bright circle of rain.
label lesson
scene grove
show Aristotle curious left
show Lin determined right
camera two Aristotle Lin cut
Aristotle: You want a rule that will make you brave?
Lin: Preferably one I can remember when everyone is staring.
Aristotle: We become builders by building. We also form character through what we repeatedly do.
Lin: So if I perform one brave act, I am brave?
Aristotle: One action matters. But ask whether you understand it, choose it for its own sake, and can act that way steadily.
I: A voice calls from beyond the trees. A worker is trapped across the stream. Aristotle turns towards it before Lin can ask another question.
label arrival
scene crossing
show Doria worried left
show Nikias determined right
camera two Doria Nikias cut
Doria: My father Melas is on the far bank. That bridge shifted while he was carrying tools. He cannot safely cross it now.
Nikias: I can reach him. Everyone saw me step back at training yesterday. Let them watch today.
Doria: I saw you step back because the practice spear broke. I would like my brother alive as well as my father.
show Lin worried center
Lin: The bank is firm here. We can help organise people without going onto the bridge ourselves.
I: A rope, a few helpers, and a damaged crossing. Doria asks me to coordinate while she watches her father. Nikias waits for my answer. So does the crowd.
I: Six decision turns remain before the damaged span gives way. Reading takes no time. Every decision uses one turn; I cannot do everything.
I: Safety measures our preparations, Trust our ability to work together, and Honour our public standing. Honour can bring help, but applause cannot hold a bridge up.
I: At the end: rescue outcome up to 50 points, avoidable harm prevented up to 30, cooperation up to 20. Honour stays separate. The goal is to help—not merely look helpful.
label turn_one
camera two Doria Nikias cut
Nikias: I will go first. A quick crossing, before anyone has time to argue.
Doria: The stones under the landing have moved. He has not looked at them.
I: Turn 1 of 6. I can stop the rush openly, inspect with Nikias out of the crowd's hearing, or let him lead preparations from this bank.
choice first_plan
option public "Stop him publicly: 'Nobody crosses until we inspect the landing.'" -> first_public ; Safety += 6, Trust -= 2, Honour -= 2, Turns -= 1
option private "Inspect beside him quietly; let Doria manage the waiting crowd." -> first_private ; Safety += 4, Trust += 3, Honour -= 3, Turns -= 1
option lead "Give him command of the near-bank preparations, visibly." -> first_lead ; Safety += 2, Trust += 1, Honour += 4, Turns -= 1
label first_public
express Nikias embarrassed
camera listener Nikias cut
Nikias: You could have said it without making me look like a child.
I: I tell him which stones Doria saw move. The people nearest the bridge step back, but Nikias stops meeting my eyes.
goto equipment
label first_private
react Doria point
Doria: I will keep them back. Give me something clear to tell them soon.
Nikias: Show me the stones, then. And do not make this another story about me being afraid.
I: We inspect from firm ground. Behind us someone complains that we are whispering while a man waits.
goto equipment
label first_lead
act Nikias reach "Nikias reaches for the equipment on the firm bank."
express Nikias proud
Nikias: You heard. Clear the bank. Bring the rope here.
Doria: Good. Now ask someone who understands those supports before you send anybody out.
I: People begin moving for him. Giving orders feels better to Nikias than looking closely at what might fail.
goto equipment
label equipment
show Bion skeptical left
show Nikias worried right
camera two Bion Nikias cut
Bion: I have a long hauling rope and a small boat downstream. But I will not lend them to a boy who confuses an audience with a plan.
Nikias: He has been calling me that since yesterday.
I: Turn 2 of 6. Bion knows the stream. Securing his help now means spending this turn with him instead of improving our own preparations.
choice help
option swallow "Ask Bion to inspect and lend the equipment. Let the insult pass." -> help_swallow ; Safety += 6, Trust -= 1, Honour -= 3, Turns -= 1
option boundary "Say we need his skill, and ask him to leave the insults out." -> help_boundary ; Safety += 3, Trust += 2, Honour += 1, Turns -= 1
option crowd "Ask the crowd to supply another rope while our team keeps working." -> help_crowd ; Honour += 3, Trust += 1, Turns -= 1
label help_swallow
act Bion give Nikias "Bion hands Nikias the better rope."
Bion: At least somebody knows what matters. Put that old rope aside.
express Nikias angry
Nikias: You heard what he called me. Does he get to say anything because he owns a boat?
I: Bion begins inspecting. We gain good equipment, but I have another conversation to repair.
goto mistake
label help_boundary
Bion: Fair enough. I can spare the rope. If you need the boat, call me early—it takes time to bring it round.
Nikias: I can listen to that.
I: We have help without surrendering the whole conversation, though Bion spends less time checking our work.
goto mistake
label help_crowd
if Honour >= 12 -> crowd_yes else crowd_no
label crowd_yes
I: Our public standing brings a response. Two neighbours carry over a sound rope and stay to help.
Doria: Being respected has bought us something useful. Please do not spend it on a stunt.
I: Put the volunteers and their rope to work.
goto crowd_bonus
label crowd_bonus
goto mistake
label crowd_no
Bion: They can cheer louder than they can lend. I am still downstream if you need me.
I: One person offers thin cord. Another has advice. Neither can replace Bion's equipment this turn.
goto mistake
label mistake
show Doria worried left
show Lin worried right
camera two Doria Lin cut
react Lin crouch
Lin: You said this anchor point looked firm. There is a crack underneath it.
I: She is right. I had checked the top, not the base. Nikias is waiting for me to give the next instruction.
Doria: Whatever you decide, make sure everyone working here knows which point we are using.
I: Turn 3 of 6. Correcting the setup takes this turn. The question is what I say about my mistake.
choice mistake
option admit "Tell everyone I missed the crack, and redirect the preparations." -> mistake_admit ; Safety += 5, Trust += 3, Honour -= 3, Turns -= 1
option quiet "Correct it quietly with Lin, then give everyone the new instruction." -> mistake_quiet ; Safety += 4, Trust += 1, Honour += 1, Turns -= 1
option delegate "Ask Bion to choose the anchor point and publicly give him authority." -> mistake_delegate ; Safety += 6, Trust -= 1, Honour -= 2, Turns -= 1
label mistake_admit
Lin: Then I will check the replacement with you. Two sets of eyes.
Nikias: You can say you were wrong in front of them?
I: A laugh travels through the crowd. Doria ignores it and repeats the corrected instruction.
goto role
label mistake_quiet
Lin: I will help. But next time, tell me what you are uncertain about before I have to find it.
I: Everyone receives the corrected instruction. Most people watching never learn why it changed.
goto role
label mistake_delegate
show Bion determined center
Bion: This point, from the bank. And nobody changes it without telling the whole group.
Doria: We have a clear answer. I also need to know whether you are still coordinating or he is.
I: I tell her I am coordinating; Bion is assessing the structure. Handing over expertise takes an explanation too.
goto role
label role
show Nikias embarrassed right
show Doria determined left
camera two Doria Nikias cut
Nikias: Give me the visible job. The one on the crossing. Do not put me behind everyone again.
Doria: We need someone steady to organise the helpers on firm ground. If their timing falls apart, Father's return becomes harder.
camera listener Nikias cut
Nikias: So I stand where nobody will see me do anything.
I: Turn 4 of 6. I need Nikias to accept a useful role, not merely obey while looking for a chance to prove himself.
choice role
option explain "Explain publicly why coordinating the bank is essential, and give him that role." -> role_explain ; Safety += 2, Trust += 1, Honour += 2, Turns -= 1
option direct "Give him the bank role directly. There is no time for a speech." -> role_direct ; Safety += 3, Trust -= 2, Honour -= 2, Turns -= 1
option visible "Let him lead the visible preparation at the bridge entrance, beside Doria." -> role_visible ; Safety -= 3, Trust += 2, Honour += 4, Turns -= 1
label role_explain
if Trust >= 13 -> role_accept else role_doubt
label role_accept
express Nikias determined
Nikias: All right. Listen for my call. Nobody pulls ahead of the others.
I: Because he trusts us, the explanation lands. He starts coordinating instead of performing.
I: Back his instructions and get ready.
goto role_gain
label role_gain
goto changing
label role_doubt
Nikias: A grand title for staying out of sight. Is that what this is?
Doria: I need you here, Nikias. Whatever you think of the speech.
I: He takes the role for his sister, but keeps glancing at the crowd. The words alone have not repaired our trust.
goto changing
label role_direct
Nikias: Fine. Tell me what you need.
I: He does the job. He does not tell me that two helpers cannot hear him well. Doria has to move them herself.
goto changing
label role_visible
Doria: Beside me. Not in front of me, and not out onto that span.
Nikias: I heard you.
I: He works hard where people can see. Keeping him within the safe area takes some of Doria's attention away from the preparations.
goto changing
label changing
show Aristotle worried left
show Lin worried right
camera two Aristotle Lin cut
I: A timber knocks against stone. The water is still rising. Aristotle moves back with the nearest onlookers to clear the working space.
Lin: Too little confidence, too much confidence. Are we supposed to split the difference?
Aristotle: A suitable response is not an arithmetic middle. The danger, the person, the purpose and the moment matter.
Lin: Then being frightened does not settle what I should do?
Aristotle: Ask what deserves your fear, and what deserves the risk. Then judge this occasion.
I: Turn 5 of 6. One preparation turn remains before the final rescue decision. Waiting will not freeze the water. I must choose which weakness to address.
choice preparation
option inspect "Use the last preparation turn to check the rescue setup with Bion." -> prep_inspect ; Safety += 4, Trust -= 1, Honour -= 2, Turns -= 1
option rehearse "Rehearse the team's signals so everyone can hear and respond." -> prep_rehearse ; Safety += 1, Trust += 4, Honour -= 1, Turns -= 1
option recruit "Appeal publicly for extra hands and blankets; keep the team at work." -> prep_recruit ; Honour += 2, Turns -= 1
label prep_inspect
show Bion determined center
act Bion crouch "Bion lowers himself to inspect the bank-side support, then rises."
Bion: This is what we have. We cannot inspect our way to a river with no danger in it.
I: He identifies one more weakness. Repairing it helps, but the waiting helpers grow restless.
goto final_choice
label prep_rehearse
show Doria determined center
Doria: When I raise my arm, stop. Repeat it so the people at the back can hear.
I: The first signal is missed. The second travels down the line. Finding that problem here is better than finding it under load.
goto final_choice
label prep_recruit
if Honour >= 12 -> recruit_yes else recruit_no
label recruit_yes
I: The crowd answers. Two people join the line, and a woman brings blankets. Being believed has made a practical difference.
I: Give the new helpers clear places.
goto recruit_gain
label recruit_gain
goto final_choice
label recruit_no
I: A few people cheer. One brings a blanket. The extra hands I hoped for do not arrive in time to train with us.
Lin: We have to make the next decision with the people who are here.
goto final_choice
label final_choice
show Doria scared left
show Nikias determined right
camera two Doria Nikias cut
Doria: Father is still on the higher ledge. He can hold there a little longer, but his ankle is hurt. He cannot run across.
Nikias: We have one chance before that span goes. Choose.
I: Turn 6 of 6. Bion judges the prepared crossing needs Safety at least 23 and Trust at least 13. With Honour at least 12, extra helpers lower the Safety requirement to 21. The boat needs Trust at least 10 to organise promptly. These are his estimates, not promises.
I: The boat avoids the bridge but takes longer in the cold. Sending Nikias ahead may be faster, but exposes another person to the unstable span. I stay on the firm bank coordinating.
choice rescue_method
option crossing "Use the prepared crossing under Bion's direction." -> crossing_check ; Turns -= 1
option boat "Abandon the crossing and coordinate Bion's boat downstream." -> boat_check ; Honour -= 3, Turns -= 1
option dash "Let Nikias go ahead while the team supports from the bank." -> dash_check ; Honour += 4, Turns -= 1
label crossing_check
if Honour >= 12 -> crossing_supported else crossing_ordinary
label crossing_supported
if Safety >= 21 -> crossing_trust else crossing_fail
label crossing_ordinary
if Safety >= 23 -> crossing_trust else crossing_fail
label crossing_trust
if Trust >= 13 -> crossing_success else crossing_fail
label crossing_success
I: Doria's signal travels down the line. Under Bion's direction, the prepared rescue brings Melas back before the span gives way.
show Melas relieved center
Melas: A blanket first. Congratulations later.
I: Make room for him on firm ground.
goto good_scores
label good_scores
goto aftermath
label crossing_fail
I: Bion calls a halt when the setup and the team's timing cannot carry the load together. Melas stays on the ledge; we switch to the boat.
I: The span gives way before the boat reaches him. He remains above the water, but the delay leaves him badly chilled, and a helper strains a wrist during the abandoned attempt.
show Melas worried center
Melas: I am here. Sit with me while I get warm.
I: Bring blankets and help the injured helper.
goto delay_scores
label delay_scores
goto aftermath
label boat_check
if Trust >= 10 -> boat_success else boat_delay
label boat_success
I: We clear space downstream and follow Bion's directions. Melas returns in the boat, cold and limping, while the damaged span drops into the stream behind him.
show Melas relieved center
Melas: I would rather take the long way home than not arrive.
I: Settle him beside his family and fetch a blanket.
goto boat_scores
label boat_scores
goto aftermath
label boat_delay
I: Conflicting instructions send the helpers to different landing places. Bion stops us, chooses one, and begins again.
I: Melas eventually returns safely in the boat, but the cold has taken its toll. Doria sits beside him until his shaking eases.
show Melas worried center
Melas: Next time, one person giving the directions. Please.
I: Stay with them and help Bion gather the equipment.
goto boat_delay_scores
label boat_delay_scores
goto aftermath
label dash_check
if Safety >= 20 -> dash_supported else dash_fail
label dash_supported
I: Nikias reaches his father. The team helps them return, but a shifting plank throws Nikias hard against the side. Doria catches his arm from the bank.
show Melas relieved center
Nikias: Did you see? We did it.
Doria: I saw your shoulder hit. Sit down before you try to wave at anyone.
I: Check Nikias's shoulder and bring Melas a blanket.
goto dash_scores
label dash_scores
goto aftermath
label dash_fail
I: Nikias slips at the entrance and catches himself against the bank. His wrist is hurt. Bion stops the attempt and takes charge of the boat rescue.
I: Melas returns much later, chilled and exhausted. We have two people needing care, and the crowd has gone quiet.
show Melas worried center
I: Bring blankets and stay to help both of them.
goto dash_fail_scores
label dash_fail_scores
goto aftermath
label aftermath
scene crossing
show Doria relieved left
show Nikias worried right
camera two Doria Nikias cut
Doria: Father is home on this side. That matters. So do the costs of getting him here.
if Honour >= 12 -> applause else quiet_finish
label applause
I: Someone starts calling Nikias a hero. Soon the crowd repeats it. Bion's equipment and Doria's signals disappear from the story people are telling.
Nikias: They finally see me differently.
Doria: Then tell them who else they should see.
goto reflection
label quiet_finish
I: Most onlookers drift away. One says the whole business took too long. Doria is still wrapping a blanket around her father.
Nikias: Is that it? No one even stays to thank us?
Doria: Father stays. I will take that.
goto reflection
label reflection
show Aristotle curious left
show Lin curious right
camera two Aristotle Lin cut
Lin: The score tells me how the rescue went. Does it tell me whether I am courageous?
Aristotle: It tells you something about this outcome. What did you understand? What did you choose for its own sake? What will you practise again?
Lin: And if I wanted to help and wanted everyone to admire me?
Aristotle: Then you have more than one desire to examine. A good result does not finish that work.
I: I look back at the bank. Nobody improved it by being fearless. Nobody improved it by being afraid of everything, either.
Aristotle: What kind of person are you practising becoming?
label result
I: My rescue score adds the outcome, harm prevented and cooperation. Honour records public reputation separately. These are this game's priorities, not a grade for my character.
I: My six decisions are saved below. Which habit would I practise again—and which would I change even if it won applause?
scene classroom
show Hepting curious left
show Lin relieved right
camera two Hepting Lin cut
I: The taxi brings us home. The driver raises four fingers: four knowledge questions before he will consider the fare paid.
Lin: I want to say I stopped caring what people think. I did not. But I noticed when it was making decisions for me.
Hepting: That gives you something concrete to work on tomorrow.
end
