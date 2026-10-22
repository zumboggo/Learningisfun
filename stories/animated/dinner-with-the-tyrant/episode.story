story 2
variable Invitation = 0 range 0 2 hidden
variable Toast = 0 range 0 2 hidden
variable Purse = 0 range 0 2 hidden
label opening
scene classroom
show Hepting curious left
show Lin happy right
camera two Hepting Lin cut
Lin [happy]: A powerful person offers me dinner. My philosophical position is yes.
Hepting [curious]: And asks you to tell everyone how wonderful he is?
Lin [skeptical]: My philosophical position now requires the menu.
I: The Teaching Stone warms beside my empty lunch box. Inside it, someone is washing vegetables while another person protects a very clean cloak.
Hepting [determined]: Diogenes and Aristippus. An ancient writer records their argument. The banquet, courier and choices we add are fiction, not a documented day in their lives. Their dialogue is paraphrased or invented.
effect magic
scene street
show Diogenes neutral left
rest Diogenes crouched
show Aristippus happy right
camera wide
I: I land beside a fountain in an imagined Greek street, in the fourth century BCE. Diogenes rinses greens. Aristippus steps around a puddle as if negotiating with it.
Diogenes [skeptical]: Learn to eat these, Aristippus, and you would not need to flatter rulers.
Aristippus [happy]: Learn to deal with people, Diogenes, and you would not need to wash these.
I: This exchange comes from a much later collection of anecdotes. We cannot verify that it happened. The stone has turned its argument into a place I can enter.
choice first_reply
option hunger "I ask whether they are arguing about dinner or freedom." -> reply_hunger
option cloak "I ask whether refusing a clean cloak can become its own kind of pride." -> reply_cloak
option taste "I ask Diogenes whether the vegetables are actually good." -> reply_taste
label reply_hunger
Aristippus [curious]: Both. A hungry person is not improved merely by being hungry.
Diogenes [determined]: And a full person may still be owned by whoever fills the bowl.
goto courier
label reply_cloak
Aristippus [laughing]: At last, someone willing to examine both wardrobes.
Diogenes [curious]: Certainly. If I need people to admire my poverty, their applause has become another possession I cannot lose.
goto courier
label reply_taste
Diogenes [happy]: Better with an onion. Freedom does not require bad cooking.
Aristippus [laughing]: Excellent. We have agreed on seasoning. Civilisation advances.
goto courier
label courier
scene street
show Niko worried left
show Aristippus curious right
camera two Niko Aristippus cut
I: Niko arrives carrying a petition from fishing families. Niko is fictional, as is the new harbour fee they are challenging. His job is to get the petition officially received, not promise that it will succeed.
Niko [worried]: I spent my food money getting here. The palace clerk will see visitors this evening. Aristippus has an invitation to the ruler's banquet.
Aristippus [determined]: I can ask the steward to receive the petition. Knowing a door is not the same as owning the room behind it.
Niko [skeptical]: It is still a useful door. But the families asked for their complaint to be delivered, not exchanged for compliments.
I: The invitation includes a guest. There is a meal inside and a chance to speak to someone with influence. Outside, Niko has half a loaf and a long evening ahead.
Aristippus [curious]: Pleasure matters. Friendship, conversation, a good meal. I want to enjoy what is available without becoming unable to leave it.
I: Aristippus is associated with the Cyrenaic tradition. Later Cyrenaics make present pleasure central to the good life. His own outlook should not be reduced to grabbing every pleasure at any price.
choice examine
option leave "I ask what would make Aristippus walk away from dinner." -> examine_leave
option need "I ask what Diogenes means by needing less." -> examine_need
option courier "I ask Niko what help he actually wants from me." -> examine_courier
label examine_leave
Aristippus [determined]: If the price were a promise I could not defend, I should leave. But refusing before learning the price may waste a chance to help.
Niko [curious]: Then we need to notice the price before the pudding arrives.
goto needs
label examine_need
Niko [curious]: Let us ask him. He has been listening while pretending to inspect that leaf.
Aristippus [happy]: It is a remarkably controversial leaf.
goto needs
label examine_courier
Niko [determined]: Help me get a receipt. You do not have to agree with every complaint, and you cannot promise the fee will disappear. I need proof that the petition reached the office.
Aristippus [relieved]: A limited task. At court, that is a luxury of its own.
goto needs
label needs
scene street
show Diogenes curious left
rest Diogenes relaxed
show Niko worried right
camera two Diogenes Niko cut
Diogenes [determined]: I train myself to need little, so that someone with more cannot easily buy my silence. Virtue and independence matter more than luxury or reputation.
I: This is Cynicism: a philosophical challenge to conventional desires and status. It does not mean assuming everyone has selfish motives, as cynical often means today.
Niko [worried]: You choose a simple meal. My family sometimes has no choice. Please do not call that freedom.
camera listener Diogenes cut
Diogenes [curious]: Fair. Voluntary practice is not the same as someone else's deprivation. I can share food. I cannot make an empty storehouse into a virtue.
camera two Diogenes Niko cut
Diogenes [skeptical]: But when a ruler discovers you cannot bear losing his favour, how loudly will you object to his next demand?
Niko [determined]: And if everyone who might object stays outside, who hears us inside?
I: The stone folds the street into a harbour. It carries Niko and me into an imagined court in Syracuse, where Aristippus is our guide. This magical joining of settings is fiction; Diogenes is not being placed at a documented Syracusan meeting.
effect magic
scene palace
show Aristippus curious left
show Steward worried right
camera wide
I: Philon, the fictional banquet steward, checks the guest list. He wants a calm evening and the household fed on time. He did not set the harbour fee.
Steward [worried]: You may bring one guest. The courier can wait at the gate. The clerk receives petitions after the toast.
Aristippus [curious]: You can join me, ask about the terms first, or stay with Niko. None guarantees a favourable answer.
choice invitation
option join "I accept the guest place and try to help from inside." -> invitation_join ; Invitation = 1
option terms "I ask what is expected before accepting the guest place." -> invitation_terms ; Invitation = 2
option outside "I decline the guest place and stay with Niko at the gate." -> invitation_outside ; Invitation = 0
label invitation_join
Aristippus [happy]: Come. There may be something useful between the courses.
Steward [relieved]: One guest. Please remember that hospitality has an audience.
I: I have gained access. I have not yet learned what the audience expects.
goto toast
label invitation_terms
Steward [curious]: You are expected to stand for the toast. You will be introduced as a visitor who appreciates the ruler's generosity. Is that acceptable?
Aristippus [skeptical]: Appreciating dinner and approving government are different claims. Let us keep them different.
I: I accept a place only if my own words remain mine. Philon agrees to hear my wording, not to guarantee the ruler will like it.
goto toast
label invitation_outside
Aristippus [determined]: I will ask inside. Your refusal need not become a refusal to help Niko.
Steward [worried]: Stay near the gate. If the clerk calls, I will not search the city for you.
I: I keep clear of the guest list. I lose the chance to put a question directly to a diner.
goto toast
label toast
scene palace
show Steward worried left
show Niko curious right
camera two Steward Niko cut
I: At the entrance, Philon brings the wording of the public toast. Even those receiving help outside are invited to join it: the ruler is called the wisest and most just protector of the city.
Steward [worried]: It is customary. A refusal could look like an accusation. A public insult will not make the clerk more helpful.
Niko [skeptical]: Do we know that he is the wisest and most just? The families sent evidence about a fee, not a report on his whole character.
I: No guard forces the words from me. The pressure is an invitation, a waiting petition and the possibility of being remembered badly.
choice toast
option praise "I repeat the full customary praise to preserve goodwill." -> toast_praise ; Toast = 0
option specific "I thank the household for the food and hearing us, without praising the ruler's justice." -> toast_specific ; Toast = 1
option silence "I remain silent, accepting that people may read it as criticism." -> toast_silence ; Toast = 2
label toast_praise
Steward [relieved]: That will keep the ceremony smooth.
Niko [worried]: Perhaps. But if someone asks whether the fishing families endorsed those words, tell them they were yours.
I: I have protected access by saying more than my evidence supports. Whether that price is justified remains my responsibility.
goto meal
label toast_specific
Steward [skeptical]: I can introduce that as thanks. The omission may still be noticed.
Niko [relieved]: You have not pretended to know his character. I hope they hear the thanks rather than only the missing words.
I: Careful wording reduces the claim. It does not remove the political risk.
goto meal
label toast_silence
Steward [disappointed]: Then I will not announce an endorsement. I cannot promise that silence will look neutral.
Niko [worried]: I understand. Please do not leave me to explain your silence as well as the petition.
I: My refusal is clear. Its meaning to others remains beyond my control.
goto meal
label meal
if Invitation == 0 -> outside_meal else inside_meal
label inside_meal
scene palace
show Aristippus happy left
show Steward neutral right
camera two Aristippus Steward cut
activity Aristippus eat steady
I: Dinner arrives. I enjoy warm bread, olives and soup. My stomach offers no objection to Cyrenaic philosophy.
Steward [curious]: Your friend is still waiting outside.
activity Aristippus pause
Aristippus [determined]: Then please set aside a bowl for him. He should not have to praise anyone to be hungry.
Steward [neutral]: There is enough in the kitchen. I will ask for one.
activity Aristippus stop
Aristippus [curious]: Enjoying this does not prove I am free. Refusing it would not prove that either. Watch what I do when the host asks for more.
goto purse
label outside_meal
scene harbour
show Niko worried left
show Aristippus curious right
camera two Niko Aristippus cut
I: Niko and I divide his half-loaf at the gate. It is a very small banquet. Aristippus comes out carrying news from the kitchen.
Aristippus [determined]: Philon has arranged soup for the courier, without requiring the toast. Take it. A free bowl does not become poisonous because I asked for it.
Niko [relieved]: I will take it. My objection was to buying praise, not to soup.
I: Refusing a guest place has not made every possible benefit unacceptable. But deciding where dependence begins is harder than drawing a gate.
goto purse
label purse
scene palace
show Steward curious left
show Niko curious center
show Aristippus skeptical right
camera wide
I: Philon meets us at the gate with a small purse. The household offers travel money to visitors and messengers. It could replace Niko's spent food money.
Steward [curious]: A gift from the household. We remember our friends. Perhaps we will ask you to speak for us another day.
Aristippus [skeptical]: That last sentence has quite a large appetite.
I: No service is specified. Refusing loses useful money now; accepting may let the household describe us as people who owe it a favour. Niko asks me to advise before he decides.
choice purse
option accept "I advise accepting the purse while retaining the right to refuse future requests." -> purse_accept ; Purse = 0
option clarify "I ask for an explicit statement that the purse buys no future service." -> purse_clarify ; Purse = 1
option refuse "I advise refusing the purse so the household cannot claim a debt." -> purse_refuse ; Purse = 2
label purse_accept
Niko [curious]: We can use it. If they ask for something wrong later, we will have to say no even after spending it.
Steward [happy]: I will record the household's gift. Other people may still call it a favour.
I: Niko accepts. The money solves a real expense; it leaves an unresolved expectation.
goto petition
label purse_clarify
Steward [worried]: I can record it as travel reimbursement with no promised service. I cannot control what every courtier will assume.
Niko [determined]: Write that, please. It gives us something to point to later.
I: Niko accepts the recorded reimbursement. A clearer agreement helps, but does not make social pressure disappear.
goto petition
label purse_refuse
Niko [worried]: I would like the money. But I would rather explain an empty purse than a promise I never made.
Steward [disappointed]: Then I keep it. Do not mistake the refusal for an order that I must admire you.
I: Niko refuses. We leave the expectation behind with money we could have used.
goto petition
label petition
scene palace
show Niko determined left
show Aristippus worried right
camera wide
I: The clerk is finally ready. Aristippus has secured a brief opening. Niko still needs proof of delivery; no one has promised to abolish the fee.
Aristippus [worried]: I can introduce him privately. Or he can insist on the normal registry. Calling attention to the complaint might stop it being buried, but could also make officials defensive.
choice petition
option introduction "Use Aristippus's private introduction and ask the clerk for a receipt." -> petition_introduction
option registry "Use the public registry and obtain the ordinary written receipt." -> petition_registry
option public "State the families' complaint aloud before submitting it for a receipt." -> petition_public
label petition_introduction
Aristippus [determined]: This courier speaks for the families named here. Please receive their petition and give him proof.
Niko [relieved]: The clerk reads the opening and marks a receipt. I get two minutes to explain the fee. Next time I may still need someone who knows the door.
goto accomplished
label petition_registry
Niko [determined]: Please enter it in the register and give me the normal receipt. I want the same process another courier could use.
I: The clerk receives it after finishing two other entries. We get proof of delivery, but no private explanation or promise of a reply date.
goto accomplished
label petition_public
Niko [determined]: These families ask why this fee has increased. They have sent names and figures, and request a reply.
I: Several guests hear. The clerk gives a receipt and asks us to leave the doorway. Our complaint has witnesses, and the household is visibly irritated.
goto accomplished
label accomplished
scene harbour
show Niko relieved left
show Aristippus neutral right
camera two Niko Aristippus cut
I: Niko tucks away the receipt. He has eaten, and the petition has been received. Those are real achievements in our invented day. The fee remains in place tonight.
Niko [relieved]: Now I can tell the families exactly what happened. No promised victory. No claim that the ruler has become just because we found a helpful clerk.
if Toast == 0 -> toast_callback_praise else toast_callback_other
label toast_callback_praise
Niko [worried]: And I will say that your praise was yours, not their endorsement. Getting the receipt does not settle whether those words were worth saying.
goto purse_callback
label toast_callback_other
if Toast == 1 -> toast_callback_specific else toast_callback_silence
label toast_callback_specific
Aristippus [curious]: Your specific thanks left you less to defend. It also relied on Philon accepting the distinction. Another steward might not.
goto purse_callback
label toast_callback_silence
Aristippus [curious]: You stayed silent and the petition still arrived. That does not prove refusal always works; tonight the clerk kept receiving complaints.
goto purse_callback
label purse_callback
if Purse == 0 -> purse_callback_accept else purse_callback_other
label purse_callback_accept
Niko [worried]: Tomorrow, if they ask for a speech, our purse may already be empty. That is when we discover whether our freedom to refuse is more than a sentence.
goto return_street
label purse_callback_other
if Purse == 1 -> purse_callback_clarify else purse_callback_refuse
label purse_callback_clarify
Niko [curious]: I have the reimbursement note. Tomorrow, someone might still say we owe them. Clear terms give us a defence, not immunity from pressure.
goto return_street
label purse_callback_refuse
Niko [curious]: We owe no favour for a purse. I still need travel money. Independence has costs that someone must carry.
goto return_street
label return_street
effect magic
scene street
show Diogenes curious left
show Aristippus neutral right
camera two Diogenes Aristippus cut
I: The stone returns us to the imagined street. I describe our afternoon. Diogenes has finished the vegetables. Aristippus has a small stain on his excellent cloak.
Diogenes [skeptical]: You helped the courier. Now ask whether you can do it again without the ruler's permission.
Aristippus [determined]: You would ask him to depend on less. I would ask him to use what is available without surrendering judgment. Neither question fills every empty bowl.
Diogenes [curious]: Nor does a clean conscience give us permission to ignore one.
I: They disagree about the good life: how much pleasure deserves pursuit, and whether learning to need less or adapting to circumstances better protects freedom. Neither has proved the other a fool.
choice judgement
option simple "I say Diogenes offers the stronger safeguard: practise needing less." -> judgement_simple
option adaptable "I say Aristippus offers the stronger safeguard: enjoy benefits while remaining able to leave." -> judgement_adaptable
option conditional "I say my judgment depends on what the gift asks of me, and whether I can truly refuse." -> judgement_conditional
label judgement_simple
Aristippus [curious]: Then show how your safeguard helps a person who cannot choose their hunger. Practising simplicity should not become an excuse to leave them outside.
Diogenes [determined]: A fair test of the principle. Do not confuse owning little with having nothing to offer.
goto home
label judgement_adaptable
Diogenes [curious]: Then practise leaving something you actually want. Otherwise your independence is a speech delivered beside a full plate.
Aristippus [determined]: A fair test. Being welcome everywhere is not freedom if I cannot bear being unwelcome anywhere.
goto home
label judgement_conditional
Diogenes [skeptical]: Name the condition before the comfortable chair helps you forget it.
Aristippus [curious]: And remember that refusing every offer is also a decision with costs. Conditions need reasons, not merely fine wording.
goto home
label home
effect magic
scene classroom
show Hepting curious left
show Lin neutral right
camera two Hepting Lin cut
I: My lunch box is still empty. Beside it I have written two things: the petition was received; no one bought a verdict about the whole philosophy.
Lin [curious]: What if the household calls tomorrow and asks Niko to say the harbour fee is fair? The families still want their complaint heard.
Hepting [determined]: That is the fresh test. Explain why each school might respond differently, using a detail from the episode. Then defend your own principle, or revise it if you have a reason.
I: In the separate Principles Portfolio, I will choose, give a reason and detail, explain the strongest other view, state a principle, and test it. The knowledge check asks what the positions mean, not which one I must agree with.
Lin [skeptical]: Next time I will ask about the toast before asking about the menu.
Hepting [happy]: A promising beginning. You may still ask about the menu.
end
