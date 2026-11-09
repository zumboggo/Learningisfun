story 2
label opening
scene corridor
show Ning worried left
camera medium Ning cut
I: 新家的第一个晚上，我只有一个碗。
I: 门外有声音。我没有开门。
I: 今天，我把邻居的名字叫错了三次。
I: 手机亮了。一条语音消息。
I: 我按下播放。
Ning: 明天，别走那条路。
I: 是我的声音。可是我没有说过这句话。
choice message
option again "我再听一次。" -> again
option reply "你是谁？" -> reply
label again
I: 连最后那口气，都和我一样。
Ning: 明天，别走那条路。
goto knock
label reply
Ning: 你是谁？
I: 没有回答。我的话旁边，只有一个小小的点。
label knock
I: 门又响了。这次，我开了一点。
show Chen neutral right
camera two Ning Chen cut
look Ning Chen
look Chen Ning
Chen: 我姓陈。不是程，也不是成。
Ning: 陈先生。对不起。
Chen: 这次对了。你吃饭了吗？
I: 他拿着一个蓝色的碗。
Ning: 我吃过了。谢谢。
I: 我的肚子叫了一声。
react Chen laugh
Chen: 你的肚子不同意。
choice bowl
option accept "那……给我一点吧。" -> accept
option explain "我有点不好意思。" -> explain
label accept
Chen: 好。碗不急着还。
I: 他把碗放在门边，慢慢走回去。
goto morning
label explain
express Chen happy
Chen: 我也怕你不喜欢。放这里，你饿了就吃。
I: 他没有等我回答。碗里还有热气。
label morning
scene corridor
show Ning neutral left
camera medium Ning cut
I: 第二天，我洗好碗，准备去上班。
I: 手机又亮了。
Ning: 走左边。带上那个碗。
I: 右边是大路。左边要经过陈先生的门。
choice road
option left "我走左边。" -> left
option test "我先看看右边。" -> test
label left
I: 我抱着碗，向左走。
I: 没有什么可怕的东西。只有很多箱子。
goto boxes
label test
I: 右边阳光很好。一个孩子跑过，笑得很大声。
I: 这里没有危险。那条消息到底想说什么？
I: 我想起那个碗，转身向左走。
label boxes
show Chen sad right
camera two Ning Chen cut
look Ning Chen
look Chen Ning
Ning: 你要搬家？
Chen: 明天走。女儿叫我去她那里。
Ning: 那很好啊。
Chen: 是啊。很好。
camera listener Ning cut
I: 他说“很好”的时候，没有看我。
choice truth
option memory "你在这里住了多久？" -> memory
option phone "我收到一条奇怪的消息。" -> phone
label memory
Chen: 三十年。以前，晚上总有人来敲门。
Chen: 现在，大家都很忙。
I: 我看看自己关着的门。
goto leaving
label phone
camera two Ning Chen cut
I: 我给他听手机里的声音。
Chen: 你的声音？
Ning: 可是我不记得说过。
Chen: 它叫你来还碗？这手机比你有礼貌。
react Ning laugh
I: 我笑了。他也笑了，但很快又低下头。
label leaving
camera two Ning Chen cut
Chen: 碗送给你。我用不了两个。
I: 箱子上，放着另一个蓝色的碗。
Ning: 你今晚吃什么？
Chen: 随便吃点。你上班去吧。
I: 我走到楼下。手机没有再响。
I: 我等了一会儿。没有新的消息。
I: 也许，它不是要我躲开什么。
I: 我把手机放进口袋。今晚，我自己选。
scene corridor
show Ning neutral left
show Chen neutral right
camera two Ning Chen cut
I: 晚上，我敲了陈先生的门。
Chen: 又叫错名字了？
choice dinner
option invite "陈先生，和我一起吃饭吧。" -> invite
option help "我不会做饭。你能教我吗？" -> help
label invite
Ning: 陈先生，和我一起吃饭吧。
Chen: 你请我？
Ning: 我有两个碗。一个在你这里。
goto dinner
label help
Ning: 我不会做饭。你能教我吗？
Chen: 你会洗碗吗？
Ning: 这个我会。
Chen: 那我们都不会饿了。
label dinner
express Chen happy
camera listener Chen cut
I: 这次，他笑的时候，眼睛也笑了。
scene kitchen
show Ning happy left
show Chen happy right
camera two Ning Chen cut
I: 两个蓝色的碗，放在一张小桌上。
Chen: 明天还是要走。
Ning: 我知道。到了以后，给我打电话吧。
Chen: 你可别不接。
Ning: 我会接。
I: 手机亮了。我把它翻过去。饭还热着。
I: 吃完饭，我才听那条消息。
express Ning surprised
camera listener Ning cut
Chen: 明天，别让她一个人等。
I: 是陈先生的声音。我慢慢抬起头。
Ning: 她是谁？
Chen: 什么？
I: 他的手机，就在桌上。关着。
end
