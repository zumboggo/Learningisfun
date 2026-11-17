story 2
variable HeardOwner = false hidden
variable AskedFood = false hidden
variable SoughtCare = false hidden
label camel_opening_v1
scene courtyard
I: An empty bowl turns toward me. The question I came to answer suddenly feels too small.
label classroom_start
scene classroom
show Hepting curious right
camera medium
I: I put my hand on the Teaching Stone. One question keeps bothering me: when someone takes what is not theirs, what else do I need to know?
Hepting [curious]: Start with the person who lost something. Then find out whose account is missing.
I: I write the question in the classroom book. A line of light runs under my pencil. My chair vibrates.
label taxi_arrival
I: A taxi noses through the classroom wall. The driver opens the door. This time, I am the passenger with a question to carry.
label taxi_departure
I: We rise over the school field. The light ahead turns the colour of sunlit sand.
label welcome
scene courtyard
show Salim curious right
camera medium
I: When I step out, a man is hauling water into the shade. I catch the bottom of his jar before it tips. Together we lower it beside the wall.
Salim [relieved]: Good hands. I am Salim. Come into the shade. You can stay with our household while you find your way.
I: His family belongs to Muzayna, a tribe in western Arabia. For now I have a place beside their mat, water to carry, and people expecting me back.
Salim [neutral]: You have arrived among Muslims. We worship one God. Muhammad was God's messenger; he died some years ago. Umar now leads the community as caliph. He is not another prophet.
I: Before I can ask more, a man comes through the entrance, holding a loose length of tether.
show Owner angry left
camera two Owner Salim cut
Owner [angry]: They took her. They slaughtered my camel.
I: He lays the rope down carefully. That movement unsettles me more than shouting would.
Owner [determined]: I am bringing the case before Umar. Salim, come with me. And you—can you help make sure I am heard?
choice first_response
option loss "Ask him what losing the camel means for him." -> hear_loss ; HeardOwner = true
option facts "Ask what he knows, before I agree to repeat the accusation." -> hear_facts
option accompany "Offer to accompany him and listen to everyone at the hearing." -> hear_accompany
label hear_loss
Owner [sad]: People hear one missing animal. I hear that everything I planned with her must change. Do not make my loss disappear when you tell this.
I: I promise to carry that concern, without promising a verdict.
goto departure
label hear_facts
Owner [skeptical]: Fair. Ask them too. But questioning the account must not become a way to forget the person who has lost something.
I: I say I will separate what I hear from what I actually witness.
goto departure
label hear_accompany
Owner [determined]: Then stay when it becomes uncomfortable. It is easy to agree with the last person who spoke.
I: I take my place beside Salim. The owner keeps the tether.
goto departure
label departure
camera listener Salim over 0.65
Owner [worried]: If everyone feels sorry for them, who is left to remember me?
express Salim worried
I: Salim looks at the loose rope before answering.
camera two Owner Salim cut
Salim [determined]: We will remember. We also need to hear them.
activity Salim walk right slow
I: I follow Salim out of the shade. He slows to keep beside me as I ask why religion belongs in a dispute about an animal.
activity Salim stop
Salim [neutral]: The Qur'an guides how we live with one another, as well as how we worship. Giving to people in need is part of that life.
I: He calls the required giving zakat. The Qur'an names the poor and people burdened by debt among those who can receive it.
Salim [curious]: A community is more than the people who can pay their own way. But first, listen to the people in this case.
label accused
scene courtyard
show Accused worried left
show Salim neutral right
camera two Accused Salim cut
I: We meet one of the people accused of taking the camel. He and the others are enslaved in Hatib's household: they are not free to leave and choose another employer.
Accused [determined]: We took the camel. I will not tell you we did not.
I: His answer removes one question and opens another. I have a chance to ask before people gather for the hearing.
choice ask_accused
option food "Ask whether they have been given enough to eat." -> ask_food ; AskedFood = true
option harm "Ask what they think the camel's owner is owed." -> ask_harm
option options "Ask what other choices were actually open to them." -> ask_options
label ask_food
Accused [worried]: Enough? No. When someone controls your work and your food, an empty bowl is not something you can simply walk away from.
I: I ask who was responsible for feeding them, rather than guessing that every hungry person has the same choices.
goto disclosure
label ask_harm
Accused [sad]: He lost his camel. I know that. I cannot give it back. But ask what was happening to us before we took it.
I: I let him finish. An admission of harm is not the whole account of responsibility.
goto disclosure
label ask_options
Accused [skeptical]: Could you leave a household that owns you? Could you decide how much food it gives you?
I: I stop before offering advice that assumes he has my freedom.
goto disclosure
label disclosure
Accused [determined]: Hatib's household uses our labour. It has not been feeding us adequately.
camera listener Salim over 0.65
express Salim worried
I: The man turns an empty bowl toward us. Salim's next question does not come immediately.
camera two Accused Salim cut
Salim [curious]: You need that heard in the case. Will you say it there?
Accused [determined]: Yes. Do not speak as though I am absent when I am standing beside you.
I: I agree. I can bring a question forward without taking his place.
if AskedFood == true -> food_callback else food_common
label food_callback
Accused [neutral]: You asked about food before you offered advice. Keep asking who had the power to provide it.
goto hearing
label food_common
I: I add another question to the one I brought: what was owed to these people before the camel was taken?
goto hearing
label hearing
scene courtyard
show Owner determined left
show Accused worried right
camera two Owner Accused cut
I: At the hearing, I stand with the people I accompanied. Umar hears the case. The responsibility of the household that enslaves the accused is now at issue too.
I: I have not witnessed the theft or their treatment. If I speak, I must make that limit clear. Salim asks what concern I want carried forward.
choice report
option owner "Make sure the owner's loss and request for repair are recorded." -> report_owner
option hunger "Ask that the accused explain their hunger and treatment themselves." -> report_hunger
option both "Distinguish the admitted taking from the question of who failed a duty of care." -> report_both
label report_owner
Owner [determined]: Thank you. I do not want punishment to become the only thing anyone remembers about my complaint.
I: I repeat his request as his request. The accused will still give their account.
goto verdict_start
label report_hunger
Accused [determined]: I can answer. Let the people who control our food answer too.
I: I step back to leave him room. The owner's complaint remains before Umar.
goto verdict_start
label report_both
I: I explain that admitting the act does not answer every question about responsibility. Both accounts need to be heard; I cannot certify events I did not see.
Owner [skeptical]: Then keep both in the account. Do not hide my camel inside an argument.
goto verdict_start
label verdict_start
camera wide
I: Umar initially orders the severe punishment of amputation for theft. My stomach tightens. No punishment has been carried out in front of me.
I: Then the direction of the judgement changes. Umar identifies starvation by the enslaving household and turns to its responsibility. The threatened punishment gives way to a financial penalty against the enslaver.
I: I have not persuaded a ruler to follow my chosen answer. His judgement comes from the case before him. Now another question presses on everyone: who must pay for the loss?
choice repair
option household "Argue that the household which denied food should bear the cost." -> repair_household
option community "Ask whether community help could restore the loss quickly." -> repair_community
option takers "Argue that taking the animal still creates an obligation to repair the harm." -> repair_takers
label repair_household
Accused [determined]: Then the people with power cannot make us carry every consequence of how they use it.
Owner [worried]: And the payment must reach the person who lost the animal. Responsibility cannot remain only a word.
goto ruling
label repair_community
Owner [worried]: Help would matter. But why should neighbours pay while the household responsible keeps its money?
I: My proposal may meet an urgent need while leaving another duty unanswered.
goto ruling
label repair_takers
Accused [worried]: We cannot make the animal live again. But what payment could you demand from people who were not even given enough food?
I: I must distinguish acknowledging a loss from choosing a fair and possible way to repair it.
goto ruling
label ruling
camera wide
I: Umar asks about the camel's value. The owner says he had refused an offer of 400 dirhams. Umar directs the enslaver to pay him 800.
I: Dirhams are money. This payment is compensation and a penalty, not repayment of a loan. The amount is definite; the questions behind it are not all settled.
label aftermath
scene courtyard
show Owner worried left
show Salim neutral right
camera two Owner Salim cut
Owner [worried]: There is an amount now. I needed someone to answer for what I lost. But I still have to go home without her.
if HeardOwner == true -> owner_callback else owner_common
label owner_callback
Owner [neutral]: You asked what losing her meant before the hearing. I remember that.
goto answer_owner
label owner_common
I: I look at the tether he is still carrying. I have heard a judgement, but he is the one who must live with the loss.
goto answer_owner
label answer_owner
choice after_hearing
option relief "Say I am relieved the hungry people will not suffer the threatened punishment." -> after_relief
option loss "Acknowledge that a payment cannot undo the loss." -> after_loss
option duties "Ask whether money answers everything the community now owes." -> after_duties
label after_relief
camera listener Owner over 0.65
express Owner worried
I: I tell him I feel relieved about the punishment.
Owner [neutral]: I hear you. Remember that relief when you tell the story. Remember my complaint too.
goto next_need
label after_loss
camera listener Owner over 0.65
express Owner sad
I: I say that an amount on its own cannot give him back the animal.
Owner [sad]: No. But repair still matters, even when it cannot restore everything.
goto next_need
label after_duties
camera listener Owner over 0.65
express Owner curious
I: I ask whether naming a price finishes every obligation.
Owner [curious]: For the camel, perhaps there can be an account. For how we live beside each other? You will need more than a purse.
goto next_need
label next_need
I: We remain in the shade for a moment. The owner winds the tether around his hand.
camera two Owner Salim cut
Salim [curious]: Before you leave our household, help me decide what to ask about next. A judgement is one thing. Tomorrow's needs are another.
choice next_step
option meals "Ask who will make sure the people in the household receive food tomorrow." -> next_meals ; SoughtCare = true
option payment "Ask how the owner can follow up on the ordered compensation." -> next_payment
option voice "Ask how people under another person's power can bring a complaint safely." -> next_voice
label next_meals
Salim [determined]: A practical question. I can raise it. I cannot promise you that asking once will put food in every bowl.
I: I write down the duty, and who has the power to meet it.
goto leave
label next_payment
Salim [determined]: An order and a payment are different things. We can ask how he should follow up, without claiming the money is already in his hand.
I: I write down the unanswered step instead of recording a happy ending I have not seen.
goto leave
label next_voice
Salim [worried]: Someone with little power may need more than an invitation to speak. Who will stand with them if the household is angry?
I: I write that question carefully. Being heard once does not make someone free.
goto leave
label leave
camera medium
I: I finish my account: what was taken; what was withheld; what Umar ordered; what I still do not know. Salim checks that I have not confused my questions with things I witnessed.
Salim [neutral]: You helped carry the water when you arrived. Now you have helped carry an account. Keep it honest.
I: The taxi waits beyond the shade. I leave as a guest with a household to remember, not as the person who fixed its world.
label home
scene classroom
show Hepting curious right
camera medium
I: Back at school, I open my book to find out how this case reached us. Malik ibn Anas, a major early Muslim jurist, records it in the Muwatta more than a century after Umar's time.
Hepting [curious]: Read the comment after the report. Does Malik accept every part of the judgement as his own community's rule?
I: He does not. Malik says their practice is to compensate the animal's value when taken, rather than double it. The same tradition preserves a judgement and an argument about its money.
I: I turn to Qur'an 2:280. It tells creditors to allow time to a debtor in difficulty and praises forgiving the debt. A loan is not the camel case, but again a money claim meets someone's circumstances.
Hepting [neutral]: David Graeber, a modern anthropologist, asks how moral obligations become exact debts—and how power can disappear behind an apparently simple demand to pay. That is a lens we bring now, not an idea Umar learned from him.
I: I underline two different things: an amount of money owed, and duties people owe one another. They can connect without being identical.
if SoughtCare == true -> care_callback else wider_callback
label care_callback
I: I return to my question about tomorrow's food. No number beside the camel answers it automatically.
goto closing
label wider_callback
I: I return to the unanswered question I left with Salim. A ruling can resolve a claim while leaving work for the community.
goto closing
label closing
I: Beneath my original question I leave room for a principle. I will need a reason for it—and a case that might challenge it.
end
