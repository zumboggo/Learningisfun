story 2
variable UrgedWait = false hidden
variable AskedConsent = false hidden
variable ProtectedPeople = false hidden
variable DemandedConsultation = false hidden
label birmingham_opening_v2
scene jail
I: Birmingham, April 1963. King writes in jail. His words will soon face a test in the streets.
label classroom_start
scene classroom
show Lin curious left
show Hepting neutral right
camera two Lin Hepting cut
I: My notebook has a neat heading: Different Ways to Argue. Mr. Hepting places a question beneath it: What if your advice is reasonable—and someone gets hurt anyway?
Hepting [determined]: You will advise someone with a decision to make. Listen carefully when he disagrees with you. Listen just as carefully to the person who disagrees with him.
Lin [worried]: Can we put the notebook somewhere dry?
I: I write our question in the classroom book. Mr. Hepting checks the destination on his phone: Birmingham. May 1963.
label taxi_arrival
I: The wall opens into a vortex. The taxi driver steps out, sunglasses on, and waits for us to climb inside.
label taxi_departure
I: We bank over the soccer field. The next opening is bright with Alabama daylight.
label birmingham_context_v2
I: Birmingham, Alabama. April has become May. King is out of jail, but segregation remains. Local organizers and young volunteers are preparing to make the city confront what it has refused to change.
label arrive
scene meeting
show Ruth determined left
show Carter worried right
camera two Ruth Carter cut
I: MAY 2. Inside a church meeting room, a young volunteer named Ruth folds a paper with her family's telephone number. Her mother, Mrs. Carter, keeps reaching for the sleeve Ruth pulls away.
Ruth [determined]: You tell me to think about my future. This is my future. Every place that tells us we do not belong will still be there when school finishes.
Carter [worried]: I know what those signs say. I also know who will have to find you if the police take you away.
I: An organizer needs help carrying questions between the families and the campaign leaders. I take a pencil and a clean sheet. My job is to advise, report back, and keep people's words intact.
scene meeting
show King determined right
show Lin worried left
camera two Lin King cut
I: Dr. King has been listening to questions all morning. He sets aside a page as I approach; outside, another group is gathering.
King [curious]: Tell me what you think we should do. But first tell me whose difficulty your advice will solve.
Lin [skeptical]: Yours is not the only voice people here listen to, is it?
King [determined]: No. Birmingham's people built this struggle before we arrived. Reverend Shuttlesworth invited us to join it. James Bevel has helped organize these young volunteers.
I: King wrote his letter in April, after religious leaders criticized the protests. Now I can put a similar objection to the man who must act on his answer.
choice wait_or_act
option wait "Give the new city leadership more time. Escalation might close an opening." -> wait_time ; UrgedWait = true
option terms "Keep the pressure, but tell people exactly what change would justify a pause." -> wait_terms
option local "Before deciding, ask the local organizers whether they still want this pressure." -> wait_local
label wait_time
King [determined]: I disagree with waiting simply because another season has arrived. We delayed around the election already. The people living with segregation have been asked to finance patience with their own lives.
I: I ask whether a new leader might still make a difference.
King [curious]: A possibility deserves examination. It does not make a promise into an achievement. What evidence would tell us that this wait was different?
Lin [worried]: I wrote “more time.” I did not write how much, or what would happen during it.
goto negotiation
label wait_terms
King [determined]: Yes. Pressure needs a purpose. We seek changes in segregation and a genuine negotiation, not an endless procession of arrests.
I: I write a second column beside our demands: what would count as action, and who could verify it?
Lin [curious]: That could help a worried family distinguish a plan from a promise. It cannot promise them safety.
goto negotiation
label wait_local
King [determined]: You are right to ask about the local movement. An invitation to help does not make this city mine to command.
I: I add a question for the organizers, rather than writing “King says” across the whole page.
Lin [curious]: People outside Birmingham may see one famous man. We are meeting people who will still live here after the cameras leave.
goto negotiation
label negotiation
scene meeting
show Carter worried left
show King determined right
camera two Carter King cut
Carter [worried]: I want those doors open too. But why must opening them begin with my daughter walking toward policemen?
I: She is not asking whether segregation is wrong. She is asking whether this method is necessary.
King [curious]: Negotiation is what we seek. The disagreement is about what will make it possible.
choice negotiate
option stop "Then stop the marches first. Show the merchants that you trust the talks." -> negotiate_stop
option leverage "Explain why marching could make negotiation more likely instead of less." -> negotiate_leverage
option evidence "Show us what happened the last time local leaders accepted promises." -> negotiate_evidence
label negotiate_stop
King [determined]: I cannot agree that removing pressure necessarily opens a door. Local leaders have tried negotiation. Merchants made promises about racial signs, and those promises were broken.
Carter [skeptical]: Then I want to know why the next promise would be different.
King [curious]: That is the question our action must answer. A peaceful appearance is not evidence that the underlying wrong has changed.
goto young_people
label negotiate_leverage
King [determined]: Direct action makes the refusal to negotiate harder to maintain. Business disruption and public attention give leaders reasons to confront demands they could previously ignore.
Carter [worried]: So you intend to make the situation uncomfortable.
King [determined]: Yes. Constructive nonviolent pressure. Not an attack on another person's body, and not a wish to see our people injured.
goto young_people
label negotiate_evidence
King [determined]: The local movement accepted promises that segregation signs would come down. Some briefly disappeared and returned; others stayed. Stopping demonstrations did not secure the promised change.
I: I cross out my assumption that no one has tried the polite route. That does not yet settle what risks should follow a broken promise.
Carter [skeptical]: Evidence explains your distrust. It does not make my daughter unbreakable.
goto young_people
label young_people
scene meeting
show Ruth determined left
show Carter worried right
camera wide
activity Ruth walk right slow
I: Ruth returns with water for her mother. The cup shakes a little; she steadies it against the table before handing it over.
activity Ruth stop
camera two Ruth Carter cut
Ruth [determined]: Ask me, too. Everyone keeps explaining what I cannot understand. I understand that people can lose their jobs for marching. I understand why some adults cannot go.
Carter [worried]: Understanding a danger and surviving it are different things.
I: Young people are becoming central to the campaign. Their willingness gives it new strength—and makes the question of responsibility sharper.
scene meeting
show King worried right
show Ruth determined left
camera two Ruth King cut
choice young_volunteers
option withdraw "Ask the young people to stay out of the street. Adults should carry this risk." -> young_withdraw
option consent "Hear each young person's reasons, tell them the risks, and include their families." -> young_consent ; AskedConsent = true
option roles "Offer support work as well as marching, so participation does not require arrest." -> young_roles
label young_withdraw
King [determined]: I cannot accept that youth makes their demand for freedom meaningless. These young people have become participants in the struggle, not merely spectators waiting for adulthood.
Ruth [angry]: If everyone gets a voice except us, you have already decided whose future this is.
I: I answer that I am worried about her safety, not her intelligence. She hears the distinction, but does not agree to stay home.
goto first_day
label young_consent
King [curious]: Your concern belongs in the discussion. Preparing for nonviolence means facing what may happen, not concealing it behind a stirring appeal.
Ruth [determined]: Ask me why I want to go. Then tell me what you know and what you do not know.
I: I bring Mrs. Carter back into the conversation. Her daughter has a voice; her mother's fear also gets a full sentence.
goto first_day
label young_roles
King [determined]: A movement requires more than the people at the front of a march. Do not confuse one person's assignment with the worth of that person's contribution.
Ruth [skeptical]: I will carry water. I will help find people. But do not use those jobs to avoid hearing why I want to march.
I: I write both possibilities down. Offering another role is not the same as receiving consent to it.
goto first_day
label first_day
scene meeting
show Carter worried left
show Lin worried right
camera two Carter Lin cut
I: By the end of May 2, hundreds of young demonstrators have been arrested. The list of names grows faster than the information about where everyone has been taken.
Carter [worried]: You have a pencil. Help me make this list useful. A name, a family contact, and what we actually know. Leave the guesses blank.
I: For a while, no one asks me for a better argument. I carry messages and check spellings. Ruth helps at the table; every new name interrupts her hand.
label next_day
scene meeting
show Ruth worried left
show King determined right
camera two Ruth King cut
I: MAY 3. More young people gather. News comes back from downtown: police and firefighters are using force. Public Safety Commissioner Bull Connor has chosen to suppress the demonstrations.
Ruth [scared]: They have hoses out there. Not a garden hose. The kind that knocks people down.
I: The news breaks our conversation open. What had been a possibility now has bodies inside it.
label birmingham_hose_v2
I: A photograph from May 3 shows firefighters directing a high-pressure hose at demonstrators near the Parkview Inn. Look at the force of the stream and the people bracing against it.
label after_hose
scene meeting
show Carter angry left
show King worried right
camera two Carter King cut
Carter [angry]: You knew they might do this. Does knowing that make this partly your responsibility?
I: King cannot answer by explaining that segregation is wrong. She has asked about a foreseeable consequence of his strategy.
choice responsibility
option blame "If continuing brings predictable attacks, call it off. You are helping cause the injuries." -> responsibility_blame
option distinguish "Condemn the attackers, but also explain what organizers owe the people facing them." -> responsibility_distinguish ; ProtectedPeople = true
option care "Before defending the strategy, organize care and reliable news for the families." -> responsibility_care ; ProtectedPeople = true
label responsibility_blame
King [determined]: I reject the claim that demanding a right transfers the attacker's guilt to the person demanding it. If a threat can cancel a peaceful protest, those who threaten acquire a veto over freedom.
Carter [angry]: That answers who is guilty. It does not answer what you will do to keep people from being hurt again.
I: I leave both sentences on the page. Responsibility for an assault and responsibility for a strategy are connected questions, not identical ones.
goto consequences
label responsibility_distinguish
King [determined]: Yes: we must not excuse the violence by blaming its victims. Our commitment to nonviolence also requires preparation and discipline; it is not permission to become careless with people.
Carter [skeptical]: Then let me hear those obligations before the next appeal for volunteers.
I: I bring her question back to the organizers. The distinction has made the demand more precise, not less urgent.
goto consequences
label responsibility_care
King [worried]: Attend to the people. The reason for this struggle is their dignity; they cannot disappear behind an account of its strategy.
I: Mrs. Carter gives me another family contact to check. I help return a message before taking another question to King.
Carter [determined]: Thank you. We still need the argument. We needed this first.
goto consequences
label consequences
scene meeting
show Lin worried left
show Ruth angry right
camera two Lin Ruth cut
I: Ruth stands when another report arrives, then sits without speaking. Lin sets the paper where she can reach it and waits.
Ruth [angry]: People will see what happened and say we should have stayed away. As though staying away were the same as being free.
label birmingham_dog_v2
I: Another photograph records a police dog attacking Walter Gadsden in Birmingham in May 1963. His name matters. The image cannot tell us every thought, action, or intention outside its frame.
label after_dog
scene meeting
show King determined right
show Lin worried left
camera two Lin King cut
I: The photographs will travel beyond Birmingham. A volunteer asks what message should accompany the evidence. My first sentence sounds powerful—and too easy.
choice exposure
option shock "Lead with the attacks. The country needs to feel the shock before it will listen." -> exposure_shock
option name "Name the people and explain the demands. Do not make their injuries the whole story." -> exposure_name
option restraint "Avoid showing the photographs. Public outrage may make compromise harder." -> exposure_restraint
label exposure_shock
King [determined]: Exposure matters. What has been allowed to continue out of sight must confront the public. But the attention has a purpose: the injustice must be addressed.
Lin [worried]: If our message ends with “look how terrible,” people can feel terrible and do nothing.
I: I add the demands and the names. I do not claim the photograph proves what every person in it was thinking.
goto tension
label exposure_name
King [determined]: Yes. These are people seeking freedom, not merely evidence of someone else's cruelty. Explain the wrong they are challenging and the change they seek.
I: I write Walter Gadsden's name before describing the dog. Mrs. Carter checks that our message also gives families somewhere to ask for news.
Lin [curious]: The image makes us look. The explanation gives us something responsible to do with what we see.
goto tension
label exposure_restraint
King [determined]: Concealing the confrontation would also conceal what we are asking the country to face. An absence of disturbing pictures does not mean the people pictured have peace.
I: I ask whether every image helps every audience. King has defended exposure; I still must choose a truthful caption and a purpose for showing it.
Lin [worried]: We can refuse spectacle without returning the evidence to a drawer.
goto tension
label tension
scene meeting
show King determined right
show Carter worried left
camera two Carter King cut
I: King takes up the argument he made in April. One sentence from the letter returns with a different weight: “We merely bring to the surface the hidden tension that is already alive.”
Carter [worried]: It was alive before. It is also worse at this moment for people who have been struck. Both can be true.
King [determined]: They can. The absence of an open confrontation is not the same thing as justice. We challenge the conditions that allow the injury to continue.
I: MAY 6. King publicly encourages parents to support the young protesters. His confidence is part of his leadership; it does not remove the danger families have already seen.
if UrgedWait == true -> wait_callback else consent_check
label wait_callback
I: I return to the advice I gave on arrival: more time. Mrs. Carter asks whether I meant time for the city to change, or time for her family to keep enduring it.
Carter [worried]: I am still frightened. Do not mistake my fear for an answer to your question.
goto consent_check
label consent_check
if AskedConsent == true -> consent_callback else law_scene
label consent_callback
Ruth [determined]: You asked what I knew before deciding. Keep asking. A choice made before the arrests does not make every later risk invisible.
I: I add a space for new information beneath our first account of the risks.
goto law_scene
label law_scene
scene meeting
show King determined right
show Lin skeptical left
camera two Lin King cut
I: Another objection reaches the room: the campaign demands obedience to desegregation rulings while its demonstrators defy restrictions on protest. A critic calls that a double standard.
Lin [skeptical]: If we only answer “our cause is right,” almost anyone could borrow that sentence.
choice law_and_order
option obey "Obey the restrictions while challenging them in court. Show respect for the law." -> law_obey
option test "Explain a principle for distinguishing just laws from unjust laws." -> law_test
option action "Answer with disciplined, open civil disobedience and willingness to face penalties." -> law_action
label law_obey
King [determined]: I respect law that protects human dignity. I cannot make obedience to a degrading law my highest duty simply because it has been enacted.
I: I ask how an audience can judge that distinction rather than accept his authority.
King [curious]: Examine what the law does to people, who has a voice in making it, and whether those imposing it accept the same obligations themselves.
goto compromise
label law_test
King [determined]: That is the distinction the objection requires. A law that degrades a group cannot become morally just merely by being written down. Test its treatment of human beings and the inequality it enforces.
Lin [curious]: So the reason has to be something another person can examine. We cannot substitute admiration for the speaker.
I: I write the principle before the example. Now an opponent has something specific to challenge.
goto compromise
label law_action
King [determined]: Yes. Open, nonviolent disobedience with willingness to face punishment is different from secretly evading a rule for advantage. It appeals to the community's conscience.
Lin [skeptical]: Accepting punishment shows commitment. It cannot by itself prove that every committed person is right.
I: I add the missing reason: what makes this law unjust? Conduct and justification must support each other.
goto compromise
label compromise
scene meeting
show King worried right
show Lin curious left
camera two Lin King cut
I: MAY 8. Negotiations have an opening. Business leaders seek a pause in demonstrations. Federal mediator Burke Marshall has been working to bring the sides toward an agreement.
I: A pause could help secure practical gains. It could also release the pressure before promises become action. Reverend Shuttlesworth is in hospital after being struck by a fire hose.
King [determined]: I intend to accept a pause so these negotiations can proceed. Demonstrations may resume if they do not produce a resolution.
Lin [surprised]: First people told you to stop because you were demanding too much. Now people may tell you not to stop because you are accepting too little.
choice pause_or_press
option pause "Take the pause. If negotiation is the purpose, give this opening a chance." -> pause_accept
option pressure "Keep demonstrating until the commitments are secured. We have seen broken promises." -> pause_pressure
option consult "Consult Shuttlesworth and local organizers before announcing a pause." -> pause_consult ; DemandedConsultation = true
label pause_accept
King [determined]: I agree that this opening must be tested. Pressure is a means toward change; continuing it without regard to an opportunity for change would lose sight of its purpose.
I: I ask what would trigger its return. He has made the pause conditional, but that does not mean everyone trusts the judgment.
Lin [worried]: A condition on paper still needs people able to enforce it.
goto shuttlesworth
label pause_pressure
King [determined]: Your warning about promises is serious. I am choosing to test this opening rather than treat every negotiation as the last betrayal repeated. We can resume demonstrations if it fails.
I: He has heard me and decided differently. Being allowed to advise has not given me the authority to choose the movement's course.
Lin [worried]: Now we have to see what the decision costs, not pretend our answer was accepted.
goto shuttlesworth
label pause_consult
King [worried]: I hear the objection. My decision is to proceed with the pause, with the possibility of resuming demonstrations if negotiations fail.
I: He does not give me the consultation I requested. I take the unresolved objection back to the people who will live with the decision.
Lin [determined]: Then we should not write “everyone agreed” just because the announcement is going ahead.
goto shuttlesworth
label shuttlesworth
scene meeting
show Organizer worried left
show King worried right
camera two Organizer King cut
I: Shuttlesworth's response reaches the campaign. He is furious at the proposed pause and at being excluded from the decision. He threatens to return to the streets from his sickbed.
Organizer [determined]: He has spent years building this movement here. He does not accept that a decision can be made over his head because he is in hospital.
I: King proceeds with the announcement. Their disagreement survives it. The famous speaker is neither the only leader nor beyond criticism.
if DemandedConsultation == true -> consult_callback else final_advice
label consult_callback
I: The consultation I asked for has become the heart of the dispute. I underline the objection instead of rewriting my notes to make the meeting look unanimous.
goto final_advice
label final_advice
scene meeting
show Carter worried left
show King determined right
camera two Carter King cut
I: MAY 10. An agreement is reached: steps toward desegregating public accommodations, improved employment opportunities, a committee to follow implementation, and release of jailed protesters on bond.
I: King, Abernathy, and Shuttlesworth appear together to announce it. Their shared appearance does not make the earlier disagreement disappear.
Carter [worried]: We have heard promises before. Tell me what this agreement means for the people whose names are still on our list.
choice closing_message
option victory "Call this a victory. People need to know their courage achieved something." -> close_victory
option obligations "Name the gains, the people who paid, and the commitments still to be checked." -> close_obligations
option trust "Begin by acknowledging the disagreements before asking people to trust the agreement." -> close_trust
label close_victory
King [determined]: There is a real achievement to recognize. Let recognition strengthen the work still required; do not turn a beginning into a declaration that every barrier has fallen.
Carter [determined]: Give us the good news. Then keep the list open until the people on it are accounted for.
I: I change “finished” to “a step secured.” The sentence is less triumphant and more useful.
goto payoff
label close_obligations
King [determined]: Yes. Name the changes we have won and the work that must follow. People deserve more than a ceremony in place of the promised result.
I: I read our account aloud: the gains, the conditions, the people still awaiting release. Mrs. Carter corrects a name; I correct it without arguing.
Lin [relieved]: That is something we can hand to another person and ask them to check.
goto payoff
label close_trust
King [determined]: We can stand together for an agreement without claiming that every judgment along the way was shared. The question now is whether these commitments become reality.
I: I keep Shuttlesworth's objection in our account. A leader's reputation does not require everyone else's disagreement to vanish.
Carter [determined]: Then I can listen without first having to pretend I was never afraid.
goto payoff
label payoff
scene meeting
show Ruth determined left
show Carter relieved right
camera two Ruth Carter cut
I: Ruth and her mother take the finished sheet: names, verified news, the agreement's commitments, and questions still unanswered. My job was small. It was finally specific enough to finish.
Ruth [determined]: Keep a copy. If someone tells this story as though we were just waiting to be rescued, show them what we were asking for.
if ProtectedPeople == true -> care_callback else departure
label care_callback
Carter [relieved]: You brought the question back to the people facing the danger. Do that again when the people are harder to see.
I: The list has become more than evidence for my preferred argument. Each line can still be checked by someone whose life it concerns.
goto departure
label departure
scene classroom
show Lin worried left
show Hepting neutral right
camera two Lin Hepting cut
I: The taxi brings us home. On my notebook, the title Different Ways to Argue is still perfectly neat. Nothing underneath it is.
Hepting [curious]: What did you bring back?
Lin [determined]: An objection can reveal an obligation. Answering it does not make the obligation go away. King could have a powerful answer and still make a decision another leader had reason to oppose.
Hepting [determined]: Now name the structure you needed: CONNECT with the person's concern; EXPLAIN the situation and claim; SUPPORT the disputed connection; ANSWER the strongest objection; CLOSE with a meaningful next step.
Lin [curious]: Classical arrangement gives those jobs a shape. Ethos, logos, and pathos can operate throughout them. Neither map tells us that the risks have become harmless.
I: The historical record continues beyond our visit. Violent backlash follows the settlement; in September, four girls are killed in the bombing of Sixteenth Street Baptist Church. The agreement is an achievement, not a safe ending to the struggle.
Hepting [worried]: The campaign helped bring national attention to demands for civil rights. No single photograph, letter, or leader acted alone.
Lin [curious]: Here is the question I cannot put away: when a strategy wins a necessary change, what do we still owe the people who bore its cost?
show Driver determined center
camera wide
Driver [determined]: Four questions for the fare. Your advice was not a points contest. These questions check what you understood.
end
