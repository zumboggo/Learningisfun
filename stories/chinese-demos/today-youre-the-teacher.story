story 2
label opening
scene classroom
show Alex worried left
show Kevin neutral right
look Alex Kevin
look Kevin Alex
camera two Alex Kevin cut
I: 还有十分钟。
I: 我是老师。今天，我要用中文说话。
I: 学生的爸爸妈妈快来了。
Alex: 欢迎……欢迎你们吃我！
Kevin: 老师，是“来看我们”。不是“吃我”。
react Kevin laugh
I: 他笑了。我也笑了，可是我的手还在抖。
Alex: 你怎么还没回家？
Kevin: 我妈妈要来。我想让她看我的画。
I: 他把一张画放在桌上。画上有一只很小的鸟。
Kevin: 我帮你练习，好吗？
choice help
option repeat "请再说一遍。" -> repeat
option honest "我有点怕。" -> honest
label repeat
Kevin: 欢迎你们来看我们。慢慢说。
Alex: 欢迎你们……来看我们。
Kevin: 对！这次不用吃老师了。
goto practice
label honest
express Kevin surprised
Kevin: 你也会怕？你每天都说很多话。
Alex: 用英语说。中文不一样。
Kevin: 那今天，我是老师。
label practice
camera two Alex Kevin cut
Kevin: 你想说什么？先告诉我。
Alex: 你们的孩子很好。我很高兴教他们。
Kevin: 那就说这个。
I: 他指着我的纸。纸上都是很长的句子。
choice paper
option simple "我们写短一点。" -> simple
option keep "我想说得好一点。" -> keep
label simple
Kevin: 好。第一句，你会了。
I: 我们写了三句。纸上突然有了很多空白。
goto bird
label keep
Kevin: 长，不一定好。你说的，我想听懂。
I: 我看看纸，又看看他。我们只留下三句。
label bird
Alex: 你的画真好。你能给大家讲讲吗？
express Kevin worried
look Kevin away
Kevin: 不。我说不好英语。
Alex: 可是你知道怎么说。
Kevin: 我知道。但是大家一看我，我就忘了。
camera listener Alex cut
I: 我低头看看自己的手。它们还在抖。
choice listen
option admit "我也有点怕。" -> admit
option ask "你想让我怎么帮你？" -> ask
label admit
Alex: 我也有点怕。
camera listener Kevin cut
Kevin: 那……你也不想听“很简单”吧？
Alex: 对。我想听“我等你”。
goto together
label ask
Kevin: 别马上叫别人。等我一下。
camera listener Alex cut
I: 昨天，我只等了两秒。
Alex: 好。以后，我多等一会儿。
label together
camera two Alex Kevin cut
look Kevin Alex
Kevin: 这只鸟想飞。可是它还没飞过。
Alex: 像我们。
Kevin: 老师，你没有翅膀。
react Alex laugh
I: 这一次，我笑得停不下来。
I: 门外有说话的声音。时间到了。
express Alex worried
Alex: 我又忘了第一句。
choice entrance
option note "我拿着纸进去。" -> note
option partner "你能站在我旁边吗？" -> partner
label note
Kevin: 拿着吧。看纸也可以。
I: 他把纸递给我，没有把它藏起来。
goto welcome
label partner
Kevin: 可以。但是你要自己说。
Alex: 好。你不用替我说。
label welcome
scene classroom
show Alex worried left
show Kevin neutral right
camera two Alex Kevin cut
I: 大家都看着我。我把脚放稳。
Alex: 欢迎你们来看我们。
I: 第二句不见了。屋里很安静。
Alex: 请等一下。我还在学中文。
camera listener Kevin cut
Kevin: 我等你。
I: 他没有马上替我说。
camera two Alex Kevin cut
Alex: 你们的孩子很好。我很高兴教他们。
express Alex happy
I: 有人笑着点头。我终于能呼吸了。
I: 后来，他妈妈来了。他拿起那张画。
Kevin: 老师，我想用英语讲一句。你别走。
choice ending
option stay "我在这里。我等你。" -> stay
option quiet "我点点头，留在他旁边。" -> quiet
label stay
Alex: 我在这里。我等你。
Kevin: 那你要等久一点。
goto finish
label quiet
I: 我点点头，没有看钟。
Kevin: 你真的不走？
Alex: 不走。
label finish
camera listener Alex cut
I: 他开始说了。声音很小，但我听见了。
I: 他说的是那只还没飞过的鸟。
camera two Alex Kevin cut
Kevin: 明天，我能再试一次吗？
Alex: 能。明天，我们都再试一次。
end
