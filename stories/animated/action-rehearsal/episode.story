story 2
label opening
scene courtyard
show Quixote determined left
show Carrier neutral right
camera wide
I: Night at a roadside inn in La Mancha. I watch from the doorway as Don Quixote guards his armour on a watering trough. He believes this is a knight's vigil in a castle.
Carrier [confused, question]: I only want to water the animals. Why is the trough wearing a helmet?
choice aside
option practical "Whisper: Perhaps the armour could guard a different corner?" -> practical
option theatrical "Whisper: Your castle appears to have a plumbing problem." -> theatrical
label practical
Quixote [determined, insist]: Honour does not move aside for a thirsty mule.
goto encounter
label theatrical
Quixote [skeptical, question]: A castle has many trials. Apparently yours is vocabulary.
goto encounter
label encounter
scene courtyard
show Quixote determined left
show Carrier confused right
camera wide
I: The carrier ignores the warning and moves the armour. To him, it is an obstruction. To Quixote, it is an outrage.
act Quixote attack Carrier "Quixote strikes the carrier with his lance. The man is badly hurt; Quixote returns to guarding the armour."
move Carrier exit
I: Another carrier later approaches the trough and is also struck. Their companions throw stones; Quixote shields himself while the innkeeper intervenes.
act Quixote cower "Quixote shelters behind his shield as stones fly from the carriers' companions."
I: The innkeeper hurries through a makeshift knighting ceremony to end the danger. Quixote takes the ceremony seriously and rides away grateful.
act Quixote bow "Quixote gives a ceremonious bow before leaving the inn."
I: From the doorway, I have seen one event interpreted as two different stories: an ordinary task at an inn, and an imagined test of chivalry.
end
