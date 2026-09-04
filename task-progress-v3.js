(() => {
  'use strict';

  const STORAGE_KEY = 'mabi-guild-character-task-progress-v1';
  const HOUR = 60 * 60 * 1000;
  const RESET_SHIFT = 2 * HOUR;
  const TASKS = [
    {id:'abyss-1',name:'深淵1－沉默的迴廊',cycle:'weekly'},
    {id:'abyss-2',name:'深淵2－崩塌的祭壇',cycle:'weekly'},
    {id:'abyss-3',name:'深淵3－毀滅的殿堂',cycle:'weekly'},
    {id:'raid-gris',name:'團隊副本－格里斯貝恩',cycle:'weekly'},
    {id:'deep-dungeon',name:'深層地下城',cycle:'daily'},
    {id:'part-time',name:'兼職任務',cycle:'weekly'},
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
  const DAILY = TASKS.filter(t=>t.cycle==='daily');
  const WEEKLY = TASKS.filter(t=>t.cycle==='weekly');
  let selectedRole = 0;
  let selectedMember = '';
  let selectedLabel = '';

  const $ = s => document.querySelector(s);
  const esc = v => String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function keys(now=Date.now()) {
    const d = new Date(now + RESET_SHIFT);
    const iso = x => `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
    const daily = iso(d);
    const offset = (d.getUTCDay()+6)%7;
    const monday = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-offset));
    return {daily,weekly:iso(monday)};
  }

  function load() {
    let state;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); } catch { state = null; }
    const k = keys();
    if (!state || !state.members) state = {version:1,dailyKey:k.daily,weeklyKey:k.weekly,members:{}};
    let changed = false;
    if (state.dailyKey !== k.daily) {
      Object.values(state.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>{r.daily={};}));
      state.dailyKey = k.daily; changed = true;
    }
    if (state.weeklyKey !== k.weekly) {
      Object.values(state.members).forEach(m=>Object.values(m.roles||{}).forEach(r=>{r.weekly={};}));
      state.weeklyKey = k.weekly; changed = true;
    }
    if (changed) save(state);
    return state;
  }

  function save(state) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch {} }
  function memberKey() { return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||'); }
  function roleState(state,member,index) {
    state.members[member] ||= {roles:{}};
    state.members[member].roles ||= {};
    state.members[member].roles[index] ||= {daily:{},weekly:{}};
    state.members[member].roles[index].daily ||= {};
    state.members[member].roles[index].weekly ||= {};
    return state.members[member].roles[index];
  }
  function done(role,task) { return !!role[task.cycle]?.[task.id]; }
  function progress(role,list) { const d=list.filter(t=>done(role,t)).length; return {done:d,total:list.length,pct:Math.round(d/list.length*100)}; }

  function roleInfo(row,index) {
    const tag = row?.querySelector('.role-tag')?.textContent?.trim() || `角色${index+1}`;
    const vals = [...(row?.querySelectorAll('.role-cell span')||[])].map(x=>x.textContent.trim()).filter(Boolean);
    const id = vals.at(-1) || '';
    return {title:tag,subtitle:id&&id!=='—'?id:''};
  }

  function decorateRoles() {
    const roles = $('#modalRoles');
    if (!roles || !$('#memberDialog')?.open) return;
    const state = load();
    const member = memberKey();
    [...roles.querySelectorAll('.role-row')].forEach((row,index)=>{
      row.classList.add('mabi-task-launch');
      row.dataset.taskRoleIndex = String(index);
      row.tabIndex = 0;
      row.setAttribute('role','button');
      const r = roleState(state,member,index);
      const dp=progress(r,DAILY), wp=progress(r,WEEKLY);
      let hint=row.querySelector('.mabi-role-task-hint');
      if(!hint){ hint=document.createElement('div'); hint.className='mabi-role-task-hint'; row.appendChild(hint); }
      const html=`<span>查看工作日誌</span><b>日 ${dp.done}/${dp.total} · 週 ${wp.done}/${wp.total}</b><i>→</i>`;
      if(hint.innerHTML!==html) hint.innerHTML=html;
    });
    save(state);
  }

  function ensureDialog(){
    let d=$('#mabiTaskDialog');
    if(d) return d;
    d=document.createElement('dialog');
    d.id='mabiTaskDialog'; d.className='mabi-task-dialog';
    d.innerHTML='<div class="mabi-task-dialog-top"><div><span class="mabi-task-kicker">CHARACTER ROUTINE / CHECKLIST</span><h2 id="mabiTaskDialogTitle">角色工作日誌</h2><p id="mabiTaskDialogSub"></p></div><button type="button" class="mabi-task-dialog-close" aria-label="關閉">×</button></div><div class="mabi-task-dialog-content"><section id="mabiTaskTracker"></section></div>';
    document.body.appendChild(d);
    d.querySelector('.mabi-task-dialog-close').onclick=()=>d.close();
    d.addEventListener('click',e=>{if(e.target===d)d.close();});
    return d;
  }

  function item(task,role){
    const checked=done(role,task);
    const mat=task.materials?.length?`<span class="mabi-task-material">需要：${task.materials.map(([n,q])=>`${esc(n)} ×${q}`).join('、')}</span>`:'';
    return `<label class="mabi-task-item ${checked?'is-done':''}"><input type="checkbox" data-task-id="${task.id}" ${checked?'checked':''}><span class="mabi-task-check"></span><span class="mabi-task-copy"><strong>${esc(task.name)}</strong>${mat}</span><span class="mabi-task-cycle ${task.cycle}">${task.cycle==='daily'?'每日':'每週'}</span></label>`;
  }
  function group(title,list,role,p,hint){return `<section class="mabi-task-group"><div class="mabi-task-group-head"><div><span class="mabi-task-group-kicker">${hint}</span><h4>${title}</h4></div><strong>${p.done} / ${p.total}</strong></div><div class="mabi-task-progress"><i style="width:${p.pct}%"></i></div><div class="mabi-task-list">${list.map(t=>item(t,role)).join('')}</div></section>`;}

  function renderTaskDialog(scrollTop=0){
    const d=ensureDialog(), state=load(), role=roleState(state,selectedMember,selectedRole);
    const dp=progress(role,DAILY), wp=progress(role,WEEKLY);
    const totals=new Map();
    TASKS.forEach(t=>{if(!done(role,t))t.materials?.forEach(([n,q])=>totals.set(n,(totals.get(n)||0)+q));});
    $('#mabiTaskDialogTitle').textContent=`${selectedLabel}｜工作日誌`;
    $('#mabiTaskDialogSub').textContent='每日 06:00／每週一 06:00 自動重置（台灣時間）';
    $('#mabiTaskTracker').innerHTML=`<div class="mabi-task-title-row"><div><h3>每日／每週工作</h3><p>這裡只顯示目前選擇角色的紀錄。</p></div><div class="mabi-task-total"><span>目前完成</span><strong>${dp.done+wp.done} / ${dp.total+wp.total}</strong></div></div><div class="mabi-task-summary-grid"><div><span>今日</span><strong>${dp.done} / ${dp.total}</strong><small>${dp.pct}% 完成</small></div><div><span>本週</span><strong>${wp.done} / ${wp.total}</strong><small>${wp.pct}% 完成</small></div></div><div class="mabi-material-box"><div><span>尚需準備材料</span><small>只統計這個角色未完成的工作</small></div><div class="mabi-material-list">${totals.size?[...totals].map(([n,q])=>`<span>${esc(n)} <b>×${q}</b></span>`).join(''):'<span class="done">目前沒有待準備材料 ✓</span>'}</div></div><div class="mabi-task-columns">${group('每日工作',DAILY,role,dp,'每天 06:00 清空')}${group('每週工作',WEEKLY,role,wp,'每週一 06:00 清空')}</div>`;
    save(state);
    const content=d.querySelector('.mabi-task-dialog-content');
    content.scrollTop=scrollTop;
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#memberGrid .member-card')) setTimeout(decorateRoles,0);
    const row=e.target.closest('#modalRoles .role-row[data-task-role-index]');
    if(row){
      selectedRole=Number(row.dataset.taskRoleIndex)||0;
      selectedMember=memberKey();
      const info=roleInfo(row,selectedRole);
      selectedLabel=info.subtitle?`${info.title}・${info.subtitle}`:info.title;
      const d=ensureDialog(); renderTaskDialog(0); if(!d.open)d.showModal();
    }
  });

  document.addEventListener('keydown',e=>{
    const row=e.target.closest?.('#modalRoles .role-row[data-task-role-index]');
    if(!row||!['Enter',' '].includes(e.key))return;
    e.preventDefault(); row.click();
  });

  document.addEventListener('change',e=>{
    const input=e.target.closest?.('#mabiTaskDialog [data-task-id]');
    if(!input)return;
    const d=$('#mabiTaskDialog'), content=d.querySelector('.mabi-task-dialog-content'), scroll=content.scrollTop;
    const state=load(), role=roleState(state,selectedMember,selectedRole), task=TASKS.find(t=>t.id===input.dataset.taskId);
    if(!task)return;
    role[task.cycle][task.id]=input.checked;
    save(state);
    renderTaskDialog(scroll);
    decorateRoles();
  });

  ensureDialog();
})();
