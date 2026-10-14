story 2
variable listened = false hidden
variable evidence = false hidden
variable care = 0 range 0 2 hidden
# Episode 3. Cervantes, Part I chapters 4–5. Seven local choices; fixed source outcomes.
label opening
scene journal
I: The airport book is waiting on my desk. I found it lurking between marmalade and a travel pillow; now it has the confidence of something that knows I cannot return it.
I: Last time, an innkeeper made Quixote a knight mostly to get him out of the inn. Today he wants to put the title to work.
I: The little door on the cover has a muddy footprint on it. From inside comes a horse's impatient snort. I check the receipt. Nothing about horses.
I: My English teacher always says that a good question takes you somewhere. I am beginning to think this was meant literally. One question, then.

I: I write: How do I know whether someone's help has actually helped?
I: The ink sinks into the door. It opens onto a pale road. I reach for the edge; the page reaches first.
effect magic
scene passage
I: My desk folds into a strip of paper. I tumble through turning pages and land sitting in warm dust. No injuries. An undignified beginning for a serious investigation.
label dawn
scene road
show Quixote proud left
prop Quixote lance
camera wide
I: Dawn in rural La Mancha, Spain. Quixote has just left the inn, newly knighted and enormously pleased. He remembers the innkeeper's advice: go home for money, clean shirts, and a squire.
Quixote [happy]: My helper returns! There is work for us now. The distressed shall find a defender!
I: I walk beside Rocinante. My job is still small: listen, carry messages, notice practical things. I can speak to Quixote. I cannot choose what he believes.
Quixote [curious]: A neighbour of mine might make a suitable squire. A working man with a family. I shall speak to him at home.
I: Rocinante needs no persuasion about the home part. Then a cry comes from the oak thicket to our right. Quixote turns at once.
Quixote [determined]: Someone needs protection. Already I may fulfil my calling!
label oak
scene road
show Quixote angry left
show Juan worried right
prop Quixote lance
camera wide
I: A farmer is beating a boy tied to an oak. The boy is about fifteen. I stop at the edge of the clearing. A mare is tied nearby; another lance leans against a tree.
act Quixote lance-threat Juan "Quixote levels his lance at the farmer and orders him to stop. No blow lands."
Quixote [angry]: Coward! Arm yourself against someone who can answer you. Untie him and pay what you owe!
Juan [scared, hesitant]: He watches my sheep. One goes missing every day! When I punish his carelessness, he says I only want to avoid his wages.
I: Under the lance, the farmer releases him. The boy steps away, shaking. This is Andrés. His master is Juan Haldudo, called the Rich, of Quintanar.
move Juan exit
show Andres worried right
Quixote [determined]: How much does he owe you?
Andres [worried, hesitant]: Nine months. Seven reals each month.
Quixote [determined]: Sixty-three reals. Pay them now.
choice wages
option listen "Ask Andrés what he needs us to understand." -> listen ; listened = true
option count "Check the wages aloud so nobody can blur the amount." -> count
label listen
I: I lower my voice. What should we understand before anyone leaves?
Andres [worried]: You are here now. That is why he is listening.
I: He looks past the lance toward his master's face. I was watching the rescuer. Andrés is watching the person who will still be here.
goto deductions
label count
I: Nine months times seven: sixty-three. I repeat it slowly. The number is at least one thing we can keep clear.
Andres [sad]: He knows the number. He has known it for months.
I: I had treated this as an argument that needed better arithmetic. Andrés has already tried being owed the money.
goto deductions
label deductions
move Andres exit
show Juan worried right
Juan [worried, explain]: There are deductions. Three pairs of shoes. A real for bloodletting when he was ill.
Quixote [angry]: Set those against the blows you have given him. You have damaged his body. He owes you nothing for that account.
Juan [pleading]: I have no money here. Let Andrés come home with me. I will pay him there.
move Juan exit
show Andres scared right
Andres [scared]: Alone with him? No! Once you have gone, he will hurt me again.
Quixote [determined]: I command him to obey. His word will bind him.
Andres [frustrated]: He is not a knight! He is Juan Haldudo. You are asking him to live by rules he never accepted.
I: Andrés does not need another stirring description of rescue. He needs someone to believe his description of danger.
choice promise
option question "Ask Quixote how the promise will be checked." -> checking
option repeat "Repeat Andrés's warning without softening it." -> warning
label checking
I: When we leave, how will you know he has paid?
Quixote [determined, insist]: He knows I shall return to punish any breach. My name will be his reminder.
I: Quixote means the threat to last. Andrés knows how quickly a road can swallow a rider.
goto oath
label warning
I: He says the danger begins when you leave. Not now. Afterwards.
Quixote [determined, reassure]: Then the man must understand who has commanded him. A knight's judgement is not a passing noise.
I: He answers the warning with more confidence. Andrés looks less reassured than before.
goto oath
label oath
move Andres exit
show Juan neutral right
Juan [neutral, explain]: I swear by every order of knighthood. Real by real—and perfumed, if you wish.
Quixote [proud]: Keep the perfume. Give him the money. Don Quixote of La Mancha, the undoer of wrongs, will hold you to it.
I: He spurs Rocinante and rides out of sight. I hurry after him. He thinks the promise is a completed rescue.
move Quixote exit
move Juan exit
I: The journal opens in my pocket. For a moment its page shows the clearing behind us: a scene Quixote cannot see. I can only read it as it happens.
label aftermath
scene road
show Juan angry left
camera wide
act Juan cross-arms "With Quixote gone, Juan folds his arms; his frightened politeness disappears."
rest Juan arms-crossed
Juan [angry]: Call your undoer of wrongs now.
I: He seizes Andrés and ties him again. The page goes dark while he beats him even more severely. When it clears, the boy has been released and is walking away in tears. No wages. He vows to find Quixote and tell him.
move Juan exit
I: I call after the rider. The journal's picture closes. Far along the road, Quixote is already praising his first great victory to Dulcinea. My voice does not reach him.
label crossroads
scene road
show Quixote proud left
prop Quixote lance
I: At a crossroads he pauses like the knights in his books, then lets Rocinante choose. The horse chooses the way to his stable. I catch up while his master congratulates himself.
Quixote [happy]: A noble beginning! The oppressor has learned to fear justice.
I: I say that a promise can fail when nobody stays to see it kept. He is already looking down the road for the next adventure. I cannot turn what I saw into something he is ready to hear.
show Merchant curious right
I: Six Toledo merchants approach on their way to buy silk in Murcia, with mounted servants and muleteers on foot. Sunshades bob over the road. Quixote sees an encounter with knights.
Quixote [determined, insist]: Halt! Confess that no maiden in the world is fairer than Dulcinea del Toboso!
Merchant [curious, question]: We do not know the lady. Show her to us, and we can agree if what you say is true.
choice beauty
option evidence "Ask why looking at her would be a problem." -> looking ; evidence = true
option courtesy "Ask the merchant to answer gently." -> gentle
label looking
I: If she is so beautiful, why not let them see?
Quixote [determined]: Because then belief would cost them nothing. They must affirm it without seeing her. That is the point.
Merchant [skeptical]: An unusual purchase. Certainty first; inspection never.
I: The merchant asks for evidence. Quixote hears a test of loyalty. They are using the same conversation for different purposes.
goto portrait
label gentle
I: He takes this seriously. Could you leave the jokes aside?
Merchant [happy]: I am trying to satisfy him. Our consciences would prefer a glimpse before an oath.
Quixote [angry]: You will believe, confess, swear, and defend it—or meet me in battle.
I: Courtesy does not solve the demand. He wants strangers to certify what they cannot know.
goto portrait
label portrait
Merchant [skeptical, question]: A portrait, then? No bigger than a grain of wheat. Even if it showed one eye missing and the other leaking sulphur, we could praise her to please you.
I: His joke makes the request more insulting, not more reasonable. Quixote burns with anger.
Quixote [angry, rage]: Nothing of the kind! You will pay for insulting her beauty!
I: He lowers his lance and charges. The merchant has not attacked him.
act Quixote stumble "Rocinante stumbles during the charge. Quixote falls before the lance reaches the merchant."
prop Quixote none
rest Quixote crouched
I: Horse and rider go down. Quixote rolls into the dust; his old armour, shield, spurs and lance encumber him. He cannot get up. The merchant is unhurt.
Quixote [angry]: Do not run, cowards! It is my horse's fault, not mine!
move Merchant exit
show Muleteer angry right
act Muleteer cross-arms "One of the muleteers stops at the fallen man's insults and folds his arms in anger."
rest Muleteer arms-crossed
I: Then he snatches Quixote's lance, breaks it, and beats him with a piece. I retreat beyond his reach. The merchants call for him to stop; he keeps striking. I turn away from the blows.
move Quixote exit
move Muleteer exit
I: At last he tires of it. The party goes on. Broken wood remains in the dust. The lance that made a farmer obey has become the weapon used against its owner.
label roadside
scene road
camera wide
I: I crouch nearby and speak to Quixote without trying to haul him upright in his armour. His answer is a ballad. He is now Baldwin, a wounded hero calling for the Marquis of Mantua.
show Pedro worried right
I: A man returning from the mill with wheat stops. He removes the battered visor and wipes the dusty face. Recognition changes his voice.
act Pedro kneel "Pedro kneels beside his injured neighbour, looking for wounds."
rest Pedro kneeling
Pedro [worried]: Señor Quixada? Who has brought you to this?
I: Quixote continues the ballad. Pedro removes the armour as carefully as he can. He finds no open wound, but the bruised man cannot move himself.
choice neighbour
option name "Help Pedro speak to him by his ordinary name." -> name ; care += 1
option story "Explain which hero Quixote thinks he is." -> hero
label name
I: This is Pedro, your neighbour. He knows you. He is helping you home.
Pedro [sad, reassure]: Yes. No title necessary. Just let me help.
I: Quixote answers from the ballad again. Pedro does not wait for the right answer before doing the useful thing.
goto lift
label hero
I: He thinks you are the Marquis of Mantua. The wounded knight in the ballad is Baldwin.
Pedro [confused, question]: Then the Marquis will have to manage with my donkey.
I: The reply is weary rather than cruel. Pedro can dislike the story and still care about the man inside it.
goto lift
label lift
rest Pedro relaxed
Pedro [determined, explain]: We must get him onto the donkey. Rocinante can carry the armour.
choice load
option straps "Hold loose straps out of Pedro's way." -> straps ; care += 1
option fragments "Gather the lance fragments for the load." -> fragments
label straps
I: I keep the straps from tangling while Pedro does the difficult lifting. This is heavy, awkward work. Nothing about it looks like a ceremony.
Pedro [relieved]: There. Hold that clear. Good.
goto homeward
label fragments
I: I collect the scattered pieces. The point, the shaft, another splinter: things that were one confident line this morning.
Pedro [neutral]: Those too. We should not leave them in the road.
goto homeward
label homeward
I: With difficulty, Pedro settles Quixote on his donkey and ties the armour and lance fragments onto Rocinante. He leads both animals toward the village.
I: Quixote changes stories. Now he speaks as Abindarráez, a captive carried away by Rodrigo de Narváez. I recognise the pattern before I know all the names: someone else's scene becomes his explanation.
Pedro [frustrated]: I am neither the Marquis nor Rodrigo. I am Pedro Alonso, your neighbour. And you are Señor Quixada.
I: Quixote answers with the words I will remember most clearly.
I: “I know who I am,” he says. He believes he could be not only these heroes but all the Twelve Peers of France and the Nine Worthies together.
choice identity
option listen "Ask Pedro why he keeps helping through all this." -> why
option encourage "Tell Pedro that being a neighbour seems enough." -> enough
label why
I: Does it bother you that he cannot see who is helping him?
Pedro [sad]: I would rather he knew me. But knowing me is not a condition for getting him home.
I: He adjusts the leading rope and keeps walking. His answer needs no audience.
goto dusk
label enough
I: You do not have to be a legendary rescuer. You stopped.
Pedro [neutral, reassure]: Well, he cannot walk home by himself, can he?
I: A very small sentence. It does more work than any magnificent oath I have heard today.
goto dusk
label dusk
scene home
show Pedro worried left
show Niece worried right
camera wide
I: We reach the village at dusk. Pedro waits until it is darker so fewer people will see his neighbour in this condition. He protects what little dignity the journey has left him.
beat quiet-aftermath Pedro Niece "At the door, Pedro meets a household worn down by worry."
I: Quixote's house is in uproar: his niece, housekeeper, the priest Pero Pérez, and the barber Nicolás have been worrying over three days of absence.
Niece [worried]: He reads for nights together. Then he attacks the walls with his sword and says he has killed giants. I should have told someone sooner.
I: The housekeeper blames the books. The priest vows that tomorrow they will be judged. Pedro calls at the door using Quixote's heroic names; everyone rushes to receive him.
I: Quixote asks to be carried to bed and treated by the wise enchantress Urganda. They offer the help they actually have. He says he fought ten enormous giants and fell through Rocinante's fault.
choice door
option fact "Quietly tell Pedro what I saw on the road." -> facts
option comfort "Give the niece room to stop blaming herself." -> niece
label facts
I: There were merchants, not giants. The horse fell before the charge reached them. Then a muleteer beat him with the broken lance.
Pedro [sad]: I will tell the priest how I found him too. Let us at least keep the account straight.
I: Two accounts will now exist in this house: the adventure he tells and the injuries they must care for.
goto bedtime
label niece
I: You did not choose the beating. You can tell them what you noticed without taking responsibility for everything that followed.
Niece [sad]: I wish I had spoken sooner. I wish he would listen now.
I: She turns toward his room. Worry does not disappear just because he has come home.
goto bedtime
label bedtime
I: He asks for food and sleep. They give him both. Pedro tells the priest how he found him and what he said on the journey. Tomorrow's plans for the books can wait beyond this chapter.
I: In my pocket the journal's door opens. I leave the family together and step back into the reading corner, carrying no souvenir except a little road dust.
label return
scene reflection
show Teacher curious center
camera medium Teacher
Teacher [curious]: What did you bring back from your question?
I: A promise that failed Andrés. A demand for belief without seeing. And a neighbour who helped without being recognised as a hero.
if listened == true -> listened-back else counted-back
label listened-back
I: Andrés told me the important part at once: the danger was what happened after we left. Listening gave me the warning. It did not make Quixote accept it.
goto evidence-back
label counted-back
I: Sixty-three reals was correct. But getting the number right was not the same as getting the boy paid or safe.
goto evidence-back
label evidence-back
if evidence == true -> looking-back else courtesy-back
label looking-back
I: When I asked why the merchants could not look, Quixote made the problem plain: he wanted belief precisely because evidence was absent.
goto care-back
label courtesy-back
I: I wanted the merchant to be gentler. That might have made a better conversation, but it could not make Quixote's demand reasonable.
goto care-back
label care-back
if care >= 1 -> practical-back else fragments-back
label practical-back
I: Helping Pedro was smaller work than stopping an oppressor. It was also work I could see had helped someone.
goto final
label fragments-back
I: I explained the borrowed hero and gathered the broken lance. Pedro supplied the thing no borrowed story supplied: a way home.
goto final
label final
Teacher [neutral, explain]: His borrowed roles are intertextuality at work. Close reading asks what each borrowed story explains—and which facts resist it.
I: My first answer needs revision. Good intentions matter. So do the people left behind when the person with good intentions rides away.
I: The journal closes. The reading corner is quiet. Somewhere in the pages, Andrés is still owed sixty-three reals.
end
