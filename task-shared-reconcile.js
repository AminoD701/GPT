(() => {
  'use strict';

  const API_URL='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const STORAGE_KEY='mabi-guild-character-task-progress-v1';
  const HOUR=3600000, RESET_SHIFT=2*HOUR;
  const TASKS=[
    {id:'abyss-1',cycle:'weekly'},{id:'abyss-2',cycle:'weekly'},{id:'abyss-3',cycle:'weekly'},{id:'raid-gris',cycle:'weekly'},
    {id:'deep-dungeon',cycle:'daily'},{id:'weekday-dungeon',cycle:'daily'},
    {id:'part-time',cycle:'weekly'},{id:'black-pit-14',cycle:'weekly'},{id:'ominous-barrier-7',cycle:'weekly'},
    {id:'tir-food',cycle:'weekly'},{id:'tir-alloy',cycle:'daily',materials:[['鋼錠',8]]},{id:'tir-board',cycle:'weekly'},
    {id:'dun-food',cycle:'weekly'},{id:'dun-special-steel',cycle:'daily',materials:[['合金鋼錠',8]]},{id:'dun-board',cycle:'weekly'},
    {id:'cobh-food',cycle:'weekly'},{id:'cobh-board',cycle:'weekly'},{id:'dugald-lumber',cycle:'daily',materials:[['炒蔬菜',2]]}
  ];
  const DAILY=TASKS.filter(t=>t.cycle==='daily');
  const WEEKLY=TASKS.filter(t=>t.cycle==='weekly');
  const $=s=>document.querySelector(s);

  function cycleKeys(now=Date.now()){
    const d=new Date(now+RESET_SHIFT), iso=x=>`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const offset=(d.getUTCDay()+6)%7;
    return {daily:iso(d),weekly:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset)))};
  }

  function load(){
    let s;try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{s=null;}
    const k=cycleKeys();
    if(!s||!s.members)s={version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    if(s.dailyKey!==k.daily){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.daily={}));s.dailyKey=k.daily;}
    if(s.weeklyKey!==k.weekly){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.weekly={}));s.weeklyKey=k.weekly;}
    return s;
  }
  function save(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
  function roleState(s,m,i){s.members[m]||={roles:{}};s.members[m].roles||={};s.members[m].roles[i]||={daily:{},weekly:{}};s.members[m].roles[i].daily||={};s.members[m].roles[i].weekly||={};return s.members[m].roles[i];}
  function memberKey(){return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');}
  function done(r,t){return !!r?.[t.cycle]?.[t.id];}
  function progress(r,list){const count=list.filter(t=>done(r,t)).length;return {done:count,total:list.length,pct:Math.round(count/list.length*100)};}
  function parseTime(value){
    const text=String(value||'').trim();
    if(!text)return 0;
    const normalized=text.replace('上午','AM').replace('下午','PM');
    const parsed=Date.parse(normalized);
    return Number.isFinite(parsed)?parsed:0;
  }

  function reconcile(items){
    const latest=new Map();
    items.forEach((item,index)=>{
      const key=[item.memberKey,item.roleIndex,item.taskId,item.cycle,item.cycleKey].join('|');
      const stamp=parseTime(item.updatedAt);
      const prev=latest.get(key);
      if(!prev||stamp>prev.stamp||(stamp===prev.stamp&&index>prev.index))latest.set(key,{item,stamp,index});
    });
    const s=load();
    for(const {item} of latest.values()){
      const task=TASKS.find(t=>t.id===item.taskId);if(!task)continue;
      const r=roleState(s,String(item.memberKey||''),Number(item.roleIndex)||0);
      r[task.cycle][task.id]=item.done===true||String(item.done).toLowerCase()==='true';
    }
    save(s);
  }

  async function sync(){
    try{
      const k=cycleKeys();
      const url=new URL(API_URL);
      url.searchParams.set('action','read');url.searchParams.set('dailyKey',k.daily);url.searchParams.set('weeklyKey',k.weekly);url.searchParams.set('_',Date.now());
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(!data?.ok||!Array.isArray(data.items))throw new Error(data?.error||'invalid data');
      reconcile(data.items);
      refreshRoleCards();
      refreshOpenDialog();
    }catch(error){console.warn('[Task Shared Reconcile] sync failed:',error);}
  }

  function refreshRoleCards(){
    const roles=$('#modalRoles');if(!roles||!$('#memberDialog')?.open)return;
    const s=load(),m=memberKey();
    [...roles.querySelectorAll('.role-row')].forEach((row,i)=>{
      const r=roleState(s,m,i),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
      const hint=row.querySelector('.mabi-role-task-hint');
      if(hint)hint.innerHTML=`<span>查看工作日誌</span><b>日 ${dp.done}/${dp.total} · 週 ${wp.done}/${wp.total}</b><i>→</i>`;
    });
    save(s);
  }

  function refreshOpenDialog(){
    const dialog=$('#mabiTaskDialog');if(!dialog?.open)return;
    const title=$('#mabiTaskDialogTitle')?.textContent||'';
    const roleRows=[...document.querySelectorAll('#modalRoles .role-row')];
    let roleIndex=roleRows.findIndex(row=>{const tag=row.querySelector('.role-tag')?.textContent?.trim()||'';const vals=[...row.querySelectorAll('.role-cell span')].map(x=>x.textContent.trim());const id=vals.at(-1)||'';return title.includes(tag)||title.includes(id);});
    if(roleIndex<0)roleIndex=0;
    const s=load(),r=roleState(s,memberKey(),roleIndex),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
    TASKS.forEach(t=>{const input=dialog.querySelector(`[data-task-id="${t.id}"]`);if(!input)return;const checked=done(r,t);input.checked=checked;input.closest('.mabi-task-item')?.classList.toggle('is-done',checked);});
    const total=dialog.querySelector('[data-total-count]');if(total)total.textContent=`${dp.done+wp.done} / ${dp.total+wp.total}`;
    const sd=dialog.querySelector('[data-summary-daily]');if(sd)sd.textContent=`${dp.done} / ${dp.total}`;
    const sdp=dialog.querySelector('[data-summary-daily-pct]');if(sdp)sdp.textContent=`${dp.pct}% 完成`;
    const sw=dialog.querySelector('[data-summary-weekly]');if(sw)sw.textContent=`${wp.done} / ${wp.total}`;
    const swp=dialog.querySelector('[data-summary-weekly-pct]');if(swp)swp.textContent=`${wp.pct}% 完成`;
    [['daily',dp],['weekly',wp]].forEach(([key,p])=>{const g=dialog.querySelector(`[data-task-group="${key}"]`);if(!g)return;const c=g.querySelector('[data-group-count]');if(c)c.textContent=`${p.done} / ${p.total}`;const bar=g.querySelector('[data-group-progress]');if(bar)bar.style.width=`${p.pct}%`;});
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('#memberGrid .member-card'))setTimeout(sync,120);
    if(event.target.closest('#modalRoles .role-row'))setTimeout(sync,120);
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('#memberDialog')?.open)sync();});
})();
