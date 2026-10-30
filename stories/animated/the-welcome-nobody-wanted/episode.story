story 2
variable attention = 0 range 0 2 hidden
variable plan = 0 range 0 2 hidden
variable response = 0 range 0 2 hidden
label welcome_opening_v1
scene square
I: A ribbon pulls tight. Above the path, a wooden support begins to move.
label classroom
scene classroom
show Hepting curious left
show Kevin happy right
camera two Hepting Kevin cut
Hepting [curious, question]: Can helping someone make their day worse?
Kevin [embarrassed]: I once explained a whole maths problem before my friend finished asking it.
Hepting [happy]: Did that help?
Kevin [skeptical]: I learned that his question was about lunch.
I: The Teaching Stone warms beside an open book. I write: When should a good leader step in, and when should they step back?
label taxi_arrival
I: A taxi rolls through a bright opening in the classroom wall. The driver opens the door. Our question has found a road.
I: I climb in with Mr. Hepting. The driver checks the book, nods once, and starts the engine.
label taxi_departure
I: We sweep out above the school field and through a second opening in the sky.
label arrival
scene square
show Lan determined left
show Kevin curious right
look Lan Kevin
look Kevin Lan
camera two Lan Kevin cut
perform Lan reach repeat 1 steady
I: A village square opens around us. A young organiser is sorting cloth beside a welcome canopy. The new district official arrives before sunset. Mr. Hepting waits by the gate while I offer to help.
Lan [determined]: I'm Lan. You can hold this end. Not that end. The other other end.
Kevin [confused]: I had not realised cloth had so many ends.
Lan [laughing]: Neither had I until today.
I: Lan places a stool in the shade for an older woman, then gives her own water cup to a tired worker. Her list falls in the dust while she does it.
Lan [worried]: If the official keeps me as organiser, I can finally pay my mother's debts. Everything must go well.
Kevin [curious]: What would going well look like for the people here?
Lan [determined]: They'll feel respected. A proper greeting, a full square, everybody in the right place.
show Auntie sad center
camera wide
Auntie [worried]: Lan, my grain is still outside. Rain is coming. They called my grandson away to rehearse the greeting.
Lan [embarrassed]: I know. We only need him for another hour.
Auntie [skeptical]: Your last hour had another hour inside it.
choice first_task
option grain "Help move Auntie's grain before rehearsing." -> help_grain ; attention = 0
option rehearsal "Finish one short rehearsal, then release the workers." -> finish_rehearsal ; attention = 1
option listen "Ask the workers what needs doing before making a plan." -> hear_workers ; attention = 2
label help_grain
camera two Kevin Auntie cut
act Kevin reach "I lift a basket from the edge of the path while Auntie opens her store door."
Auntie [relieved]: Put it beside the dry wall. You asked where before you carried it. That saves another journey.
Lan [worried]: The rehearsal will start late. I'll have to tell the official why.
Kevin [determined]: Tell him what the hour was for.
goto first_after
label finish_rehearsal
camera two Kevin Lan cut
Kevin [determined]: One rehearsal. A clear ending. Then everyone goes back to work.
Lan [relieved]: A promise I can actually count.
I: We practise a greeting, and Lan sends the workers home when it ends. A little rain reaches Auntie's grain before they cover it. The greeting is ready; part of the harvest is damp.
Lan [sad]: We kept the time we promised. It still cost her something.
goto first_after
label hear_workers
camera two Kevin Auntie cut
Kevin [curious]: What must happen before sunset, and what could wait?
Auntie [determined]: Grain under a roof. The water path clear. And please stop moving that stool away whenever it looks untidy.
Lan [surprised]: I moved it so the visitors could see the whole square.
Auntie [skeptical]: I was using it to sit down.
I: Lan crosses out two tasks. Listening has taken time; she now has less time for decorating, and better reasons for what remains.
label first_after
scene square
show Lan worried left
show Kevin curious right
camera two Lan Kevin cut
Lan [worried]: I thought respect meant preparing something beautiful. Am I supposed to stop caring how we greet him?
Kevin [curious]: Can the greeting show care without taking so much from people?
Lan [determined]: Don't give me a fine sentence. Give me something I can do before he gets here.
choice greeting
option share "Keep a short greeting, then ask the official to hear residents." -> greeting_share
option explain "Use the ceremony to explain what the village needs." -> greeting_explain
option quiet "Offer a simple welcome and let people return to their work." -> greeting_quiet
label greeting_share
Kevin [determined]: One bow, one welcome, then someone from each part of the village can speak.
Lan [skeptical]: Who gets the first turn? A short ceremony can become a very long argument.
Kevin [curious]: We can ask who hasn't been heard yet.
goto greeting_after
label greeting_explain
Kevin [determined]: The welcome can include a basket of grain and an account of the work that protects it.
Lan [curious]: So the form helps us notice the work?
Kevin [worried]: If we let the workers speak. Otherwise we are decorating with their troubles.
goto greeting_after
label greeting_quiet
Kevin [determined]: A greeting doesn't have to fill an afternoon. Say welcome, offer water, and let people go.
Lan [worried]: Some people have practised for days. They want a chance to be seen too.
Kevin [curious]: Then ask them what they still want to offer.
label greeting_after
scene square
show Fang happy left
show Lan proud right
look Fang Lan
look Lan Fang
camera two Fang Lan cut
I: Official Fang arrives carrying his own travel bag. He stops to lift the gate for a man pushing a heavy cart. Lan quickly smooths her sleeves.
Fang [happy]: You must be the organiser. They tell me you've worked very hard.
Lan [proud]: Everyone has.
Fang [curious]: Then why does everyone look tired?
camera listener Lan over 0.65
Lan [embarrassed]: Because I kept finding one more thing to improve.
I: Her fingers stop smoothing the sleeve. Fang waits for the rest.
camera two Fang Lan cut
Fang [worried]: I asked for a welcome so people would know I would listen. I didn't ask what preparing it would cost.
show Kevin curious center
camera wide
I: Fang recalls Confucius's teaching: ritual needs humaneness. A careful greeting should express care for the people it brings together.
Fang [determined]: We can still change today's plan. I need your advice.
choice ceremony
option full "Keep the planned welcome, but pay helpers and release them on time." -> plan_full ; plan = 0
option small "Keep a short shared greeting and return most helpers to their work." -> plan_small ; plan = 1
option stop "Cancel the organised welcome and let residents decide what to offer." -> plan_stop ; plan = 2
label plan_full
camera two Fang Lan cut
Fang [determined]: We have already promised people a gathering. I'll use part of my household allowance to pay the helpers.
Lan [relieved]: That makes their time visible.
Fang [worried]: It doesn't return the dry hours. And the money won't stretch to every demand next month.
goto before_wind
label plan_small
camera two Fang Lan cut
Lan [determined]: One greeting together. Then the workers leave. I'll carry the unfinished cloth myself.
Fang [relieved]: Tell people why we've shortened it. Otherwise they may think we don't value their effort.
Lan [worried]: The performers will be disappointed. I need to speak with them, not simply send them away.
goto before_wind
label plan_stop
camera two Fang Lan cut
Fang [determined]: Put away the task list. People can come or go. I will greet whoever wants to speak.
Lan [sad]: Some workers are relieved. Some say their preparation has been thrown away.
Fang [worried]: Giving up control doesn't remove my responsibility for what I already asked them to do.
label before_wind
scene square
show Lan worried left
show Kevin curious right
show Wei determined center
camera wide
I: A gust runs through the square. The tall canopy support leans toward the path. A cart is approaching from the other side, where the driver cannot see the loose tie.
Wei [determined]: That support needs attention. Nobody stand underneath it.
Lan [worried]: I was about to tell everyone to leave things alone. We keep making more work!
Kevin [shocked]: The cart is still coming.
choice danger
option stop "Stop people entering the path and call Fang and Wei." -> danger_stop ; response = 0
option handover "Ask Wei to direct the response while I guide people around." -> danger_handover ; response = 1
option wait "Step back without calling out; let others notice and respond." -> danger_wait ; response = 2
label danger_stop
camera two Kevin Wei cut
Kevin [determined]: Please stop at the corner! Wei, we need your help here.
I: Fang halts the greeting. Wei takes charge of the support while helpers keep the path clear. The delay is awkward and very public. No one is beneath the cloth when it comes down.
Wei [relieved]: You didn't have to know how to fix it. You did have to let someone know.
goto danger_after
label danger_handover
camera two Kevin Wei cut
Kevin [determined]: Wei, you know this structure. Will you direct us? I'll keep the path clear.
Wei [determined]: Yes. Give people room. Ask the cart driver to wait at the far corner.
I: Wei calls for two experienced helpers. The canopy is lowered, and the welcome pauses. Lan must trust directions that aren't on her list.
Lan [relieved]: I still did something. I just wasn't in charge of every hand.
goto danger_after
label danger_wait
camera listener Lan over 0.65
I: I step back. The cart reaches the corner before Wei gets its driver's attention. Its wheel catches the loose cloth. The empty support drops across the path; everyone stays clear, but the gate is blocked.
Lan [shocked]: I thought stepping back meant I shouldn't interfere.
Wei [worried]: You could see something the driver couldn't. I needed that information sooner.
I: Wei closes the path and calls helpers. The greeting waits while they clear it. Nobody is hurt. Doing less has still had consequences.
label danger_after
scene square
show Lan sad left
show Fang worried right
camera two Lan Fang cut
I: The cloth lies folded at the edge of the square. Lan starts collecting the scattered ties. Fang crouches to help, then waits when she raises a hand.
Lan [sad]: Please let me finish one knot before you suggest a better way.
Fang [embarrassed]: Fair.
I: He holds the basket steady instead. She puts the last tie inside it.
Lan [worried]: You'll need someone else for the next welcome.
camera listener Lan over 0.65
Fang [determined]: I need someone who can tell me when my plans are costing people too much. Can you learn to do that?
I: Lan keeps a hand on the basket. She looks at Fang before she answers.
camera two Lan Fang cut
Lan [curious]: If I tell you, will you listen when visitors are watching?
Fang [worried]: That is the part I will have to practise.
choice account
option public "Ask Fang to explain his own part in the burden publicly." -> account_public
option residents "Ask residents to describe the costs before deciding what changes." -> account_residents
option private "Begin with a private review so Lan can speak without losing face." -> account_private
label account_public
Fang [determined]: I asked for the event. I should say what I failed to ask before it began.
Lan [worried]: Let me speak about my decisions too. If you take every responsibility, you also take away mine.
I: They prepare a short explanation together. Honesty may cost Fang some authority today; silence would make the next invitation harder to trust.
goto tomorrow
label account_residents
Fang [determined]: Before I announce a lesson, I should hear what people actually lost.
Lan [curious]: I'll ask who had no time to come. A meeting can miss people for the same reason a ceremony does.
I: Listening will take another visit. Fang leaves without the simple success story his travelling clerk hoped to record.
goto tomorrow
label account_private
Lan [relieved]: I can tell you more if I don't have to defend myself before the whole square.
Fang [worried]: Then we begin privately. Afterward we still owe residents an account of decisions that used their time.
I: Privacy makes the first conversation easier. It also gives them a responsibility to bring its results back out of the room.
label tomorrow
scene square
show Lan determined left
show Kevin curious right
camera two Lan Kevin cut
if attention == 0 -> remember_help else remember_check
label remember_check
if attention == 1 -> remember_rehearsal else remember_listen
label remember_help
Lan [curious]: You helped with Auntie's grain before we made our fine speeches. Next time I want to ask what needs protecting first.
goto next_plan
label remember_rehearsal
Lan [curious]: We kept our promise about the rehearsal, but the rain still reached the grain. A clear plan can still miss the wrong thing.
goto next_plan
label remember_listen
Lan [curious]: That stool wasn't untidy. It was useful to someone. I want fewer invisible people on my next list.
label next_plan
Lan [determined]: Tomorrow I have one job left to offer you: help me begin again. What should the first step be?
choice next_day
option ask "Ask residents what help they want before offering jobs." -> next_ask
option limits "Agree on limits that people can question or refuse." -> next_limits
option share "Give local helpers authority, with a clear way to raise a concern." -> next_share
label next_ask
Kevin [curious]: Start with a question people can answer honestly. What help would matter to you tomorrow?
Lan [determined]: And if nobody asks for my beautiful plan, I will try not to look wounded.
I: She turns the list over. The blank side looks difficult, but no longer like a failure.
goto home
label next_limits
Kevin [determined]: Say how much time you are asking for. Give people a real way to say no.
Lan [curious]: A limit I have to accept, even when the visitor is important.
I: She writes a smaller list. Beside the first task she leaves space for someone else's answer.
goto home
label next_share
Kevin [determined]: Let helpers make decisions where they know more. Make it easy to call for support.
Lan [curious]: So I need to stay available without standing over them.
I: She gives Wei the repair list and asks when he wants her to check back. For once, she waits for his answer.
label home
scene classroom
show Hepting curious left
show Kevin curious right
camera two Hepting Kevin cut
I: The taxi brings us safely home by a quiet road of light. The driver taps tomorrow's empty space in the book. I leave the pen there for a moment.
Hepting [curious]: What did Lan learn?
Kevin [curious]: That care can need a greeting, a question, or a warning. It depends on what is happening to people.
Hepting [determined]: Confucius asks whether our forms express humaneness. The Daoist challenge asks when our efforts start forcing things. Neither lets us stop paying attention.
Kevin [happy]: I think I can practise waiting for my friend's actual question.
I: I close the book. My next helpful sentence will have to wait until someone else finishes theirs.
end
