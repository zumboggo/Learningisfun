story 2
variable AskedHelp = false hidden
variable LetFinish = false hidden
label opening
scene classroom
show Kevin happy left
show Hepting curious right
camera two Kevin Hepting cut
Kevin [happy]: I'm funny in Chinese. In English, I'm mostly accurate.
I: This is not the same thing. Nobody has ever laughed so hard at my correct use of the present perfect that milk came out of their nose.
Hepting [curious]: What are you writing?
Kevin [worried]: A question. How do I sound like myself when I don't have all my words?
I: He reads it twice. Then he slides the classroom book toward me instead of answering.
Kevin [curious]: Somewhere with lunch, please. I think better with lunch.
label taxi_arrival
I: I write the question. The wall opens, and our driver steps out of the magical taxi, sunglasses on. He waits while I check that I have my notebook.
label taxi_departure
I: We fly above the soccer field. I prepare three impressive English sentences. By the time we land, I have forgotten two and stopped liking the third.
label lunch
scene classroom
show Kevin happy left
show Mei happy right
camera two Kevin Mei cut
I: The book has brought us to a school lunch gathering. Mei waves me over. Beside her stands a new student holding a lunch tray and looking for somewhere to put it.
show Nia worried center
camera wide
I: I move my bag before she has to ask. One strap catches on my chair; I nearly pull the whole thing over. Excellent. My first international performance.
Nia [happy]: Thank you. I'm Nia.
Kevin [happy]: Kevin. The chair usually behaves better.
I: She smiles. A small one, but it counts.
move Nia exit
camera two Kevin Mei cut
Mei [excited]: Tell her about the automatic door. The one at the sports center.
Kevin [embarrassed]: That story has been exaggerated.
Mei [happy]: Only by you.
I: Last Saturday I stood in front of a door, waving both arms at its sensor. A little boy watched for a while. Then he walked past me and pulled it open.
I: In Chinese, I can make that boy sound like a retired engineer inspecting a serious machine problem. In English, I have just forgotten the word for sensor.
Kevin [worried]: So I was waving at the... the thing that knows you're there.
Mei [curious]: The camera?
Kevin [worried]: Not exactly.
I: I hear my own pause getting longer. I switch to Chinese. The boy's tiny sigh comes back to me, and Mei starts laughing before I reach the end.
move Mei exit
show Nia happy right
camera two Kevin Nia cut
I: Nia laughs too. Half a second late.
camera listener Nia cut
I: I know that laugh. I use it when the teacher asks whether everyone understood.
label joke_opening_v1
I: I turn back to Nia. Can I try that again?
label first_choice
camera two Kevin Nia cut
choice finish_joke
option simple "Try again with the words I have." -> simple
option help "Ask Mei for the missing word, then finish myself." -> help ; AskedHelp = true
option leave "Admit I got stuck, and ask about Nia instead." -> leave
label simple
Kevin [worried]: I thought the door could see me. It could not. It was a door you pull.
Nia [happy]: How long were you waving?
Kevin [embarrassed]: Long enough to become part of that little boy's afternoon.
I: She laughs at the boy this time. Or at me. Either is better than laughing because everyone else did.
goto correction
label help
Kevin [curious]: Mei, what's the little thing that opens an automatic door?
Mei [happy]: A sensor?
Kevin [happy]: Yes. I was giving a very energetic performance for a sensor that didn't exist.
Nia [happy]: Did anybody clap?
Kevin [embarrassed]: A boy opened the door. I think that was his review.
I: Borrowing one word has not made it Mei's story. This is useful information.
goto correction
label leave
Kevin [embarrassed]: Sorry. I lost the English version halfway through. Has anything confusing happened to you here yet?
Nia [happy]: I asked where the library was. Someone gave me directions to the laboratory.
Kevin [surprised]: Did you find a book?
Nia [happy]: Three sinks. No books.
I: I'm laughing now. I still want to tell her my story properly, but I don't have to provide every funny thing at the table.
goto correction
label correction
show Mei curious center
camera wide
Kevin [happy]: Yesterday I goed back to the same door—
Mei [curious]: Went.
Kevin [confused]: What?
Mei [neutral]: You went. Not goed. Sorry. Carry on.
I: She means to help. I know she means to help. The rest of my sentence has nevertheless left the building.
camera listener Kevin cut
I: Nia waits. Mei waits. I suddenly want lunch to require more chewing.
choice corrected
option pause "Could you let me finish, then help me with the words?" -> pause ; LetFinish = true
option joke "My grammar is still outside, waving at the door." -> joke
option admit "I know you mean to help. I just forgot what I was saying." -> admit
label pause
Mei [worried]: Oh. Yes. I thought you'd want to know straight away.
Kevin [happy]: I do want to know. Just after the embarrassing part of the story.
Nia [happy]: Which part are we in now?
Kevin [happy]: There are several.
goto effort
label joke
Nia [laughing]: Let it in!
Mei [happy]: All right. I'll save the corrections until the end.
Kevin [happy]: Thank you. There may be a list.
I: I find my place again. A joke helped this time; I don't want to have to make one every time I'm uncomfortable.
goto effort
label admit
Mei [worried]: Sorry. I wasn't trying to make you feel bad.
Kevin [neutral]: I know. Give me a second.
I: Nobody fills the second. The next sentence comes back.
Kevin [happy]: Yesterday I went back. I used the handle. Personal growth.
goto effort
label effort
move Nia exit
show Mei worried right
camera two Kevin Mei cut
I: When Nia steps away to return her tray, Mei lowers her voice.
Mei [worried]: I get it. But sometimes I want lunch to be easy. All morning I have to think about how to say everything.
Kevin [worried]: Me too.
Mei [worried]: In Chinese, I can just talk. I don't want that to become something bad.
I: Neither do I. The voice I have with my family isn't a problem to solve.
choice shared_effort
option ask "Let's ask Nia what helps, instead of deciding for her." -> ask
option share "Maybe we can help each other when a word goes missing." -> share
option translate "What if we translate whenever someone misses something?" -> translate
label ask
Mei [curious]: Without making her feel like a project?
Kevin [worried]: I could ask what she does when she gets stuck. I have recent experience.
Mei [happy]: Several minutes of it.
I: She moves my notebook so Nia will have room when she comes back.
goto nia_story
label share
Mei [worried]: You won't correct every sentence?
Kevin [happy]: I don't have that kind of power.
Mei [happy]: Then if I ask for a word, help. If you understand me, let me keep going.
I: It sounds possible. Not effortless. Possible.
goto nia_story
label translate
Mei [curious]: I can help, but sometimes I miss the joke while I'm explaining the previous joke.
Kevin [worried]: Right. You'd be working while we had lunch.
Mei [neutral]: Translate a word, sure. A whole conversation every day is a lot.
I: I hadn't thought about whose job my easy solution would become.
goto nia_story
label nia_story
show Nia happy right
move Mei exit
camera two Kevin Nia cut
Nia [curious]: What did I miss?
Kevin [worried]: We were talking about getting stuck. Does it happen to you in English?
Nia [happy]: This morning. Yesterday. Would you like the complete schedule?
I: I had quietly decided that she was the confident one. She hadn't been at our table long enough to correct me.
Nia [happy]: At my old school, we had to introduce ourselves with one unusual fact. I wanted to say my grandmother kept—
I: She makes a small movement with both hands. Wings, maybe. Then she shakes her head.
Nia [worried]: Wait. I know this.
I: I have guesses. Several excellent guesses. My mouth prepares to offer all of them.
choice listen
option wait "Give her a moment without finishing the sentence." -> wait
option offer "Would you like a word, or a little time?" -> offer
option guess "Try a guess: chickens?" -> guess
label wait
I: I take a sip of water. Nia tries a different route.
Nia [happy]: Bees! She kept bees. I told the class my grandmother kept bears.
Kevin [surprised]: That's quite an unusual fact.
I: Nia makes the same tiny face I made when I lost sensor. I recognize it faster this time.
goto invitation
label offer
Nia [happy]: Time. I can see the word somewhere.
I: I wait. She looks toward the window, then back at me.
Nia [happy]: Bees! I meant bees. I told everybody my grandmother kept bears.
Kevin [happy]: Your grandmother must have seemed very brave.
goto invitation
label guess
Kevin [curious]: Chickens?
Nia [happy]: Smaller.
Kevin [curious]: Very small chickens?
Nia [laughing]: Give me a second! Bees. I meant bees, but I told the class my grandmother kept bears.
I: I laugh, then stop guessing long enough to hear the rest.
goto invitation
label invitation
show Mei happy center
camera wide
Nia [happy]: A boy asked if he could visit. I said yes before I realized why.
Mei [laughing]: Did he come?
Nia [happy]: With his father. Who had questions.
I: We laugh together. Nobody has to watch the others to work out when to start.
camera two Kevin Nia cut
if AskedHelp == true -> help_callback else no_help_callback
label no_help_callback
Kevin [happy]: I still owe you the complete door story.
goto callback_join
label help_callback
Kevin [happy]: I needed Mei's sensor to finish my story. You needed a second to find bees.
Nia [happy]: Mine were harder to keep in one place.
label callback_join
if LetFinish == true -> finish_callback else next_offer
label finish_callback
Mei [happy]: And I remembered not to correct the bear story halfway through.
Nia [happy]: Thank you. The bears were the important part.
label next_offer
Nia [happy]: There's an English Corner welcome activity next week. They're looking for two people to open it.
Kevin [worried]: Open it how?
Nia [happy]: With a funny story. You and me?
I: An audience larger than a lunch table. My stomach notices before the rest of me does.
choice next_step
option together "Yes, if we practice together first." -> together
option small "Could we start with a small group?" -> small
option honest "I want to. I'm also scared I'll get stuck again." -> honest
label together
Nia [happy]: Tomorrow at lunch?
Kevin [happy]: We should probably find out how the microphone works.
Mei [happy]: Check whether it has a handle.
goto home
label small
Nia [curious]: We could try it with a few people first, then decide about the whole room.
Kevin [happy]: That sounds like a size of courage I currently own.
Mei [happy]: I'll be your first audience. I can laugh quietly if necessary.
goto home
label honest
Nia [happy]: You probably will. So will I.
I: This is a terrible motivational speech. It also makes me feel better.
Kevin [happy]: All right. But if I forget sensor again, somebody has to rescue me.
Mei [happy]: We know the procedure now.
goto home
label home
scene classroom
show Kevin happy left
show Hepting curious right
camera two Kevin Hepting cut
I: Mr. Hepting finds me writing in the book. Under my original question, I've added a lunch time and two names.
Hepting [curious]: An answer?
Kevin [happy]: A practice session.
label taxi_return
I: The taxi carries us home. For once, I spend the ride thinking about what someone else said, instead of rehearsing what I should have said.
label ending
scene classroom
show Kevin happy left
show Hepting happy right
camera two Kevin Hepting cut
I: Back in class, I try the first line aloud. I'm funny in Chinese. In English, I'm getting help.
Kevin [happy]: And next week, apparently, I'm getting a microphone.
end
