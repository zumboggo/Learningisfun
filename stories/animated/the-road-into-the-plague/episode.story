story 2
variable CarryNames = false hidden
variable Advice = 0 range 0 2 hidden
variable ReserveSupplies = false hidden
variable SeekNews = false hidden
label classroom
scene classroom
I: I rest my hand on the Teaching Stone. If people need me somewhere dangerous, is staying away a betrayal?
I: I write the question in the classroom book. Light gathers beneath the page. I close my fingers around my pencil.
label taxi_arrival
I: A taxi rolls through a bright opening in the classroom wall. I climb in alone; my class stays behind.
label taxi_departure
I: We lift over the school field and enter a second opening. Beyond it, a dusty road runs between low hills.
label sargh
scene road
show Rashid worried left
show Nadir neutral right
camera two Rashid Nadir cut
I: At Sargh, I step out beside a travelling party that has stopped without unpacking. A man steadies a slipping bundle with his knee. I catch its loose end.
Rashid [relieved]: Thank you. Hold that while I tighten it. I am Rashid. You have arrived at a very bad time to ask when we leave.
Nadir [curious]: Or a very good time to help. I am Nadir. I keep this little group's supplies in order. Can you carry our questions while I count what we have?
I: I agree. I want to bring back an answer they can act on. Then someone passes the word along the road: plague in al-Sham, the country ahead.
Rashid [worried]: My cousin lives there. I have been carrying news from his family. Now every person who comes down this road might know something.
Nadir [determined]: And everyone here has people waiting for them too. Please remember that when you bring back an answer.
I: Umar, the caliph leading the Muslim community, is travelling toward al-Sham. At Sargh, Abu Ubayda and other commanders have brought him news of the outbreak.
I: There is no announced decision yet. Beside me, Rashid reties the same knot. Nadir counts a bundle twice.
choice first_question
option people "Ask Rashid what he knows about his cousin, and what he only fears." -> cousin
option risk "Ask Nadir what continuing would require from this group." -> travellers
option evidence "Ask both which news is confirmed before I repeat anything." -> evidence
label cousin
Rashid [sad]: I know where he lives. I do not know whether he is sick. That is the part my mind keeps filling in.
I: I ask whether he wants me to repeat his worry or report an illness. He looks up sharply.
Rashid [determined]: The worry. Do not turn my fear into news about him.
goto task
label travellers
Nadir [worried]: People hear a ruler deciding whether to go on. I hear someone deciding where all these feet must go. The youngest helper will follow because the rest of us do.
I: I ask whether the helper has been asked what risk he will accept.
Nadir [sad]: Not yet. Being willing to carry a bundle is not the same as agreeing to every danger along the road.
goto task
label evidence
Nadir [determined]: The commanders have reported the outbreak. That is more than a rumour. We still do not know what it means for every settlement ahead.
Rashid [worried]: And I have no news of my cousin. If someone says every household is lost, ask how they know.
I: I repeat the distinction aloud: an outbreak is reported; this family's fate is unknown.
goto task
label task
camera medium
activity Nadir walk right slow
Nadir [neutral]: I need the supplies ready whether we go forward or turn back. Walk with me to the shade, and tell me what you will carry to the discussion.
activity Nadir stop
camera two Rashid Nadir cut
Rashid [determined]: Carry the people ahead with you. We set out for a purpose. If leaders only arrive when the road is easy, what are their promises worth?
Nadir [skeptical]: Carry the people beside you too. Arriving with more people who need care may make a bad situation worse.
Rashid [worried]: You speak as if my cousin were a danger on a road, not a person at the end of it.
camera listener Nadir over 0.65
express Nadir sad
I: Nadir puts the bundle down. For a moment, the counting stops.
Nadir [sad]: I have not even asked his name.
camera two Rashid Nadir cut
Rashid [neutral]: Harith. I do not ask you to know how to save him. I ask you not to forget him.
I: I have room to carry one detailed request from this small group before the next consultation. The other concern will still be heard from others.
choice carry_request
option names "Carry Harith's name and ask how people ahead will remain our responsibility." -> carry_names ; CarryNames = true
option consent "Carry the helpers' concern and ask who may decide the risk they bear." -> carry_consent
label carry_names
Rashid [relieved]: Then take his name accurately. You cannot promise he will hear from us. But you can keep him from becoming just 'those people up there'.
Nadir [worried]: I will speak to the helpers here. Please do not let our quiet work look like agreement to go anywhere.
I: Rashid entrusts me with the family message. Nadir stays to hear the helpers' concerns himself.
goto consultation
label carry_consent
Nadir [relieved]: Ask who is being volunteered. That is the question I could not leave these bundles to carry.
Rashid [sad]: I will keep my cousin's message for now. Come back to me after you have an answer. Do not disappear into the sensible crowd.
I: Nadir gathers the helpers to hear their concerns. I take their question; Rashid keeps the message.
goto consultation
label consultation
camera wide
I: Around Umar, consultation moves from one group to another. Early emigrants disagree; the Ansar, the community's supporters from Medina, also disagree.
I: Some argue that the journey has a purpose and should continue. Others warn against taking the people accompanying Umar into the outbreak.
I: Later, elders of Quraysh advise returning. I hear no one promise a world without danger. They are choosing which responsibility to act on under uncertainty.
camera two Rashid Nadir cut
Rashid [determined]: If those ahead hear only that the caliph turned away, what will they think? A leader's presence can matter even when he cannot end the sickness.
Nadir [determined]: Yes. But he carries other lives with him. His courage does not give him ownership of their risk.
Rashid [skeptical]: Nor does protecting them erase his responsibilities to anyone else.
Nadir [neutral]: Agreed. Tell me what turning back would still require of us. That is a harder question than calling it cowardice.
I: My recommendation will not decide for Umar. It will tell these two what I am prepared to support, and they will expect me to stand behind it.
choice recommendation
option continue "Recommend continuing: the purpose and the people ahead deserve our presence." -> advise_forward ; Advice = 1
option return "Recommend returning: we should not bring this party into the outbreak." -> advise_return ; Advice = 2
option wait "Recommend holding here briefly to seek clearer news before moving either way." -> advise_wait
label advise_forward
Rashid [determined]: Then say what you are offering, not just where others should go. Would you carry a task yourself?
I: I offer to carry messages, while admitting I cannot promise that my presence will help. I will not call the helpers cowards if they are afraid.
Nadir [worried]: You have named a duty. Now remember that willing people can still add to the burden. I will keep asking about those who did not choose this.
goto decision
label advise_return
Nadir [relieved]: I will prepare the group for that possibility. We can protect them without pretending the people ahead no longer exist.
I: I say I must still help with a responsibility that reaches beyond the return road.
Rashid [sad]: I want to believe you. It will be easy to remember the people you can see, once the hills hide the rest.
goto decision
label advise_wait
Rashid [curious]: What news would change your mind? If no one brings it, how long do we stand here?
I: I ask for clearer information about the route and who needs help, but admit that waiting cannot guarantee certainty.
Nadir [determined]: I will keep the bundles accessible. We spend food and daylight while we wait. A pause is a choice with costs too.
goto decision
label decision
camera wide
I: Umar announces that he will return toward Medina in the morning. Abu Ubayda asks whether this means fleeing from God's decree.
I: Umar answers that choosing precautions also happens within God's decree. He compares it to choosing fertile rather than barren grazing for camels: either choice remains within God's rule.
I: Both men share faith in God. Their disagreement concerns what that faith requires in a dangerous situation.
camera two Rashid Nadir cut
Rashid [worried]: I hear the warning in Abu Ubayda's question. We do not control our fate. If fear decides everything, what will we ever be willing to do?
Nadir [determined]: I hear Umar saying our choices still matter. Trust need not mean refusing the better pasture when you can see it.
choice faith_reply
option limits "Tell Rashid: accepting that we cannot control everything can coexist with taking precautions." -> faith_precaution
option duties "Tell Nadir: precautions need a limit, or danger could excuse abandoning every duty." -> faith_duty
label faith_precaution
Rashid [skeptical]: Then do not call every retreat wise just because the traveller survives. Ask what they left undone.
I: I agree to judge the obligations as well as the outcome. He listens without agreeing that this journey should end here.
goto new_testimony
label faith_duty
Nadir [curious]: Yes. And courage needs a limit, or every avoidable danger becomes a test of loyalty. Ask what help a risk can actually bring.
I: I agree that a brave intention does not guarantee a useful act. He listens without agreeing that this party should go on.
goto new_testimony
label new_testimony
camera wide
I: Abd al-Rahman ibn Awf arrives after being absent. He reports Muhammad's instruction: do not enter a land where plague is occurring, and do not flee from it if already there.
I: Umar welcomes this testimony and returns. The instruction reaches the discussion after his announcement; it is not what every adviser already knew when they disagreed.
I: We are on the approach to the affected region. Turning back here is different from fleeing a place where we are already living through the outbreak.
camera two Rashid Nadir cut
Nadir [neutral]: We have a direction now. I still need your help with what we take responsibility for next.
if Advice == 1 -> forward_callback else other_advice
label forward_callback
Rashid [sad]: You offered to carry a task yourself. The journey will not go forward, but the offer need not vanish with it.
I: I cannot make Umar reverse his decision. I can keep the practical part of my commitment.
goto supplies
label other_advice
if Advice == 2 -> return_callback else wait_callback
label return_callback
Rashid [determined]: You said you would help beyond the return road. This is the moment I meant.
I: Protecting the party was my recommendation. I have not yet finished the responsibility that came with it.
goto supplies
label wait_callback
Nadir [neutral]: You asked what information would matter. New testimony has arrived; the decision has been made. Will you help us act now?
I: I stop treating uncertainty as a reason to postpone every practical task.
goto supplies
label supplies
I: Nadir has a small reserve beyond what he has set aside for the planned return. He can keep it against delays, or mark it for a request to help those ahead. Delivery is not arranged.
Rashid [determined]: Marking it would make our promise more than comforting words. I will help seek an authorised way to use it. I cannot promise that a route will open.
Nadir [worried]: A delay could make that reserve important here. I can separate it while we ask, but I need your help checking the return loads if we do.
choice reserve
option offer "Help set the reserve aside for an aid request, accepting less spare capacity here." -> reserve_aid ; ReserveSupplies = true
option keep "Keep the reserve with the returning party and help document the unmet need instead." -> reserve_return
label reserve_aid
camera action Rashid Nadir cut
act Nadir give Rashid "Nadir passes Rashid the reserve bundle; I help distinguish it from the return loads."
Rashid [relieved]: I will take responsibility for asking how it could be used. No one is being sent into the outbreak on my promise.
I: I help Nadir check the remaining loads. We have made resources available for a request, not delivered aid or proved that anyone will survive.
goto last_task
label reserve_return
Nadir [relieved]: Then I can keep the extra margin for the party. Help me record why we kept it, so it is a decision we answer for.
camera listener Rashid over 0.65
express Rashid sad
Rashid [sad]: I understand the reason. It still means there is no bundle for the request I hoped to make.
I: I sit with that answer before helping record the unmet need. An explanation does not remove the cost to him.
camera two Rashid Nadir cut
goto last_task
label last_task
if CarryNames == true -> names_callback else consent_callback
label names_callback
Rashid [neutral]: You carried Harith's name. Here is the message again. Will you help me put our next request into words that do not promise news we cannot obtain?
I: I read it back to him accurately. He corrects one detail, then lets me keep helping.
goto final_choice
label consent_callback
Nadir [neutral]: The helpers heard that you carried their concern. They are helping prepare the return now. Rashid is still waiting for you.
I: I return to Rashid as promised. He opens the message he kept earlier and finally reads it to me.
goto final_choice
label final_choice
I: Before the party moves, there is time for one last task. Rashid wants a request for news ready; Nadir needs help checking that the quietest helpers are accounted for.
choice last_commitment
option news "Stay with Rashid to finish a request for news of Harith, without claiming an answer will come." -> finish_news ; SeekNews = true
option people "Help Nadir account for the returning helpers; ask Rashid to carry his own request." -> finish_people
option connect "Bring them together to divide both jobs, then help with the final count." -> finish_together
label finish_news
Rashid [relieved]: Put that we do not know. Leave room for an answer that is not the one I want.
I: We finish the request. Nadir takes over the final count without me; his work lasts longer because I have chosen this task.
goto payoff
label finish_people
Nadir [determined]: Come. Start with the person who has not spoken all afternoon.
I: I help check the helpers and their loads. Rashid finishes his request alone. He thanks me for returning to listen, but does not pretend this was the help he hoped for.
goto payoff
label finish_together
camera listener Nadir over 0.65
Rashid [worried]: I can help with the count after this. Could you hear the request once, so someone besides me knows what it says?
Nadir [neutral]: Read it. Then help me check the last loads.
camera two Rashid Nadir cut
I: I keep the count while they exchange the request. Both tasks get attention, but we use the last quiet minutes before departure; no extra time appears because we cooperate.
goto payoff
label payoff
if ReserveSupplies == true -> aid_payoff else reserve_payoff
label aid_payoff
Rashid [determined]: The reserve stays marked for the request, pending permission and a practical route. If it cannot go, I owe Nadir an answer about it.
Nadir [neutral]: And I know what is left for the return. Thank you for doing the checking with me.
goto common_end
label reserve_payoff
Nadir [neutral]: The reserve is counted with the return loads. Rashid's unmet request is recorded alongside the reason we kept it.
Rashid [determined]: Keep both. Do not let a tidy count make the missing help disappear.
goto common_end
label common_end
I: The group is ready to act. My small task is finished: their concerns have been carried, the supplies accounted for, and the next responsibilities named. Harith's fate remains unknown to us.
if SeekNews == true -> news_payoff else other_payoff
label news_payoff
I: Rashid folds the request we finished together. I have helped ask a question I may never hear answered.
goto home
label other_payoff
I: Nadir calls the final count back to me. I have helped people leave without pretending that departure settles every duty.
goto home
label home
camera wide
I: The taxi waits off the road. I climb in safely, carrying no proof that my judgement was the best one. I do carry the names of the people who bore its costs.
scene classroom
I: Back beside the Teaching Stone, I reopen the question in the book. I add a second line: if I choose not to go, what responsibility remains mine?
I: The driver adjusts his sunglasses. Four questions for the fare. Understanding both sides will count; agreeing with one particular side will not.
end
