(() => {
  'use strict';
  const API='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const KEY='mabi-guild-character-task-progress-v1';
  const SHIFT=2*3600000;
  const TASKS=[['abyss-1','weekly'],['abyss-2','weekly'],['abyss-3','weekly'],['raid-gris','weekly'],['deep-dungeon','daily'],['weekday-dungeon','daily'],['part-time','weekly'],['black-pit-14','weekly'],['ominous-barrier-7','weekly'],['tir-food','weekly'],['tir-alloy','daily'],['tir-board','weekly'],['dun-food','weekly'],['dun-special-steel','daily'],['dun-board','weekly'],['cobh-food','weekly'],['cobh-board','weekly'],['dugald-lumber','daily']].map(([id,cycle])=>({id,cycle}));
  const DAILY=TASKS.filter(x=>x.cycle==='daily'), WEEKLY=TASKS.filter(x=>x.cycle==='weekly');
  const $=s=>document.querySelector(s);
  let busy=false,timer=0;

  function keys(now=Date.now()){
    const d=new Date(now+SHIFT),iso=x=>`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const offset=(d.getUTCDay()+6)%7;
    return {daily:iso(d),weekly:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset)))};
  }
  function load(){
    let s;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch{s=null}
    const k=keys();
    if(!s||!s.members)s={version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    if(s.dailyKey!==k.daily){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.daily={}));s.dailyKey=k.daily}
    if(s.weeklyKey!==k.weekly){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.weekly={}));s.weeklyKey=k.weekly}
    return s;
  }
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
  function role(s,m,i){s.members[m]||={roles:{}};s.members[m].roles||={};s.members[m].roles[i]||={daily:{},weekly:{}};s.members[m].roles[i].daily||={};s.members[m].roles[i].weekly||={};return s.members[m].roles[i]}
  function asBool(v){return v===true||v===1||['true','1','yes'].includes(String(v??'').trim().toLowerCase())}
  function memberKey(){return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||')}
  function prog(r,list){const done=list.filter(t=>!!r?.[t.cycle]?.[t.id]).length;return {done,total:list.length,pct:Math.round(done/list.length*100)}}

  function apply(items){
    // Google Sheet row order is authoritative: last matching row wins.
    const latest=new Map();
    items.forEach(item=>{
      const task=TASKS.find(t=>t.id===String(item.taskId||''));if(!task)return;
      latest.set([String(item.memberKey||''),Number(item.roleIndex)||0,task.id].join('|'),{item,task});
    });
    const s=load();
    for(const {item,task} of latest.values()){
      const m=String(item.memberKey||'');if(!m)continue;
      role(s,m,Number(item.roleIndex)||0)[task.cycle][task.id]=asBool(item.done);
    }
    save(s);
  }

  function openRoleIndex(){
    const title=$('#mabiTaskDialogTitle')?.textContent||'';
    const rows=[...document.querySelectorAll('#modalRoles .role-row')];
    const i=rows.findIndex(row=>{
      const tag=row.querySelector('.role-tag')?.textContent?.trim()||'';
      const vals=[...row.querySelectorAll('.role-cell span')].map(x=>x.textContent.trim()).filter(Boolean);
      const id=vals.at(-1)||'';
      return (tag&&title.includes(tag))||(id&&id!=='—'&&title.includes(id));
    });
    return i<0?0:i;
  }

  function paint(){
    const s=load(),m=memberKey(),roles=$('#modalRoles');
    if(roles&&$('#memberDialog')?.open){
      [...roles.querySelectorAll('.role-row')].forEach((row,i)=>{
        const r=role(s,m,i),d=prog(r,DAILY),w=prog(r,WEEKLY),h=row.querySelector('.mabi-role-task-hint');
        if(h)h.innerHTML=`<span>查看工作日誌</span><b>日 ${d.done}/${d.total} · 週 ${w.done}/${w.total}</b><i>→</i>`;
      });
    }
    const dlg=$('#mabiTaskDialog');if(!dlg?.open)return;
    const r=role(s,m,openRoleIndex()),d=prog(r,DAILY),w=prog(r,WEEKLY);
    TASKS.forEach(t=>{const input=dlg.querySelector(`[data-task-id="${t.id}"]`);if(!input)return;const checked=!!r?.[t.cycle]?.[t.id];input.checked=checked;input.closest('.mabi-task-item')?.classList.toggle('is-done',checked)});
    const set=(q,v)=>{const n=dlg.querySelector(q);if(n)n.textContent=v};
    set('[data-total-count]',`${d.done+w.done} / ${d.total+w.total}`);set('[data-summary-daily]',`${d.done} / ${d.total}`);set('[data-summary-daily-pct]',`${d.pct}% 完成`);set('[data-summary-weekly]',`${w.done} / ${w.total}`);set('[data-summary-weekly-pct]',`${w.pct}% 完成`);
    [['daily',d],['weekly',w]].forEach(([k,p])=>{const g=dlg.querySelector(`[data-task-group="${k}"]`);if(!g)return;const c=g.querySelector('[data-group-count]'),b=g.querySelector('[data-group-progress]');if(c)c.textContent=`${p.done} / ${p.total}`;if(b)b.style.width=`${p.pct}%`});
    const sub=$('#mabiTaskDialogSub');if(sub)sub.textContent='每日 06:00／每週一 06:00 自動重置（台灣時間） · 共用進度已同步';
  }

  async function sync(){
    if(busy||document.visibilityState==='hidden')return;busy=true;
    try{
      const k=keys(),u=new URL(API);u.searchParams.set('action','read');u.searchParams.set('dailyKey',k.daily);u.searchParams.set('weeklyKey',k.weekly);u.searchParams.set('_',Date.now());
      const res=await fetch(u.toString(),{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();if(!data?.ok||!Array.isArray(data.items))throw new Error('invalid payload');
      apply(data.items);paint();
    }catch(e){console.warn('[Task Sync v3]',e)}finally{busy=false}
  }
  function schedule(ms=500){clearTimeout(timer);timer=setTimeout(sync,ms)}
  window.addEventListener('focus',()=>schedule(50));window.addEventListener('pageshow',()=>schedule(50));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(50)});
  document.addEventListener('click',e=>{if(e.target.closest('#memberGrid .member-card,#modalRoles .role-row'))schedule(900)});
  document.addEventListener('change',e=>{if(e.target.closest?.('#mabiTaskDialog [data-task-id]'))schedule(1400)});
  setInterval(()=>{if($('#memberDialog')?.open||$('#mabiTaskDialog')?.open)sync()},4000);
})();
