(() => {
  'use strict';
  const API='https://script.google.com/macros/s/AKfycbwt_aqdfRWbhhyab2ZI8-6FZXWRMBufL_c7ZD51GbEjotkYyQwsGTzDgAjbKJT6Yx8/exec';
  const SHEET_ID='1USPYBfsaIlIDvefmlIBEe4_cx_B4KoOhlHiMjymcfTs', SHEET_NAME='工作日誌_共用';
  const KEY='mabi-role-skill-progress-v1', PREFIX='skill-profile-v1';
  const TRACE=(typeof SPIRIT_TRACE_EXP!=='undefined'?SPIRIT_TRACE_EXP:20000);
  const EXP=(typeof CLASS_LEVEL_EXP!=='undefined'?CLASS_LEVEL_EXP:{
    1:6754,2:13508,3:20262,4:27014,5:33768,6:40522,7:47276,8:54030,9:60784,10:63000,11:64000,12:65000,13:66000,14:67000,15:68000,16:69000,17:70000,18:76000,19:82000,20:140000,21:141828,22:148582,23:155334,24:162088,25:168842,26:175596,27:182350,28:189104,29:195856,30:202610,31:1829022,32:1865594,33:4013190,34:7000000,35:10908518,36:11235754,37:11572798,38:11919958,39:12277536,40:14542710,41:15415272,42:16340188,43:17320600,44:18359836,45:19461426,46:22769688,47:26640746,48:31169673,49:36468517,50:42668165,51:49921753,52:58408451,53:68337888,54:79955329,55:93547735,56:109450850,57:128057495,58:149827269,59:175297905,60:205098549,61:239965302,62:280759403,63:328488502,64:384331547
  });
  const GROUPS={
    '戰士系':['戰士','劍術士','大劍戰士'],
    '魔法師系':['魔法師','火焰術士','冰霜術士','電擊術士'],
    '弓手系':['弓手','弩手','長弓手'],
    '盜賊系':['盜賊','雙刀客','格鬥家'],
    '治癒師系':['治癒師','祭司','修道士'],
    '吟遊詩人系':['吟遊詩人','樂師','舞者']
  };
  const ALL=Object.values(GROUPS).flat(), $=s=>document.querySelector(s), fmt=n=>Number(n||0).toLocaleString('en-US');
  let active='', syncing=false;

  function memberKey(){return [$('#modalGuild')?.textContent?.trim(),$('#modalMainId')?.textContent?.trim(),$('#modalLine')?.textContent?.trim()].join('||');}
  function weekKey(){const d=new Date(Date.now()+7200000),o=(d.getUTCDay()+6)%7,w=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-o));return w.getUTCFullYear()+'-'+String(w.getUTCMonth()+1).padStart(2,'0')+'-'+String(w.getUTCDate()).padStart(2,'0');}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
  function normalizeClass(v){v=String(v||'').trim();const a={'冰霜巫師':'冰霜術士','火焰法師':'火焰術士','元素法師':'魔法師','雙刀':'雙刀客','大劍':'大劍戰士'};return ALL.includes(v)?v:(a[v]||'');}
  function roles(){return [...document.querySelectorAll('#modalRoles .role-row')].map((row,i)=>{const c=[...row.querySelectorAll('.role-cell')];return {tag:(row.querySelector('.role-tag')?.textContent||('角色'+(i+1))).replace(/^✦\\s*/,''),id:c[1]?.querySelector('span')?.textContent?.trim()||('角色'+(i+1)),cls:normalizeClass(c[0]?.querySelector('span')?.textContent)};});}
  function clean(p,info){return {profession:normalizeClass(p?.profession)||info?.cls||'',characterLevel:p?.characterLevel===''?'':Math.max(1,Math.min(65,Number(p?.characterLevel)||1)),skillLevel:p?.skillLevel===''?'':Math.max(1,Math.min(65,Number(p?.skillLevel)||1)),exp:Math.max(0,Number(p?.exp)||0),traces:Math.max(0,Math.floor(Number(p?.traces)||0))};}
  function getProfiles(){const s=load();return {s,profiles:s[active]||{}};}
  function project(p){
    const lv=Number(p.skillLevel),char=Number(p.characterLevel),exp=Math.max(0,Number(p.exp)||0),tr=Math.max(0,Number(p.traces)||0);
    if(!Number.isInteger(lv)||lv<1||lv>65)return {valid:false};
    if(lv<65&&exp>=EXP[lv])return {valid:false,error:'Lv.'+lv+' 目前 EXP 需小於 '+fmt(EXP[lv])};
    const cap=Math.max(lv,Math.min(65,Number.isInteger(char)&&char>0?char:65));
    let level=lv,rem=exp+tr*TRACE;
    while(level<cap&&level<65&&rem>=EXP[level]){rem-=EXP[level];level++;}
    const next=(level<cap&&level<65)?EXP[level]:0;
    return {valid:true,level,rem,cap,gain:level-lv,next,capped:level>=cap&&cap<65,tracesToNext:next?Math.ceil(Math.max(0,next-rem)/TRACE):0};
  }
  function options(selected){return Object.entries(GROUPS).map(([g,list])=>'<optgroup label="'+g+'">'+list.map(n=>'<option value="'+n+'" '+(n===selected?'selected':'')+'>'+n+'</option>').join('')+'</optgroup>').join('');}
  function summary(){
    const bar=$('#mabiSkillSummary');if(!bar)return;active=memberKey();const infos=roles(),p=getProfiles().profiles;let total=0,filled=0,after=0;
    infos.forEach((info,i)=>{const x=clean(p[i]||{},info),lv=Number(x.skillLevel),r=project(x);if(Number.isInteger(lv)&&lv>0){total+=lv;filled++;}after+=r.valid?r.level:(Number.isInteger(lv)?lv:0);});
    bar.innerHTML='<div><span>六角色職業等級</span><strong>'+fmt(total)+'</strong><small>'+filled+' / '+(infos.length||6)+' 已記錄'+(filled?' · 餵完現有痕跡約 '+fmt(after):'')+'</small></div><button type="button" class="mabi-skill-open">管理職業技能進度 <span>→</span></button>';
  }
  function decorate(){
    if(!$('#memberDialog')?.open)return;active=memberKey();const title=$('#memberDialog .roles-title');if(!title)return;
    let bar=$('#mabiSkillSummary');if(!bar){bar=document.createElement('div');bar.id='mabiSkillSummary';bar.className='mabi-skill-summary';title.insertAdjacentElement('afterend',bar);}summary();setTimeout(()=>sync(true),250);
  }
  function ensureDialog(){
    let d=$('#mabiSkillDialog');if(d)return d;d=document.createElement('dialog');d.id='mabiSkillDialog';d.className='mabi-skill-dialog';
    d.innerHTML='<div class="mabi-skill-head"><div><span>PROFESSION / SPIRIT TRACE</span><h2>六角色職業技能進度</h2><p id="mabiSkillSync">記錄職業等級、EXP 與精靈痕跡，並即時計算可提升等級。</p></div><button class="mabi-skill-close" type="button">×</button></div><div class="mabi-skill-content"><div id="mabiSkillTotals"></div><div id="mabiSkillCards" class="mabi-skill-cards"></div><div class="mabi-skill-actions"><span id="mabiSkillSaveState">修改後按「儲存全部」同步到其他裝置。</span><button id="mabiSkillSaveAll" type="button">儲存全部</button></div></div>';
    document.body.appendChild(d);d.querySelector('.mabi-skill-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});d.querySelector('#mabiSkillSaveAll').onclick=saveAll;d.addEventListener('input',edit);d.addEventListener('change',edit);return d;
  }
  function render(){
    active=memberKey();const d=ensureDialog(),infos=roles(),p=getProfiles().profiles;
    d.querySelector('#mabiSkillCards').innerHTML=infos.map((info,i)=>{const x=clean(p[i]||{},info);return '<section class="mabi-skill-card" data-role-index="'+i+'"><div class="mabi-skill-card-head"><div><span>'+info.tag+'</span><h3>'+info.id+'</h3></div><b data-card-level>'+(x.skillLevel?'職業 Lv.'+x.skillLevel:'尚未記錄')+'</b></div><div class="mabi-skill-fields"><label><span>職業</span><select data-field="profession"><option value="">選擇職業</option>'+options(x.profession)+'</select></label><label><span>角色等級</span><input data-field="characterLevel" type="number" min="1" max="65" value="'+x.characterLevel+'"></label><label><span>職業技能等級</span><input data-field="skillLevel" type="number" min="1" max="65" value="'+x.skillLevel+'"></label><label><span>目前該級 EXP</span><input data-field="exp" type="number" min="0" value="'+x.exp+'"></label><label class="wide"><span>持有精靈痕跡</span><input data-field="traces" type="number" min="0" value="'+x.traces+'"></label></div><div class="mabi-skill-calc" data-calc></div></section>';}).join('');
    recalc();
  }
  function readCard(card){const info=roles()[Number(card.dataset.roleIndex)||0]||{};const v=n=>card.querySelector('[data-field="'+n+'"]')?.value??'';return clean({profession:v('profession'),characterLevel:v('characterLevel'),skillLevel:v('skillLevel'),exp:v('exp'),traces:v('traces')},info);}
  function recalc(){
    const d=$('#mabiSkillDialog');if(!d)return;let total=0,after=0,filled=0;
    d.querySelectorAll('.mabi-skill-card').forEach(card=>{const p=readCard(card),lv=Number(p.skillLevel),r=project(p);if(Number.isInteger(lv)&&lv>0){total+=lv;filled++;}after+=r.valid?r.level:(Number.isInteger(lv)?lv:0);card.querySelector('[data-card-level]').textContent=p.skillLevel?'職業 Lv.'+p.skillLevel:'尚未記錄';let h='<p>輸入職業技能等級後，就會自動估算現有精靈痕跡能餵到幾等。</p>';if(p.skillLevel&&r.valid){const cap=r.capped?' · 受角色 Lv.'+r.cap+' 上限限制':'';const next=r.next?'距下一級還差 '+fmt(Math.max(0,r.next-r.rem))+' EXP（約 '+fmt(r.tracesToNext)+' 個痕跡）':(r.capped?'已達目前角色等級可提升上限':'已達最高職業等級');h='<div><span>現有痕跡餵完可達</span><strong>Lv.'+r.level+'</strong><em>+'+r.gain+' 級'+cap+'</em></div><small>餵完後該級累積 '+fmt(r.rem)+' EXP · '+next+'</small>';}else if(p.skillLevel&&!r.valid)h='<p class="error">'+(r.error||'請確認職業等級與 EXP。')+'</p>';card.querySelector('[data-calc]').innerHTML=h;});
    d.querySelector('#mabiSkillTotals').innerHTML='<div class="mabi-skill-total"><div><span>目前六角色職業等級加總</span><strong>'+fmt(total)+'</strong><small>'+filled+' 個角色已記錄</small></div><div><span>依各角色現有痕跡推算</span><strong>'+fmt(after)+'</strong><small>與精靈痕跡工具相同 EXP 表 · 1 痕跡 = '+fmt(TRACE)+' EXP</small></div></div>';
  }
  function edit(e){if(!e.target.matches('[data-field]'))return;recalc();const s=$('#mabiSkillSaveState');if(s)s.textContent='有尚未儲存的修改';}
  function encode(p){return [PREFIX,encodeURIComponent(p.profession||''),p.characterLevel||0,p.skillLevel||0,p.exp||0,p.traces||0].join('|');}
  function decode(id){const a=String(id||'').split('|');if(a[0]!==PREFIX||a.length<6)return null;try{return clean({profession:decodeURIComponent(a[1]),characterLevel:Number(a[2])||'',skillLevel:Number(a[3])||'',exp:Number(a[4])||0,traces:Number(a[5])||0},{});}catch{return null;}}
  async function writeOne(i,info,p){const body=new URLSearchParams({action:'update',memberKey:active,roleIndex:String(i),roleName:info.id||info.tag||('角色'+(i+1)),taskId:encode(p),cycle:'weekly',cycleKey:weekKey(),done:'true'});const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString(),cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();if(!data?.ok)throw new Error(data?.error||'save failed');}
  async function saveAll(){
    const d=$('#mabiSkillDialog'),btn=$('#mabiSkillSaveAll'),state=$('#mabiSkillSaveState');if(!d||!btn)return;active=memberKey();const infos=roles(),cards=[...d.querySelectorAll('.mabi-skill-card')],s=load();s[active]||={};const payload=cards.map((c,i)=>({i,info:infos[i]||{},p:readCard(c)}));payload.forEach(x=>s[active][x.i]=x.p);save(s);summary();btn.disabled=true;state.textContent='正在同步六個角色…';try{for(const x of payload)await writeOne(x.i,x.info,x.p);state.textContent='已儲存並同步到共用資料';setTimeout(()=>sync(true),1200);}catch(e){console.warn('[Skill Progress] save failed',e);state.textContent='共用同步失敗，已保留在這台裝置';}finally{btn.disabled=false;}
  }
  function cell(row,i){const c=row?.c?.[i];return c?(c.v??c.f??''):'';}
  function readSheet(){return new Promise((resolve,reject)=>{const cb='__mabiSkill_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const timer=setTimeout(()=>finish(new Error('timeout')),10000);function cleanUp(){clearTimeout(timer);sc.remove();try{delete window[cb];}catch{window[cb]=undefined;}}function finish(err,data){if(done)return;done=true;cleanUp();err?reject(err):resolve(data);}window[cb]=p=>{try{const rows=p?.table?.rows||[];finish(null,rows.map((r,n)=>({n,member:String(cell(r,0)||'').trim(),role:Number(cell(r,1))||0,task:String(cell(r,3)||'').trim()})).filter(x=>x.member&&x.task.startsWith(PREFIX+'|')));}catch(e){finish(e);}};const tqx='out:json;responseHandler:'+cb+';reqId:'+Date.now();sc.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?sheet='+encodeURIComponent(SHEET_NAME)+'&headers=1&tqx='+encodeURIComponent(tqx)+'&_='+Date.now();sc.onerror=()=>finish(new Error('load failed'));document.head.appendChild(sc);});}
  async function sync(silent){
    if(syncing||!active)return;syncing=true;const sub=$('#mabiSkillSync');if(sub&&!silent)sub.textContent='正在同步其他裝置的職業技能進度…';try{const rows=await readSheet(),latest=new Map();rows.forEach(r=>{if(r.member===active)latest.set(r.role,r);});if(latest.size){const s=load();s[active]||={};latest.forEach((r,i)=>{const p=decode(r.task);if(p)s[active][i]=p;});save(s);}if(sub)sub.textContent='共用進度已同步 · 已記錄 '+latest.size+' 個角色';if($('#mabiSkillDialog')?.open)render();summary();}catch(e){console.warn('[Skill Progress] sync failed',e);if(sub)sub.textContent='共用同步失敗，目前顯示這台裝置的紀錄';}finally{syncing=false;}
  }

  document.addEventListener('click',e=>{if(e.target.closest('#memberGrid .member-card'))setTimeout(decorate,180);const b=e.target.closest('.mabi-skill-open');if(!b)return;e.preventDefault();e.stopPropagation();active=memberKey();const d=ensureDialog();render();if(!d.open)d.showModal();sync(false);},true);
  const r=$('#modalRoles');if(r)new MutationObserver(()=>{if($('#memberDialog')?.open)setTimeout(decorate,0);}).observe(r,{childList:true,subtree:true});
  window.addEventListener('focus',()=>{if($('#memberDialog')?.open){active=memberKey();sync(true);}});
  setInterval(()=>{if(document.visibilityState==='visible'&&$('#mabiSkillDialog')?.open)sync(true);},10000);
})();