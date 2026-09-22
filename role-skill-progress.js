(() => {
  'use strict';

  const API='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const SHEET_ID='1USPYBfsaIlIDvefmlIBEe4_cx_B4KoOhlHiMjymcfTs';
  const SHEET_NAME='工作日誌_共用';
  const KEY='mabi-role-skill-progress-v2';
  const OLD_KEY='mabi-role-skill-progress-v1';
  const PREFIX='skill-profile-v3';
  const V2_PREFIX='skill-profile-v2';
  const OLD_PREFIX='skill-profile-v1';
  const TRACE=(typeof SPIRIT_TRACE_EXP!=='undefined'?SPIRIT_TRACE_EXP:20000);
  const EXP=(typeof CLASS_LEVEL_EXP!=='undefined'?CLASS_LEVEL_EXP:{
    1:6754,2:13508,3:20262,4:27014,5:33768,6:40522,7:47276,8:54030,9:60784,
    10:63000,11:64000,12:65000,13:66000,14:67000,15:68000,16:69000,17:70000,
    18:76000,19:82000,20:140000,21:141828,22:148582,23:155334,24:162088,
    25:168842,26:175596,27:182350,28:189104,29:195856,30:202610,
    31:1829022,32:1865594,33:4013190,34:7000000,35:10908518,36:11235754,
    37:11572798,38:11919958,39:12277536,40:14542710,41:15415272,42:16340188,
    43:17320600,44:18359836,45:19461426,46:22769688,47:26640746,48:31169673,
    49:36468517,50:42668165,51:49921753,52:58408451,53:68337888,54:79955329,
    55:93547735,56:109450850,57:128057495,58:149827269,59:175297905,
    60:205098549,61:239965302,62:280759403,63:328488502,64:384331547
  });
  const GROUPS=[
    ['戰士系',['戰士','劍術士','大劍戰士']],
    ['魔法師系',['魔法師','火焰術士','冰霜術士','電擊術士']],
    ['弓手系',['弓手','弩手','長弓手']],
    ['盜賊系',['盜賊','雙刀客','格鬥家']],
    ['治癒師系',['治癒師','祭司','修道士']],
    ['吟遊詩人系',['吟遊詩人','樂師','舞者']]
  ];
  const CLASSES=GROUPS.flatMap(x=>x[1]);
  const $=s=>document.querySelector(s);
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  let activeMember='';
  let activeRole=0;
  let syncing=false;
  let draftProfiles=null;
  let dirty=false;

  function memberKey(){
    return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');
  }
  function weekKey(){
    const d=new Date(Date.now()+7200000),o=(d.getUTCDay()+6)%7,w=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-o));
    return w.getUTCFullYear()+'-'+String(w.getUTCMonth()+1).padStart(2,'0')+'-'+String(w.getUTCDate()).padStart(2,'0');
  }
  function load(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}
  }
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
  function oldLoad(){
    try{return JSON.parse(localStorage.getItem(OLD_KEY)||'{}')||{};}catch{return {};}
  }
  function normalizeClass(v){
    v=String(v||'').trim();
    const aliases={'冰霜巫師':'冰霜術士','火焰法師':'火焰術士','元素法師':'魔法師','雙刀':'雙刀客','大劍':'大劍戰士'};
    return CLASSES.includes(v)?v:(aliases[v]||'');
  }
  function roleInfos(){
    return [...document.querySelectorAll('#modalRoles .role-row')].map((row,i)=>{
      const cells=[...row.querySelectorAll('.role-cell')];
      return {
        tag:(row.querySelector('.role-tag')?.textContent||('角色'+(i+1))).replace(/^✦\s*/,'').trim(),
        id:cells[1]?.querySelector('span')?.textContent?.trim()||('角色'+(i+1)),
        currentClass:normalizeClass(cells[0]?.querySelector('span')?.textContent)
      };
    });
  }
  function blankProfile(){
    return {traces:0,professions:{}};
  }
  function normalizeProfile(p){
    const out=blankProfile();
    out.traces=Math.max(0,Math.floor(Number(p?.traces)||0));
    CLASSES.forEach(name=>{
      const src=p?.professions?.[name];
      if(!src)return;
      const level=src.level===''?'':Math.max(1,Math.min(65,Number(src.level)||1));
      const exp=Math.max(0,Number(src.exp)||0);
      out.professions[name]={level,exp};
    });
    return out;
  }
  function migrateOldProfile(old){
    const out=blankProfile();
    if(!old||typeof old!=='object')return out;
    out.traces=Math.max(0,Math.floor(Number(old.traces)||0));
    const profession=normalizeClass(old.profession);
    const level=Number(old.skillLevel);
    if(profession&&Number.isInteger(level)&&level>=1&&level<=65){
      out.professions[profession]={level,exp:Math.max(0,Number(old.exp)||0)};
    }
    return out;
  }
  function ensureMemberStore(){
    const store=load();
    activeMember=memberKey();
    if(!store[activeMember]){
      store[activeMember]={};
      const old=oldLoad()[activeMember]||{};
      Object.keys(old).forEach(k=>store[activeMember][k]=migrateOldProfile(old[k]));
      save(store);
    }
    return store;
  }
  function profileAt(index){
    const store=ensureMemberStore();
    if(!store[activeMember][index])store[activeMember][index]=blankProfile();
    store[activeMember][index]=normalizeProfile(store[activeMember][index]);
    save(store);
    return store[activeMember][index];
  }
  function startDraft(){
    activeMember=memberKey();
    const saved=ensureMemberStore()[activeMember]||{};
    draftProfiles={};
    roleInfos().forEach((_,i)=>draftProfiles[i]=normalizeProfile(saved[i]||{}));
    dirty=false;
  }
  function currentProfiles(){
    return draftProfiles||(ensureMemberStore()[activeMember]||{});
  }
  function stashEditor(){
    if(!draftProfiles||!$('#mabiRoleEditor'))return;
    draftProfiles[activeRole]=readEditor();
  }
  function discardDraft(){
    draftProfiles=null;
    dirty=false;
  }
  function roleTotal(profile){
    return CLASSES.reduce((sum,name)=>{
      const level=Number(profile?.professions?.[name]?.level);
      return sum+(Number.isInteger(level)?level:0);
    },0);
  }
  function project(level,exp,traces){
    level=Number(level);
    exp=Math.max(0,Number(exp)||0);
    traces=Math.max(0,Math.floor(Number(traces)||0));
    if(!Number.isInteger(level)||level<1||level>65)return {valid:false};
    if(level<65&&exp>=EXP[level])return {valid:false,error:'Lv.'+level+' 目前 EXP 需小於 '+fmt(EXP[level])};
    let target=level,remaining=exp+traces*TRACE;
    while(target<65&&remaining>=EXP[target]){remaining-=EXP[target];target++;}
    const next=target<65?EXP[target]:0;
    return {
      valid:true,
      level:target,
      remaining,
      gain:target-level,
      next,
      tracesToNext:next?Math.ceil(Math.max(0,next-remaining)/TRACE):0
    };
  }

  function decorate(){
    if(!$('#memberDialog')?.open)return;
    activeMember=memberKey();
    const title=$('#memberDialog .roles-title');
    if(!title)return;
    let bar=$('#mabiSkillSummary');
    if(!bar){
      bar=document.createElement('div');
      bar.id='mabiSkillSummary';
      bar.className='mabi-skill-summary';
      title.insertAdjacentElement('afterend',bar);
    }
    renderSummary();
    setTimeout(()=>syncProfiles(true),300);
  }
  function renderSummary(){
    const bar=$('#mabiSkillSummary');if(!bar)return;
    activeMember=memberKey();
    const infos=roleInfos(),store=currentProfiles();
    let total=0,recorded=0;
    infos.forEach((_,i)=>{
      const p=normalizeProfile(store[i]||{});
      total+=roleTotal(p);
      recorded+=CLASSES.filter(name=>Number.isInteger(Number(p.professions?.[name]?.level))).length;
    });
    bar.innerHTML='<div><span>六角色・19職業等級總和</span><strong>'+fmt(total)+'</strong><small>已記錄 '+recorded+' / '+(infos.length*CLASSES.length)+' 個職業</small></div><button type="button" class="mabi-skill-open">管理職業等級 <span>→</span></button>';
  }

  function ensureDialog(){
    let d=$('#mabiSkillDialog');
    if(d)return d;
    d=document.createElement('dialog');
    d.id='mabiSkillDialog';
    d.className='mabi-skill-dialog';
    d.innerHTML='<div class="mabi-skill-head"><div><span>PROFESSION / SPIRIT TRACE</span><h2>六角色・19職業等級紀錄</h2><p id="mabiSkillSync">每隻角色可分別記錄 19 個職業等級與目前 EXP。</p></div><button class="mabi-skill-close" type="button">×</button></div><div class="mabi-skill-content"><div id="mabiSkillTotals"></div><div id="mabiRoleTabs" class="mabi-role-tabs"></div><div id="mabiRoleEditor"></div><div class="mabi-skill-actions"><span id="mabiSkillSaveState">修改後按「儲存全部」同步到其他裝置。</span><button id="mabiSkillSaveAll" type="button">儲存全部</button></div></div>';
    document.body.appendChild(d);
    d.querySelector('.mabi-skill-close').onclick=()=>{discardDraft();d.close();};
    d.addEventListener('click',e=>{if(e.target===d){discardDraft();d.close();}});
    d.querySelector('#mabiSkillSaveAll').onclick=saveAll;
    d.addEventListener('input',onEdit);
    d.addEventListener('focusin',e=>{if(e.target.matches('[data-level],[data-exp],#mabiRoleTraces'))requestAnimationFrame(()=>e.target.select?.());});
    d.addEventListener('change',onEdit);
    d.addEventListener('click',e=>{
      const tab=e.target.closest('[data-role-tab]');
      if(tab){stashEditor();activeRole=Number(tab.dataset.roleTab)||0;renderDialog();}
    });
    return d;
  }
  function totalsMarkup(){
    const infos=roleInfos(),store=ensureMemberStore()[activeMember]||{};
    let total=0,recorded=0;
    const perRole=infos.map((info,i)=>{
      const p=normalizeProfile(store[i]||{});
      const t=roleTotal(p);
      total+=t;
      const count=CLASSES.filter(name=>Number.isInteger(Number(p.professions?.[name]?.level))).length;
      recorded+=count;
      return {info,total:t,count};
    });
    return '<div class="mabi-skill-total"><div><span>六角色職業等級總和</span><strong>'+fmt(total)+'</strong><small>19 職業 × '+infos.length+' 角色</small></div><div><span>目前已記錄</span><strong>'+recorded+'</strong><small>共 '+(infos.length*CLASSES.length)+' 個職業欄位</small></div></div><div class="mabi-role-total-strip">'+perRole.map((x,i)=>'<span data-jump-role="'+i+'"><b>'+x.info.tag+'</b> '+fmt(x.total)+'</span>').join('')+'</div>';
  }
  function professionRows(profile){
    return GROUPS.map(([group,list])=>{
      const rows=list.map(name=>{
        const data=profile.professions?.[name]||{level:'',exp:0};
        return '<div class="mabi-prof-row" data-profession="'+name+'"><strong>'+name+'</strong><label><span>等級</span><input data-level type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="'+(data.level??'')+'" placeholder="輸入等級"></label><label><span>目前 EXP</span><input data-exp type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" value="'+(data.exp||'')+'" placeholder="輸入目前 EXP"></label></div>';
      }).join('');
      return '<section class="mabi-prof-group"><h4>'+group+'</h4>'+rows+'</section>';
    }).join('');
  }
  function calculatorMarkup(profile){
    const selected=CLASSES.find(n=>profile.professions?.[n]?.level)||CLASSES[0];
    return '<section class="mabi-trace-calc"><div class="mabi-trace-calc-head"><div><span>精靈痕跡試算</span><strong>這只是試算，不會自動扣除痕跡</strong></div><label><span>這隻角色持有精靈痕跡</span><input id="mabiRoleTraces" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" value="'+(profile.traces||'')+'" placeholder="輸入精靈痕跡"></label></div><div class="mabi-trace-calc-body"><label><span>想餵哪個職業</span><select id="mabiCalcProfession">'+CLASSES.map(n=>'<option value="'+n+'" '+(n===selected?'selected':'')+'>'+n+'</option>').join('')+'</select></label><div id="mabiCalcResult"></div></div></section>';
  }
  function renderDialog(){
    activeMember=memberKey();
    const d=ensureDialog(),infos=roleInfos(),store=currentProfiles();
    activeRole=Math.max(0,Math.min(infos.length-1,activeRole));
    d.querySelector('#mabiSkillTotals').innerHTML=totalsMarkup();
    d.querySelector('#mabiRoleTabs').innerHTML=infos.map((info,i)=>{
      const p=normalizeProfile(store[i]||{});
      return '<button type="button" data-role-tab="'+i+'" class="'+(i===activeRole?'active':'')+'"><span>'+info.tag+'</span><b>'+info.id+'</b><small>總和 '+fmt(roleTotal(p))+'</small></button>';
    }).join('');
    const info=infos[activeRole]||{tag:'角色',id:'—'};
    const p=normalizeProfile(store[activeRole]||{});
    d.querySelector('#mabiRoleEditor').innerHTML='<section class="mabi-role-editor"><div class="mabi-role-editor-head"><div><span>'+info.tag+'</span><h3>'+info.id+'</h3></div><strong>19 職業總和 '+fmt(roleTotal(p))+'</strong></div>'+calculatorMarkup(p)+'<div class="mabi-prof-groups">'+professionRows(p)+'</div></section>';
    wireCalculator();
    recalcLive();
  }
  function readEditor(){
    const p=blankProfile();
    p.traces=Math.max(0,Math.floor(Number($('#mabiRoleTraces')?.value)||0));
    document.querySelectorAll('#mabiRoleEditor [data-profession]').forEach(row=>{
      const name=row.dataset.profession;
      const lv=row.querySelector('[data-level]')?.value??'';
      const exp=Math.max(0,Number(row.querySelector('[data-exp]')?.value)||0);
      if(lv!==''){
        p.professions[name]={level:Math.max(1,Math.min(65,Number(lv)||1)),exp};
      }
    });
    return p;
  }
  function persistEditor(){
    stashEditor();
  }
  function wireCalculator(){
    $('#mabiCalcProfession')?.addEventListener('change',recalcLive);
    $('#mabiRoleTraces')?.addEventListener('input',recalcLive);
  }
  function recalcLive(){
    const p=readEditor();
    const selected=$('#mabiCalcProfession')?.value||CLASSES[0];
    const data=p.professions[selected];
    const result=$('#mabiCalcResult');
    if(result){
      if(!data?.level){
        result.innerHTML='<p>請先填寫 <b>'+selected+'</b> 的目前職業等級。</p>';
      }else{
        const r=project(data.level,data.exp,p.traces);
        if(!r.valid){
          result.innerHTML='<p class="error">'+(r.error||'請確認等級與 EXP')+'</p>';
        }else{
          const next=r.next?'距下一級還差 '+fmt(Math.max(0,r.next-r.remaining))+' EXP（約 '+fmt(r.tracesToNext)+' 個痕跡）':'已達最高職業等級';
          result.innerHTML='<div><span>'+selected+' 現有痕跡餵完可達</span><strong>Lv.'+r.level+'</strong><em>+'+r.gain+' 級</em></div><small>餵完後該級累積 '+fmt(r.remaining)+' EXP · '+next+'</small>';
        }
      }
    }
    const title=$('#mabiRoleEditor .mabi-role-editor-head strong');
    if(title)title.textContent='19 職業總和 '+fmt(roleTotal(p));
  }
  function onEdit(e){
    if(!e.target.closest('#mabiRoleEditor'))return;
    if(e.target.matches('[data-level],[data-exp],#mabiRoleTraces')){
      const raw=String(e.target.value||'');
      const cleaned=raw.replace(/[^0-9]/g,'');
      if(cleaned!==raw)e.target.value=cleaned;
    }
    stashEditor();
    dirty=true;
    recalcLive();
    const s=$('#mabiSkillSaveState');
    if(s)s.textContent='尚未儲存';
  }

  function encodeProfile(profile){
    const p=normalizeProfile(profile);
    const entries=[];
    CLASSES.forEach((name,index)=>{
      const item=p.professions?.[name];
      if(!item||item.level==='')return;
      entries.push(index+':'+Number(item.level)+':'+Math.max(0,Number(item.exp)||0));
    });
    return PREFIX+'|'+Math.max(0,Math.floor(Number(p.traces)||0))+'|'+entries.join(',');
  }
  function decodeProfile(taskId){
    const raw=String(taskId||'');
    if(raw.startsWith(PREFIX+'|')){
      const parts=raw.split('|');
      const out=blankProfile();
      out.traces=Math.max(0,Math.floor(Number(parts[1])||0));
      const list=String(parts[2]||'').split(',').filter(Boolean);
      list.forEach(entry=>{
        const seg=entry.split(':');
        const index=Number(seg[0]),level=Number(seg[1]),exp=Math.max(0,Number(seg[2])||0);
        const name=CLASSES[index];
        if(name&&Number.isInteger(level)&&level>=1&&level<=65)out.professions[name]={level,exp};
      });
      return normalizeProfile(out);
    }
    if(raw.startsWith(V2_PREFIX+'|')){
      try{return normalizeProfile(JSON.parse(decodeURIComponent(raw.slice(V2_PREFIX.length+1))));}catch{return null;}
    }
    if(raw.startsWith(OLD_PREFIX+'|')){
      const a=raw.split('|');
      if(a.length<6)return null;
      try{
        return migrateOldProfile({
          profession:decodeURIComponent(a[1]||''),
          characterLevel:Number(a[2])||'',
          skillLevel:Number(a[3])||'',
          exp:Number(a[4])||0,
          traces:Number(a[5])||0
        });
      }catch{return null;}
    }
    return null;
  }
  async function writeOne(index,info,profile){
    const body=new URLSearchParams({
      action:'update',
      memberKey:activeMember,
      roleIndex:String(index),
      roleName:info.id||info.tag||('角色'+(index+1)),
      taskId:encodeProfile(profile),
      cycle:'weekly',
      cycleKey:weekKey(),
      done:'true'
    });
    const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString(),cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    let data;
    try{data=await res.json();}catch{throw new Error('伺服器回傳格式錯誤');}
    if(!data?.ok)throw new Error(data?.error||'save failed');
  }
  async function saveAll(){
    stashEditor();
    const d=$('#mabiSkillDialog'),btn=$('#mabiSkillSaveAll'),state=$('#mabiSkillSaveState');
    if(!d||!btn)return;
    const infos=roleInfos();
    const store=ensureMemberStore();
    store[activeMember]={};
    infos.forEach((_,i)=>store[activeMember][i]=normalizeProfile(draftProfiles?.[i]||{}));
    save(store);
    btn.disabled=true;state.textContent='正在儲存並同步六個角色的 19 職業紀錄…';
    try{
      for(let i=0;i<infos.length;i++)await writeOne(i,infos[i],normalizeProfile(store[activeMember][i]||{}));
      dirty=false;
      state.textContent='已儲存並同步到共用資料';
      renderSummary();
    }catch(e){
      console.warn('[Skill Progress v2] save failed',e);
      state.textContent='共用同步失敗：'+(e?.message||'未知錯誤')+'；這台裝置的紀錄已保留';
    }finally{btn.disabled=false;}
  }
  function cell(row,i){const c=row?.c?.[i];return c?(c.v??c.f??''):'';}
  function readSheet(){
    return new Promise((resolve,reject)=>{
      const cb='__mabiSkill2_'+Date.now()+'_'+Math.random().toString(36).slice(2),script=document.createElement('script');
      let finished=false;
      const timer=setTimeout(()=>finish(new Error('timeout')),10000);
      function clean(){clearTimeout(timer);script.remove();try{delete window[cb];}catch{window[cb]=undefined;}}
      function finish(err,data){if(finished)return;finished=true;clean();err?reject(err):resolve(data);}
      window[cb]=payload=>{
        try{
          const rows=payload?.table?.rows||[];
          finish(null,rows.map((row,n)=>({
            n,
            member:String(cell(row,0)||'').trim(),
            role:Number(cell(row,1))||0,
            task:String(cell(row,3)||'').trim()
          })).filter(x=>x.member&&(x.task.startsWith(PREFIX+'|')||x.task.startsWith(V2_PREFIX+'|')||x.task.startsWith(OLD_PREFIX+'|'))));
        }catch(e){finish(e);}
      };
      const tqx='out:json;responseHandler:'+cb+';reqId:'+Date.now();
      script.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?sheet='+encodeURIComponent(SHEET_NAME)+'&headers=1&tqx='+encodeURIComponent(tqx)+'&_='+Date.now();
      script.onerror=()=>finish(new Error('Google Sheet load failed'));
      document.head.appendChild(script);
    });
  }
  async function syncProfiles(silent=false){
    if(syncing||!activeMember||dirty)return;
    syncing=true;
    const sub=$('#mabiSkillSync');
    if(sub&&!silent)sub.textContent='正在同步其他裝置的職業等級紀錄…';
    try{
      const rows=await readSheet(),latest=new Map();
      if($('#mabiSkillDialog')?.open)return;
      rows.forEach(row=>{if(row.member===activeMember)latest.set(row.role,row);});
      if(latest.size){
        const store=ensureMemberStore();
        latest.forEach((row,index)=>{
          const p=decodeProfile(row.task);
          if(p)store[activeMember][index]=p;
        });
        save(store);
      }
      if(sub)sub.textContent='共用進度已同步 · '+latest.size+' 個角色';
      renderSummary();
    }catch(e){
      console.warn('[Skill Progress v2] sync failed',e);
      if(sub)sub.textContent='共用同步失敗，目前顯示這台裝置的紀錄';
    }finally{syncing=false;}
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#memberGrid .member-card'))setTimeout(decorate,180);
    const jump=e.target.closest('[data-jump-role]');
    if(jump){activeRole=Number(jump.dataset.jumpRole)||0;renderDialog();return;}
    const open=e.target.closest('.mabi-skill-open');
    if(!open)return;
    e.preventDefault();e.stopPropagation();
    activeMember=memberKey();activeRole=0;startDraft();
    const d=ensureDialog();renderDialog();if(!d.open)d.showModal();
  },true);

  const roles=$('#modalRoles');
  if(roles)new MutationObserver(()=>{if($('#memberDialog')?.open)setTimeout(decorate,0);}).observe(roles,{childList:true,subtree:true});
  window.addEventListener('focus',()=>{if($('#memberDialog')?.open&&!$('#mabiSkillDialog')?.open&&!dirty){activeMember=memberKey();syncProfiles(true);}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('#memberDialog')?.open&&!$('#mabiSkillDialog')?.open&&!dirty)syncProfiles(true);});
  setInterval(()=>{if(document.visibilityState==='visible'&&$('#memberDialog')?.open&&!$('#mabiSkillDialog')?.open&&!dirty)syncProfiles(true);},30000);
})();