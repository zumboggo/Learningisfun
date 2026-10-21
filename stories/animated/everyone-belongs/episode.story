story 2
variable Friendship = 6 range 0 20 visible
variable Inclusion = 4 range 0 20 visible
variable Film = 6 range 0 20 visible
variable Promised = false hidden
label opening
scene classroom
show Mei excited left
show Yeyul proud center
show Jordan curious right
camera wide
I: Lunch break. Our group has promised a thirty-second welcome video for new students. The bell rings in twenty minutes. My noodles are becoming one large noodle.
Yeyul [proud]: A serious school tour. But everything goes wrong. I introduce a cupboard as the principal's office.
Mei [laughing]: Finally, a principal who stores cleaning supplies.
Jordan [curious]: Shall I film the cupboard now?
I: Jordan is new. He brought the camera. Mei and Yeyul are my friends. We share a home language; Jordan doesn't understand it. We all know some English.
Mei [worried]: I can write English. Speaking while a camera watches me is different.
Jordan [determined]: I want this film to look good. My last film had my thumb in every scene. Artistic choice.
I: I want my friends to feel safe, Jordan to have a real place, and our film to get finished. The three meters track those aims, not anybody's worth.
I: Film means time and usable footage. There is no real timer: I can read slowly. The choices, not my reading speed, use our fictional lunch break.
label planning
I: DECISION 1 OF 7. Mei and Yeyul start planning in our home language. Their ideas come quickly. Jordan points the camera at the wrong cupboard.
Jordan [confused]: Is this the principal or the sports department?
choice plan
option summary "Let my friends finish. Then explain the plan to Jordan." -> plan_summary ; Friendship += 2, Inclusion -= 1, Film += 2
option together "Plan together in simple English. Give everyone time." -> plan_together ; Inclusion += 3, Friendship -= 1, Film -= 2
option test "Act out a quick test so everyone can see the idea." -> plan_test ; Inclusion += 1, Friendship += 1, Film -= 1
label plan_summary
Yeyul [excited]: Yes! We keep the surprise ending.
Jordan [skeptical]: Thanks for the instructions. Do I get to suggest anything?
I: The plan is ready quickly. Jordan knows what to film, but didn't help decide it.
goto presenter_scene
label plan_together
Mei [embarrassed]: The joke was better in my head. Wait. Let me write it.
react Jordan nod
I: Jordan waits while Mei writes three words. He adds an idea for a low camera angle. We have a shared plan, but less filming time.
goto presenter_scene
label plan_test
camera wide
act Yeyul bow "Yeyul gives a grand bow to the imaginary cupboard principal."
Jordan [laughing]: Wait. Film that from down here. Make the cupboard look powerful.
Mei [happy]: Yes! But do not show the mop until the end.
I: The test helps everyone understand. Setting it up takes time; a few details are still unclear.
goto presenter_scene
label presenter_scene
camera two Mei Yeyul
I: DECISION 2 OF 7. Mei pulls me aside while Yeyul checks the background.
Mei [pleading]: Please don't make me present in English. I want to help. I just don't want my face and my mistakes on the school screen.
camera listener Mei cut
I: She folds the script twice. This isn't a request for me to tell her to be brave.
choice presenter
option replace "Offer to present while Mei directs me." -> presenter_replace ; Friendship += 2, Film += 2, Inclusion -= 1
option rehearse "Offer a short line and a private rehearsal. Let Mei agree first." -> presenter_rehearse ; Friendship += 1, Inclusion += 1, Film -= 2
option visual "Change the scene to signs and actions. Mei writes the signs." -> presenter_visual ; Friendship += 2, Inclusion += 2, Film -= 2
label presenter_replace
Mei [relieved]: Thank you. Say it like the cupboard is extremely important.
I: I become the presenter. Mei directs confidently, but now most of the speaking footage features me.
goto director_scene
label presenter_rehearse
Mei [worried]: One line. Off camera first. And I can stop.
I: We practise quietly. She chooses to try. It takes several minutes, and her hands still shake a little.
Mei [skeptical]: If anyone says I just need confidence, they can confidently eat my cold lunch.
goto director_scene
label presenter_visual
Mei [determined]: I can write: PRINCIPAL. And then: PLEASE DO NOT FEED THE MOP.
I: Mei stays central without a speech. We spend time making signs. Jordan points out that viewers need time to read them.
goto director_scene
label director_scene
camera wide
I: DECISION 3 OF 7. We watch our first clip. The cupboard joke is hard to follow.
Jordan [determined]: This doesn't make sense. Let's do it properly. Reveal the mop at the end.
express Yeyul disappointed
camera listener Yeyul cut
I: Yeyul stops reaching for the script.
Yeyul [disappointed]: Properly. Right. We were doing it improperly.
Mei [skeptical]: The camera idea is useful. The way you said it was not.
choice director
option back "Back Jordan's clearer version and ask him to explain the shot." -> director_back ; Film += 3, Inclusion += 2, Friendship -= 2
option defend "Keep our original version. Explain why the joke matters to us." -> director_defend ; Friendship += 2, Inclusion -= 1, Film += 1
option compare "Film both versions and compare them together." -> director_compare ; Friendship += 1, Inclusion += 2, Film -= 2
label director_back
Jordan [embarrassed]: Sorry. I meant the shot, not your whole idea.
Yeyul [skeptical]: The shot accepts your apology. I am thinking about it.
I: The new version is clearer. Yeyul follows the directions but makes fewer suggestions.
goto joke_scene
label director_defend
Yeyul [relieved]: Thank you. The long silence before the mop is the point.
Jordan [worried]: Okay. But will a new student understand why we are staring at a door?
I: We get another take quickly. Jordan's question remains unanswered.
goto joke_scene
label director_compare
I: Our version makes the group laugh. Jordan's makes the surprise easier to see. Neither wins everything.
Mei [curious]: Can we keep our serious voices and his camera angle?
Jordan [happy]: Yes. Also, the mop is our best actor.
I: The shared edit is promising. Testing both versions has used time we might need later.
goto joke_scene
label joke_scene
camera wide
act Yeyul reach "Yeyul reaches down to move the imaginary camera bag out of the walkway."
I: DECISION 4 OF 7. While we reset, Yeyul makes a joke in our home language about a disastrous trip with our friends. Mei and I laugh.
Jordan [curious]: What happened?
Yeyul [worried]: Please don't tell the whole story. It includes my swimming shorts.
I: The joke isn't about Jordan. But he is waiting again, smiling without knowing why.
choice joke
option explain "Ask Yeyul's permission, then explain the story now." -> joke_explain ; Inclusion += 2, Film -= 2
option later "Promise Jordan a short explanation after the final shot." -> joke_later ; Friendship += 1, Film += 1, Promised = true
option brief "Say it is a private trip story. Explain the next shot together." -> joke_brief ; Friendship += 1, Inclusion += 1, Film += 1
label joke_explain
Yeyul [embarrassed]: You may explain the bus. Not the shorts.
I: I keep that boundary. Jordan understands the joke, although it takes longer to explain than to enjoy.
Jordan [skeptical]: That was a lot of history for a bus joke.
goto take_scene
label joke_later
Jordan [neutral]: Okay. After the final shot.
I: We keep moving. Jordan has heard that promise before from other people. Whether I keep mine will matter.
goto take_scene
label joke_brief
Jordan [neutral]: Fair enough. I don't need every private story. I do need to know what we are filming.
I: We explain the next shot together. Jordan is still outside the memory, but inside the plan.
goto take_scene
label take_scene
camera two Mei Jordan
I: DECISION 5 OF 7. Mei offers one short line. She can stay off camera if she wants. On the first take she sounds stiff. Then she suddenly makes the cupboard seem terrifying.
Mei [determined]: Our principal have many secrets.
Jordan [curious]: That was funny. It should be 'has'. Another take?
express Mei worried
camera listener Mei cut
I: Mei watches the little screen. For once, she likes her own performance.
Mei [worried]: Everyone understands it. But people will see it. I don't know.
choice take
option keep "Suggest keeping the funny take, if Mei agrees." -> take_keep ; Friendship += 1, Film += 2
option reshoot "Offer a private rehearsal and a corrected take." -> take_reshoot ; Friendship -= 1, Film -= 1, Inclusion += 1
option control "Show Mei both takes and give her the final choice." -> take_control ; Friendship += 2, Inclusion += 1, Film -= 2
label take_keep
Mei [worried]: Keep it for now. Ask me again before we submit it.
I: We save time. She hasn't given permission for the final screening yet. The joke works because of her acting, not the grammar.
goto last_scene
label take_reshoot
Mei [frustrated]: I know the rule. Knowing and saying are different.
I: We practise privately. The corrected take is clear, but less funny. Mei chooses that take for the school screen.
Jordan [relieved]: Saved. And I will ask before calling another take next time.
goto last_scene
label take_control
Mei [determined]: Use the clear version for school. Keep the funny one for us. Ask before sharing either anywhere else.
I: Comparing clips takes time. Mei chooses where her own performance goes. Nobody gives her a bravery speech.
goto last_scene
label last_scene
camera wide
I: DECISION 6 OF 7. We have time for one more attempt. Jordan lowers the camera.
Jordan [worried]: Could I be in this one? My family keeps asking who my new friends are. I have excellent footage of your cupboard.
Yeyul [worried]: We still haven't filmed our ending. You promised we'd keep it.
I: A combined shot could include everyone and the ending. It needs a clear plan and cooperation. A rushed attempt could lose both.
choice last_shot
option jordan "Film Jordan's entrance. Give up the planned ending." -> last_jordan ; Inclusion += 3, Friendship -= 2, Film += 1
option ending "Keep the promised ending. Credit Jordan as cameraman." -> last_ending ; Friendship += 2, Inclusion -= 2, Film += 2
option combined "Try one combined shot with everyone in it. Risk losing our last attempt." -> combined_check ; Film -= 1
label last_jordan
Jordan [excited]: I enter, see the mop, and ask if the principal is available.
Yeyul [disappointed]: That's my ending gone.
I: Jordan gets a visible part. Yeyul helps film it, quietly.
goto promise_check
label last_ending
Jordan [disappointed]: Credit is good. It isn't a photo I can send home.
Yeyul [happy]: We can finally finish the joke.
I: We capture the ending. Jordan's name appears, but his face doesn't.
goto promise_check
label combined_check
if Film >= 5 -> combined_people else combined_rushed
label combined_people
if Inclusion >= 7 -> combined_ready else combined_confused
label combined_ready
camera wide
act Yeyul bow "Yeyul bows; Mei reveals the imaginary sign; Jordan steps into the group."
Jordan [laughing]: Is the principal available, or being used to clean the floor?
Mei [laughing]: Both. Very efficient school.
I: The shared plan holds. We get one untidy, usable shot with everyone and the ending.
goto promise_check
label combined_rushed
Yeyul [worried]: Are we entering before or after the mop?
I: We rush the setup. The camera records us arguing about where to stand. There isn't another attempt.
Jordan [skeptical]: A welcome video. Nobody knows where to go. Quite accurate.
goto promise_check
label combined_confused
Jordan [confused]: I thought I was entering now.
Mei [frustrated]: We changed that. Didn't someone tell you?
I: We had enough filming time, but no shared plan for this shot. We keep our earlier clips; the combined ending doesn't work.
goto promise_check
label promise_check
if Promised == true -> promise_paid else edit_scene
label promise_paid
I: While Jordan saves the files, I remember my promise about the bus joke. I give the short version, without the private shorts story.
Jordan [relieved]: You remembered. Thank you. It still isn't funny.
Yeyul [proud]: It was a very advanced bus.
goto edit_scene
label edit_scene
camera wide
I: DECISION 7 OF 7. The bell is close. Our footage includes a clean presenter clip, an uneven group version and some funny mistakes between takes.
Mei [determined]: My nervous first take stays private. You can use my approved line or the signs.
Jordan [worried]: I said some bossy things while filming. Ask before using those too.
Yeyul [skeptical]: Our welcome video now needs a welcome-video consent meeting.
I: A polished edit needs Film at 9 or more; otherwise it will be very short. A behind-the-scenes edit needs Inclusion at 8 and Friendship at 8 for everyone to agree. The group cut is available either way.
choice submit
option polished "Use our cleanest approved footage. Accept a shorter film if needed." -> polished_check ; Film += 2, Inclusion -= 1
option group "Submit the uneven group cut. Keep everyone's approved contribution." -> group_end ; Inclusion += 2, Friendship += 1, Film -= 1
option behind "Ask everyone about a behind-the-scenes cut. Use the group cut if anyone says no." -> behind_check
label polished_check
if Film >= 11 -> polished_full else polished_short
label polished_full
I: We finish a clear thirty-second film. Mostly, it shows me presenting. The others appear through their approved lines, signs or camera work.
Jordan [neutral]: It looks good. It doesn't show much of how we made it.
Mei [relieved]: Sometimes I want my work seen without my nerves being seen.
goto aftermath
label polished_short
I: We only have enough clean material for twelve seconds. The film is clear, but the cupboard mystery is mostly just a cupboard.
Yeyul [skeptical]: Our principal has become a trailer for a door.
goto aftermath
label group_end
I: The group cut has a long pause, a shaky turn and everyone's approved contribution. Camera work earns a credit even where the cameraman isn't on screen.
Mei [skeptical]: The pause is artistic.
Jordan [skeptical]: The camera shake is my thumb returning to its roots.
I: We submit a film we can explain. It isn't the polished one we first imagined.
goto aftermath
label behind_check
if Inclusion >= 8 -> behind_friendship else behind_no
label behind_friendship
if Friendship >= 8 -> behind_yes else behind_no
label behind_yes
Mei [determined]: Only the clips we each approve. No nervous practice take.
Jordan [happy]: You can include me ordering everyone around if you include me apologising too.
Yeyul [proud]: Keep my bow to the mop. My finest work.
I: We agree on a short behind-the-scenes cut. Its joke is the difficult process of making a welcome film. Nobody's accent is the punchline.
goto aftermath
label behind_no
Mei [worried]: Not today. I don't want our awkward moments shown.
Jordan [neutral]: The group cut, then. We said people could say no.
I: We submit the uneven group cut using approved clips. Asking permission did not guarantee the answer I wanted.
goto aftermath
label aftermath
camera wide
I: The file uploads. Outside, the bell rings. Our thirty-second welcome has consumed an entire lunch.
if Friendship >= 9 -> friends_warm else friends_cool
label friends_warm
Yeyul [happy]: We argued, but you listened. Next time, we plan before the noodles become furniture.
Mei [relieved]: And I can choose how I take part. I might try a longer line next time. Might.
goto jordan_check
label friends_cool
Yeyul [disappointed]: I know the film mattered. A few times it felt like you and Jordan were deciding what was wrong with us.
Mei [worried]: I need help with English. I don't need a surprise performance test.
I: We finish the film, but our friendship still needs a conversation. Finishing doesn't erase that.
goto jordan_check
label jordan_check
if Inclusion >= 8 -> jordan_warm else jordan_cool
label jordan_warm
Jordan [curious]: Are you eating here tomorrow? I have another idea. You can tell me if it's bad.
Yeyul [skeptical]: We can tell you now. Save time.
Jordan [laughing]: Great. Efficient friendship.
goto reflection
label jordan_cool
Jordan [neutral]: Send me the file. I'll send the camera credit home.
I: He leaves to find his lunch. Having a useful job didn't always mean having a place in the group.
goto reflection
label reflection
camera wide
I: My noodles now lift out of the bowl as one solid block. We have created a second school building.
Mei [skeptical]: Put a sign on it. PRINCIPAL.
I: The story ends. There is no perfect-person score. My seven decisions appear below; I can use them as evidence in my writing.
I: WRITE ON PAPER — 4–6 sentences. Choose one decision where helping one person cost someone else something. What did I choose? Who gained, and who carried the cost? What would I say to that person afterward?
I: STARTERS: I chose to ___. This helped ___ because ___. It cost ___ some ___. They might say ___. I would reply, "___." Next time, we could ___.
I: STRETCH — 100–150 words. Give the strongest reason for a different choice. Propose a practical agreement for the next group task that supports nervous English speakers and keeps everyone informed.
I: FINAL LINE: Write one English phrase you could use in a real class: "Could you explain the plan?" / "Give me a moment to write it." / "Can I practise that first?" Or write your own.
I: Keep this writing for your teacher. It is separate from the four-question comprehension check. That check tests the story, not whether you chose my favourite ending.
end
