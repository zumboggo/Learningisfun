story 2
variable attention = 0 range 0 2 hidden
variable policy = 0 range 0 2 hidden
variable diary = 0 range 0 2 hidden
variable response = 0 range 0 1 hidden
label classroomOpening
scene classroom
I: I rest my hand on the Teaching Stone. In my notebook I have written a question: when does protecting someone become an excuse to keep putting them in danger?
I: The stone warms. Vietnam, mid-1968. American troops fight alongside South Vietnam’s forces against North Vietnamese and southern revolutionary forces, supported by China and the Soviet Union. The Tet Offensive has shaken American confidence. Peace talks have begun in Paris, but the fighting continues.
I: In Quảng Ngãi, Dr. Đặng Thùy Trâm works in a revolutionary battlefield hospital. A cloth bundle waits beside a bed. I reach for it.
label page0
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
perform Helper reach repeat 1 steady
I: I smooth a folded blanket on the waiting bed. An brings a small cloth bundle to the table. It belongs to the patient we are preparing to receive. We have not yet learned his name.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
react An reach
I: Outside this little room, trucks move along roads watched from the sky. Inside, An lowers the bundle carefully. “Keep this with him,” he says. “When he wakes up, he should know where it is.”
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: Dr. Đặng Thùy Trâm steps between the table and the bed, checking that the way is clear. I lift the blanket again. An catches the far corner, and together we pull it straight.
label page1
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
I: Trâm left Hanoi to work here in Quảng Ngãi. She is young, but the others look to her when someone arrives. I watch her check our preparations, then turn back toward the entrance.
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
express Tram determined
camera listener Tram over 0.65
I: On a table near her things is a small diary. Letters and pages must travel a long way from home. The diary stays close, even when almost everything else has to be moved.
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
camera two Tram An cut
I: Trâm checks the space around the bed while we prepare it. An holds the bundle against his chest. “Before we put it away,” he asks me, “what should we find out?”
choice decision1
option option0 "“Who is he? Does anyone know his name?”" -> branch1_0 ; attention = 0
option option1 "“What do you need me to do first?”" -> branch1_1 ; attention = 1
option option2 "“How does Trâm keep doing this?”" -> branch1_2 ; attention = 2
label branch1_0
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
express An relieved
react An nod
camera listener An cut
I: An checks with the person bringing the patient. “I’ll ask. And we can label the bundle once we know.” He sets it apart from the others. My question makes an anonymous arrival into someone we need to identify.
goto rejoin1
label branch1_1
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
express An curious
react An nod
camera listener An cut
I: “Clear this part of the table,” An says. We make room together. He puts the bundle somewhere we can see it. My question gives us a practical beginning, even while much remains unknown.
goto rejoin1
label branch1_2
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
express An curious
react An nod
camera listener An cut
I: An pauses with the bundle in his hands. “I cannot speak for her. I know it helps when the next thing is ready.” He asks me to straighten the blanket with him. My question leads us back to something we can do.
goto rejoin1
label rejoin1
label page2
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
perform Helper give An repeat 1 steady
camera action Helper An cut
I: We agree to keep the bundle at the patient’s place until we can identify it properly. An tucks the corners of the cloth inward. It is a small promise. We have the power to keep it.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: I reach for a scrap of paper. As my fingers touch it, the hospital table seems to fall away. Another sheet lies beneath my hand: a policy memorandum, on a polished desk far from Quảng Ngãi.
label page3
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
I: Washington, 1965. McNamara slides a memorandum toward an adviser, Ellis. A chair stands empty beside them. Ellis draws it out for me.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: If South Vietnam falls, what becomes of the people who relied on us? More forces could defend them—and give us a stronger position at negotiations.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Could. You are asking Hanoi to value the next blow more than its own aims. What if it sends more men too?
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: You have been quiet. Before this goes upstairs, what would you ask?
choice decision3
option option0 "“Does keeping a promise require sending more troops?”" -> branch3_0
option option1 "“What if Hanoi thinks it is defending its own country?”" -> branch3_1
option option2 "“Why not send supplies and keep American troops out?”" -> branch3_2
label branch3_0
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Does keeping a promise require sending more troops?”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Leaving also has a cost. Our allies have built their plans around our support.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Then name the promise precisely. Is it protection from attack, a particular government’s survival, or victory? Those can demand very different things.
goto rejoin3
label branch3_1
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “What if Hanoi thinks it is defending its own country?”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Then it may endure more pressure than we expect. But the South Vietnamese who oppose it have claims on us too.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener Ellis over 0.65
react McNamara sigh
Ellis: And neither side becomes obedient because a foreign capital supplies it. We need to understand their purposes before predicting their surrender.
goto rejoin3
label branch3_2
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Why not send supplies and keep American troops out?”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: That keeps our own exposure smaller. It may also leave an ally unable to hold its position.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
perform Ellis reach repeat 1 steady
camera listener Ellis over 0.65
react McNamara sigh
Ellis: And weapons still reach someone’s village. Distance can reduce the danger of a direct superpower clash without reducing the danger for the people fighting there.
goto rejoin3
label rejoin3
label page4
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
I: Ellis places a second sheet beside the memorandum. A bombing pause; then stronger pressure if no agreement follows. Below it sits a warning: a larger stalemate by 1967.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: We can attack, but at what cost?
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Let us try the alternatives before we sign. What would you put on this second sheet?
choice decision4
option option0 "“Pause bombing and offer talks before sending more forces.”" -> branch4_0 ; policy = 0
option option1 "“Support the South, but set a ceiling on American involvement.”" -> branch4_1 ; policy = 1
option option2 "“Send more forces—but decide now what would make us stop.”" -> branch4_2 ; policy = 2
label branch4_0
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Pause bombing and offer talks before sending more forces.”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Suppose they use the pause to strengthen their forces and offer nothing. How long do we wait?
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Set a review date and specify what would count as movement. A pause opens a possibility; it does not make an agreement. We must also say what happens if talks fail.
goto rejoin4
label branch4_1
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Support the South, but set a ceiling on American involvement.”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: And if that ceiling leaves our ally facing defeat? Would we hold it when the pressure comes?
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: A limit that disappears whenever it hurts is no limit. We need a plan for protecting people if our preferred government cannot survive.
goto rejoin4
label branch4_2
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Send more forces—but decide now what would make us stop.”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: A stronger position may still bring them to negotiations. What evidence would distinguish slow progress from failure?
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Not the number of bombs dropped. Look for political security and movement toward a settlement. If each setback only justifies another increase, no result can ever disprove the plan.
goto rejoin4
label rejoin4
label page5
scene map
camera wide cut
I: The map stretches across the table. Outside powers can send money, weapons and advisers to local allies. They can pursue influence without sending their own armies to fight their rival directly. From this distance, it can look like a way to keep danger contained.
scene map
camera wide cut
I: But American troops are already fighting in Vietnam. Soviet and Chinese support helps the communist forces. The map holds both kinds of involvement: support through others, and direct intervention.
scene map
camera wide cut
I: At each place marked on the map, people have reasons of their own: independence, revolution, fear of communism, loyalty, family safety. A line drawn from a foreign capital cannot tell me everything about the person at its other end.
label page6
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
react An reach
I: The rough hospital table is beneath my hand again. An has found a scrap of paper for the bundle. The bed is ready, but our work is not finished. We still need to connect these belongings to the right person.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: “She could have stayed closer to home,” An says quietly, glancing toward Trâm. “She came here.” Across the room she is absorbed in her work, intent on what the next patient will need.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: I watch her put one thing in order, then another. To officials across the ocean she belongs to an enemy force. Here, somebody is waiting for the doctor to finish making room.
label page7
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
look Tram down
camera listener Tram cut
I: Trâm closes her diary and looks up. There is a moment before the next task claims her. I want to understand more than the name on the opposite side of a map.
choice decision7
option option0 "“What brought you here?”" -> branch7_0 ; diary = 0
option option1 "“Who do you miss most?”" -> branch7_1 ; diary = 1
option option2 "“What can I do that would help?”" -> branch7_2 ; diary = 2
label branch7_0
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
look Tram down
camera listener Tram cut
express An relieved
react An nod
camera listener An cut
I: She speaks of the struggle for Vietnam’s future and the people who need her work. I hear conviction in her answer. She has chosen a side; she has also chosen to be here, doing this work.
goto rejoin7
label branch7_1
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
look Tram down
camera listener Tram cut
express An curious
react An nod
camera listener An cut
I: Her answer takes us far from the hospital: family, familiar voices, a home in Hanoi. For a moment I can imagine the person who waits for a letter from her. Then a sound at the entrance turns her attention back.
goto rejoin7
label branch7_2
scene hospital
show Tram neutral left
show An worried right
look Tram An
look An Tram
rest An attentive
camera two Tram An cut
look Tram down
camera listener Tram cut
express An curious
react An nod
camera listener An cut
I: She points me toward the waiting place and the tasks still unfinished. Her answer gives me something to do. I return to An carrying a little more of the responsibility with me.
goto rejoin7
label rejoin7
label page8
scene hospital
show Helper worried left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
react An sigh
camera listener An over 0.65
I: An begins to write, then stops. “I keep thinking about how ordinary this is,” he says. “A blanket. A name. Making sure somebody can find what is theirs.”
scene hospital
show Helper worried left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
look Helper An
express Helper worried
camera listener Helper cut
I: He looks at the bundle rather than at me. “My mother ties cloth like that,” he adds. His fingers follow the knot, then pull away.
scene hospital
show Helper worried left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: From the entrance comes the sound of someone approaching. The space beside the bed is clear. An is waiting for my answer, and there is still work we can finish.
choice decision8
option option0 "“Tell me what you mean.”" -> branch8_0 ; response = 0
option option1 "“Let’s finish it together. Then we can talk.”" -> branch8_1 ; response = 1
label branch8_0
scene hospital
show Helper worried left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
react An sigh
camera listener An over 0.65
express An relieved
react An nod
camera listener An cut
I: “I want him to have something familiar when he looks around,” An says. I hold the label while he writes. Listening takes a moment, but it tells me why this little task matters to him.
goto rejoin8
label branch8_1
scene hospital
show Helper worried left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
react An sigh
camera listener An over 0.65
express An curious
react An nod
camera listener An cut
I: An nods and hands me the label. We check the bundle against the patient’s place before putting it down. “All right,” he says. He knows I have heard him, even though I want to complete the task first.
goto rejoin8
label rejoin8
label page9
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
camera two Helper An cut
look Helper down
I: I hold the scrap steady while An checks what we have written. Here, protection is something I can touch: a blanket, a clear path, belongings kept beside the person who owns them.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
camera two Helper An cut
look Helper down
I: I remember the American office. There, protection meant an allied government kept standing, a promise honored, a position on a map preserved. I look from our small label to the doorway.
scene hospital
show Helper neutral left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
camera two Helper An cut
look Helper down
I: The people at that desk cannot hear this room. The people in this room cannot reach their desk. Between the two, the war keeps moving.
label page10
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
I: Washington, June 1967. Ellis sets the old memorandum beside a new one. McNamara now opposes a large troop increase and favors restricting bombing south of the twentieth parallel.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
if policy == 0 -> recallPause else recallOther
label recallPause
Ellis: You asked for a pause and talks. The fighting has continued. What would make that opening more than another interval between attacks?
goto recallDone
label recallOther
if policy == 1 -> recallLimit else recallTest
label recallLimit
Ellis: You asked for a ceiling on our involvement. Here is the newer recommendation. Would we hold a limit if the news became worse?
goto recallDone
label recallTest
Ellis: You asked what would make us stop increasing the force. Two years have passed. What would count as enough evidence?
label recallDone
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: I favor limiting the bombing and resisting a big increase. We still need to strengthen the South’s position and seek reduced hostilities. But more force is not a promise of the result we want.
label page11
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: You have changed the recommendation. The people under the bombs need a change in what happens.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: A recommendation is what I can take to the president. Tell me what you would require of it.
choice decision11
option option0 "“Set a date. If the plan fails its test, change course.”" -> branch11_0
option option1 "“Hear from Vietnamese people beyond the officials we support.”" -> branch11_1
option option2 "“Suppose we halted the bombing. Could talks begin?”" -> branch11_2
label branch11_0
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Set a date. If the plan fails its test, change course.”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Then the test must be something we can observe—not a hope we can keep postponing.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Put it in writing. Include evidence against the plan, and let someone who did not design it examine that evidence. A deadline without a consequence is another delay.
goto rejoin11
label branch11_1
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Hear from Vietnamese people beyond the officials we support.”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Whom would you invite? A government spokesman cannot speak for every village. Neither can one opponent.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Then hear more than one voice, including people who will bear the danger. Disagreement is information. It should not disappear because it is inconvenient to our plan.
goto rejoin11
label branch11_2
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara front
look Ellis front
camera two McNamara Ellis cut
I: I say, “Suppose we halted the bombing. Could talks begin?”
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: Possibly. But suppose Hanoi does not respond, or fighting in the South continues. A halt alone cannot settle the war.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Nor can we know the response without making an opening. Pair it with an offer through diplomatic channels and a plan for failure. Neither more bombing nor a halt comes with certainty.
goto rejoin11
label rejoin11
label page12
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener McNamara over 0.65
react Ellis shake-head
McNamara: I can put a different recommendation forward. I cannot order every government to accept it—or undo the decisions already made.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
camera listener Ellis over 0.65
react McNamara sigh
Ellis: Then begin with what you can change. And when you ask for more time, say whose time you are spending.
scene office
show McNamara worried left
show Ellis skeptical right
look McNamara Ellis
look Ellis McNamara
rest McNamara attentive
rest Ellis attentive
camera two McNamara Ellis cut
look McNamara down
look Ellis down
camera two McNamara Ellis cut
I: McNamara closes the old memorandum. I think of An waiting with a label in his hand. Nobody from our hospital will sign the new page. They will live with what follows from it.
label page13
scene radio
camera wide cut
I: October 1968. Across Washington, Saigon and Paris, messages travel between governments and political intermediaries. An American presidential election is approaching. Johnson announces a halt to the bombing as efforts continue to expand the peace talks.
scene radio
camera wide cut
I: Through Anna Chennault, contacts from Nixon’s campaign encourage South Vietnam to hold back from participating. The promise is that a Nixon administration could offer a better deal.
scene radio
camera wide cut
I: South Vietnamese leaders have their own fears about negotiations and what an agreement could mean for their future. The messages reach people who are already weighing their own risks.
label page14
scene radio
camera wide cut
I: I read the messages again. They tell me that participation has been discouraged. They cannot tell me what every negotiator would have accepted if the messages had never been sent.
scene radio
camera wide cut
I: Across the hospital table, waiting meant making room for one more person. Across these political channels, waiting may improve someone’s position. Somewhere, the fighting continues while the messages move.
scene radio
camera wide cut
I: I have to decide what I can honestly say about what I have seen.
choice decision14
option option0 "“These contacts encouraged South Vietnam to hold back.”" -> branch14_0
option option1 "“Without those contacts, the war would be over this year.”" -> branch14_1
label branch14_0
scene radio
camera wide cut
I: I can point to the messages. That is what they support. I set them down without claiming to know the agreement that might have followed in another course of events.
goto rejoin14
label branch14_1
scene radio
camera wide cut
I: I stop before finishing the sentence. I have seen messages, not an agreement accepted by every party. I cannot turn a lost possibility into a certainty.
goto rejoin14
label rejoin14
label page15
scene hospital
show Helper relieved left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
express An relieved
perform Helper give An repeat 1 steady
camera action Helper An cut
I: The hospital returns. We check the label once more and place the bundle beside the prepared bed. Our small task is complete. It does not stop an offensive or bring negotiators to agreement. It does keep one promise.
scene hospital
show Helper relieved left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
express An relieved
react An nod
camera two Helper An cut
if response == 0 -> hospitalListen else hospitalFinish
label hospitalListen
I: An touches the edge of the label. “Thanks for listening earlier,” he says. “That was what I meant. Something familiar.”
goto hospitalDone
label hospitalFinish
I: “Now we can talk,” I tell An. He looks at the bundle. “That was what I meant earlier,” he says. “Something familiar.”
label hospitalDone
scene hospital
show Helper relieved left
show An worried right
look Helper An
look An Helper
rest An attentive
camera two Helper An cut
I: At the entrance, someone calls for help. An moves first; I follow. When the patient reaches the bed, his belongings will be waiting where we said they would be.
label page16
scene diary
camera wide cut
I: In June 1970, Trâm is killed. She is twenty-seven. The work she leaves behind includes two small diaries.
scene diary
camera wide cut
I: Fred Whitehurst, an American soldier, preserves her writing. In 2005, it reaches her family. Pages carried away from the war cross the distance home.
scene diary
camera wide cut
I: I picture the little book beside the hospital table. Across the years, a voice survives: love, resolve, anger, longing. A person whom another country had called an enemy.
label page17
scene map
camera wide cut
I: The maps return to their folders. Outside support once promised influence at a distance: supplies and weapons instead of a direct battle with a rival superpower. Here, that distance has proved difficult to keep.
scene map
camera wide cut
I: I remember the two tables. At one, a recommendation might change the course of a war. At the other, we kept a bundle beside a bed. Neither table held every part of the world around it.
scene map
camera wide cut
I: I still hear the question above the memorandum: “At what cost?” This time, when I think about the answer, I can see a face.
scene classroom
I: The Teaching Stone cools beneath my hand. I am back beside my notebook. I remember Kant’s demand that people matter as ends in themselves, never merely as tools for someone else’s purpose. I look again at the word protection. Whose purposes did it protect?
end