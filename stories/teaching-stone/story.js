/* Compiled into SugarCube, never receives authentication credentials. */
Config.history.maxStates = 1;
Config.history.controls = false;
Config.saves.isAllowed = () => false;
Config.ui.stowBarInitially = true;
Config.passages.nobr = true;
setup.choices = [];
setup.channel = null;
setup.ready = false;
// Account-owned progress is restored only by the parent, never SugarCube’s tab session.
Config.navigation.override = function(destination) { return setup.ready ? destination : 'Start'; };
setup.send = function(type, extra = {}) {
 if (window.parent !== window && setup.channel) window.parent.postMessage({protocol:'teaching-stone-v1',channel:setup.channel,type,...extra},location.origin);
};
setup.refresh = function() {
 const step=setup.choices.length;
 Engine.play(step === 10 ? 'Assessment' : 'Decision'+(step+1));
};
window.addEventListener('message',function(event){
 const m=event.data;
 if(event.origin!==location.origin||event.source!==window.parent||!m||m.protocol!=='teaching-stone-v1'||m.type!=='init'||typeof m.channel!=='string'||setup.ready)return;
 try {setup.rules.replay(m.choices); } catch {return;}
 setup.channel=m.channel;setup.choices=m.choices.slice();setup.ready=true;setup.refresh();
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
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Whose wellbeing?';details.append(summary);const p=document.createElement('p');p.textContent=`Households ${s.households} · Workers ${s.workers} · You ${s.self} · Influential residents’ support ${s.influential}. These game indicators describe conditions, not anyone’s moral worth.`;details.append(p);this.output.append(details);
}});
Macro.add('stonePortrait',{handler:function(){
 const name=this.args[0],img=document.createElement('img');img.className='portrait';img.alt='';img.src=name+(setup.choices.length>=8&&setup.rules.replay(setup.choices).trust>=65&&['scribe','household'].includes(name)?'-hopeful':'')+'.webp';img.addEventListener('error',()=>img.remove(),{once:true});this.output.append(img);
}});
Macro.add('stoneAssessment',{handler:function(){
 const a=setup.rules.assess(setup.choices);
 const heading=document.createElement('h2');heading.textContent=a.ending;this.output.append(heading);
 const intro=document.createElement('p');intro.textContent='The stone speaks: “I do not weigh your worth. I show you what your decisions asked of people—and what they made possible.”';this.output.append(intro);
 for(const note of a.notes){const p=document.createElement('p');p.textContent=note;this.output.append(p);}
 const score=document.createElement('p');score.className='score';score.textContent=a.total+' / 100 · Long-term flourishing';this.output.append(score);
 const list=document.createElement('ul');for(const [key,label] of Object.entries({needs:'Basic needs & dignity',resilience:'Future resilience',cooperation:'Trustworthy cooperation',understanding:'Applied understanding'})){const li=document.createElement('li');li.textContent=label+': '+a.scores[key]+' / 25';list.append(li);}this.output.append(list);
 const d=document.createElement('details');d.innerHTML='<summary>How the assessment works</summary><p>Needs: the least-supported of households, workers and you (15 points), plus dignity (10). Resilience: preparation (15), preserved seed (5), and a food reserve (5). Cooperation: trust (15) and lasting arrangements (10). Understanding: evidence gathering, fair inquiry, applying the four lenses alongside ma’at, and planning beyond yourself (25). Each score is rounded. Wealth and elite approval do not add moral points. This is an authored teaching model you can question, not a universal measurement of goodness.</p>';this.output.append(d);
 setup.send('complete',{choices:setup.choices.slice()});
}});
$(document).on(':passagedisplay',function(){
 const h=document.querySelector('.passage h1');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}
 window.scrollTo(0,0);
});
$(document).one(':storyready',function(){
 if(window.parent===window){setup.ready=true;return;}
 setup.send('ready'); // Parent's load event also initializes; ready has no credentials.
 window.parent.postMessage({protocol:'teaching-stone-v1',type:'ready'},location.origin);
});
