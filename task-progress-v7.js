(() => {
  'use strict';

  const WRITE_API='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const SHEET_ID='1USPYBfsaIlIDvefmlIBEe4_cx_B4KoOhlHiMjymcfTs';
  const SHEET_NAME='工作日誌_共用';
  const STORAGE_KEY='mabi-guild-character-task-progress-v1';
  const SHIFT=2*3600000;
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
  const DAILY=TASKS.filter(t=>t.cycle==='daily');
  const WEEKLY=TASKS.filter(t=>t.cycle==='weekly');
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  let selectedRole=0;
  let selectedMember='';
  let selectedLabel='';
  let selectedRoleName='';
  let syncing=false;
  let syncText='共用進度';
  let lastServerRows=0;

  function keys(now=Date.now()){
    const d=new Date(now+SHIFT);
    const iso=x=>`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const offset=(d.getUTCDay()+6)%7;
    return {daily:iso(d),weekly:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset)))};
  }

  function normalizeDateKey(value){
    if(value instanceof Date&&!Number.isNaN(value.getTime())){
      return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
    }
    let s=String(value??'').trim();
    if(!s)return '';
    const dm=s.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
    if(dm)return `${dm[1]}-${String(Number(dm[2])+1).padStart(2,'0')}-${dm[3].padStart(2,'0')}`;
    const ymd=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if(ymd)return `${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`;
    return s;
  }

  function asBool(v){
    if(v===true||v===1)return true;
    return ['true','1','yes'].includes(String(v??'').trim().toLowerCase());
  }

  function load(){
    let s;
    try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{s=null;}
    const k=keys();
    if(!s||!s.members)s={version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    let changed=false;
    if(s.dailyKey!==k.daily){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.daily={}));s.dailyKey=k.daily;changed=true;}
    if(s.weeklyKey!==k.weekly){Object.values(s.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>r.weekly={}));s.weeklyKey=k.weekly;changed=true;}
    if(changed)save(s);
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
  function currentMemberKey(){return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');}
  const done=(r,t)=>!!r?.[t.cycle]?.[t.id];
  function progress(r,list){const n=list.filter(t=>done(r,t)).length;return {done:n,total:list.length,pct:Math.round(n/list.length*100)};}

  function setSync(text){
    syncText=text;
    const node=$('#mabiTaskDialogSub');
    if(node)node.textContent=`每日 06:00／每週一 06:00 自動重置（台灣時間） · ${text}`;
  }

  function gvizCell(row,index){
    const c=row?.c?.[index];
    if(!c)return '';
    return c.v??c.f??'';
  }

  function gvizDateCell(row,index){
    const c=row?.c?.[index];
    if(!c)return '';
    return normalizeDateKey(c.v??c.f??'') || normalizeDateKey(c.f??'');
  }

  function readSheetJsonp(){
    return new Promise((resolve,reject)=>{
      const id=`__mabiJournal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script=document.createElement('script');
      let settled=false;
      const cleanup=()=>{
        clearTimeout(timer);
        script.remove();
        try{delete window[id];}catch{window[id]=undefined;}
      };
      const fail=err=>{if(settled)return;settled=true;cleanup();reject(err);};
      window[id]=payload=>{
        if(settled)return;
        try{
          if(payload?.status&&payload.status!=='ok')throw new Error(payload?.errors?.[0]?.detailed_message||'Google Sheet query failed');
          const rows=payload?.table?.rows||[];
          const items=rows.map(row=>({
            memberKey:String(gvizCell(row,0)||'').trim(),
            roleIndex:Number(gvizCell(row,1))||0,
            roleName:String(gvizCell(row,2)||'').trim(),
            taskId:String(gvizCell(row,3)||'').trim(),
            cycle:String(gvizCell(row,4)||'').trim(),
            cycleKey:gvizDateCell(row,5),
            done:asBool(gvizCell(row,6)),
            updatedAt:String(gvizCell(row,7)||'').trim()
          })).filter(x=>x.memberKey&&x.taskId);
          settled=true;cleanup();resolve(items);
        }catch(e){fail(e);}
      };
      const tqx=`out:json;responseHandler:${id};reqId:${Date.now()}`;
      const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&headers=1&tqx=${encodeURIComponent(tqx)}&_=${Date.now()}`;
      script.src=url;
      script.async=true;
      script.onerror=()=>fail(new Error('Google Sheet JSONP load failed'));
      const timer=setTimeout(()=>fail(new Error('Google Sheet JSONP timeout')),10000);
      document.head.appendChild(script);
    });
  }

  async function readViaAppsScript(){
    const k=keys(),u=new URL(WRITE_API);
    u.searchParams.set('action','read');u.searchParams.set('dailyKey',k.daily);u.searchParams.set('weeklyKey',k.weekly);u.searchParams.set('_',Date.now());
    const res=await fetch(u.toString(),{cache:'no-store'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    if(!data?.ok||!Array.isArray(data.items))throw new Error('invalid sync payload');
    return data.items;
  }

  function applyServer(items){
    const k=keys();
    const latest=new Map();
    items.forEach(item=>{
      const task=TASKS.find(t=>t.id===String(item.taskId||''));
      if(!task)return;
      const expected=task.cycle==='daily'?k.daily:k.weekly;
      const cycleKey=normalizeDateKey(item.cycleKey);
      if(cycleKey&&cycleKey!==expected)return;
      const key=[String(item.memberKey||''),Number(item.roleIndex)||0,task.id].join('|');
      // Sheet/API rows are chronological; later matching row is authoritative.
      latest.set(key,{item,task});
    });
    const s=load();
    for(const {item,task} of latest.values()){
      const member=String(item.memberKey||'').trim();
      if(!member)continue;
      roleState(s,member,Number(item.roleIndex)||0)[task.cycle][task.id]=asBool(item.done);
    }
    save(s);
    lastServerRows=items.length;
  }

  async function fetchShared({silent=false}={}){
    if(syncing)return false;
    syncing=true;
    if(!silent)setSync('正在同步共用進度…');
    try{
      let items;
      let source='Google Sheet';
      try{
        items=await readSheetJsonp();
      }catch(sheetError){
        console.warn('[Task Journal v7] direct sheet read failed, fallback to Apps Script',sheetError);
        source='備援 API';
        items=await readViaAppsScript();
      }
      applyServer(items);
      setSync(`共用進度已同步 · ${source} ${lastServerRows} 筆`);
      decorateRoles();
      refreshOpenDialog();
      return true;
    }catch(e){
      console.warn('[Task Journal v7] read failed',e);
      setSync('共用同步失敗，暫用本機紀錄');
      return false;
    }finally{syncing=false;}
  }

  async function writeShared(task,checked){
    const k=keys();
    const body=new URLSearchParams({
      action:'update',memberKey:selectedMember,roleIndex:String(selectedRole),
      roleName:selectedRoleName||selectedLabel,taskId:task.id,cycle:task.cycle,
      cycleKey:task.cycle==='daily'?k.daily:k.weekly,done:String(!!checked)
    });
    setSync('正在儲存共用進度…');
    try{
      const res=await fetch(WRITE_API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString(),cache:'no-store'});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      if(!data?.ok)throw new Error(data?.error||'save failed');
      setSync('已儲存到共用進度，正在確認…');
      setTimeout(()=>fetchShared({silent:true}),1200);
      setTimeout(()=>fetchShared({silent:true}),3500);
      return true;
    }catch(e){
      console.warn('[Task Journal v7] write failed',e);
      setSync('共用儲存失敗，本機紀錄已保留');
      return false;
    }
  }

  function decorateRoles(){
    const roles=$('#modalRoles');
    if(!roles||!$('#memberDialog')?.open)return;
    const s=load(),m=currentMemberKey();
    [...roles.querySelectorAll('.role-row')].forEach((row,i)=>{
      row.classList.add('mabi-task-launch');row.dataset.taskRoleIndex=i;row.tabIndex=0;row.setAttribute('role','button');
      const r=roleState(s,m,i),d=progress(r,DAILY),w=progress(r,WEEKLY);
      let h=row.querySelector('.mabi-role-task-hint');
      if(!h){h=document.createElement('div');h.className='mabi-role-task-hint';row.appendChild(h);}
      h.innerHTML=`<span>查看工作日誌</span><b>日 ${d.done}/${d.total} · 週 ${w.done}/${w.total}</b><i>→</i>`;
    });
  }

  function ensureDialog(){
    let d=$('#mabiTaskDialog');
    if(d)return d;
    d=document.createElement('dialog');d.id='mabiTaskDialog';d.className='mabi-task-dialog';
    d.innerHTML='<div class="mabi-task-dialog-top"><div><span class="mabi-task-kicker">CHARACTER ROUTINE / CHECKLIST</span><h2 id="mabiTaskDialogTitle">角色工作日誌</h2><p id="mabiTaskDialogSub"></p></div><button type="button" class="mabi-task-dialog-close" aria-label="關閉">×</button></div><div class="mabi-task-dialog-content"><section id="mabiTaskTracker"></section></div>';
    document.body.appendChild(d);
    d.querySelector('.mabi-task-dialog-close').onclick=()=>d.close();
    d.addEventListener('click',e=>{if(e.target===d)d.close();});
    return d;
  }

  function item(t,r){
    const checked=done(r,t);
    const mat=t.materials?.length?`<span class="mabi-task-material">需要：${t.materials.map(([n,q])=>`${esc(n)} ×${q}`).join('、')}</span>`:'';
    return `<label class="mabi-task-item ${checked?'is-done':''}" data-task-row="${t.id}"><input type="checkbox" data-task-id="${t.id}" ${checked?'checked':''}><span class="mabi-task-check"></span><span class="mabi-task-copy"><strong>${esc(t.name)}</strong>${mat}</span><span class="mabi-task-cycle ${t.cycle}">${t.cycle==='daily'?'每日':'每週'}</span></label>`;
  }
  function group(key,title,list,r,p,hint){
    return `<section class="mabi-task-group" data-task-group="${key}"><div class="mabi-task-group-head"><div><span class="mabi-task-group-kicker">${hint}</span><h4>${title}</h4></div><strong data-group-count>${p.done} / ${p.total}</strong></div><div class="mabi-task-progress"><i data-group-progress style="width:${p.pct}%"></i></div><div class="mabi-task-list">${list.map(t=>item(t,r)).join('')}</div></section>`;
  }
  function materialsMarkup(r){
    const totals=new Map();
    TASKS.forEach(t=>{if(!done(r,t))t.materials?.forEach(([n,q])=>totals.set(n,(totals.get(n)||0)+q));});
    return totals.size?[...totals].map(([n,q])=>`<span>${esc(n)} <b>×${q}</b></span>`).join(''):'<span class="done">目前沒有待準備材料 ✓</span>';
  }

  function renderDialog(keepScroll=false){
    const d=ensureDialog(),content=d.querySelector('.mabi-task-dialog-content'),scroll=keepScroll?content.scrollTop:0;
    const s=load(),r=roleState(s,selectedMember,selectedRole),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
    $('#mabiTaskDialogTitle').textContent=`${selectedLabel}｜工作日誌`;
    $('#mabiTaskDialogSub').textContent=`每日 06:00／每週一 06:00 自動重置（台灣時間） · ${syncText}`;
    $('#mabiTaskTracker').innerHTML=`<div class="mabi-task-title-row"><div><h3>每日／每週工作</h3><p>所有裝置共用同一份角色進度。</p></div><div class="mabi-task-total"><span>目前完成</span><strong data-total-count>${dp.done+wp.done} / ${dp.total+wp.total}</strong></div></div><div class="mabi-task-summary-grid"><div><span>今日</span><strong data-summary-daily>${dp.done} / ${dp.total}</strong><small data-summary-daily-pct>${dp.pct}% 完成</small></div><div><span>本週</span><strong data-summary-weekly>${wp.done} / ${wp.total}</strong><small data-summary-weekly-pct>${wp.pct}% 完成</small></div></div><div class="mabi-material-box"><div><span>尚需準備材料</span><small>只統計這個角色未完成的工作</small></div><div class="mabi-material-list" data-material-list>${materialsMarkup(r)}</div></div><div class="mabi-task-columns">${group('daily','每日工作',DAILY,r,dp,'每天 06:00 清空')}${group('weekly','每週工作',WEEKLY,r,wp,'每週一 06:00 清空')}</div><div class="mabi-task-safe-bottom" aria-hidden="true"></div>`;
    content.scrollTop=scroll;
  }

  function refreshOpenDialog(){
    const d=$('#mabiTaskDialog');if(!d?.open||!selectedMember)return;
    const s=load(),r=roleState(s,selectedMember,selectedRole),dp=progress(r,DAILY),wp=progress(r,WEEKLY);
    TASKS.forEach(t=>{
      const input=d.querySelector(`[data-task-id="${t.id}"]`);if(!input)return;
      const checked=done(r,t);input.checked=checked;input.closest('.mabi-task-item')?.classList.toggle('is-done',checked);
    });
    const set=(q,v)=>{const n=d.querySelector(q);if(n)n.textContent=v;};
    set('[data-total-count]',`${dp.done+wp.done} / ${dp.total+wp.total}`);
    set('[data-summary-daily]',`${dp.done} / ${dp.total}`);set('[data-summary-daily-pct]',`${dp.pct}% 完成`);
    set('[data-summary-weekly]',`${wp.done} / ${wp.total}`);set('[data-summary-weekly-pct]',`${wp.pct}% 完成`);
    [['daily',dp],['weekly',wp]].forEach(([k,p])=>{
      const g=d.querySelector(`[data-task-group="${k}"]`);if(!g)return;
      const c=g.querySelector('[data-group-count]'),b=g.querySelector('[data-group-progress]');
      if(c)c.textContent=`${p.done} / ${p.total}`;if(b)b.style.width=`${p.pct}%`;
    });
    const mat=d.querySelector('[data-material-list]');if(mat)mat.innerHTML=materialsMarkup(r);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#memberGrid .member-card'))setTimeout(async()=>{decorateRoles();await fetchShared({silent:true});decorateRoles();},120);
    const row=e.target.closest('#modalRoles .role-row[data-task-role-index]');if(!row)return;
    selectedRole=Number(row.dataset.taskRoleIndex)||0;
    selectedMember=currentMemberKey();
    const tag=row.querySelector('.role-tag')?.textContent?.trim()||`角色${selectedRole+1}`;
    const vals=[...row.querySelectorAll('.role-cell span')].map(x=>x.textContent.trim()).filter(Boolean);
    const id=vals.at(-1)||'';
    selectedRoleName=id&&id!=='—'?id:tag;
    selectedLabel=id&&id!=='—'?`${tag}・${id}`:tag;
    const d=ensureDialog();renderDialog();if(!d.open)d.showModal();fetchShared();
  });

  document.addEventListener('keydown',e=>{
    const row=e.target.closest?.('#modalRoles .role-row[data-task-role-index]');
    if(!row||!['Enter',' '].includes(e.key))return;
    e.preventDefault();row.click();
  });

  document.addEventListener('change',e=>{
    const input=e.target.closest?.('#mabiTaskDialog [data-task-id]');if(!input)return;
    const task=TASKS.find(t=>t.id===input.dataset.taskId);if(!task||!selectedMember)return;
    const s=load(),r=roleState(s,selectedMember,selectedRole);
    r[task.cycle][task.id]=input.checked;save(s);
    input.closest('.mabi-task-item')?.classList.toggle('is-done',input.checked);input.blur();
    decorateRoles();refreshOpenDialog();writeShared(task,input.checked);
  });

  window.addEventListener('focus',()=>{if($('#memberDialog')?.open||$('#mabiTaskDialog')?.open)fetchShared({silent:true});});
  window.addEventListener('pageshow',()=>{if($('#memberDialog')?.open||$('#mabiTaskDialog')?.open)fetchShared({silent:true});});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&($('#memberDialog')?.open||$('#mabiTaskDialog')?.open))fetchShared({silent:true});});
  setInterval(()=>{if(document.visibilityState==='visible'&&($('#memberDialog')?.open||$('#mabiTaskDialog')?.open))fetchShared({silent:true});},3000);

  ensureDialog();
})();
