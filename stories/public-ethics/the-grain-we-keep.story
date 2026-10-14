story 2
variable food = 60 range 0 100 visible
variable seed = 20 range 0 20 visible
variable repaired = false hidden
variable evidence = false hidden
# YOU / NEED: a student temporarily trusted with a real decision, not an ancient body.
label opening
I: You are going about your day and find a small strange stone with markings on it. Do you pick it up?
I: I pick it up. The markings warm beneath my fingers. A thin gold circle begins to glow.
I: For a moment, everything goes dark. Then light opens around me. Warm wind brushes my face. I am still myself, still holding the stone.
label arrival
scene village
show Djehu surprised center
camera wide
Djehu [surprised, question]: Are you the adviser the stone promised? I had imagined more luggage. Or at least a warning before you arrived.
I: Mudbrick walls surround a grain store beside the Nile. The stone warms my palm: Egypt, around 1900 BCE. A low flood has left the fields thirsty.
camera medium Djehu
Djehu [worried, explain]: I am Djehu, the scribe. Our administrator is away. The village has agreed to let its visitor direct today's emergency distribution.
Djehu: This seal gives your orders authority. It does not make them wise. I record the food; you decide whose needs we notice.
I: He puts the seal beside my notebook. Through the doorway I see an empty basket, a digging tool, and several people trying not to look frightened.
Djehu [worried, hesitant]: Sixty food. Twenty seed, kept separately for planting. The canal bank has collapsed. Tonight's water may reach us—or escape into the sand.
I: I am still me, temporarily responsible for a store that other people need. The stone's circle will close at dawn. Their lives will continue afterward.
choice first-hearing
option households "Hear the people waiting before promising anything." -> hear-households
option ledger "Check what the grain account leaves out." -> inspect-ledger
label hear-households
Djehu [neutral, explain]: Tia speaks for the households. Hori repairs the irrigation channels. Neither expected to be invited in first.
I: I pull a bench into the shade. My first official act is moving furniture. At least I am qualified for this one.
goto first-bread
label inspect-ledger
I: The board lists sacks, not mouths. I ask where it records the people too ill to collect a ration.
Djehu [embarrassed, hesitant]: It doesn't. A neat total can hide a very untidy omission.
I: He opens another board. Before we have moved any grain, we have changed what counts as evidence.
goto first-bread
# SEARCH: three linked commitments, each with a visible cost.
label first-bread
scene village
show Tia determined center
camera medium Tia
Tia [determined, explain]: I am Tia. I carry my neighbours' requests because some cannot walk here. My basket has become very good at carrying nothing.
react Tia sigh
Tia: My neighbour has three children. My brother has two strong sons. Equal household shares are our custom. They will not feed both homes for the same time.
I: Beyond her shoulder, a child licks flour from an empty bowl. The grain stays beautifully safe behind its locked door.
Tia [worried, insist]: Give reasons people can question. But please don't make the children wait until you understand everything.
I: Djehu's estimates sit beside the seal: sixteen measures for urgent needs, including delivery; eighteen for equal household shares. Neither can end the shortage.
choice first-ration
option needs "Distribute by need; explain the rule and deliver absent households' shares. Cost: 16 food." -> needs-ration ; food -= 16
option equal "Use equal household shares so the rule is simple and predictable. Cost: 18 food." -> equal-ration ; food -= 18
label needs-ration
Tia [relieved, reassure]: I'll take a witness on deliveries. If we ask you for an open account, we should offer one too.
I: Some people challenge the different amounts. Explaining a rule is slower than stamping it. That does not make their questions a nuisance.
goto canal
label equal-ration
I: The line moves quickly. Tia accepts her share, then quietly tips some into a larger household's basket.
Tia [sad, explain]: I understand your rule. These children still need more. Equal treatment and meeting different needs can pull apart.
goto canal
label canal
scene village
show Hori worried center
camera wide
I: At the courtyard's water gate, Hori lays reeds on the ground to map the broken bank. His muddy feet have brought a second map indoors.
camera medium Hori
Hori [worried, explain]: I repair these channels. My father patched this bank twice. Water cut underneath both patches. We must strengthen the base.
Hori: Twelve measures will feed a crew for the deeper repair. Or six buys shorter shared shifts, if you help and accept that we may not finish before the water.
I: He rubs a sore wrist. His own field needs work too. Calling this everyone's duty will not give him another pair of hands.
Hori [determined, insist]: Doing good work improves our chances. It cannot promise what the river will do.
choice repair-plan
option crew "Feed the crew and fund the deeper repair. Cost: 12 food." -> paid-repair ; food -= 12, repaired = true
option shifts "Join shorter shared shifts and preserve more food. Cost: 6 food." -> shared-repair ; food -= 6
label paid-repair
I: Grain goes out before the work begins. Hori marks the foundation, where the dangerous weakness actually is.
Hori [relieved, explain]: Thank you for paying for the part nobody can admire from the road.
I: I carry reeds while the crew digs. By evening, the reinforced bank is ready. Our store is thinner; the repair is stronger.
goto bargain
label shared-repair
I: I take a basket of mud. It feels light for approximately four steps. Then it develops political opinions about my arms.
Hori [happy, reassure]: Smaller loads. We need you useful, not impressive.
I: The shifts leave time for workers' own fields, but the daylight runs out before the foundation is finished. The temporary patch must face tonight's water.
goto bargain
label bargain
scene village
show Intef skeptical center
camera medium Intef
Intef [neutral, explain]: Intef. My estate has grain. Before you ask: my mother remembered a hunger year. I would rather not bury people.
I: He brings a loaf, not guards. His fine linen is clean in a way that feels almost argumentative.
Intef [worried, hesitant]: If I give once, every shortage becomes mine to solve. Twenty-four measures, if households owe labour until the debt is repaid.
I: I ask when that obligation ends. He cannot give a date. The larger delivery would buy relief by giving him power over future work.
Intef [skeptical, question]: Or sixteen, with my contribution publicly recognised. No household debt. Would you refuse useful help because I want my name remembered?
choice contribution
option credit "Accept 16 measures for truthful public credit, with no labour debt." -> negotiated ; food += 16
option levy "Require a proportionate 12-measure surplus contribution under a published rule." -> levied ; food += 12
option debt "Accept 24 measures now, despite the open-ended labour obligation." -> indebted ; food += 24
label negotiated
Intef [happy, explain]: Record sixteen. Not fourteen because you dislike my pride, and not twenty because I enjoy praise.
I: His mixed motives have supplied real food. My promise is credit for what he gave, not control over the village.
goto missing
label levied
Intef [angry, insist]: Then publish who else the rule covers. Including yourself, if you hold a surplus.
I: He sends the grain and leaves angry. A defensible demand can still make an opponent; the sacks do not tell me whether he will cooperate tomorrow.
goto missing
label indebted
I: The extra sacks arrive. So does a list of households expected to supply future labour. The space for an end date is empty.
Intef [neutral, explain]: They will eat tonight. That matters.
I: It does. So does the power in the unfinished agreement. I leave that cost visible in the account, rather than pretending the food was free.
goto missing
# FIND / TAKE: apparent order, evidence, then uncertainty outside the student's control.
label missing
scene village
show Djehu worried center
camera close Djehu
Djehu [worried, hesitant]: A measure is missing. Someone named a young worker. Three people repeated the accusation. The guard is waiting for your order.
I: Outside, the boy twists an empty strap. Djehu's board has a corrected mark. One rumour has acquired three voices and the appearance of certainty.
Djehu: Hori says the boy delivered food to an injured friend. Someone else saw a basket spill. Neither tells us whether the account is right.
choice accusation
option investigate "Delay judgment: compare the entry with independent witnesses." -> investigate ; evidence = true
option release "Release the boy immediately; postpone investigating the account." -> release
label investigate
I: I ask for corroboration: someone who actually saw the delivery, rather than heard the accusation repeated.
Djehu [embarrassed, explain]: I counted that delivery twice. The boy had permission to take the ration. Nobody recorded the permission.
react Djehu sigh
Djehu [relieved, reassure]: Correct both failures. Please leave my correction visible. The next scribe needs to know how the mistake happened.
I: Impartiality protected a person, not just a tidy procedure. I wonder how quickly anyone would have seized Intef's arm.
goto water
label release
Djehu [relieved, reassure]: He can go home. You have spared him a frightening night.
I: The disputed entry remains. Mercy has protected this boy; without a checked account, tomorrow's accused person may face exactly the same danger.
goto water
label water
scene village
show Hori surprised center
camera wide
effect shake
I: A shout cuts across the courtyard. Water strikes the gate. Hori grabs my sleeve and pulls me back onto the raised path.
Hori [determined, insist]: Stay here. The crew knows the bank. Nobody proves their courage by becoming another person to rescue.
chance water-pressure 50 -> ordinary-water else hard-water
label ordinary-water
if repaired == true -> strong-holds else patch-holds
label strong-holds
Hori [relieved, explain]: The deep repair holds. Water reaches the lower fields. Tonight, our preparation and the river happened to agree.
goto seed-store
label patch-holds
Hori [relieved, explain]: The patch holds—for tonight. We saved food, and the pressure stayed low enough. We still owe that foundation more work.
I: Relief is not proof that the cheaper plan was always safe. Tomorrow's team needs the warning as much as the good news.
goto seed-store
label hard-water
if repaired == true -> strong-damaged else patch-breaks
label strong-damaged
Hori [sad, explain]: The main bank holds, but a side channel breaks. Some lower plots lose their water. Even a careful repair cannot protect every weak place.
I: We funded the stronger plan and people still face losses. Hori marks the damage instead of offering a comforting lie.
goto seed-store
label patch-breaks
Hori [sad, explain]: The unfinished base gives way. Everyone got clear, but the lower fields have lost tonight's water. We need another repair before planting.
I: Keeping more food was a real benefit. The risk we accepted has become someone else's muddy field. I cannot cross that consequence off the board.
goto seed-store
label seed-store
scene village
show Tia worried center
camera close Tia
Tia [worried, question]: The seed store still has twenty measures. Five could carry the weakest through. Fifteen would feed more people now. What will we plant afterward?
I: She rests her empty basket against the sealed door. Today's hunger and next season's hunger have arrived at the same address.
Tia: The remaining food is promised for the coming days. Borrow from those rations, or from the seed? Neither store is spare.
Tia: Do not promise nobody will ever be hungry. Tell us what remains, who receives it, and when we can ask you to reconsider.
choice seed-ration
option preserve "Protect all 20 seed measures; divert 5 food from the coming days to urgent needs." -> preserve-seed ; food -= 5
option emergency "Release 5 seed measures for urgent needs; protect 15 for planting." -> emergency-seed ; seed -= 5
option consume "Release 15 seed measures to relieve more hunger now; keep 5." -> consume-seed ; seed -= 15
label preserve-seed
Tia [sad, explain]: You have protected a better chance of a harvest. Remember the people who still have to reach it.
I: Five measures leave the food store for urgent needs. The coming days now have thinner rations; guarding the seed has not removed the cost.
goto record
label emergency-seed
Tia [relieved, explain]: Record the five as an emergency release. And record that it means less planting. A compromise is not a miracle.
I: She carries a small basket toward the homes beyond the canal. Fifteen measures stay under the seed seal.
goto record
label consume-seed
Tia [relieved, reassure]: More children will eat tonight. Thank you for seeing them.
I: Then she looks into the nearly empty seed store. Gratitude does not refill it. Tomorrow's planting team inherits five measures and a harder problem.
goto record
# RETURN / CHANGE: leave an accountable institution, not a perfect ending.
label record
scene village
show Djehu neutral center
camera medium Djehu
Djehu [neutral, explain]: We speak of ma'at: truth, justice and the proper order of the world. Powerful people can also say 'order' when they mean 'leave my place untouched'.
I: The stone's gold circle is nearly closed. My choices have moved food and risk between people; none has made the shortage vanish.
Djehu [curious, question]: Shall the record say your authority settles everything? Or give reasons, name the consequences, and let people question the orders?
if evidence == true -> checked-record else unchecked-record
label checked-record
Djehu [relieved, explain]: My corrected entry stays. If I hide my mistake, I hide the lesson that could protect the next boy.
goto handover
label unchecked-record
Djehu [worried, explain]: I have marked the disputed entry for tomorrow's review. An unanswered question should not quietly turn into a fact.
goto handover
label handover
I: Tia has asked for household voices in the next hearing. Hori wants authority to make small repairs without waking an administrator for every shovel of mud.
Djehu: Either plan needs public accounts and a way to appeal. Otherwise we have simply changed whose name people are afraid to question.
choice lasting-arrangement
option council "Leave a household-and-worker council, public accounts, and a protected complaint route." -> council
option successor "Train a successor with written duties, public reviews, and appeals." -> successor
label council
Djehu [happy, explain]: Tia and Hori have already disagreed about the first rule. Neither asked you to end the discussion. I think that is progress.
I: My name joins the contributors' names. Beneath them: food remaining, seed remaining, debts or promises, repairs still needed. Accountability fits on less stone than a monument.
goto return
label successor
Djehu [determined, explain]: I can repeat the duties without looking. More importantly, so can the people who may need to challenge me.
I: I leave the seal beside an open account. Sharing responsibility gives the next leader room to rest and other people a way to correct a mistake.
goto return
label return
camera wide
effect magic
scene path
I: A circle of gold opens beside the grain store. I step through and find the familiar path beneath my feet. Dust from the courtyard still marks my notebook.
I: I have left a village with food, unfinished work, and people entitled to question what I did. Did everybody approve? No. Could I explain my reasons—and admit what the consequences made me reconsider?
I: The stone cools. I cannot carry the seal home. I can carry the habit of asking who is missing from the account.
end
