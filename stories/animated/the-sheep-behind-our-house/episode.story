story 2
variable trust = 0 range 0 2 hidden
variable route = 0 range 0 2 hidden
variable repair = 0 range 0 2 hidden
label sheep_opening_v1
scene yard
I: A sheep calls from behind the gate. Jun's father reaches for the latch, then stops.
label classroom
scene classroom
show Hepting curious left
show Kevin curious right
camera two Hepting Kevin cut
I: Mr. Hepting places a small drawing of a sheep beside the Teaching Stone. I am immediately suspicious of how simple the drawing is.
Kevin [skeptical]: This is going to become complicated, isn't it?
Hepting [curious]: Someone you love has hurt someone else. What does loyalty ask you to do?
Kevin [worried]: Can I have the sheep question instead?
Hepting [happy]: That is the sheep question.
I: In the open book I write: Can I protect someone I love without leaving their harm to somebody else?
label taxi_arrival
I: A taxi emerges through the classroom wall. The driver reads our question and opens the door.
I: Mr. Hepting takes the seat beside me. I put the book on my knees. I have not yet found a comfortable place to put the question.
label taxi_departure
I: We curve above the school field, then pass through a bright opening toward a village road.
label arrival
scene yard
show Jun happy left
show Kevin curious right
camera two Jun Kevin cut
I: By a farming household in eastern China, Jun is mending a gate. He offers me a place beside him while Mr. Hepting waits outside. Jun's father, Bo, has sent for someone who can help a difficult conversation.
Jun [happy]: My father says you know how to listen.
Kevin [embarrassed]: I am trying to make that rumour true.
perform Jun reach repeat 1 steady
I: Jun pulls the loose gate tie through a hole. He has wrapped the rough end so it won't scrape his father's hand.
Jun [curious]: Last winter Father carried me all the way home when I couldn't walk. I can manage one piece of rope for him.
I: A sheep bleats from the enclosure. It pushes its nose toward the gate. A dark mark sits on one ear.
Jun [worried]: That wasn't here yesterday.
show Bo worried center
camera wide
Bo [worried]: It belongs to Shen. I took it last night. She wouldn't sell it, and I wanted something a creditor would accept.
Kevin [shocked]: Does she know where it is?
Bo [sad]: No. I haven't sold it. I know what I did. I need time to put it back.
camera listener Jun over 0.65
Jun [worried]: You told me to keep this gate tied so nobody would steal from us.
I: Jun's hand stays around the little piece of rope. Bo does not reach for it.
camera two Bo Jun cut
Bo [pleading]: I am still the man who carried you home. Please don't become the person who destroys this family.
choice first_words
option promise "Help Jun promise privacy while asking Bo to return the sheep." -> promise_private ; trust = 0
option question "Ask what protecting the family would require Bo to do now." -> ask_protection ; trust = 1
option boundary "Help Jun refuse to promise silence before hearing Shen." -> set_boundary ; trust = 2
label promise_private
Jun [worried]: I won't begin by calling everyone into our yard. But the sheep has to go back.
Bo [relieved]: Thank you. Let me be the one who takes it.
Kevin [curious]: Does privacy include asking Shen what she has lost?
I: Bo looks toward the road. The promise has made it easier for him to speak. It may make speaking to anyone else harder.
goto hear_owner
label ask_protection
Jun [curious]: If protecting us means leaving Shen with the loss, who is protecting her household?
Bo [sad]: I was thinking about our own door when the creditor came. I stopped thinking beyond it.
Kevin [determined]: Then let's find out what has happened beyond it.
goto hear_owner
label set_boundary
Jun [determined]: I love you. I cannot promise an answer before I know what has happened to her.
Bo [angry]: So one bad act makes you a stranger to me?
camera listener Bo over 0.65
Jun [sad]: No. That is why this hurts.
I: Bo looks down at the wrapped end of the rope. Jun has not taken his hand away from it.
label hear_owner
scene square
show Shen worried left
show Jun sad right
camera two Shen Jun cut
I: Shen stands by an empty basket. Jun and I find her asking travellers about the sheep. She has spent the morning searching instead of carrying her woven goods to market.
Shen [worried]: A dark mark on its left ear. It comes when I shake the feed bowl. Have you seen it?
Jun [worried]: We have found it. It's alive. We can bring it to you.
Shen [relieved]: Where?
I: Jun glances at me. She needs the animal. She is also asking what happened to it.
choice hear_shen
option alone "Ask Shen to speak with Bo privately before deciding what else is needed." -> shen_private
option witness "Offer a trusted witness so Shen need not enter the conversation alone." -> shen_witness
option wishes "Ask what Shen wants before offering a way to settle the harm." -> shen_wishes
label shen_private
Jun [worried]: Would you speak with Father privately? I want you to hear it from him.
Shen [skeptical]: I can meet him by my gate. Privacy must not mean I have to stand alone in his yard.
I: Jun agrees. Shen chooses where the conversation will happen.
goto owner_after
label shen_witness
Jun [determined]: We can ask a person you trust to come. You shouldn't have to rely only on our account.
Shen [curious]: Aunt Wen knows both households. I'll ask her. I don't want a crowd collecting a story to laugh at.
I: Having a witness will take more time. It also gives Shen someone whose loyalty is not already promised to Jun's father.
goto owner_after
label shen_wishes
Jun [curious]: First, what do you need from us?
Shen [determined]: My sheep. The truth about how it left. And a way to avoid losing another market morning to this.
Jun [sad]: I was thinking about how to make Father less afraid.
Shen [worried]: I understand that. I am afraid too.
label owner_after
scene yard
show Bo worried left
show Shen determined right
camera two Bo Shen cut
I: At the household gate, Bo brings out the sheep. It hears Shen's voice and pulls toward her. She checks its ear, then runs a hand along its back. Bo keeps the rope loose.
Bo [sad]: I took it. You refused to sell, and I decided my need mattered more than your answer. I am sorry.
Shen [determined]: I need to know why your need won't take my things again tomorrow.
Bo [worried]: I can promise.
Shen [sad]: I believed you before I needed that promise.
camera listener Bo over 0.65
I: Bo lowers his hands. There is nothing left in them to give back.
show Jun worried center
camera wide
Jun [worried]: I have heard that Confucius valued fathers and sons protecting one another. I want that to mean something here.
Kevin [curious]: It does mean something. Shen is asking whether it can mean something for her too.
I: The sheep rubs its head against Shen's basket. Returning it has ended the search. It hasn't returned the morning.
choice next_action
option private "Support a private agreement with Shen, without reporting Bo to the clerk." -> route_private ; route = 0
option clerk "Ask the clerk to record what happened and hear both households." -> route_clerk ; route = 1
option day "Ask Shen for one day to agree on repair before deciding about a report." -> route_day ; route = 2
label route_private
Shen [determined]: I will try an agreement with a witness I choose. I am not promising silence about anything that happens next.
Bo [relieved]: I wanted the whole matter to disappear.
Jun [worried]: Then this isn't the promise you wanted. It's a chance to do something with it.
I: The agreement protects some family privacy. It asks Shen to carry some of the risk of trusting again.
goto repair_scene
label route_clerk
scene square
show Clerk curious left
show Bo worried right
camera two Clerk Bo cut
Clerk [curious]: I can record your admission and the return. I can ask the village head to hear a dispute over repair. I cannot promise what that hearing will decide.
Bo [worried]: People will remember my name beside this.
Clerk [determined]: A record can protect Shen if the agreement is denied later. It can also follow your household after you've repaired the harm.
I: Jun stays beside his father while the clerk writes. Reporting has not required leaving him alone. It has changed what can remain private.
goto repair_scene
label route_day
Shen [worried]: One day. The sheep comes with me now. Tomorrow I decide whether the repair offered is enough to continue privately.
Bo [relieved]: A day gives me room to think.
Shen [determined]: It gives me another day of uncertainty. Please remember whose time you have asked for.
I: Jun says he will come back tomorrow even if the conversation is uncomfortable. A delay now has a person and a promise attached to it.
label repair_scene
scene yard
show Bo worried left
show Jun sad right
camera two Bo Jun cut
I: Bo stands beside a bundle of reeds and begins weaving. His creditor expects baskets tomorrow. Two evenings of his work could replace Shen's lost market earnings, but those evenings are already promised elsewhere.
Bo [worried]: If I give her the work, our payment will be late. If I sell our winter blanket, your mother will go without it.
Jun [determined]: I'll do all the work. Nobody needs to know.
camera listener Jun over 0.65
Bo [sad]: You didn't take the sheep.
I: Jun twists the gate tie between his fingers. He is offering to make his father's wrong disappear into his own evenings.
camera two Bo Jun cut
choice repair_cost
option labour "Ask Bo to negotiate the debt and offer his own work to Shen." -> repair_labour ; repair = 0
option household "Offer a family payment, with each affected person's agreement." -> repair_family ; repair = 1
option aid "Seek temporary help for the household, while keeping Bo responsible for repair." -> repair_aid ; repair = 2
label repair_labour
Bo [determined]: I'll speak to the creditor myself. Shen's missing earnings don't become your secret debt.
Jun [worried]: He may refuse more time.
Bo [sad]: Then I will have another difficult conversation. You can come with me. You don't have to become the payment.
I: Shen will need to agree that the offered work is useful and fairly valued. Bo's promise alone does not settle what he owes.
goto returned
label repair_family
Jun [curious]: We could sell a small store of cloth, if Mother agrees. We all use it. I cannot offer her share without asking.
Bo [worried]: That would mean she bears a cost for what I did.
Jun [determined]: Yes. Helping you should be a choice she can refuse. We still need to tell her the truth.
I: A family can share a burden without pretending it began equally. The conversation waiting inside the house has become larger.
goto returned
label repair_aid
Jun [curious]: Could the neighbours offer a short loan, so you can repay Shen without losing what the household needs?
Bo [embarrassed]: I was willing to steal rather than admit I needed help. Asking now will cost me pride as well.
Kevin [determined]: Asking doesn't require Shen to forgive you. It could make a fair repair possible.
I: A neighbour may refuse. Community help could reduce the pressure; it does not change whose act created this debt.
label returned
scene square
show Shen determined left
show Jun worried right
camera two Shen Jun cut
I: Shen has her sheep beside the gate. She listens to the proposal and asks for the work or payment to be valued with her chosen witness. She has not yet agreed to call the matter finished.
Shen [determined]: Don't make a promise on my behalf just because your family has found one it can bear.
Jun [sad]: I wanted you to tell me I had been a good son.
Shen [worried]: I can see you love him. I need you to see me without waiting for me to praise that love.
camera listener Jun over 0.65
I: Jun puts the wrapped gate tie into his pocket. For once, he doesn't have an answer ready.
camera two Shen Jun cut
choice hard_question
option loyalty "Ask whether loyalty can include refusing a loved person's demand." -> loyalty_reply
option privacy "Ask what privacy protects, and whose voice it can hide." -> privacy_reply
option care "Ask how to care for Bo while keeping Shen's claim visible." -> care_reply
label loyalty_reply
Jun [curious]: If I refuse the silence Father asked for, can I still stand beside him?
Shen [determined]: Standing beside someone and agreeing to everything are different things. You'll have to show him what yours means.
I: Jun walks back toward the household. The path has not become easy, but it is no longer only a path away from his father.
goto last_visit
label privacy_reply
Jun [curious]: Privacy can protect him from humiliation. What stops it from protecting him from responsibility too?
Shen [determined]: An agreement I can question. Someone I choose to witness it. A way to speak again if the work isn't done.
I: Jun repeats her conditions, slowly enough for her to correct one. He has stopped trying to finish the conversation for her.
goto last_visit
label care_reply
Jun [curious]: Can I help him face this without asking you to carry his fear?
Shen [sad]: You can visit, work beside him, and tell the truth about what remains unpaid. None of that requires me to pretend the harm is gone.
I: Jun nods. The care he knows how to give is beginning to have a boundary he did not expect.
label last_visit
scene yard
show Bo sad left
show Jun worried right
camera two Bo Jun cut
if route == 0 -> callback_private else callback_check
label callback_check
if route == 1 -> callback_clerk else callback_day
label callback_private
Bo [worried]: I still wish you had kept all of this inside our door.
Jun [determined]: We kept a private path open. Shen keeps the right to speak if it fails. I won't ask her to surrender that for us.
goto father_turn
label callback_clerk
Bo [sad]: When the clerk wrote my name, I thought you would leave me there.
Jun [determined]: I came home with you. Tomorrow I can help carry your baskets. I won't say the writing never happened.
goto father_turn
label callback_day
Bo [worried]: Tomorrow she may decide to report me anyway.
Jun [determined]: Then we still return tomorrow. Her answer isn't a reward we have already earned.
label father_turn
camera listener Bo over 0.65
Bo [sad]: I used the day I carried you home as though it bought your silence.
I: Jun takes the rough gate tie from his pocket. He places it beside his father's unfinished basket.
camera two Bo Jun cut
Jun [sad]: You don't have to stop being my father for me to say you did wrong.
Bo [determined]: Tomorrow I will ask you to walk with me. I won't ask you to make my promise for me.
choice tomorrow
option walk "Help Jun accompany Bo while Bo speaks for himself." -> ending_walk
option witness "Help Jun check that Shen's chosen witness can attend." -> ending_witness
option return "Help Jun arrange a clear time to check the promised repair." -> ending_return
label ending_walk
I: Jun offers his arm at the gate. Bo accepts it. Tomorrow the walk will be theirs together, and the explanation will still belong to Bo.
goto home
label ending_witness
I: Jun asks Shen who she wants beside her tomorrow. Bo waits while she answers. Their family will not choose every voice in the next conversation.
goto home
label ending_return
I: Jun asks Shen when she can meet without losing another market trip. The time goes into the agreement, beside Bo's promised work. Something that was easy to forget now has a place to be checked.
label home
scene classroom
show Hepting curious left
show Kevin worried right
camera two Hepting Kevin cut
I: We return safely by taxi. The driver closes the book gently. Mr. Hepting leaves the drawing of the sheep where it was.
Hepting [curious]: Did bringing back the sheep answer the whole question?
Kevin [worried]: It answered the part about where the sheep should be. People were harder.
Hepting [determined]: The Analects makes family loyalty difficult to dismiss. Our case also asks us to hear the owner. A serious answer has to face both.
Kevin [curious]: And paying attention to the situation doesn't mean every answer is equally good. Some answers leave somebody carrying a loss we haven't noticed.
I: I draw a little gate beside the sheep. I leave it open, with enough space for someone else to enter the picture.
end
