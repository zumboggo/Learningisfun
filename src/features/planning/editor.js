'use strict';
const $=s=>document.querySelector(s), KEY='brainstorming-board-v1', LIBRARY_KEY='learning-planning:'+window.PLANNING_USER;
const todayTitle=()=>new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
const blankBoard=()=>({title:todayTitle(),rowCount:8,columnCount:10,rows:Array(10).fill(''),cards:Array(100).fill(''),cardDone:Array(100).fill(false),notes:['',''],footerNote:'',todoMode:true,todoChecked:[],archive:[]});
const validBoard=s=>s&&typeof s.title==='string'&&Array.isArray(s.rows)&&s.rows.every(x=>typeof x==='string')&&Array.isArray(s.cards)&&s.cards.every(x=>typeof x==='string')&&((s.rows.length===5&&s.cards.length===40)||(s.rows.length===10&&s.cards.length===100&&Number.isInteger(s.rowCount)&&s.rowCount>=1&&s.rowCount<=10&&Number.isInteger(s.columnCount)&&s.columnCount>=1&&s.columnCount<=10));
function normalizeBoard(board){if(board.cards.length===100)return {...board,archive:Array.isArray(board.archive)?board.archive.filter(item=>item&&typeof item.text==='string'):[],cardDone:Array.from({length:100},(_,i)=>board.cardDone?.[i]===true),todoMode:true,todoChecked:Array.isArray(board.todoChecked)?board.todoChecked.map(x=>x===true):[],rowCount:8,columnCount:10,notes:Array.isArray(board.notes)?board.notes.slice(0,2):['',''],footerNote:board.footerNote||''};const next=blankBoard();next.title=board.title;board.rows.forEach((name,r)=>next.rows[r]=name);board.cards.forEach((text,i)=>next.cards[Math.floor(i/8)*10+i%8]=text);return next}
const visibleSlots=()=>Array.from({length:state.rowCount},(_,r)=>Array.from({length:state.columnCount},(_,c)=>r*10+c)).flat();
const slotNumber=i=>Math.floor(i/10)*state.columnCount+i%10+1;
const dimensionsText=()=>state.rowCount+(state.rowCount===1?' row × ':' rows × ')+state.columnCount+(state.columnCount===1?' column':' columns');
const newId=()=>crypto.randomUUID();
let library,currentId,state,active=0,dragged=null,draggedRow=null,timer;
try{const saved=JSON.parse(localStorage.getItem(LIBRARY_KEY));if(saved&&Array.isArray(saved.boards)&&saved.boards.length&&saved.boards.every(b=>typeof b.id==='string'&&validBoard(b.data))){saved.boards.forEach(b=>b.data=normalizeBoard(b.data));library=saved;currentId=saved.boards.some(b=>b.id===saved.currentId)?saved.currentId:saved.boards[0].id;state=saved.boards.find(b=>b.id===currentId).data}}catch{}
if(!library){state=blankBoard();currentId=newId();library={currentId,boards:[{id:currentId,data:state}]}}
// Preserve older ninth/tenth rows in a continuation board before fixing the template.
function preserveOverflow(){for(const b of [...library.boards]){if(b.data.cards.slice(80).some(t=>t.trim())||b.data.rows.slice(8).some(t=>t.trim()&&!/^Row (9|10)$/.test(t))){const extra=blankBoard();extra.title=b.data.title+' — continued';extra.rows.splice(0,2,...b.data.rows.slice(8));extra.cards.splice(0,20,...b.data.cards.slice(80));extra.cardDone.splice(0,20,...b.data.cardDone.slice(80));b.data.cardDone.fill(false,80);library.boards.push({id:newId(),data:extra});b.data.rows.splice(8,2,'','');b.data.cards.fill('',80)}}}
preserveOverflow();
library.boards.forEach(board=>mergeAdditionalNotes(board.data));
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
function save(){library.currentId=currentId;library.boards.find(b=>b.id===currentId).data=state;let ok=true;try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));$('#saved').innerHTML='<i></i> Saved on this device'}catch{ok=false;$('#saved').textContent='Storage unavailable — export to keep your work'}const slots=visibleSlots();const filled=slots.filter(i=>state.cards[i].trim()).length;$('#count').textContent=filled+' / '+slots.length+' cards';const hidden=state.cards.filter(t=>t.trim()).length-filled;$('#hidden-cards').textContent=hidden?hidden+' hidden cards retained — expand to see them.':'';$('#current-board-name').textContent=state.title.trim()||'Untitled board';$('#archive-count').textContent=String(library.boards.reduce((total,board)=>total+(board.data.archive?.length||0),0));if(ok&&typeof window!=='undefined')window.brainstormingSaved?.();return ok}
function closeBoards(){$('#boards-menu').hidden=true;$('#boards-toggle').setAttribute('aria-expanded','false')}
function refreshBoards(){const list=$('#boards-list');list.replaceChildren();for(const b of library.boards){const entry=document.createElement('div');entry.className='board-entry'+(b.id===currentId?' selected':'');const open=document.createElement('button');open.className='open-board';open.textContent=(b.id===currentId?'✓  ':'')+(b.data.title.trim()||'Untitled board');open.setAttribute('aria-label','Open board: '+(b.data.title.trim()||'Untitled board'));open.onclick=()=>{if(!save()){toast('Cannot save changes. Export before switching boards.');return}currentId=b.id;state=b.data;$('#title').value=state.title;render();closeBoards()};const del=document.createElement('button');del.className='delete-board';del.textContent='Delete';del.setAttribute('aria-label','Delete board: '+(b.data.title.trim()||'Untitled board'));del.onclick=()=>deleteBoard(b.id);entry.append(open,del);list.append(entry)}}
function deleteBoard(id){const board=library.boards.find(b=>b.id===id);if(!confirm('Delete “'+(board.data.title.trim()||'Untitled board')+'” and all its cards and archived items?'))return;const previous={boards:library.boards,currentId,state};library.boards=library.boards.filter(b=>b.id!==id);if(!library.boards.length)library.boards=[{id:newId(),data:blankBoard()}];if(id===currentId){currentId=library.boards[0].id;state=library.boards[0].data}if(!save()){library.boards=previous.boards;currentId=previous.currentId;state=previous.state;toast('Could not delete board: storage unavailable.');return}$('#title').value=state.title;render();refreshBoards();toast('Board deleted')}
$('#boards-toggle').onclick=()=>{const opening=$('#boards-menu').hidden;if(opening)refreshBoards();$('#boards-menu').hidden=!opening;$('#boards-toggle').setAttribute('aria-expanded',String(opening))};
document.addEventListener('click',e=>{if(!e.target.closest('.board-picker'))closeBoards()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBoards()});
$('#save-board').onclick=()=>{if(save()){refreshBoards();toast('Board saved: '+(state.title.trim()||'Untitled board'))}else toast('Could not save. Export to keep your work.')};
$('#new-board').onclick=()=>{if(!save()){toast('Export your changes before creating a board.');return}const previous={currentId,state};currentId=newId();state=blankBoard();library.boards.push({id:currentId,data:state});if(!save()){library.boards.pop();currentId=previous.currentId;state=previous.state;toast('Could not create board: storage unavailable.');return}$('#title').value=state.title;render();closeBoards();$('#title').focus();$('#title').select();toast('New board ready. Give it a title.')};

