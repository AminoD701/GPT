(() => {
  'use strict';

  const API_URL='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const STORAGE_KEY='mabi-guild-character-task-progress-v1';
  const HOUR=3600000, RESET_SHIFT=2*HOUR;
  const TASKS=[
    {id:'abyss-1',name:'深淵1－沉默的迴廊',cycle:'weekly'},
    {id:'abyss-2',name:'深淵2－崩塌的祭壇',cycle:'weekly'},
    {id:'abyss-3',name:'深淵3－毀滅的殿堂',cycle:'weekly'},
    {id:'raid-gris',name:'團隊副本－格里斯貝恩',cycle:'weekly'},
    {id:'deep-dungeon',name:'深層地下城',cycle:'daily'},
    {id:'weekday-dungeon',name:'週幾地下城',cycle:'daily'},
    {id:'part-time',name:'兼職任務',cycle:'weekly'},
    {id:'black-pit-14',name:'黑色坑洞14次',cycle:'weekly'},
    {id:'ominous-barrier-7',name:'不祥結界7次',cycle:'weekly'},
    {id:'tir-food',name:'提爾克那－食材兌換',cycle:'weekly'},
    {id:'tir-alloy',name:'提爾克那－合金鋼錠',cycle:'daily',materials:[['鋼錠',8]]},
    {id:'tir-board',name:'提爾克那－佈告欄',cycle:'weekly'},
    {id:'dun-food',name:'杜巴頓－食材兌換',cycle:'weekly'},
    {id:'dun-special-steel',name:'杜巴頓－特殊鋼錠',cycle:'daily',materials:[['合金鋼錠',8]]},
    {id:'dun-board',name:'杜巴頓－佈告欄',cycle:'weekly'},
    {id:'cobh-food',name:'庫漢－食材兌換',cycle:'weekly'},
    {id:'cobh-board',name:'庫漢－佈告欄',cycle:'weekly'},
    {id:'dugald-lumber',name:'杜加德走廊－高級木材',cycle:'daily',materials:[['炒蔬菜',2]]}
  ];
  const DAILY=TASKS.filter(t=>t.cycle==='daily'), WEEKLY=TASKS.filter(t=>t.cycle==='weekly');
  let selectedRole=0, selectedMember='', selectedLabel='', selectedRoleName='';
  let syncState='idle', syncText='共用進度';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function cycleKeys(now=Date.now()){
    const d=new Date(now+RESET_SHIFT), iso=x=>`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const offset=(d.getUTCDay()+6)%7;
    return {daily:iso(d),weekly:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset)))};
  }
  function save(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
  function load(){
    let s;try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{s=null;}
    const k=cycleKeys(); if(!s||!s.members)s={version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    let changed=false;
    if(s.dailyKey!==k.daily){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.daily={}));s.dailyKey=k.daily;changed=true;}
    if(s.weeklyKey!==k.weekly){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.weekly={}));s.weeklyKey=k.weekly;changed=true;}
    if(changed)save(s);return s;
  }
  function memberKey(){return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');}
  function roleState(s,m,i){s.members[m]||={roles:{}};s.members[m].roles||={};s.members[m].roles[i]||={daily:{},weekly:{}};s.members[m].roles[i].daily||={};s.members[m].roles[i].weekly||={};return s.members[m].roles[i];}
  const done=(r,t)=>!!r[t.cycle]?.[t.id];
  const progress=(r,list)=>{const d=list.filter(t=>done(r,t)).length;return {done:d,total:list.length,pct:Math.round(d/list.length*100)}};

  function setSync(state,text){
    syncState=state;syncText=text;
    const node=$('#mabiTaskDialogSub');
    if(node)node.textContent=`每日 06:00／每週一 06:00 自動重置（台灣時間） · ${text}`;
  }

  async function fetchShared(){
    const k=cycleKeys();
    setSync('loading','正在同步共用進度…');
    try{
      const url=new URL(API_URL);url.searchParams.set('action','read');url.searchParams.set('dailyKey',k.daily);url.searchParams.set('weeklyKey',k.weekly);url.searchParams.set('_',Date.now());
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(!data?.ok||!Array.isArray(data.items))throw new Error(data?.error||'共用資料格式錯誤');
      const s=load();
      for(const item of data.items){
        const task=TASKS.find(t=>t.id===item.taskId);if(!task)continue;
        const r=roleState(s,String(item.memberKey||''),Number(item.roleIndex)||0);
        r[task.cycle][task.id]=!!item.done;
      }
      save(s);
      setSync('ok','共用進度已同步');
      return true;
    }catch(error){
      console.warn('[Task Journal] 共用進度讀取失敗，使用本機暫存：',error);
      setSync('error','共用同步失敗，暫用本機紀錄');
      return false;
    }
  }

  async function writeShared(task,checked){
    const k=cycleKeys();
    const body=new URLSearchParams({
      action:'update',
      memberKey:selectedMember,
      roleIndex:String(selectedRole),
      roleName:selectedRoleName||selectedLabel,
      taskId:task.id,
      cycle:task.cycle,
      cycleKey:task.cycle==='daily'?k.daily:k.weekly,
      done:String(!!checked)
    });
    setSync('loading','正在儲存共用進度…');
    try{
      const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(!data?.ok)throw new Error(data?.error||'共用儲存失敗');
      setSync('ok','已儲存到共用進度');
      return true;
    }catch(error){
      console.warn('[Task Journal] 共用進度寫入失敗，本機紀錄已保留：',error);
      setSync('error','共用儲存失敗，本機紀錄已保留');
      return false;
    }
  }

  function decorateRoles(){
    const roles=$('#modalRoles'); if(!roles||!$('#memberDialog')?.open)return;
    const s=load(), m=memberKey();
    [...roles.querySelectorAll('.role-row')].forEach((row,i)=>{
      row.classList.add('mabi-task-launch');row.dataset.taskRoleIndex=i;row.tabIndex=0;row.setAttribute('role','button');
      const r=roleState(s,m,i),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
      let h=row.querySelector('.mabi-role-task-hint');if(!h){h=document.createElement('div');h.className='mabi-role-task-hint';row.appendChild(h);}h.innerHTML=`<span>查看工作日誌</span><b>日 ${dp.done}/${dp.total} · 週 ${wp.done}/${wp.total}</b><i>→</i>`;
    }); save(s);
  }
  function ensureDialog(){
    let d=$('#mabiTaskDialog');if(d)return d;
    d=document.createElement('dialog');d.id='mabiTaskDialog';d.className='mabi-task-dialog';
    d.innerHTML='<div class="mabi-task-dialog-top"><div><span class="mabi-task-kicker">CHARACTER ROUTINE / CHECKLIST</span><h2 id="mabiTaskDialogTitle">角色工作日誌</h2><p id="mabiTaskDialogSub"></p></div><button type="button" class="mabi-task-dialog-close" aria-label="關閉">×</button></div><div class="mabi-task-dialog-content"><section id="mabiTaskTracker"></section></div>';
    document.body.appendChild(d);d.querySelector('.mabi-task-dialog-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;
  }
  function item(t,r){const c=done(r,t),mat=t.materials?.length?`<span class="mabi-task-material">需要：${t.materials.map(([n,q])=>`${esc(n)} ×${q}`).join('、')}</span>`:'';return `<label class="mabi-task-item ${c?'is-done':''}" data-task-row="${t.id}"><input type="checkbox" data-task-id="${t.id}" ${c?'checked':''}><span class="mabi-task-check"></span><span class="mabi-task-copy"><strong>${esc(t.name)}</strong>${mat}</span><span class="mabi-task-cycle ${t.cycle}">${t.cycle==='daily'?'每日':'每週'}</span></label>`;}
  function group(key,title,list,r,p,hint){return `<section class="mabi-task-group" data-task-group="${key}"><div class="mabi-task-group-head"><div><span class="mabi-task-group-kicker">${hint}</span><h4>${title}</h4></div><strong data-group-count>${p.done} / ${p.total}</strong></div><div class="mabi-task-progress"><i data-group-progress style="width:${p.pct}%"></i></div><div class="mabi-task-list">${list.map(t=>item(t,r)).join('')}</div></section>`;}
  function materialsMarkup(r){const totals=new Map();TASKS.forEach(t=>{if(!done(r,t))t.materials?.forEach(([n,q])=>totals.set(n,(totals.get(n)||0)+q));});return totals.size?[...totals].map(([n,q])=>`<span>${esc(n)} <b>×${q}</b></span>`).join(''):'<span class="done">目前沒有待準備材料 ✓</span>';}
  function renderDialog(keepScroll=false){
    const d=ensureDialog(),content=d.querySelector('.mabi-task-dialog-content'),oldScroll=keepScroll?content.scrollTop:0,s=load(),r=roleState(s,selectedMember,selectedRole),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
    $('#mabiTaskDialogTitle').textContent=`${selectedLabel}｜工作日誌`;$('#mabiTaskDialogSub').textContent=`每日 06:00／每週一 06:00 自動重置（台灣時間） · ${syncText}`;
    $('#mabiTaskTracker').innerHTML=`<div class="mabi-task-title-row"><div><h3>每日／每週工作</h3><p>所有裝置共用同一份角色進度。</p></div><div class="mabi-task-total"><span>目前完成</span><strong data-total-count>${dp.done+wp.done} / ${dp.total+wp.total}</strong></div></div><div class="mabi-task-summary-grid"><div><span>今日</span><strong data-summary-daily>${dp.done} / ${dp.total}</strong><small data-summary-daily-pct>${dp.pct}% 完成</small></div><div><span>本週</span><strong data-summary-weekly>${wp.done} / ${wp.total}</strong><small data-summary-weekly-pct>${wp.pct}% 完成</small></div></div><div class="mabi-material-box"><div><span>尚需準備材料</span><small>只統計這個角色未完成的工作</small></div><div class="mabi-material-list" data-material-list>${materialsMarkup(r)}</div></div><div class="mabi-task-columns">${group('daily','每日工作',DAILY,r,dp,'每天 06:00 清空')}${group('weekly','每週工作',WEEKLY,r,wp,'每週一 06:00 清空')}</div><div class="mabi-task-safe-bottom" aria-hidden="true"></div>`;save(s);content.scrollTop=oldScroll;
  }
  function updateVisibleState(){
    const d=$('#mabiTaskDialog');if(!d?.open)return;
    const s=load(),r=roleState(s,selectedMember,selectedRole),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
    d.querySelector('[data-total-count]').textContent=`${dp.done+wp.done} / ${dp.total+wp.total}`;
    d.querySelector('[data-summary-daily]').textContent=`${dp.done} / ${dp.total}`;d.querySelector('[data-summary-daily-pct]').textContent=`${dp.pct}% 完成`;
    d.querySelector('[data-summary-weekly]').textContent=`${wp.done} / ${wp.total}`;d.querySelector('[data-summary-weekly-pct]').textContent=`${wp.pct}% 完成`;
    [['daily',dp],['weekly',wp]].forEach(([k,p])=>{const g=d.querySelector(`[data-task-group="${k}"]`);if(!g)return;g.querySelector('[data-group-count]').textContent=`${p.done} / ${p.total}`;g.querySelector('[data-group-progress]').style.width=`${p.pct}%`;});
    d.querySelector('[data-material-list]').innerHTML=materialsMarkup(r);decorateRoles();
  }

  async function syncAndRefresh(){
    const ok=await fetchShared();
    if(ok){renderDialog(true);decorateRoles();}
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#memberGrid .member-card')){
      setTimeout(async()=>{decorateRoles();await fetchShared();decorateRoles();},0);
    }
    const row=e.target.closest('#modalRoles .role-row[data-task-role-index]');if(!row)return;
    selectedRole=Number(row.dataset.taskRoleIndex)||0;selectedMember=memberKey();const tag=row.querySelector('.role-tag')?.textContent?.trim()||`角色${selectedRole+1}`;const vals=[...(row.querySelectorAll('.role-cell span')||[])].map(x=>x.textContent.trim()).filter(Boolean);const id=vals.at(-1)||'';selectedRoleName=id&&id!=='—'?id:tag;selectedLabel=id&&id!=='—'?`${tag}・${id}`:tag;
    const d=ensureDialog();renderDialog();if(!d.open)d.showModal();syncAndRefresh();
  });
  document.addEventListener('keydown',e=>{const row=e.target.closest?.('#modalRoles .role-row[data-task-role-index]');if(!row||!['Enter',' '].includes(e.key))return;e.preventDefault();row.click();});
  document.addEventListener('change',e=>{
    const input=e.target.closest?.('#mabiTaskDialog [data-task-id]');if(!input)return;
    const s=load(),r=roleState(s,selectedMember,selectedRole),t=TASKS.find(x=>x.id===input.dataset.taskId);if(!t)return;
    r[t.cycle][t.id]=input.checked;save(s);const row=input.closest('.mabi-task-item');row?.classList.toggle('is-done',input.checked);input.blur();updateVisibleState();writeShared(t,input.checked);
  });
  window.addEventListener('focus',()=>{if($('#mabiTaskDialog')?.open)syncAndRefresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('#mabiTaskDialog')?.open)syncAndRefresh();});

  ensureDialog();
})();
