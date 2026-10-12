story 1
variable trust = 2 range 0 5 visible
variable evidence = 0 range 0 3 visible
variable original = false hidden
label opening
scene classroom
show Hepting happy center
Hepting: Today you are the editor. Your job is to check a claim before the whole school believes it.
I: A fairly ordinary Tuesday. Then Mr. Hepting taps a secret WeChat mini-program, and a car comes through the window without breaking it.
effect magic
show Mei surprised center
Mei: Please tell me the driver knows where the brakes are.
I: The car lands between the whiteboard and my desk. Outside, a silver rift opens above the CDIS soccer field.
move Mei nod
Mei: Someone posted my article with a sentence I never wrote. The newspaper demonstration starts in ten minutes. I need the original.
choice first
option ask "I ask what changed before promising anything." -> question ; evidence += 1
option promise "I promise to stand beside Mei while we find out." -> promise ; trust += 1
label question
Mei: My draft said the new rule COULD help. The announcement says it WILL help. That is a rather expensive missing word.
goto depart
label promise
Mei: Thank you. But please don't say you know I'm right yet. We still need proof.
goto depart
label depart
I: We climb in. The driver adjusts his sunglasses. The car shoots toward the rift; the soccer goals stretch like noodles.
effect magic
scene archive
show Lin surprised center
I: I land on a wooden floor with the dignity of a dropped sandwich. A sign says: Archive of Unfinished Arguments. Time: five minutes before publication.
Lin: I'm the archive assistant today. Apparently that means I carry everything. Mei's original draft is in one of these folders.
choice search
option folder "I check the dated draft folder." -> source ; original = true, evidence += 1
option headline "I check the public headline first." -> headline ; evidence += 1
label source
Lin: Here it is: 'The rule could help, if students have a quiet place to practise.' The condition matters too.
goto pressure
label headline
Lin: The headline says 'New rule guarantees success.' A confident claim, but confidence isn't evidence.
goto pressure
label pressure
move Lin exit
show Yeyul worried center
Yeyul: I'm organising the demonstration. We have to print something soon. Could you just approve the stronger sentence?
I: Yeyul holds a stack of blank posters. She has spent all lunch arranging the display. Starting over would hurt.
choice response
option explain "I explain why the certainty changes the claim." -> explain ; trust += 1
option pause "I ask her to pause printing until we compare the source." -> pause ; evidence += 1
label explain
Yeyul: I thought sounding uncertain would make everyone ignore us. But a promise we can't keep would be worse.
goto complication
label pause
Yeyul: All right. I'd rather lose five minutes than put Mei's name on words she didn't write.
goto complication
label complication
chance printer 50 -> jam else rush
label jam
I: The printer coughs, flashes red, and eats the first poster. Even machines have opinions about deadlines.
goto decide
label rush
I: Footsteps approach outside. The audience is early. This is a deeply inconsiderate thing for an audience to do.
goto decide
label decide
show Mei worried center
Mei: We may not get a perfect poster. What can we honestly put my name on?
choice claim
option qualified "I suggest a qualified claim, with its condition." -> qualified ; trust += 1
option question "I turn the poster into a question for the audience." -> question_poster ; trust += 1
label qualified
Mei: 'The rule could help if students have a quiet place to practise.' Less dramatic. Much closer to what I meant.
goto proof
label question_poster
Mei: 'When would this rule help?' That invites people to examine the conditions with us.
goto proof
label proof
if original == true -> compare else acknowledge
label compare
I: I place the dated draft beside the new poster. Anyone can compare the two. A source is more useful than my most confident face.
goto audience
label acknowledge
I: We label the poster as a revised question. We explain that we have not yet checked the original draft. What we don't know belongs in the story too.
goto audience
label audience
show Yeyul happy center
Yeyul: I'll introduce the correction. People may still be annoyed. But at least they will know what happened.
choice credit
option shared "I help explain the correction with Yeyul." -> together ; trust += 1
option support "I let Mei speak and keep the evidence ready." -> support ; evidence += 1
label together
I: My voice wobbles on the first sentence. It works better once I stop trying to sound like a television lawyer.
goto return
label support
I: Mei explains what changed. I hold up the draft folder when she asks. Being useful turns out to involve surprisingly little dramatic pointing.
goto return
label return
scene classroom
effect magic
show Hepting happy center
I: The car tips us back into CDIS. My chair is exactly where I left it. My confidence in headlines is somewhere else.
Hepting: You couldn't control the deadline. You could control whether your words matched your evidence.
I: The driver raises four fingers. Apparently the fare is payable in understanding.
end