function refreshPlanner(){
  const previous=JSON.parse(JSON.stringify(state)),archivedAt=new Date().toISOString();
  const items=[];
  state.cards.forEach((text,index)=>{
    if(!state.cardDone[index])return;
    if(text.trim())items.push({id:newId(),text,kind:'Note',location:(state.rows[Math.floor(index/10)]||'Row '+(Math.floor(index/10)+1))+' · Cell '+(index%10+1),boardTitle:state.title,archivedAt});
    state.cards[index]='';state.cardDone[index]=false;
  });
  {
    const remaining=[],checks=[];
    (state.notes[0]||'').split('\n').forEach((text,index)=>{
      if(state.todoChecked[index]){
        if(text.trim())items.push({id:newId(),text,kind:'To Do',location:'Top-left checklist',boardTitle:state.title,archivedAt});
      }else{remaining.push(text);checks.push(false)}
    });
    state.notes[0]=remaining.join('\n');state.todoChecked=checks;
  }
  state.archive=[...(state.archive||[]),...items];
  if(!save()){
    state=previous;library.boards.find(board=>board.id===currentId).data=state;
    render();toast('Nothing archived: storage unavailable. Back up your boards and try again.');return;
  }
  render();toast(items.length?'Archived '+items.length+' completed '+(items.length===1?'item.':'items.'):'No completed items to archive.');
}
function showArchive(){
  const list=$('#archive-list');list.replaceChildren();
  const entries=library.boards.flatMap(board=>(board.data.archive||[]).map(item=>({...item,currentTitle:board.data.title})));
  entries.sort((a,b)=>String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  for(const item of entries){
    const article=document.createElement('article');article.className='archive-item';
    const heading=document.createElement('h3');heading.textContent=item.boardTitle||item.currentTitle||'Untitled board';
    const meta=document.createElement('p');meta.className='archive-meta';
    const date=new Date(item.archivedAt);
    meta.textContent=[item.kind||'Note',item.location,Number.isNaN(date.getTime())?'':date.toLocaleString()].filter(Boolean).join(' · ');
    const text=document.createElement('div');text.className='archive-text';text.textContent=item.text;
    article.append(heading,meta,text);list.append(article);
  }
  if(!entries.length){const empty=document.createElement('p');empty.textContent='No archived items yet. Mark items as dealt with, then use Refresh planner.';list.append(empty)}
  $('#archive-dialog').showModal();
}
$('#refresh-planner').onclick=refreshPlanner;
$('#open-archive').onclick=showArchive;

function moveRow(from,to){if(from===to)return;const groups=state.rows.map((name,i)=>({name,cards:state.cards.slice(i*10,i*10+10),done:state.cardDone.slice(i*10,i*10+10)}));const [moving]=groups.splice(from,1);groups.splice(to,0,moving);state.rows=groups.map(g=>g.name);state.cards=groups.flatMap(g=>g.cards);state.cardDone=groups.flatMap(g=>g.done);render();toast('Row moved to position '+(to+1))}
function setupRowDrag(row,heading,grip,r){heading.draggable=true;heading.title='Drag to move this row';heading.ondragstart=e=>{if(e.target.tagName==='TEXTAREA'){e.preventDefault();return}e.stopPropagation();draggedRow=r;dragged=null;e.dataTransfer.setData('text/plain','row:'+r);e.dataTransfer.effectAllowed='move';row.classList.add('row-dragging')};heading.ondragend=()=>{draggedRow=null;document.querySelectorAll('.row').forEach(el=>el.classList.remove('row-dragging','row-over'))};row.ondragover=e=>{if(draggedRow!==null){e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('row-over')}};row.ondragleave=e=>{if(!row.contains(e.relatedTarget))row.classList.remove('row-over')};row.ondrop=e=>{if(draggedRow===null)return;e.preventDefault();e.stopPropagation();const from=draggedRow;draggedRow=null;moveRow(from,r)};
let origin=null,target=r,moved=false;grip.onpointerdown=e=>{if(e.button!==0)return;origin={x:e.clientX,y:e.clientY};target=r;moved=false;grip.setPointerCapture(e.pointerId);e.preventDefault()};grip.onpointermove=e=>{if(!origin)return;if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>6)moved=true;if(!moved)return;row.classList.add('row-dragging');const destination=document.elementFromPoint(e.clientX,e.clientY)?.closest('.row');document.querySelectorAll('.row').forEach(el=>el.classList.remove('row-over'));if(destination){target=Number(destination.dataset.row);destination.classList.add('row-over')}};grip.onpointerup=()=>{if(!origin)return;origin=null;document.querySelectorAll('.row').forEach(el=>el.classList.remove('row-dragging','row-over'));if(moved)moveRow(r,target)};grip.onpointercancel=()=>{origin=null;document.querySelectorAll('.row').forEach(el=>el.classList.remove('row-dragging','row-over'))};grip.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const to=Math.max(0,Math.min(state.rowCount-1,r+(e.key==='ArrowUp'?-1:1)));moveRow(r,to);$('#board').querySelector(`[data-row="${to}"] .row-grip`).focus()}}}
function preview(text){const words=text.trim().split(/\s+/);return words.slice(0,8).join(' ')+(words.length>8?'…':'')}

