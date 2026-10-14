const byId=id=>document.getElementById(id);
const root=byId('app'),stage=byId('playStage'),frame=byId('gameFrame');
const labels={'2048':'Puzzle','snake':'Arcade','minesweeper':'Puzzle','pong':'Arcade','breakout':'Arcade','memory':'Puzzle','connect4':'Strategy','block-stack':'Puzzle'};
const keys={favorite:'jat-arcade:favorites:v1',recentIds:'jat-arcade:recentIds:v1',scores:'jat-arcade:scores:v1'};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let apps=[],filter='All',query='',active=null;
let favorites=read(keys.favorite,[]),recentIds=read(keys.recentIds,[]);
const ownedURL=url=>{try{let u=new URL(url);return u.origin===location.origin&&u.pathname.startsWith('/JAT-OS/arcade/')}catch{return false}};
const getId=a=>a.id.split('.').pop().replace(/^arcade-/,'');
const category=a=>labels[getId(a)]||'Featured';
const showScore=(a)=>{const id=getId(a),scores=read(keys.scores,{});if(scores[id]!=null)return '★ '+scores[id];if(id==='2048'||id==='snake'){let best=localStorage.getItem(id==='2048'?'jat-2048-best':'jat-snake-best');if(best)return '★ '+best}return 'Play now'};
async function load(){
 try{let r=await fetch('../registry/apps.json',{cache:'no-cache'});if(!r.ok)throw Error('Registry '+r.status);
 let data=await r.json();apps=data.apps.filter(a=>a.category==='arcade'&&a.launch?.url&&a.icon?.src).map(a=>({...a,local:ownedURL(a.launch.url)}));
 }catch(e){byId('libraryCount').textContent='Could not load game registry.';console.warn(e)}
 byId('heroStats').textContent=apps.length+' games · No account needed';drawFilters();draw();
}
const groups=['All','Arcade','Puzzle','Strategy','Favorites'];
function drawFilters(){byId('filters').replaceChildren(...groups.map(label=>{let b=document.createElement('button');b.className='chip';b.textContent=label;b.type='button';b.setAttribute('aria-pressed',String(filter===label));b.onclick=()=>{filter=label;drawFilters();draw()};return b}))}
function filtered(){let items=apps.filter(a=>(filter==='All'||filter==='Favorites'&&favorites.includes(a.id)||category(a)===filter)&& (a.name+' '+a.description).toLowerCase().includes(query));
 let sort=byId('sort').value;if(sort==='recent')items.sort((a,b)=>recentIds.indexOf(b.id)-recentIds.indexOf(a.id));else if(sort==='az')items.sort((a,b)=>a.name.localeCompare(b.name));return items}
