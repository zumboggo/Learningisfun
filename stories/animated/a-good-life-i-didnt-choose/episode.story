story 2
variable concern = 0 range 0 2 hidden
variable judgment = 0 range 0 2 hidden
label goodlife_opening_v1
I: Under the desert moon, Santiago turns toward the alchemist. What if he decides to stay?
label classroom
scene classroom
show Kevin worried left
show Hepting neutral right
camera two Kevin Hepting cut
I: Someone asks what I want to do after graduation. I have an answer ready. It is a good answer. Adults usually nod when they hear it.
Kevin: How do you tell whether you want something, or just like how people look at you when you say it?
Hepting: Does their approval mean you cannot want it too?
Kevin: No. That would make this easier.
I: Mr. Hepting slides the Question Journal toward me. Its cover has a door drawn on it. Today I notice that the door has no sign telling me which way to go.
scene journal
show Kevin curious center
I: I write one question: How would I know whether I chose a good life, or became afraid to choose another?
label taxi_arrival
I: The drawn door glows. A vortex opens in the classroom wall, and a silver taxi rolls through it. The driver steps out in sunglasses.
scene classroom
show Kevin surprised left
show Hepting happy right
Hepting: Ready to meet someone who already has an excellent answer to what comes next?
Kevin: That sounds reassuring. Which is probably a bad sign.
I: I take the journal and climb into the taxi.
label taxi_departure
I: The taxi lifts from the school, banks over the field and accelerates into a second vortex. Chengdu disappears behind us.
label arrival
scene desert
show Kevin curious left
show Santiago worried right
camera two Kevin Santiago cut
I: We arrive at Al-Fayoum, an oasis in the Sahara. War has stopped the caravan. Santiago has read a warning in the flight of hawks; the oasis has survived the attack, and its chief has rewarded him with fifty gold pieces and offered him a place as counselor.
I: Tonight he is going out into the desert with the alchemist. I am to walk beside them when they stop, listen, and carry back an honest account of what Santiago chooses. I cannot choose for him.
Santiago: You have come a long way to hear someone who may be finished travelling.
Kevin: Finished because you found what you wanted?
Santiago: I have money from the crystal shop. A reward. Work people respect. And Fatima is here.
express Santiago happy
Santiago: When I speak about her, everyone wants to put her at the bottom of a list and tell me what comes first. She is a person. I want a life with her.
I: The palms make a soft, dry sound. Beyond them there is no road I can see. For the first time, staying sounds less like surrender than like coming home.
choice first-priority
option security "Ask what security would give him." -> security ; concern = 0
option belonging "Ask what belonging means to him." -> belonging ; concern = 1
option purpose "Ask what he wants to do as counselor." -> purpose ; concern = 2
label security
Kevin: What would it mean to have enough money here?
Santiago: Not to begin again hungry in a strange city. Not to discover that one person can walk away with everything I own.
Kevin: So it is more than liking gold.
Santiago: Much more.
goto journey
label belonging
Kevin: What makes this place feel like somewhere you could stay?
Santiago: There is someone whose voice I listen for. Tomorrow would not have to mean another goodbye.
Kevin: That is a real thing to want.
Santiago: Then remember it when you tell this story.
goto journey
label purpose
Kevin: Would being counselor matter even if nobody called it impressive?
Santiago: I warned people of danger. If I can do something useful here, why must useful work be somewhere farther away?
Kevin: I do not have an answer ready for that.
Santiago: Good. Neither do I.
goto journey
label journey
I: The alchemist has told Santiago to exchange his camel for a horse. The following night, they ride beyond the palms. I travel with them, quiet enough to hear the wind.
I: Santiago is asked to find life in the desert. He admits that he does not know how. Then he lets his horse guide him. Where it slows among the rocks, they dismount and search.
show Santiago surprised left
show Alchemist neutral right
show Kevin curious far-left
camera two Santiago Alchemist cut
I: The alchemist reaches into a hole and pulls out a cobra. Santiago recoils. With his blade, the alchemist draws a circle in the sand, sets the snake inside it, and the cobra becomes still.
Santiago: You could have been bitten.
Alchemist: You found life where you thought you could not find it. That was the sign I needed.
Santiago: For what?
Alchemist: To guide you toward the Pyramids.
express Santiago worried
look Santiago away
camera listener Santiago over 0.65
I: Santiago turns toward the direction of the oasis. The palms are out of sight now.
Santiago: I want to stay. Fatima matters more to me than a treasure I have never seen.
look Santiago auto
camera two Santiago Alchemist cut
Alchemist: She has not asked you to abandon your search. She trusts that you can go and return.
I: He says this with the certainty of a man who knows the desert. But Fatima is not standing here to answer for herself.
choice question-love
option listen "Ask what Fatima herself has said." -> fatima
option danger "Ask whether returning is guaranteed." -> danger
label fatima
camera two Kevin Santiago cut
Kevin: Santiago, what has Fatima actually asked you to do?
Santiago: To continue my search. She has not asked me to give it up.
Kevin: Then wanting to stay is yours. It cannot simply be called her request.
Santiago: Wanting to stay is mine. So is being afraid to leave.
goto stay-question
label danger
camera two Kevin Santiago cut
Kevin: Can you promise he will return safely?
Alchemist: The desert is dangerous. Knowing it does not make it harmless.
Santiago: That is what everyone steps past when they tell me to go.
Kevin: Then we should not step past it.
goto stay-question
label stay-question
camera two Santiago Alchemist cut
Santiago: What if I decide to stay?
I: The alchemist does not shrug or tell him to do whatever makes him happy. He begins describing a future. We are still standing on the same sand, beside the same circle. No years have passed.
Alchemist: In the first year, you will be counselor. You can buy sheep and camels. You and Fatima will marry and be happy. You will learn this desert and watch its palms grow.
express Santiago relieved
camera listener Santiago over 0.65
I: Santiago listens. In that first year there is work, affection, and time enough to learn the place where he lives.
Santiago: You describe it as if I should be ashamed to want it.
camera two Santiago Alchemist cut
Alchemist: Listen to the next year.
Alchemist: In the second, the treasure will trouble you again. The signs will keep speaking of it. You will push them aside. Your work will benefit the oasis, and your camels will bring you wealth and influence.
Santiago: So I would still be helping people.
Alchemist: Yes. And still turning away from something you know you want.
choice first-years
option good "Ask whether those good years count." -> years-good
option assumption "Ask what his prediction assumes." -> years-assumption
label years-good
camera two Kevin Santiago cut
Kevin: Does doing good work become worthless because another wish remains?
Alchemist: I have not said his camels disappear, or that his service does no good.
Santiago: Then let us keep those things in the account. I would be giving up something by leaving too.
goto third-year
label years-assumption
camera two Kevin Santiago cut
Kevin: Your prediction assumes the desire for the treasure will remain.
Alchemist: I am speaking to this boy, who has followed it across the sea and the desert.
Santiago: And now I have found someone I did not know I would find.
I: Neither of them has stopped hearing the other. Neither has agreed.
goto third-year
label third-year
camera two Santiago Alchemist cut
Alchemist: In the third year you will walk the oasis at night, thinking of the journey you did not make. Fatima will feel that she interrupted it. You will still love one another.
express Santiago sad
camera listener Santiago over 0.65
Alchemist: You will remember she never asked you to stay. You will know that fear of not returning was what held you here.
I: Santiago's eyes leave the alchemist. For a moment he looks at the sand between them.
Santiago: She could blame herself for a choice I made.
I: It is the first part of this possible future that he repeats aloud.
choice responsibility
option own "Ask how he could take responsibility for staying." -> own
option separate "Separate loving her from fearing the journey." -> separate
label own
camera two Kevin Santiago cut
Kevin: If you stayed, what would you owe her?
Santiago: The truth. I could not say I gave up my life for her when she never asked for that bargain.
Kevin: Even if you later regretted the choice?
Santiago: Especially then.
goto fourth-year
label separate
camera two Kevin Santiago cut
Kevin: Could loving her and fearing the journey both be true?
Santiago: They are both true now. That does not tell me which one is choosing for me.
Kevin: Perhaps it helps to stop using one as the name for the other.
I: Santiago looks back toward the alchemist. He has not stopped wanting to stay.
goto fourth-year
label fourth-year
camera two Santiago Alchemist cut
Alchemist: In the fourth year, after you have repeatedly refused to listen, the signs will fall silent. The chiefs will dismiss you as counselor. You will still be a wealthy merchant. But you will believe your chance to follow your Personal Legend is gone.
Santiago: Wealthy. Loved. And thinking it is too late.
Alchemist: Love, as I understand it, does not demand that you abandon that search.
I: He has spoken the four years with certainty. I have heard a warning, not watched four years happen. The distinction matters, even here under this moon.
choice judgment
option warning "A warning worth taking seriously, not proof of the future." -> warning ; judgment = 0
option pressure "His certainty could pressure Santiago into leaving." -> pressure ; judgment = 1
option insight "He has named a fear Santiago was avoiding." -> insight ; judgment = 2
label warning
camera two Kevin Santiago cut
Kevin: I want to remember your warning without pretending we have already lived it.
Alchemist: Remember, then. The choice still has to be made tonight.
Santiago: I cannot wait four years to find out whether choosing now is safe.
goto release
label pressure
camera two Kevin Santiago cut
Kevin: You make staying sound like a future he must escape. That is a powerful way to persuade someone.
Alchemist: You may question my words. He still has his own heart to listen to.
Santiago: I need to know whether I am leaving because I choose it, or because I am frightened of your story.
goto release
label insight
camera two Kevin Santiago cut
Kevin: He spoke about fear, and you answered about Fatima blaming herself. Did that reach something you already knew?
Santiago: I do not want to make her responsible for my courage. Or for its absence.
Kevin: That sounds like something you can own, whichever way you go.
goto release
label release
camera wide cut
perform Alchemist reach repeat 1 steady
I: The alchemist erases the circle. The cobra slips away among the rocks. Nothing holds it there now.
I: Santiago remembers the crystal merchant and his postponed journey to Mecca. He thinks of the Englishman who has begun trying, and of Fatima, who has trusted him to continue.
show Santiago worried left
show Kevin neutral right
camera two Santiago Kevin cut
if concern == 0 -> security-return else other-return
label security-return
Kevin: Earlier you said you wanted never to be hungry in a strange city again. Has that stopped mattering?
Santiago: No. I remember exactly what it cost me. Going would not erase that memory.
goto decision
label other-return
if concern == 1 -> belonging-return else purpose-return
label belonging-return
Kevin: Earlier you asked me to remember the person whose voice you listen for. I have not forgotten.
Santiago: Neither have I. She is not a smaller part of my life because I am thinking of leaving.
goto decision
label purpose-return
Kevin: Earlier you asked why useful work had to be somewhere else.
Santiago: It does not. But I must answer for my own search as well as the work I could do here.
goto decision
label decision
scene desert
show Santiago determined left
show Alchemist neutral right
camera two Santiago Alchemist cut
I: They mount their horses. On the ride back, Santiago follows the alchemist. The sounds of the oasis reach us on the wind; he tries to pick out Fatima's voice.
Santiago: I will go with you.
express Santiago relieved
camera listener Santiago over 0.65
I: His shoulders ease. The choice brings him peace. It does not bring the Pyramids closer, end the war, or tell Fatima that he is leaving.
camera two Santiago Alchemist cut
Alchemist: We leave before sunrise.
I: Santiago has chosen the journey. He still has a goodbye to make. I close the journal before that conversation belongs to me.
label return
scene classroom
show Kevin worried left
show Hepting neutral right
camera two Kevin Hepting cut
I: The taxi brings me home. My good answer about the future is still waiting for me. It has not become a bad answer just because I questioned it.
Hepting: Did you find out what Santiago should do?
Kevin: I found out what he chose. That is not quite the same thing.
if judgment == 1 -> pressure-return else other-judgment
label pressure-return
Kevin: I also noticed how someone else's confident story could begin making the choice for him.
Hepting: Including a story told by someone you admire?
Kevin: Especially then, perhaps.
goto last-choice
label other-judgment
if judgment == 0 -> warning-return else insight-return
label warning-return
Kevin: The alchemist gave him a warning. I do not want to turn a warning into evidence that every other life must fail.
Hepting: Then keep track of who is speaking, and what we actually see happen.
goto last-choice
label insight-return
Kevin: Sometimes another person hears the fear inside the reason you give. That does not mean they get to choose your life.
Hepting: What would help you tell the difference?
goto last-choice
label last-choice
choice next-step
option private "Write what I would want if nobody could applaud." -> private
option conversation "Ask someone what they expect, then say what I want." -> conversation
option experiment "Try a small part of the path before committing." -> experiment
label private
Kevin: I could write down what I would still want if nobody ever knew I had achieved it.
Hepting: Keep the answer private if that helps you be honest. You do not owe the class a confession.
goto fare
label conversation
Kevin: I could ask someone I care about what they really expect. I may be carrying a demand they have never made.
Hepting: And leave room for them to answer. They may surprise you.
goto fare
label experiment
Kevin: I could try a small part of the work. Find out whether I like doing it, not only being the person who plans to do it.
Hepting: Something specific enough to teach you something. Small enough that you can reconsider.
goto fare
label fare
I: The taxi driver taps the fare meter. Four questions about what happened; three correct pays for the journey. He does not charge extra for disagreeing with the alchemist.
Hepting: If you want a question to keep afterwards: what evidence would help you distinguish a freely chosen commitment from a decision made out of fear?
I: I leave a blank space beneath my first question. For once, I do not fill it just to have an answer ready.
end