function mergeAdditionalNotes(board){
  const notes=Array.isArray(board.notes)?board.notes:['',''];
  if(notes[1]){
    const first=notes[0]||'',extra=notes[1];
    board.todoChecked=[...(first?first.split('\n').map((_,i)=>board.todoChecked?.[i]===true):[]),...extra.split('\n').map(()=>false)];
    board.notes=[first?first+'\n'+extra:extra,''];
  }
}
function renderTodos(focusIndex){
  mergeAdditionalNotes(state);
  const list=$('#todo-list');list.replaceChildren();
  const heading=document.createElement('h2');heading.className='todo-heading';heading.textContent='To-Do';list.append(heading);
  const lines=(state.notes[0]||'').split('\n');
  state.todoChecked=lines.map((_,i)=>state.todoChecked?.[i]===true);
  lines.forEach((text,index)=>{
    const row=document.createElement('div');row.className='todo-row';
    const check=document.createElement('input');check.type='checkbox';check.checked=state.todoChecked[index]===true;
    check.setAttribute('aria-label','Complete task '+(index+1));
    const input=document.createElement('textarea');input.rows=1;input.value=text;input.placeholder='To do…';input.setAttribute('aria-label','Task '+(index+1));
    input.classList.toggle('completed',check.checked);
    const resize=()=>{input.style.height='auto';input.style.height=Math.max(21,input.scrollHeight)+'px'};
    check.onchange=()=>{state.todoChecked[index]=check.checked;input.classList.toggle('completed',check.checked);save()};
    input.oninput=()=>{
      const current=state.notes[0].split('\n'),parts=input.value.split('\n');
      current.splice(index,1,...parts);state.notes[0]=current.join('\n');
      if(parts.length>1)state.todoChecked.splice(index,1,...parts.map((_,i)=>i===0&&check.checked));
      save();if(parts.length>1)renderTodos(index+parts.length-1);else resize();
    };
    input.onkeydown=e=>{
      if(e.isComposing||e.keyCode===229)return;
      if(e.key==='Enter'){
        e.preventDefault();const start=input.selectionStart,end=input.selectionEnd;
        const current=state.notes[0].split('\n');current.splice(index,1,input.value.slice(0,start),input.value.slice(end));
        state.notes[0]=current.join('\n');
        while(state.todoChecked.length<lines.length)state.todoChecked.push(false);
        state.todoChecked.splice(index+1,0,false);save();renderTodos(index+1);
      }else if(e.key==='Backspace'&&!input.value&&lines.length>1){
        e.preventDefault();const current=state.notes[0].split('\n');current.splice(index,1);state.notes[0]=current.join('\n');state.todoChecked.splice(index,1);save();renderTodos(Math.max(0,index-1));
      }
    };
    row.append(check,input);list.append(row);resize();
    if(index===focusIndex){input.focus();input.setSelectionRange(input.value.length,input.value.length)}
  });
}
window.addEventListener('resize',()=>{document.querySelectorAll('.todo-row textarea').forEach(input=>{input.style.height='auto';input.style.height=Math.max(21,input.scrollHeight)+'px'})});

