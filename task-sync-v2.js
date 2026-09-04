(() => {
  'use strict';

  const API_URL='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const STORAGE_KEY='mabi-guild-character-task-progress-v1';
  const RESET_SHIFT=2*3600000;
  const TASKS=[
    ['abyss-1','weekly'],['abyss-2','weekly'],['abyss-3','weekly'],['raid-gris','weekly'],
    ['deep-dungeon','daily'],['weekday-dungeon','daily'],['part-time','weekly'],['black-pit-14','weekly'],
    ['ominous-barrier-7','weekly'],['tir-food','weekly'],['tir-alloy','daily'],['tir-board','weekly'],
    ['dun-food','weekly'],['dun-special-steel','daily'],['dun-board','weekly'],['cobh-food','weekly'],
    ['cobh-board','weekly'],['dugald-lumber','daily']
  ].map(([id,cycle])=>({id,cycle}));
  const DAILY=TASKS.filter(t=>t.cycle==='daily');
  const WEEKLY=TASKS.filter(t=>t.cycle==='weekly');
  let syncing=false;
  let timer=0;

  const $=s=>document.querySelector(s);

  function cycleKeys(now=Date.now()){
    const d=new Date(now+RESET_SHIFT);
    const iso=x=>`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const offset=(d.getUTCDay()+6)%7;
    return {
      daily:iso(d),
      weekly:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset)))
    };
  }

  function bool(v){
    if(v===true||v===1)return true;
    const s=String(v??'').trim().toLowerCase();
    return s==='true'||s==='1'||s==='yes';
  }

  function load(){
    let s;
    try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{s=null;}
    const k=cycleKeys();
    if(!s||!s.members)s={version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    if(s.dailyKey!==k.daily){
      Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.daily={}));
      s.dailyKey=k.daily;
    }
    if(s.weeklyKey!==k.weekly){
      Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.weekly={}));
      s.weeklyKey=k.weekly;
    }
    return s;
  }

  function save(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
  function roleState(s,m,i){
    s.members[m]||={roles:{}};
    s.members[m].roles||={};
    s.members[m].roles[i]||={daily:{},weekly:{}};
    s.members[m].roles[i].daily||={};
    s.members[m].roles[i].weekly||={};
    return s.members[m].roles[i];
  }
  function memberKey(){
    return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');
  }
  function progress(r,list){
    const done=list.filter(t=>!!r?.[t.cycle]?.[t.id]).length;
    return {done,total:list.length,pct:Math.round(done/list.length*100)};
  }

  function applyServer(items){
    // Apps Script returns sheet rows in row order. The last row for a task is authoritative.
    // This deliberately avoids Date.parse because Google Sheets may return localized Chinese timestamps.
    const latest=new Map();
    items.forEach((item,index)=>{
      const task=TASKS.find(t=>t.id===String(item.taskId||''));
      if(!task)return;
      const key=[String(item.memberKey||''),Number(item.roleIndex)||0,task.id,task.cycle].join('|');
      latest.set(key,{item,index,task});
    });

    const s=load();
    for(const {item,task} of latest.values()){
      const m=String(item.memberKey||'');
      if(!m)continue;
      const r=roleState(s,m,Number(item.roleIndex)||0);
      r[task.cycle][task.id]=bool(item.done);
    }
    save(s);
  }

  function findOpenRoleIndex(){
    const rows=[...document.querySelectorAll('#modalRoles .role-row')];
    const title=$('#mabiTaskDialogTitle')?.textContent||'';
    let index=rows.findIndex(row=>{
      const tag=row.querySelector('.role-tag')?.textContent?.trim()||'';
      const vals=[...row.querySelectorAll('.role-cell span')].map(x=>x.textContent.trim()).filter(Boolean);
      const id=vals.at(-1)||'';
      return (tag&&title.includes(tag))||(id&&id!=='—'&&title.includes(id));
    });
    return index<0?0:index;
  }

  function refreshRoleCards(){
    const roles=$('#modalRoles');
    if(!roles||!$('#memberDialog')?.open)return;
    const s=load(),m=memberKey();
    [...roles.querySelectorAll('.role-row')].forEach((row,i)=>{
      const r=roleState(s,m,i),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
      const hint=row.querySelector('.mabi-role-task-hint');
      if(hint)hint.innerHTML=`<span>查看工作日誌</span><b>日 ${dp.done}/${dp.total} · 週 ${wp.done}/${wp.total}</b><i>→</i>`;
    });
  }

  function refreshDialog(){
    const dialog=$('#mabiTaskDialog');
    if(!dialog?.open)return;
    const s=load(),r=roleState(s,memberKey(),findOpenRoleIndex());
    const dp=progress(r,DAILY),wp=progress(r,WEEKLY);

    TASKS.forEach(t=>{
      const input=dialog.querySelector(`[data-task-id="${t.id}"]`);
      if(!input)return;
      const checked=!!r?.[t.cycle]?.[t.id];
      input.checked=checked;
      input.closest('.mabi-task-item')?.classList.toggle('is-done',checked);
    });

    const set=(sel,text)=>{const n=dialog.querySelector(sel);if(n)n.textContent=text;};
    set('[data-total-count]',`${dp.done+wp.done} / ${dp.total+wp.total}`);
    set('[data-summary-daily]',`${dp.done} / ${dp.total}`);
    set('[data-summary-daily-pct]',`${dp.pct}% 完成`);
    set('[data-summary-weekly]',`${wp.done} / ${wp.total}`);
    set('[data-summary-weekly-pct]',`${wp.pct}% 完成`);
    [['daily',dp],['weekly',wp]].forEach(([key,p])=>{
      const g=dialog.querySelector(`[data-task-group="${key}"]`);
      if(!g)return;
      const c=g.querySelector('[data-group-count');
      const bar=g.querySelector('[data-group-progress]');
      if(c)c.textContent=`${p.done} / ${p.total}`;
      if(bar)bar.style.width=`${p.pct}%`;
    });

    const sub=$('#mabiTaskDialogSub');
    if(sub&&!sub.textContent.includes('共用進度已同步')){
      sub.textContent='每日 06:00／每週一 06:00 自動重置（台灣時間） · 共用進度已同步';
    }
  }

  async function sync(){
    if(syncing||document.visibilityState==='hidden')return;
    syncing=true;
    try{
      const k=cycleKeys();
      const url=new URL(API_URL);
      url.searchParams.set('action','read');
      url.searchParams.set('dailyKey',k.daily);
      url.searchParams.set('weeklyKey',k.weekly);
      url.searchParams.set('_',Date.now());
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(!data?.ok||!Array.isArray(data.items))throw new Error('invalid sync payload');
      applyServer(data.items);
      refreshRoleCards();
      refreshDialog();
    }catch(error){
      console.warn('[Task Sync v2] sync failed:',error);
    }finally{
      syncing=false;
    }
  }

  function schedule(delay=700){
    clearTimeout(timer);
    timer=setTimeout(sync,delay);
  }

  window.addEventListener('focus',()=>schedule(50));
  window.addEventListener('pageshow',()=>schedule(50));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(50);});
  document.addEventListener('click',e=>{
    if(e.target.closest('#memberGrid .member-card,#modalRoles .role-row'))schedule(900);
  });
  document.addEventListener('change',e=>{
    if(e.target.closest?.('#mabiTaskDialog [data-task-id]'))schedule(1200);
  });
  setInterval(()=>{
    if($('#memberDialog')?.open||$('#mabiTaskDialog')?.open)sync();
  },5000);
})();