function card(a){
 let el=document.createElement('article');el.className='game-card';let thumb=document.createElement('button');thumb.className='cover';thumb.type='button';thumb.style.setProperty('--cover',a.icon.color||'#354a78');thumb.setAttribute('aria-label','Play '+a.name);
 let img=document.createElement('img');img.src=new URL('../'+a.icon.src,location.href).href;img.alt='';img.loading='lazy';thumb.append(img);
 let watermark=document.createElement('span');watermark.className='watermark';watermark.textContent=(a.shortName||a.name).slice(0,2).toUpperCase();thumb.append(watermark);thumb.onclick=()=>openGame(a);
 let body=document.createElement('div');body.className='card-body';
 let type=document.createElement('span');type.className='card-kicker';type.textContent=category(a);let title=document.createElement('h3');title.textContent=a.name;
 let desc=document.createElement('p');desc.textContent=a.description;
 let meta=document.createElement('div');meta.className='card-meta';let score=document.createElement('span');score.textContent=showScore(a);let state=document.createElement('span');state.textContent=a.local?'INSTANT PLAY':'BROWSER APP';meta.append(score,state);
 let actions=document.createElement('div');actions.className='card-actions';let play=document.createElement('button');play.className='button primary';play.type='button';play.textContent='▶ Play';play.onclick=()=>openGame(a);
 let fav=document.createElement('button');fav.className='favorite';fav.type='button';fav.textContent=favorites.includes(a.id)?'★':'☆';fav.title='Toggle favorite';fav.setAttribute('aria-pressed',String(favorites.includes(a.id)));fav.setAttribute('aria-label','Favorite '+a.name);fav.onclick=()=>{favorites=favorites.includes(a.id)?favorites.filter(i=>i!==a.id):[...favorites,a.id];save(keys.favorite,favorites);draw()};
 actions.append(play,fav);body.append(type,title,desc,meta,actions);el.append(thumb,body);return el
}
function draw(){let items=filtered();byId('games').replaceChildren(...items.map(card));byId('empty').hidden=!!items.length;byId('libraryCount').textContent=items.length+' of '+apps.length+' games';const recent=apps.find(a=>a.id===recentIds[0])||apps.find(a=>getId(a)==='2048')||apps[0];if(recent){let b=byId('continueButton');b.textContent=(recentIds.length?'Continue ':'Play ')+recent.name+' ↗';b.onclick=()=>openGame(recent)}}
function openGame(a){active=a;recentIds=[a.id,...recentIds.filter(id=>id!==a.id)].slice(0,25);save(keys.recentIds,recentIds);
 byId('stageTitle').textContent=a.name;byId('stageIcon').src=new URL('../'+a.icon.src,location.href).href;
 byId('stageHint').textContent=a.local?'Click the game for keyboard and controller input':'External app · controls vary';
 byId('externalGame').href=a.launch.url;frame.src=a.launch.url;frame.title=a.name;stage.hidden=false;root.hidden=true;document.title=a.name+' — JAT Arcade';
 window.history.replaceState({jatArcade:a.id},'','#play='+encodeURIComponent(getId(a)));byId('closeGame').focus();
}
function closeGame(){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});frame.removeAttribute('src');stage.hidden=true;root.hidden=false;active=null;document.title='JAT Arcade — Jeremy Anderson Tech';window.history.replaceState({},'','#');draw();byId('search').focus()}
byId('closeGame').onclick=closeGame;
byId('reloadGame').onclick=()=>{if(active)frame.src=active.launch.url};
byId('fullGame').onclick=()=>{if(!document.fullscreenElement)stage.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.().catch(()=>{})};
byId('helpButton').onclick=()=>byId('controlsDialog').showModal();
byId('clearFilters').onclick=()=>{filter='All';query='';byId('search').value='';drawFilters();draw()};
byId('search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();draw()});
byId('sort').addEventListener('change',draw);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!document.fullscreenElement){closeGame()}});
document.addEventListener('fullscreenchange',()=>{byId('fullGame').title=document.fullscreenElement?'Exit fullscreen':'Fullscreen game'});
window.addEventListener('storage',e=>{if(e.key===keys.scores||e.key==='jat-2048-best'||e.key==='jat-snake-best')draw()});
const buttonMapping=[{code:'ArrowUp',index:12},{code:'ArrowDown',index:13},{code:'ArrowLeft',index:14},{code:'ArrowRight',index:15},{code:'Enter',index:0},{code:'Escape',index:1},{code:' ',index:2}];
const prev=new Map();
function controllerTick(t){
 let gamepads=navigator.getGamepads?.()||[];let gp=[...gamepads].find(Boolean);byId('controllerStatus').textContent=gp?'🎮 '+gp.id.slice(0,24):'⌘ Keyboard & touch';
 if(gp&&active&&active.local){let btn=[...buttonMapping];
 const ax=gp.axes?.[0]||0,ay=gp.axes?.[1]||0;
 btn.forEach(b=>{let pressed=!!gp.buttons[b.index]?.pressed;if(b.code==='ArrowLeft'&&ax<-.6||b.code==='ArrowRight'&&ax>.6||b.code==='ArrowUp'&&ay<-.6||b.code==='ArrowDown'&&ay>.6)pressed=true;
 const k=b.code+'-'+gp.index;let was=prev.get(k)||false;
 if(pressed!==was){lastMove=t;frame.contentWindow?.postMessage({type:'jat-arcade:gamepad',key:b.code,pressed},location.origin)}
 prev.set(k,pressed);
 })}else prev.clear();
 requestAnimationFrame(controllerTick)
}
requestAnimationFrame(controllerTick);
load();
