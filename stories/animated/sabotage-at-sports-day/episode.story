story 2
variable Public = false hidden
variable Solved = false hidden
variable Role = 0 range 0 2 hidden
label sportsday_opening_v1
scene field
I: A hand reaches across the award table. The golden running shoe disappears beneath the cloth.
label opening
scene classroom
show Kevin determined left
show Hepting curious right
camera two Kevin Hepting cut
Kevin [determined]: Today, I help my team win something. Even if it is only the warm-up.
Hepting [curious]: Does your team know about this plan?
I: In the classroom book, I write: How do you get people to agree to a good idea?
label taxi_arrival
I: A taxi rolls through the classroom wall. Our driver adjusts his sunglasses. Apparently my question requires transport.
label taxi_departure
I: We fly over the soccer field and through a bright doorway. I practise my victory expression in the window.
label arrival
scene field
show Kevin happy left
show Sam determined right
camera two Kevin Sam cut
I: We arrive at neighbourhood sports day. My teammate Sam is warming up beside the relay course. The race begins in fifteen minutes.
activity Sam walk right brisk
Sam [determined]: We've practised the handover. Today we beat the blue team.
I: A small runner passes with a trailing shoelace. I call him back and wait while he ties it. Sam quietly restarts his stopwatch.
Kevin [happy]: That was community service. It should come off our time.
activity Sam stop
show Ben happy center
camera wide
Ben [happy]: Bags? Water bottles? I am the official bag holder.
I: Sam's dad, Ben, takes our bags. He has a thin grey support around one knee. He declines a low folding seat and leans against the high table instead.
Sam [neutral]: Are adults allowed in the relay?
Ben [happy]: Only if you want to lose with dignity.
I: Sam does not laugh. He puts a second entry form beneath his own. The ADULT box is circled. The name is blank.
move Ben exit
move Sam exit
show Mei worried right
camera two Kevin Mei cut
Mei [worried]: Kevin. Someone has moved the starting line.
I: Our old chalk stripe is halfway up the little grass bank. A new stripe crosses the flat ground below. The route still goes the same distance.
Mei [worried]: And the crawl-under arch is gone. There's a ribbon to touch at shoulder height instead.
Kevin [shocked]: Sabotage.
Mei [skeptical]: Possibly. Please investigate before naming the crime.
I: I pin a spare entry card to my shirt. HEAD OF SECURITY. It covers most of my chest. The promotion is immediate.
choice investigate
option course "Check what changed along the course." -> course
option trophy "Check whether anything else has gone missing." -> trophy
option people "Ask who was working here this morning." -> people
label course
Kevin [curious]: Is the new route shorter?
Mei [neutral]: No. Same distance. But the start is level, and nobody has to crouch under anything.
Kevin [skeptical]: An unusually considerate crime.
goto evidence
label trophy
Mei [worried]: Actually, the golden shoe has vanished. The Fastest Individual trophy.
Kevin [determined]: Nobody touch the table.
Mei [skeptical]: I need the entry forms on it.
Kevin [neutral]: Nobody touch the table without a reasonable administrative purpose.
goto evidence
label people
Mei [neutral]: Everyone helped. Sam set out the cones. The blue team carried tables. I measured the course.
Kevin [curious]: So everyone had access?
Mei [skeptical]: It's a sports day, Kevin. We invited people.
goto evidence
label evidence
I: We compare notes: same distance, flatter start, no crawling. Also missing: the golden shoe for Fastest Individual. The team cup is still there.
Mei [worried]: I can't start a race while someone keeps changing the course. We have ten minutes to sort this out.
I: Across the field, Sam touches the new ribbon without bending. Then he looks toward his dad and the bags.
Kevin [curious]: Sam! Can you come here?
move Mei exit
show Sam worried right
rest Sam guarded
camera two Kevin Sam cut
I: He approaches the award table. Something gold pokes out beneath the cloth. Sam reaches down and pushes it out of sight.
choice challenge
option public "Call Mei over: Sam knows where the trophy is." -> public ; Public = true
option private "Ask Sam quietly what he put under the table." -> private
option joke "Ask whether the trophy is training undercover." -> joke
label public
Kevin [determined]: Mei! Sam knows where the trophy went!
Sam [angry]: Could you say it a little louder? The apartments at the back may have missed it.
Kevin [embarrassed]: I saw you hide something. I need to know what's going on.
goto caught
label private
Kevin [curious]: What did you put under the table? We can talk here.
Sam [worried]: The shoe. Please don't call everyone over.
Kevin [neutral]: Okay. But Mei is about to cancel the race.
goto caught
label joke
Kevin [curious]: Is the trophy training undercover?
Sam [skeptical]: Yes. Its camouflage is terrible.
Kevin [neutral]: Sam. Mei is about to cancel the race. What happened?
goto caught
label caught
act Sam reach "Sam retrieves the golden shoe from beneath the tablecloth."
Sam [neutral]: I was going to put it back afterward.
Kevin [curious]: And the starting line? And the arch?
Sam [worried]: Me. All three.
I: An excellent moment for my detective speech. Unfortunately, Sam looks less like a criminal mastermind than someone who has lost his bus ticket.
Kevin [curious]: But you're our fastest runner. Why hide a trophy you could win?
Sam [neutral]: I don't want that one today.
I: Beside him lies the second entry form: ADULT circled, name blank. His dad is still standing by the bags. Flat ground. No crawling. Two forms.
I: I have found who changed the course. What was he trying to change about the day?
choice deduction
option cheating "Was this a way to give our team an advantage?" -> cheating
option cancel "Did you want the race cancelled without saying so?" -> cancel
option together "Were you trying to make a race you and your dad could enter?" -> together ; Solved = true
label cheating
Sam [frustrated]: I'd have kept the hill. I'm good at the hill.
Kevin [curious]: Then the changes were for someone else?
Sam [neutral]: Yes. Someone who isn't on an entry form yet.
goto reveal
label cancel
Sam [worried]: No! I've been waiting all week. I wanted another person in it.
Kevin [curious]: The adult form?
Sam [neutral]: That was the idea.
goto reveal
label together
Sam [surprised]: You noticed the form?
Kevin [neutral]: Eventually. My badge was blocking part of the investigation.
Sam [sad]: I wanted Dad next to me.
goto reveal
label reveal
Sam [sad]: His knee is getting better. He can walk on level ground, but he can't run or crawl under things yet.
Kevin [curious]: So you moved the start and changed the arch.
Sam [neutral]: He used to do the relay with me. Today everyone keeps giving him bags.
camera listener Kevin over 0.65
I: I look at the bag I handed him without even asking.
camera two Kevin Sam cut
Sam [worried]: And the shoe... I thought he'd see Fastest Individual and decide there was no point entering anything.
Kevin [neutral]: Did you ask him?
Sam [embarrassed]: I was making it easy to say yes.
I: Ben approaches. He has six bags and the expression of a very patient coat rack.
move Sam exit
show Ben curious right
camera two Kevin Ben cut
choice invitation
option medical "Offer to explain Ben's knee to everyone so they understand." -> medical
option invite "Ask Ben whether he wants to join a different kind of relay." -> invite
option check "Ask Ben what would make this afternoon better for him." -> check
label medical
Kevin [determined]: We could announce about your knee. Then everyone would understand the changes.
Ben [skeptical]: You could ask me first.
express Kevin embarrassed
camera listener Kevin over 0.65
I: I fold the bottom of my enormous badge under itself.
Kevin [embarrassed]: Right. Would you like to join us? And what would work for you?
goto terms
label invite
Kevin [curious]: Would you like to do a walking relay with Sam?
Ben [happy]: Yes. A short, level one. Without anybody shouting BRAVE DAD through a microphone.
Kevin [neutral]: That removes most of my planned speech.
goto terms
label check
Kevin [curious]: What would make today better for you?
Ben [neutral]: Fewer bags. Something I can do with Sam. Being asked before I become the reason for a new rule.
Kevin [embarrassed]: I can start with my bag.
act Ben give Kevin "Ben hands Kevin his bag. There are still five left."
goto terms
label terms
camera two Kevin Ben cut
Ben [neutral]: A short walk on level ground suits me. No running, no bending under things. And I'll stop if I need to.
Kevin [neutral]: I'll ask Mei what we can arrange.
Ben [happy]: Good. Ask. She has the whistle.
move Kevin exit
show Sam worried left
camera two Sam Ben cut
Sam [worried]: I thought you'd say no.
Ben [neutral]: I might have. You still get to ask.
Sam [sad]: I wanted us to be a team again.
camera listener Ben over 0.65
I: Ben puts the remaining bags down, one by one.
Ben [happy]: We were a team when you made me carry all those. A badly managed team.
camera two Sam Ben cut
Sam [happy]: The pay is terrible.
Ben [happy]: I'm bringing that up at the meeting.
label negotiation
scene field
show Kevin curious left
show Mei determined right
camera two Kevin Mei cut
I: Mei has the original course plan and exactly four minutes of patience left. Sam stands beside the table with the rescued shoe.
Mei [determined]: The runners practised that course. Some want their times recorded. I can't just swap their race.
I: I take a breath. This time I need a proposal, not an announcement.
choice proposal
option extra "Could we add a short walking round after the regular relay?" -> extra
option replace "What if we replaced the relay with a walking race?" -> replace
option open "What could we change while keeping the race people signed up for?" -> open
label extra
Mei [curious]: Maybe. Who will reset the course, and where does the extra time come from?
Kevin [neutral]: We'll reset it. Could we use the ten minutes before packing up?
Mei [neutral]: That could work if the volunteers agree. Let's ask them.
goto agreement
label replace
Mei [skeptical]: What about the runners who came for the regular relay?
Kevin [embarrassed]: Right. I've changed their plan again. What if we kept it and added a short walking round afterward?
Mei [curious]: In the ten minutes before packing up? Ask the volunteers whether they can stay.
goto agreement
label open
Mei [curious]: We have ten minutes before packing up. You could propose another round then.
Kevin [curious]: Would that still be fair if anyone could join and it didn't change the regular results?
Mei [neutral]: It sounds workable. Ask the volunteers about the time, too.
goto agreement
label agreement
I: We ask. The volunteers agree to a short extra round. Mei checks the level strip with Ben; he chooses a comfortable distance. Anyone can join, pair up, or watch.
show Sam embarrassed center
camera wide
Sam [embarrassed]: I changed the course and hid the trophy. I'm sorry. I'll put everything back for the relay.
Mei [neutral]: Thank you. Start with the arch. And please stop making my job a detective novel.
if Public == true -> correction else quiet_return
label correction
Kevin [embarrassed]: And everyone who heard me shout: Sam was trying to race with his dad. He wasn't stealing the prize. The changes still weren't agreed.
Sam [neutral]: Thanks. You can use the loud voice for cheering now.
goto restore
label quiet_return
I: I help Sam set the golden shoe back on its stand. No announcement. Mei checks it off her list.
Sam [neutral]: Thanks for keeping the conversation small.
Kevin [happy]: A specialist service. Surprisingly difficult with this badge.
goto restore
label restore
act Kevin give Sam "Kevin hands Sam the course plan. Together they begin returning the cones to their original marks."
I: The regular relay goes ahead. We make a clean handover, take the hill, and finish second. For three seconds I consider investigating the blue team's legs.
show Ben happy right
move Mei exit
camera wide
Ben [happy]: Excellent handover. Terrible victory expression.
Kevin [neutral]: It hasn't been tested under actual victory conditions.
I: After the results, we set out the agreed short, level walking course. Sam writes Ben's name in the empty box. Then he offers him the pen.
Sam [curious]: Is that okay?
Ben [happy]: It is my name, yes. A promising start.
choice finale
option race "Ask to join the walking round as Sam and Ben's teammate." -> race ; Role = 0
option official "Offer to help Mei run the walking round." -> official ; Role = 1
option cheer "Ask Sam and Ben whether they want a cheering section." -> cheer ; Role = 2
label race
Kevin [curious]: Room for one more teammate?
Sam [happy]: Yes. But Dad has already designed a handover system.
Ben [determined]: Three easy steps. I have diagrams.
Kevin [worried]: I have joined management.
goto walking
label official
move Kevin left
show Mei happy right
camera two Kevin Mei cut
Kevin [curious]: Could I help with the start?
Mei [happy]: Yes. You can hold the clipboard. I keep the whistle.
Kevin [neutral]: An important separation of powers.
move Mei exit
show Ben happy right
goto walking
label cheer
Kevin [curious]: Would you like some cheering?
Ben [happy]: Our names will do. No inspirational speeches.
Sam [happy]: And no chanting. He'll walk in time to it.
Kevin [neutral]: A tragically restricted artistic commission.
goto walking
label walking
scene field
show Sam determined left
show Ben happy right
camera two Sam Ben cut
I: Sam takes the first short leg. Ben waits at the handover, swinging his empty hands. For once, there is nothing hanging from them.
activity Sam walk right slow
I: Sam walks toward his dad. He is concentrating harder than he did during the regular race.
activity Sam stop
act Sam give Ben "Sam places the relay ribbon in Ben's hand. Ben closes his fingers around it."
activity Ben walk left slow
I: Ben takes his short, comfortable leg. He does not run. He does, however, look extremely pleased when another walker falls behind.
activity Ben stop
Ben [determined]: Was that a jog? Mei! Clarification!
Sam [embarrassed]: Dad.
Ben [happy]: I'm just asking a question.
if Role == 0 -> race_end else other_end
label race_end
show Kevin happy center
camera wide
I: I take the last leg. We finish laughing and arguing about whose diagram was upside down. My victory expression finally gets some practice.
goto payoff
label other_end
if Role == 1 -> official_end else cheer_end
label official_end
show Kevin curious center
camera wide
I: I check with Mei before answering. She confirms the walking rule, and Ben accepts it with the solemnity of an international appeal.
goto payoff
label cheer_end
show Kevin happy center
camera wide
Kevin [happy]: Come on, Sam! Come on, Ben!
Ben [happy]: Excellent. Slightly more Ben next time.
goto payoff
label payoff
Sam [skeptical]: You said you were coming for a quiet afternoon.
Ben [happy]: I can be competitive quietly.
I: He lowers his voice to ask whether anyone has a measuring tape. Sam looks at me. We have successfully included a serious problem.
label home
scene classroom
show Kevin happy left
show Hepting curious right
camera two Kevin Hepting cut
I: The taxi brings us home by the ordinary road, which is disappointing but gives me time to unpin my badge.
Hepting [curious]: Did people agree to your idea?
Kevin [neutral]: Eventually. It wasn't quite my idea by then.
if Solved == true -> good_detective else revised_detective
label good_detective
Kevin [happy]: I solved the mystery, though.
Hepting [happy]: Was that the hard part?
Kevin [skeptical]: Dad is still asking for a measuring tape. The case remains complicated.
goto fare
label revised_detective
Kevin [happy]: My first theory needed some repairs.
Hepting [curious]: And your second?
Kevin [happy]: Much better. It contained the people who were actually there.
goto fare
label fare
I: Our driver taps four questions on his screen. Three correct pays the fare; if I miss, I can review and try again. Then I choose a question, write one paragraph, and keep it open for my English Corner teacher.
end