function render(){const board=$('#board');renderTodos();$('#footer-note').value=state.footerNote||'';$('#board-summary').textContent=state.rowCount+(state.rowCount===1?' row. ':' rows. ')+(state.rowCount*state.columnCount)+(state.rowCount*state.columnCount===1?' possibility.':' possibilities.');$('#copy-summary').textContent='Copy pastes into '+dimensionsText()+'. Exports include your full text.';board.replaceChildren();state.rows.slice(0,state.rowCount).forEach((label,r)=>{const row=document.createElement('div');row.className='row';row.dataset.row=r;const heading=document.createElement('div');heading.className='row-label';const n=document.createElement('span');n.textContent=String(r+1).padStart(2,'0');const grip=document.createElement('button');grip.type='button';grip.className='row-grip';grip.textContent='⠿';grip.setAttribute('aria-label','Move row '+(r+1)+'; drag or use up and down arrow keys');const input=document.createElement('textarea');input.rows=5;input.placeholder='Topic / question';input.value=label;input.maxLength=300;input.setAttribute('aria-label','Name row '+(r+1));input.addEventListener('input',()=>{state.rows[r]=input.value;save()});const caption=document.createElement('div');caption.className='row-caption';caption.append(n,grip);heading.append(caption,input);setupRowDrag(row,heading,grip,r);row.append(heading);for(let c=0;c<state.columnCount;c++){const i=r*10+c,card=document.createElement('button');card.className='card'+(!state.cards[i].trim()?' empty':'')+(state.cardDone[i]?' dealt-with':'');card.draggable=!!state.cards[i].trim();card.dataset.slot=i;card.setAttribute('aria-label',`${label}, slot ${c+1}${state.cardDone[i]?' (dealt with)':''}: ${state.cards[i].trim()?preview(state.cards[i]):'Add a thought'}`);const num=document.createElement('span');num.className='number';num.textContent=String(slotNumber(i)).padStart(2,'0');const text=document.createElement('span');text.className=state.cards[i].trim()?'preview':'plus';text.textContent=state.cards[i].trim()?preview(state.cards[i]):'+';card.append(num,text);card.onclick=()=>openCard(i);card.ondragstart=e=>{e.stopPropagation();draggedRow=null;dragged=i;e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';card.classList.add('dragging')};card.ondragend=()=>{dragged=null;document.querySelectorAll('.card').forEach(el=>el.classList.remove('dragging','over'))};card.ondragover=e=>{if(dragged!==null){e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('over')}};card.ondragleave=()=>card.classList.remove('over');card.ondrop=e=>{if(dragged===null)return;e.preventDefault();e.stopPropagation();if(dragged!==null){const from=dragged;dragged=null;swapCards(from,i);board.querySelector(`[data-slot="${i}"]`).focus()}};card.style.gridColumn=String(c%5+2);card.style.gridRow=String(Math.floor(c/5)+1);row.append(card)}board.append(row)});save()}
function swapCards(a,b){[state.cards[a],state.cards[b]]=[state.cards[b],state.cards[a]];[state.cardDone[a],state.cardDone[b]]=[state.cardDone[b],state.cardDone[a]];render();toast(a===b?'Already in this slot':'Cards swapped')}
function updateCompletionButton(){
  const button=$('#complete-note'),done=state.cardDone[active]===true;
  button.setAttribute('aria-pressed',String(done));button.disabled=!state.cards[active].trim();
  button.title=done?'Mark note as still to address':'Mark note as dealt with';
  button.setAttribute('aria-label',button.title);
}
$('#complete-note').onclick=()=>{
  const previous=state.cardDone[active];state.cardDone[active]=!previous;
  if(!save()){state.cardDone[active]=previous;toast('Could not save this change.');return}
  updateCompletionButton();render();
  toast(state.cardDone[active]?'Marked as dealt with':'Marked as still to address');
};
function openCard(i){active=i;$('#move').disabled=visibleSlots().length===1;$('#card-location').textContent=`${state.rows[Math.floor(i/10)]||'Row '+(Math.floor(i/10)+1)} / CARD ${slotNumber(i)}`;$('#thought').value=state.cards[i];updateCompletionButton();$('#move-controls').hidden=true;$('#destination').replaceChildren();for(const j of visibleSlots()){if(j===i)continue;const o=document.createElement('option');o.value=j;o.textContent=`${slotNumber(j)} · ${state.rows[Math.floor(j/10)]||'Row '+(Math.floor(j/10)+1)}`;$('#destination').append(o)}$('#editor').showModal();$('#thought').focus()}
$('#thought').oninput=()=>{state.cards[active]=$('#thought').value;if(!state.cards[active].trim())state.cardDone[active]=false;updateCompletionButton();save()};$('#editor').addEventListener('close',()=>{render();$('#board').querySelector(`[data-slot="${active}"]`).focus()});$('#thought').onkeydown=e=>{
  if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){
    e.preventDefault();state.cards[active]=$('#thought').value;
    if(save())$('#editor').close();
  }
};
$('#delete-note').onclick=()=>{
  const previous=state.cards[active],wasDone=state.cardDone[active];state.cards[active]='';state.cardDone[active]=false;
  if(!save()){state.cards[active]=previous;state.cardDone[active]=wasDone;toast('Could not delete note: storage unavailable.');return}
  $('#thought').value='';$('#editor').close();toast('Note deleted');
};$('#move').onclick=()=>{$('#move-controls').hidden=!$('#move-controls').hidden};$('#swap').onclick=()=>{const to=Number($('#destination').value);swapCards(active,to);active=to;$('#editor').close()};
$('#title').value=state.title;$('#title').oninput=e=>{state.title=e.target.value;save()};
// Parse spreadsheet CSV, including quoted commas, escaped quotes and multiline cells.
function parseCSV(source){
 const text=source.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
 const endField=()=>{row.push(field);field='';closed=false};
 const endRow=()=>{endField();rows.push(row);row=[]};
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}else field+=ch;continue}
  if(ch===','){endField();continue}
  if(ch==='\r'||ch==='\n'){endRow();if(ch==='\r'&&text[i+1]==='\n')i++;continue}
  if(closed){if(ch===' '||ch==='\t')continue;throw new Error('The CSV has unexpected text after a closing quote.')}
  if(ch==='"'){if(field.length)throw new Error('A quoted CSV cell must start with a quote.');quoted=true;continue}
  field+=ch;
 }
 if(quoted)throw new Error('The CSV has a quoted cell that is missing its closing quote.');
 if(field.length||row.length||closed||!rows.length)endRow();
 return rows;
}
function cardsFromCSV(text){
 let rows=parseCSV(text);
 if(!rows.some(row=>row.some(cell=>cell.trim())))throw new Error('This CSV is empty. Add some text and try again.');
 while(rows.length>8&&rows.at(-1).every(cell=>!cell.trim()))rows.pop();
 const imported={cards:Array(100).fill(''),rowCount:state.rowCount,columnCount:state.columnCount};
 if(rows.every(row=>row.length===1)){
  if(rows.length>80)throw new Error('A single-column CSV can have up to 80 items.');
  imported.columnCount=10;
  imported.rowCount=8;
  rows.forEach((row,i)=>imported.cards[Math.floor(i/imported.columnCount)*10+i%imported.columnCount]=row[0]);return imported;
 }
 if(rows.length>8||rows.some(row=>row.slice(10).some(cell=>cell.trim())))throw new Error('Please use up to 8 rows × 10 columns, or a single column of up to 80 items. Nothing was imported.');
 imported.rowCount=8;imported.columnCount=10;
 rows.forEach((row,r)=>row.slice(0,10).forEach((cell,c)=>imported.cards[r*10+c]=cell));return imported;
}
function addImportedBoard(imported,name){
 if(!save())throw new Error('Could not save your current board. Export it before importing.');
 const previous={currentId,state};
 currentId=newId();state={...blankBoard(),title:name||'Imported board',...imported};library.boards.push({id:currentId,data:state});
 if(!save()){library.boards.pop();currentId=previous.currentId;state=previous.state;$('#title').value=state.title;render();throw new Error('Storage is full or unavailable. The CSV was not imported.')}
 $('#title').value=state.title;render();refreshBoards();closeBoards();toast('Imported '+imported.cards.filter(c=>c.trim()).length+' cards into a new board.');
}
$('#import-csv').onclick=()=>$('#csv-file').click();
$('#csv-file').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;const button=$('#import-csv');button.disabled=true;
 try{
  if(file.size>2*1024*1024)throw new Error('Please choose a CSV smaller than 2 MB.');
  const cards=cardsFromCSV(await file.text());addImportedBoard(cards,file.name.replace(/\.csv$/i,'').trim().slice(0,120));
 }catch(error){toast(error.message||'Could not read this CSV. Please try another file.')}finally{button.disabled=false;e.target.value=''}
};

