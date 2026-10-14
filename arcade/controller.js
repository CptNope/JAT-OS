/* Shared JAT Arcade controller and score adapter.
 * Each game still owns its gameplay. This module only translates gamepad keys and
 * reports existing visible scores to local storage within the same origin.
 */
(() => {
  const id = location.pathname.split('/').filter(Boolean).at(-1);
  const scoresKey = 'jat-arcade:scores:v1';
  const keyByButton = {12:'ArrowUp',13:'ArrowDown',14:'ArrowLeft',15:'ArrowRight',0:'Enter',1:'Escape',2:' '};
  const mapKey = key => {
    if (id === 'pong' || id === 'breakout') {
      if (key === 'ArrowUp') return id === 'pong' ? 'w' : 'ArrowLeft';
      if (key === 'ArrowDown') return id === 'pong' ? 's' : 'ArrowRight';
      if (key === 'ArrowLeft') return id === 'pong' ? 'w' : 'ArrowLeft';
      if (key === 'ArrowRight') return id === 'pong' ? 's' : 'ArrowRight';
    }
    if (id === 'connect4') {
      if (key === 'Enter') return '4';
      if (key === 'ArrowLeft') return '3';
      if (key === 'ArrowRight') return '5';
    }
    if (id === 'block-stack' && key === 'Enter') return 'ArrowUp';
    return key;
  };
  const held = new Set();
  const trigger = (key, pressed) => {
    key = mapKey(key);
    if (!pressed) {
      held.delete(key);
      document.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));
      return;
    }
    if (held.has(key)) return;
    held.add(key);
    // The keydown handlers already provided by each game remain the source of truth.
    document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
    if (!['w','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)) {
      held.delete(key);
      document.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));
    }
    // Accessible start and reset shortcuts for games that do not use keyboard activation.
    if (key === 'Enter' && ['pong','breakout','snake'].includes(id)) {
      const el=document.querySelector(id==='snake'?'#toggle':'#start');
      if(el && !['pong','breakout'].includes(id)) el.click();
      if(el && ['pong','breakout'].includes(id)) el.click();
    }
    if(key === 'Escape' && ['pong','breakout','snake','block-stack'].includes(id)) {
      const el=document.querySelector('#pause')||document.querySelector('#start')||document.querySelector('#toggle');
      if(el) el.click();
    }
  };
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const d=event.data;
    if(d?.type!=='jat-arcade:gamepad'||typeof d.key!=='string'||typeof d.pressed!=='boolean') return;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape',' '].includes(d.key))return;
    trigger(d.key,d.pressed);
  });
  // A directly launched game (outside the Arcade hub) can read its own gamepad.
  if(window===window.top && navigator.getGamepads){
    let previous=new Map();
    const poll=()=>{
      const pad=[...navigator.getGamepads()].find(Boolean);
      if(pad){
        for(const [index,key] of Object.entries(keyByButton)){
          let pressed=Boolean(pad.buttons[Number(index)]?.pressed);
          const x=pad.axes?.[0]||0,y=pad.axes?.[1]||0;
          if(key==='ArrowLeft')pressed ||= x<-.62;
          if(key==='ArrowRight')pressed ||= x>.62;
          if(key==='ArrowUp')pressed ||= y<-.62;
          if(key==='ArrowDown')pressed ||= y>.62;
          const was=previous.get(index)||false;
          if(pressed!==was)trigger(key,pressed);
          previous.set(index,pressed);
        }
      }else previous.clear();
      requestAnimationFrame(poll);
    };requestAnimationFrame(poll);
  }
  // Expose best-score data through the same local score registry, without
  // pretending that scores from independently hosted games are readable.
  const selector={
    '2048':'#score',snake:'#score',breakout:'#score',
    'block-stack':'#score',memory:'#moves',minesweeper:'#time',
    pong:'#p',connect4:'#msg'
  }[id];
  if(selector){
    let last='';
    const report=()=>{
      const el=document.querySelector(selector);if(!el)return;
      const value=(el.textContent||'').trim();if(value===last)return;last=value;
      let store;try{store=JSON.parse(localStorage.getItem(scoresKey)||'{}')}catch{store={}}
      if(id==='2048'||id==='snake'||id==='breakout'||id==='block-stack'||id==='pong'){
        const num=Number(value);if(!Number.isFinite(num))return;
        if(num>(store[id]||0))store[id]=num;
      }else if(id==='memory'){
        const pairs=Number(document.querySelector('#pairs')?.textContent||0);
        const moves=Number(value);
        if(pairs===8 && moves>0)store[id]=store[id]?Math.min(store[id],moves):moves;
      }else if(id==='connect4'){
        if(value.toLowerCase().includes('you win'))store[id]=(store[id]||0)+1;
      }else if(id==='minesweeper'){
        const message=document.querySelector('#status')?.textContent||'';
        if(message.toLowerCase().includes('cleared')){const t=Number(value);if(t>0)store[id]=store[id]?Math.min(store[id],t):t}
      }
      try{localStorage.setItem(scoresKey,JSON.stringify(store))}catch{}
    };
    new MutationObserver(report).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    report();
  }
})();