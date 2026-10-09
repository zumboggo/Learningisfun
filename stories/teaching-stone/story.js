/* Compiled into SugarCube, never receives authentication credentials. */
Config.history.maxStates = 1;
Config.history.controls = false;
Config.saves.isAllowed = () => false;
Config.ui.stowBarInitially = true;
Config.passages.nobr = true;
setup.choices = [];
setup.channel = null;
setup.ready = false;
setup.booted = false;
// Account-owned progress is restored only by the parent, never SugarCube’s tab session.
Config.navigation.override = function(destination) { return setup.ready ? destination : 'Start'; };
setup.send = function(type, extra = {}) {
 if (window.parent !== window && setup.channel) window.parent.postMessage({protocol:'teaching-stone-v1',channel:setup.channel,type,...extra},location.origin);
};
setup.refresh = function() {
 const step=setup.choices.length;
 Engine.play(step === 10 ? 'Assessment' : step > 0 ? 'Consequence'+step : 'Decision1');
};
window.addEventListener('message',function(event){
 const m=event.data;
 if(event.origin!==location.origin||event.source!==window.parent||!m||m.protocol!=='teaching-stone-v1'||m.type!=='init'||typeof m.channel!=='string')return;
 if(setup.ready){if(setup.booted&&State.passage==='Start')setup.refresh();return;}
 try {setup.rules.replay(m.choices); } catch {return;}
 setup.channel=m.channel;setup.choices=m.choices.slice();setup.ready=true;if(setup.booted)setup.refresh();
});
Macro.add('stoneChoice',{handler:function(){
 const [id,label]=this.args,step=setup.choices.length;
 const button=document.createElement('button');button.textContent=label;button.className='stone-choice';
 if(!setup.rules.available(setup.choices,id)){button.disabled=true;button.textContent+=' — not enough grain';}
 button.addEventListener('click',()=>{if(button.disabled||setup.choices.length!==step)return;button.disabled=true;setup.choices.push(id);setup.send('save',{choices:setup.choices.slice()});Engine.play('Consequence'+(step+1));});
 this.output.append(button);
}});
Macro.add('stoneConsequence',{handler:function(){
 const i=Number(this.args[0]),choice=setup.choices[i];
 const p=document.createElement('p');p.textContent=setup.responses[i][choice]||'';this.output.append(p);
 const s=setup.rules.replay(setup.choices),notes=[];
 if(i===6)notes.push(s.grain<12?'Your food store is also low. Preserving seed has not removed the need for emergency food.':'Your earlier rationing and contributions leave food grain alongside the seed decision.');
 if(i===8&&setup.choices[3]==='bargain')notes.push(choice==='monument'?'The inscription centers you. Intef notices how little it says about your agreement.':'Intef’s contribution is recorded as promised. The acknowledgment does not give him control over households.');
 if(i===9)notes.push(s.resilience>=65?'In the weeks that follow, repairs and reserves give the village room to recover. No one can promise the next flood, but you have changed what people can do when it comes.':'In the weeks that follow, the village still faces risks your decisions did not resolve. People have to live with both the help you offered and the work you left undone.');
 for(const note of notes){const el=document.createElement('p');el.textContent=note;this.output.append(el);}
}});
Macro.add('stoneStats',{handler:function(){
 const s=setup.rules.replay(setup.choices),el=document.createElement('div');el.className='stone-stats';
 for(const [label,value] of [['Resources',s.grain+' food · '+s.seed+' seed'],['Relationships',s.trust+'/100 trust'],['Wellbeing',Math.round((s.households+s.workers+s.self)/3)+'/100'],['Legacy',s.legacy+'/100']]){const cell=document.createElement('div'),name=document.createElement('span'),number=document.createElement('strong');name.textContent=label;number.textContent=value;cell.append(name,number);el.append(cell);}
 this.output.append(el);
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Whose wellbeing?';details.append(summary);const p=document.createElement('p');p.textContent=`Households ${s.households} · Workers ${s.workers} · You ${s.self} · Influential residents’ support ${s.influential}. The account records food, health, trust and influence.`;details.append(p);this.output.append(details);
}});
Macro.add('stoneStage',{handler:function(){
 const scene=setup.scenes[Number(this.args[0])],reaction=this.args[1]?scene.reactions[setup.choices[Number(this.args[0])]]:null;
 const stage=document.createElement('div');stage.className='stage';stage.setAttribute('aria-label','The granary courtyard');
 scene.cast.forEach((id,i)=>{const mood=reaction?.[i]||'neutral',figure=document.createElement('figure'),sprite=document.createElement('div'),caption=document.createElement('figcaption');
 figure.className='character '+(id===scene.speaker?'speaking':'');sprite.className='sprite';sprite.style.backgroundImage=`url("${id}-pixel.webp")`;sprite.style.backgroundPosition=({neutral:'0%',happy:'50%',sad:'100%'})[mood]+' 0';sprite.setAttribute('role','img');sprite.setAttribute('aria-label',setup.characters[id].split(' · ')[0]+': '+({neutral:'listening',happy:'relieved',sad:'troubled'})[mood]);
 caption.textContent=setup.characters[id].split(' · ')[0]+(reaction?' · '+({neutral:'thoughtful',happy:'relieved',sad:'troubled'})[mood]:'');figure.append(sprite,caption);stage.append(figure);});
 this.output.append(stage);
}});
Macro.add('stoneAssessment',{handler:function(){
 const a=setup.rules.assess(setup.choices);
 const heading=document.createElement('h2');heading.textContent=a.ending;this.output.append(heading);
 const intro=document.createElement('p');intro.textContent='The stone speaks: “I do not weigh your worth. I show you what your decisions asked of people—and what they made possible.”';this.output.append(intro);
 for(const note of a.notes){const p=document.createElement('p');p.textContent='“'+note.replace(/^Growth invitation: /,'Remember: ')+'”';this.output.append(p);}
 const growth={needs:'“Look for the person whose strength is running out. Can you ease their burden without wearing yourself away?”',resilience:'“Remember the seed store. What could you have done earlier so that bread today cost less of tomorrow?”',cooperation:'“Leave a promise that survives another hand holding the seal. Who will hear the person who says it has been broken?”',understanding:'“Before your next judgment, seek the witness you have not heard. Let your reasons withstand a question from the person who must bear the cost.”'};
 const lowest=Object.keys(a.scores).reduce((x,y)=>a.scores[x]<=a.scores[y]?x:y);const invitation=document.createElement('p');invitation.className='stone-note';invitation.textContent='The stone grows warmer. '+growth[lowest];this.output.append(invitation);
 const score=document.createElement('p');score.className='score';score.textContent=a.total+' / 100 · Long-term flourishing';this.output.append(score);
 const list=document.createElement('ul');for(const [key,label] of Object.entries({needs:'Basic needs & dignity',resilience:'Future resilience',cooperation:'Trustworthy cooperation',understanding:'Applied understanding'})){const li=document.createElement('li');li.textContent=label+': '+a.scores[key]+' / 25';list.append(li);}this.output.append(list);
 const d=document.createElement('details');d.innerHTML='<summary>How the assessment works</summary><p>Needs: the least-supported of households, workers and you (15 points), plus dignity (10). Resilience: preparation (15), preserved seed (5), and a food reserve (5). Cooperation: trust (15) and lasting arrangements (10). Understanding: evidence gathering, fair inquiry, applying the four lenses alongside ma’at, and planning beyond yourself (25). Each score is rounded. Wealth and elite approval do not add moral points. This is an authored teaching model you can question, not a universal measurement of goodness.</p>';this.output.append(d);
 setup.send('complete',{choices:setup.choices.slice()});
}});
// Passage-local pacing never changes the immutable choice history or score.
setup.cancelReveal=()=>{};
$(document).on(':passageinit',()=>setup.cancelReveal());
$(document).on(':passagedisplay',function(){
 const passage=document.querySelector('.passage'),beats=passage.querySelector('.story-beats'),after=passage.querySelector('.after-beats');
 if(beats&&after){
  const paragraphs=Array.from(beats.children);let index=0,timer=null,finish=()=>{};
  const controls=document.createElement('div');controls.className='beat-controls';
  const next=document.createElement('button'),all=document.createElement('button'),counter=document.createElement('span');
  next.textContent='Next ▸';all.textContent='Show all';all.className='quiet';counter.className='beat-count';
  controls.append(counter,next,all);beats.after(controls);after.hidden=true;
  const stop=()=>{if(timer)clearInterval(timer);timer=null;};setup.cancelReveal=stop;
  const show=()=>{
   stop();paragraphs.forEach((p,i)=>p.hidden=i!==index);const p=paragraphs[index];
   counter.textContent=(index+1)+' / '+paragraphs.length;next.textContent=index===paragraphs.length-1?'Continue ▸':'Next ▸';
   // Keep full accessible text; the optional visual reveal never delays screen readers.
   const original=p.innerHTML;finish=()=>{stop();p.innerHTML=original;};
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const accessible=document.createElement('span');accessible.className='sr-only';accessible.innerHTML=original;
    const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');visual.innerHTML=original;
    p.replaceChildren(accessible,visual);const walker=document.createTreeWalker(visual,NodeFilter.SHOW_TEXT),nodes=[];let node;
    while((node=walker.nextNode()))nodes.push({node,text:node.textContent});nodes.forEach(n=>n.node.textContent='');
    let n=0,c=0;timer=setInterval(()=>{for(let j=0;j<3&&n<nodes.length;j++){const entry=nodes[n];entry.node.textContent=entry.text.slice(0,++c);if(c>=entry.text.length){n++;c=0;}}if(n===nodes.length)finish();},16);
   }
  };
  const unlock=(showAll=false)=>{finish();if(showAll)paragraphs.forEach(p=>p.hidden=false);else{const recall=document.createElement('details');recall.innerHTML='<summary>Recall the conversation</summary>'+paragraphs.map(p=>'<p>'+p.innerHTML+'</p>').join('');after.prepend(recall);}controls.remove();after.hidden=false;const target=after.querySelector('summary,button');target?.focus({preventScroll:true});};
  next.addEventListener('click',()=>{if(timer){finish();return;}if(index<paragraphs.length-1){index++;show();}else unlock();});
  all.addEventListener('click',()=>unlock(true));show();
 }
 const h=passage.querySelector('h1');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}window.scrollTo(0,0);
});
$(document).one(':storyready',function(){
 setup.booted=true;
 if(setup.channel)setup.refresh();
 if(window.parent===window){setup.ready=true;return;}
 setup.send('ready'); // Parent's load event also initializes; ready has no credentials.
 window.parent.postMessage({protocol:'teaching-stone-v1',type:'ready'},location.origin);
});