function cleanCell(s){return s.replace(/[\t\r\n]+/g,' ')}
function matrix(){return Array.from({length:state.rowCount},(_,r)=>state.cards.slice(r*10,r*10+state.columnCount))}
function download(data,type,ext){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=(state.title.trim().replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,70)||'Brainstorming')+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
$('#csv').onclick=()=>{const csv=matrix().map(row=>row.map(s=>'"'+s.replace(/"/g,'""')+'"').join(',')).join('\r\n');download('\ufeff'+csv,'text/csv;charset=utf-8','csv');toast('CSV exported · '+dimensionsText())};
$('#copy').onclick=async()=>{const rows=matrix(),plain=rows.map(r=>r.map(cleanCell).join('\t')).join('\n');const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');const html='<table>'+rows.map(r=>'<tr>'+r.map(s=>'<td>'+escape(cleanCell(s))+'</td>').join('')+'</tr>').join('')+'</table>';try{if(window.ClipboardItem&&navigator.clipboard.write){await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})])}else await navigator.clipboard.writeText(plain);toast('Copied! Paste into a spreadsheet for '+(state.rowCount*state.columnCount)+' cells.')}catch{try{await navigator.clipboard.writeText(plain);toast('Copied · '+dimensionsText())}catch{const ta=document.createElement('textarea');ta.value=plain;document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?'Copied · '+dimensionsText():'Clipboard blocked. Use Export as CSV instead.')}}};
// A dependency-free A4 PDF, using embedded JPEG pages to preserve any script or font.
function wrap(ctx,text,width){const lines=[];for(const para of text.split('\n')){let line='';for(const word of para.split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width<=width){line=candidate;continue}if(line){lines.push(line);line=''}for(const ch of Array.from(word)){if(ctx.measureText(line+ch).width>width&&line){lines.push(line);line=ch}else line+=ch}}lines.push(line)}return lines}
function makePage(){const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1190,1684);return{canvas,ctx}}
async function exportPDF(){const btn=$('#pdf');btn.disabled=true;try{if(document.fonts)await document.fonts.ready;const {canvas,ctx}=makePage();let overflow=false;
function box(x,y,w,h,text,bold=false,done=false){ctx.strokeStyle=bold?'#111':'#666';ctx.lineWidth=bold?3:1;ctx.strokeRect(x,y,w,h);let size=bold?19:16;let lines=[];do{ctx.font=(bold?'bold ':'')+size+'px sans-serif';lines=wrap(ctx,text,w-16);if(lines.length*(size*1.3)<=h-16)break;size--}while(size>7);if(lines.length*(size*1.3)>h-16)overflow=true;ctx.save();ctx.beginPath();ctx.rect(x+5,y+5,w-10,h-10);ctx.clip();ctx.fillStyle='#111';lines.forEach((line,i)=>{const baseline=y+8+size+i*size*1.3;ctx.fillText(line,x+8,baseline);if(done){ctx.strokeStyle='#111';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+8,baseline-size*.35);ctx.lineTo(x+8+ctx.measureText(line).width,baseline-size*.35);ctx.stroke()}});ctx.restore()}
{
box(60,60,344,1450,'');ctx.save();ctx.beginPath();ctx.rect(65,65,334,1440);ctx.clip();ctx.font='16px sans-serif';ctx.fillStyle='#111';ctx.strokeStyle='#111';ctx.lineWidth=1;ctx.font='bold 16px sans-serif';ctx.fillText('To-Do',69,84);ctx.font='16px sans-serif';let y=112;
(state.notes[0]||'').split('\n').forEach((text,index)=>{
  const lines=wrap(ctx,text,302),checked=state.todoChecked?.[index]===true;
  ctx.strokeRect(69,y-13,12,12);
  if(checked){ctx.beginPath();ctx.moveTo(71,y-8);ctx.lineTo(75,y-3);ctx.lineTo(80,y-12);ctx.stroke()}
  lines.forEach(line=>{if(y>1502)overflow=true;ctx.fillText(line,89,y);if(checked){ctx.beginPath();ctx.moveTo(89,y-5);ctx.lineTo(89+ctx.measureText(line).width,y-5);ctx.stroke()}y+=20.8});
});ctx.restore();
}box(60,1538,344,86,state.title,true);box(444,1538,686,86,state.footerNote||'');
for(let r=0;r<8;r++){const y=60+r*183;box(444,y,167,164,state.rows[r],true);for(let c=0;c<10;c++)box(627+(c%5)*103,y+Math.floor(c/5)*88,91,76,state.cards[r*10+c],false,state.cardDone[r*10+c])}
download(encodePDF([canvas]),'application/pdf','pdf');toast(overflow?'A4 saved. Some text is too long for the sheet; full text remains in your board and backup.':'A4 planning sheet saved')}catch(error){toast('Could not create the PDF. Please try again.');console.error(error)}finally{btn.disabled=false}}
function encodePDF(pages){const enc=new TextEncoder(),chunks=[],offsets=[0];let pos=0;const add=s=>{const b=typeof s==='string'?enc.encode(s):s;chunks.push(b);pos+=b.length};const obj=(id,body)=>{offsets[id]=pos;add(id+' 0 obj\n');add(body);add('\nendobj\n')};add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')}] >>`);pages.forEach((canvas,i)=>{const id=3+i*3;obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);const bytes=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.92).split(',')[1]),c=>c.charCodeAt(0));offsets[id+1]=pos;add(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const stream='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';obj(id+2,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`)});const xref=pos;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'})}
$('#footer-note').oninput=e=>{state.footerNote=e.target.value;save()};
$('#backup').onclick=()=>download(JSON.stringify(library,null,2),'application/json','json');
$('#restore').onclick=()=>$('#backup-file').click();
$('#backup-file').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.boards)||!data.boards.every(b=>validBoard(b.data)))throw Error('Please choose a Brainstorming backup.');for(const b of data.boards)library.boards.push({id:newId(),data:normalizeBoard(b.data)});preserveOverflow();library.boards.forEach(board=>mergeAdditionalNotes(board.data));save();refreshBoards();toast('Boards restored. Existing boards kept.')}catch(err){toast(err.message)}finally{e.target.value=''}};
$('#pdf').onclick=exportPDF;render();
