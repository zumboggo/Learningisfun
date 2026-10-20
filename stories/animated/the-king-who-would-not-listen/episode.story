story 2
variable Petition = 0 range 0 2 hidden
variable Speech = 0 range 0 2 hidden
variable Counsel = 0 range 0 2 hidden
variable Limits = 0 range 0 2 hidden
label opening
scene classroom
show Hepting curious left
show Lin skeptical right
camera two Hepting Lin
Hepting [curious]: Suppose the wisest person in the room made every decision.
Lin [skeptical]: Who decides who is wisest?
I: The Teaching Stone glows. A tiny palace appears inside it. Its door has a handle on only one side.
Hepting [worried]: Syracuse, Sicily. Around 367 BCE. Plato thinks philosophy might improve a ruler. Find out what happens when the ruler dislikes the lesson.
effect magic
scene palace
show Maia worried left
show Dion determined right
camera wide
I: My notebook becomes a wax tablet. I am a visiting assistant to Maia, a fictional palace copyist. Dion is preparing a lesson for the new ruler, Dionysius II.
act Dion give Maia "Dion hands Maia the imagined writing tablet and waits for her to read it."
Maia [worried]: A dockworker sent a complaint. The harbour repairs are late. The palace wants a clean copy before the audience.
Dion [determined]: My friend Plato is coming from Athens. If we can educate one ruler well, we might improve an entire city.
Maia [skeptical]: Wonderful. First educate him to read the sentence after the compliment.
I: The complaint says workers have gone unpaid. Then it calls the ruler a peacock with a treasury. Maia covers the writer's name with her thumb.
Maia [worried]: He asked us to deliver it. He did not ask to become an example.
choice petition
option exact "Deliver the complaint exactly, including the insult." -> petition_exact ; Petition = 0
option respectful "Keep the facts and demand, but replace the insult with respectful wording." -> petition_respectful ; Petition = 1
option anonymous "Send an anonymous factual summary; keep the original safely with Maia." -> petition_anonymous ; Petition = 2
label petition_exact
Dion [worried]: The ruler will hear the worker's own voice. He may hear only the insult.
Maia [determined]: I will warn the writer what we are sending. His words should not become our surprise for him.
goto audience
label petition_respectful
Maia [curious]: I keep the unpaid wages. I replace the peacock with a request for a payment date.
Dion [relieved]: You have made it easier to hear. Be careful that courtesy does not become a machine for removing anger.
goto audience
label petition_anonymous
Maia [relieved]: His family has less exposure. But now the official can dismiss it as a rumour from nobody.
Dion [worried]: Protecting a speaker and proving a claim are different tasks. We still need evidence.
goto audience
label audience
scene palace
show King proud left
show Plato neutral right
rest Plato attentive
camera two King Plato
I: Dionysius stands beside Plato, an Athenian philosopher. Guards wait beyond the courtyard. The ruler has inherited enormous power from his father.
King [proud]: I welcome honest advice. Everyone here agrees that I welcome it.
camera listener Plato cut
Plato [skeptical]: How would they safely tell you otherwise?
camera two King Plato
King [determined]: A city needs decisions. Carthage is a powerful rival. Ships and soldiers cost money. An assembly can argue while the danger approaches.
Plato [curious]: And a ruler can decide quickly and wrongly. Before governing others, he must learn to govern his own desires.
if Petition == 0 -> heard_exact else heard_other
label heard_exact
King [angry]: A peacock? That is the argument?
Plato [determined]: The unpaid wages are the argument. The bird is a distraction.
goto wages
label heard_other
if Petition == 1 -> heard_respectful else heard_anonymous
label heard_respectful
King [curious]: This is a civil request. Why was it not brought sooner?
I: I explain that it was brought sooner, less politely. The king's smile becomes smaller.
goto wages
label heard_anonymous
King [skeptical]: No name? How do I know the complaint is real?
Plato [determined]: Examine the accounts. A missing signature does not pay a worker.
goto wages
label wages
King [determined]: Have the accounts examined. That is why a city needs a ruler who can get things done.
I: An inquiry is promised. Payment is not. Still, Maia's complaint has reached someone who can order action.
Plato [curious]: In my ideal city, philosophical understanding and political power belong together. Governing well requires knowledge of what is good, not merely skill at winning applause.
Plato [curious]: We can distinguish episteme, knowledge, from doxa, opinion. Confidence or popularity alone does not make an opinion knowledge.
King [happy]: Excellent. I have the political power. You can supply the understanding before lunch.
Plato [skeptical]: It is not a sauce.
I: Plato's philosopher-ruler is an ideal, not a title that proves Dionysius is wise. I must suggest how this ruler could show that he is learning.
choice lesson
option study "Ask him to defend a decision against Plato's questions." -> lesson_study
option witness "Ask him to hear the dockworkers and question the accounts." -> lesson_witness
option review "Ask him to let another body review one of his decisions." -> lesson_review
label lesson_study
Plato [determined]: A ruler should be able to give reasons, not merely orders.
King [curious]: Then ask me a difficult question.
I: He accepts a lesson. There is still no guarantee that an answer he dislikes will change an order.
goto rumours
label lesson_witness
King [skeptical]: A worker knows his wages. Does he know how to defend a city?
Plato [curious]: He may know something about that city which its ruler does not.
I: The king requests an account. Who chooses the witnesses will matter as much as the invitation.
goto rumours
label lesson_review
King [worried]: If I must obey their judgment, who is ruling? If I need not obey, what have you changed?
Plato [curious]: You have found the question inside the proposal.
I: The king does not agree. A pleasant lesson has become an argument about authority.
goto rumours
label rumours
scene palace
show Maia worried left
show Theras determined right
camera wide
activity Theras walk left brisk
I: Theras, a fictional citizen who supplies the harbour, paces while Maia copies a new instruction. There is a rumour that grain stores have been stolen.
Theras [worried]: My neighbours are gathering. Some want to break into the storehouse. Others want the accounts opened.
activity Theras pause
Maia [worried]: In this imagined harbour dispute, the proposed order forbids speeches that damage confidence in the ruler. That could include both groups.
activity Theras stop
camera two Maia Theras
Theras [determined]: I have seen a crowd become dangerous. A speech can do harm before anyone checks whether it is true.
Maia [skeptical]: And an official can call a true complaint dangerous. What recommendation should I copy?
choice speech
option ban "Support a short emergency ban on public accusations while officials investigate." -> speech_ban ; Speech = 0
option threats "Restrict direct calls to attack people; allow criticism and demands for evidence." -> speech_threats ; Speech = 1
option answer "Reject new speech restrictions; answer rumours with evidence and protect the storehouse." -> speech_answer ; Speech = 2
label speech_ban
Theras [relieved]: That may give us a quiet night.
Maia [worried]: Write an end date. But if the ruler alone decides whether the emergency continues, the date is only a promise.
I: The proposal prioritises immediate order. Honest critics could be silenced with the reckless ones.
goto philosopher
label speech_threats
Theras [curious]: So demanding the accounts is allowed. Calling for someone to be beaten is not.
Maia [determined]: Write examples and an appeal. Otherwise an official can stretch the word threat until it fits a question.
I: The distinction protects more criticism, but someone must enforce it fairly under pressure.
goto philosopher
label speech_answer
Maia [relieved]: Then the complaint remains speakable.
Theras [worried]: Good. But bring the evidence quickly. A correction tomorrow will not repair a broken head tonight.
I: I have opposed a new ban, not made rumours harmless. Evidence and physical protection require work.
goto philosopher
label philosopher
scene palace
show Plato curious left
show Maia skeptical right
camera two Plato Maia
I: Maia asks Plato to defend our right to speak. His answer is less comfortable than I expected.
Plato [determined]: Stories educate desire. In the ideal city of my Republic, guardians should not grow up on every tale poets choose to tell.
Maia [skeptical]: You would select the stories? Then the dispute is partly about who may censor, not simply whether censorship is wrong.
camera listener Plato cut
I: Plato listens. The man challenging a ruler is not a modern defender of unrestricted expression.
camera two Plato Maia
Plato [curious]: Nor does popularity make a judgment true. A crowd can reward a speaker who flatters it instead of someone who understands the problem.
Maia [determined]: A court can do that too. At least people affected by a decision should have a way to challenge it.
I: Democracy gives citizens a political voice. Ancient citizenship excluded many people, including women and enslaved people. Maia would not gain a vote just because men held an assembly.
I: Before the court breaks apart, Dion asks us to suggest a way to hear the harbour dispute. These are our fictional proposals, not institutions Plato established here.
choice hearing
option experts "Let a small group with relevant knowledge recommend a solution publicly." -> hearing_experts
option assembly "Let a citizen assembly hear evidence and decide." -> hearing_assembly
option mixed "Let experts explain the options, then let citizens decide with protections for dissenters." -> hearing_mixed
label hearing_experts
Plato [curious]: Knowledge matters. How will you distinguish an expert from a confident friend of the ruler?
Maia [skeptical]: And how do the people paying the cost challenge the recommendation?
I: Expertise may improve a decision. It does not settle who deserves authority.
goto exile
label hearing_assembly
Maia [determined]: The decision would have to face people beyond the palace.
Plato [worried]: They may still choose a flattering falsehood. Participation does not remove the need for education and evidence.
I: Nor would this ancient citizen assembly include everyone affected. I keep that exclusion in my notes.
goto exile
label hearing_mixed
Plato [curious]: You are separating the work of knowing from the right to decide. Neither part can simply ignore the other.
Maia [worried]: Who enforces those protections when the majority dislikes a dissenter? Add that question before declaring the system finished.
I: The mixed proposal has more checks, and more places where delay or manipulation could enter.
goto exile
label exile
scene palace
show Dion worried left
show King angry right
camera wide
I: Months pass inside the stone. The historical crisis arrives: Dionysius has Dion sent into exile. Our harbour recommendations have not determined this event.
King [angry]: He invites a famous teacher, then stands between that teacher and me. Am I supposed to call that loyalty?
Dion [determined]: Advice that limits your power is not automatically a plot to steal it.
camera listener Dion cut
look Dion away
rest Dion downcast
I: Dion looks toward the exit. A ruler's suspicion has become another person's departure.
scene palace
show Plato worried left
show Maia sad right
camera two Plato Maia
Maia [sad]: The man who brought the teacher has been removed. The teacher is still here.
Plato [worried]: If I remain, perhaps I can still persuade Dionysius. If I leave, perhaps I abandon the chance to improve anything.
I: The Seventh Letter presents Plato as caught between hope, suspicion and pressure to appear the ruler's friend. Its authorship is debated; this dialogue is our reconstruction, not a quotation.
Maia [skeptical]: And if your presence makes people think he listens, when he does not?
choice counsel
option remain "Recommend staying to seek specific improvements, while refusing public praise." -> counsel_remain ; Counsel = 0
option conditions "Recommend setting clear conditions for continued advice, even if access is lost." -> counsel_conditions ; Counsel = 1
option leave "Recommend seeking permission to leave and explaining why cooperation has failed." -> counsel_leave ; Counsel = 2
label counsel_remain
Plato [determined]: A chance to help matters. I would need evidence that remaining still helps someone besides the ruler.
Maia [worried]: And people may see your presence even when they never hear your refusal to praise him.
goto seal
label counsel_conditions
Plato [curious]: Which condition would show that advice can change more than the language of an announcement?
Maia [determined]: Let a critic appeal a punishment without asking the same man to judge himself.
I: Clear conditions expose a refusal. They do not force acceptance, and the door may close first.
goto seal
label counsel_leave
Plato [sad]: Refusing to lend my reputation can matter. It does not pay the workers or bring Dion home.
Maia [worried]: Nor can a visitor simply walk out because the argument has ended. Permission and a safe passage still matter.
goto seal
label seal
scene palace
show King determined left
show Plato worried right
rest Plato guarded
camera two King Plato
King [determined]: I have ordered the harbour inquiry. Yet you speak as if nothing I do can be good.
Plato [curious]: An order can be good. The question is what happens when your order is bad.
King [worried]: You ask me to risk the city on people I do not trust.
Plato [determined]: You ask the city to risk everything on your judgment.
camera listener King cut
I: For a moment the king says nothing. Fear of disorder can be sincere even in someone who benefits from controlling everyone else.
camera two King Plato
I: I am allowed one final recommendation. It will be copied into a private memorandum, not enacted by my choice.
choice limits
option education "Invest in the ruler's education and require him to explain important decisions." -> limits_education ; Limits = 0
option law "Propose written limits and an independent appeal against the ruler's decisions." -> limits_law ; Limits = 1
option shared "Propose sharing final authority with a representative citizen body." -> limits_shared ; Limits = 2
label limits_education
King [relieved]: Then help me become worthy of the responsibility.
Plato [skeptical]: Explaining an order is not the same as allowing it to be overturned. And the next ruler may refuse the lessons.
goto departure
label limits_law
King [skeptical]: A rule cannot defend the harbour. People must enforce it.
Plato [determined]: Yes. A law that only the ruler may interpret against himself may offer very little protection.
I: My proposal needs independent people with real authority. The king gives no promise to create them.
goto departure
label limits_shared
King [worried]: A divided government can become a divided city.
Plato [curious]: Shared power can check one person's error. It can also organise several people's errors. Explain how your citizens would hear evidence and protect those they outvote.
I: I add those questions. The recommendation remains a proposal, not a democratic revolution.
goto departure
label departure
scene harbour
show Maia worried left
show Plato sad right
camera wide
I: Later, Plato is able to leave Sicily. Our short visit compresses events around his first stay with Dionysius II in 367–366 BCE. No branch has converted the ruler or prevented Dion's exile.
Maia [curious]: The inquiry may help. The exile still happened. What will you tell people when they ask whether the experiment worked?
choice report
option progress "Report the possible small gains, alongside the limits and exile." -> report_progress
option contradiction "Lead with the contradiction between welcoming wisdom and silencing challenge." -> report_contradiction
option uncertainty "Separate what happened from what we cannot know about motives or future results." -> report_uncertainty
label report_progress
Maia [determined]: Keep possible in the sentence. An inquiry is not the wages arriving.
Plato [sad]: Nor does a small benefit erase what someone else has lost.
goto callbacks
label report_contradiction
Plato [curious]: Then name the action and the belief it conflicts with. A sharp accusation is stronger when it is precise.
Maia [skeptical]: And do not turn the philosopher into a hero who never wanted control over other people's words.
goto callbacks
label report_uncertainty
Maia [curious]: We know that Dion was exiled. We do not have a window into every person's mind.
Plato [determined]: Uncertainty should limit a claim, not become an excuse to ignore what is clear.
goto callbacks
label callbacks
if Speech == 0 -> callback_ban else callback_speech
label callback_ban
Maia [worried]: You supported a temporary ban. Keep asking who can end it if the ruler wants it to last.
goto callback_counsel
label callback_speech
if Speech == 1 -> callback_threats else callback_open
label callback_threats
Maia [determined]: You separated criticism from calls to attack. Your principle will depend on whether an unpopular critic can challenge the official's label.
goto callback_counsel
label callback_open
Maia [determined]: You refused new restrictions. Your principle still owes frightened people an answer about immediate harm.
goto callback_counsel
label callback_counsel
if Counsel == 0 -> callback_stay else callback_counsel_other
label callback_stay
Plato [curious]: You advised remaining useful without praising the ruler. Watch whether influence changes him, or merely changes what you are willing to excuse.
goto return
label callback_counsel_other
if Counsel == 1 -> callback_conditions else callback_leave
label callback_conditions
Plato [curious]: You asked for conditions. A condition protects your integrity only if you will act when it is refused.
goto return
label callback_leave
Plato [curious]: You advised departure. Refusal can preserve an objection; it does not guarantee that the people left behind are better off.
goto return
label return
effect magic
scene classroom
show Hepting neutral left
rest Hepting attentive
show Lin curious right
camera two Hepting Lin
I: My wax tablet becomes a notebook again. On the last page I have drawn the palace door, now with two handles.
Hepting [determined]: Plato returned to Syracuse again in 361 BCE. The effort still did not produce his ideal philosophical government. Later Dion overthrew Dionysius, and was himself assassinated. Replacing the person did not settle the problem of power.
Lin [curious]: So the lesson is that smart people should never rule?
Hepting [skeptical]: No. Ask how knowledge should guide power, who may challenge it, and what happens when the person holding it is mistaken.
if Limits == 0 -> final_education else final_limits
label final_education
Lin [curious]: You chose education and explanations. Now imagine the ruler learns brilliantly, but his successor refuses every lesson. Does your principle still protect people?
goto close
label final_limits
if Limits == 1 -> final_law else final_shared
label final_law
Lin [curious]: You chose laws and appeals. Now imagine the ruler appoints every judge. What must change before your protection is real?
goto close
label final_shared
Lin [curious]: You chose shared authority. Now imagine a popular majority votes to silence a small minority. What does your principle require?
goto close
label close
Hepting [curious]: In your portfolio, compare one character's stated belief with a specific action. Then test your own principle in another situation. You can defend it or revise it; give reasons either way.
Lin [skeptical]: I propose a rule: anyone declaring themselves the wisest must first survive a group project.
Hepting [worried]: A demanding constitutional safeguard.
I: The stone goes quiet. The difficult question remains: who can say no when the person in charge is certain they are right?
end
