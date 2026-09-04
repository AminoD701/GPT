(() => {
  'use strict';

  const INTRO_GID='946560868';
  const SKILL_GID='485504438';
  const BASE='https://docs.google.com/spreadsheets/d/e/2PACX-1vSE-IKb2H8AZNOkljE2_5z-ekVn8h49WTtheoGOFAz1iARthjZGLWR4d2ro_FU-3B5rNrPZrPAsmEbg/pub?gid=__GID__&single=true&output=csv';
  let petsV5=[];
  let skillsV5=[];
  let loadedV5=false;
  let loadingV5=null;
  let errorV5='';
  let modeV5='recommend';
  const selectedSubstatsV5=new Set();
  let selectedFocusV5='';
  let skillQueryV5='';
  let skillTagV5='';
  let skillCategoryV5='';

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const splitList=v=>String(v??'').split(/[\/、,，]+/).map(x=>x.trim()).filter(Boolean);
  const cell=(row,...keys)=>{for(const key of keys){const v=row?.[key];if(v!==undefined&&String(v).trim()!=='')return String(v).trim();}return '';};
  function pctText(value){const raw=String(value??'').trim();if(!raw)return '官方未標示';if(raw.endsWith('%'))return raw;const n=Number(raw);if(!Number.isFinite(n))return raw;return `${(n>1?n:n*100).toFixed((n>1?n:n*100)%1?2:0)}%`;}

  function normalizePets(rows){
    return rows.map(row=>({
      category:cell(row,'寵物類別'),
      tags:splitList(cell(row,'初始標籤')),
      name:cell(row,'寵物名稱'),
      substats:splitList(cell(row,'副屬性能力')),
      skill:cell(row,'固有技能'),
      skillDesc:cell(row,'固有技能介紹')
    })).filter(p=>p.name);
  }

  function dedupeSkills(rows){
    const map=new Map();
    rows.forEach(row=>{
      const name=cell(row,'技能名稱'),tag=cell(row,'標籤'),effect=cell(row,'基礎效果');
      if(!name)return;
      const key=`${name}|${tag}|${effect}`;
      const rate=pctText(cell(row,'技能取得機率'));
      if(!map.has(key))map.set(key,{...row,__rates:new Set(rate&&rate!=='官方未標示'?[rate]:[])});
      else if(rate&&rate!=='官方未標示')map.get(key).__rates.add(rate);
    });
    return [...map.values()];
  }

  async function loadV5(){
    if(loadedV5)return;
    if(loadingV5)return loadingV5;
    loadingV5=(async()=>{
      try{
        const [introRes,skillRes]=await Promise.all([
          fetch(`${BASE.replace('__GID__',INTRO_GID)}&_=${Date.now()}`,{cache:'no-store'}),
          fetch(`${BASE.replace('__GID__',SKILL_GID)}&_=${Date.now()}`,{cache:'no-store'})
        ]);
        if(!introRes.ok)throw new Error(`寵物介紹 HTTP ${introRes.status}`);
        if(!skillRes.ok)throw new Error(`寵物技能 HTTP ${skillRes.status}`);
        const introRows=parseCsv(await introRes.text());
        const skillRows=parseCsv(await skillRes.text());
        const introHeaders=introRows.length?Object.keys(introRows[0]):[];
        const requiredIntro=['寵物類別','初始標籤','寵物名稱','副屬性能力','固有技能','固有技能介紹'];
        const missing=requiredIntro.filter(h=>!introHeaders.includes(h));
        if(missing.length)throw new Error(`寵物介紹缺少欄位：${missing.join('、')}`);
        petsV5=normalizePets(introRows);
        skillsV5=dedupeSkills(skillRows);
        try{petSkillRows=skillRows;}catch{}
        errorV5='';loadedV5=true;
      }catch(error){
        errorV5=error?.message||String(error);
        console.error('[Pet V5] 載入失敗',error);
      }finally{loadingV5=null;}
    })();
    return loadingV5;
  }

  function focusInfo(p){
    const s=p.skill;
    if(s.startsWith('破防嚎叫'))return {key:'damage',label:'主人增傷',score:3};
    if(s.startsWith('鬥志爆發'))return {key:'damage',label:'寵物攻擊增益',score:2};
    if(s.startsWith('空隙突襲'))return {key:'damage',label:'寵物直接輸出',score:1};
    if(s.startsWith('究極的應援'))return {key:'ultimate',label:'絕招充能',score:1};
    if(s.startsWith('恢復的祈願'))return {key:'heal',label:'回復',score:1};
    if(s.startsWith('不屈的願望'))return {key:'survive',label:'生存減傷',score:1};
    if(s.startsWith('元素淨化'))return {key:'cleanse',label:'淨化',score:1};
    return {key:'control',label:'控場',score:1};
  }

  function petCard(p){
    const focus=focusInfo(p);
    return `<article class="petv4-card"><div class="petv4-card-head"><div><span>${esc(p.category)}</span><h3>${esc(p.name)}</h3></div><b>${esc(focus.label)}</b></div><div class="petv4-substats">${p.substats.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="petv4-skill"><small>固有技能</small><strong>${esc(p.skill)}</strong><p>${esc(p.skillDesc)}</p></div><div class="petv4-tags"><small>初始可能標籤</small><div>${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div></article>`;
  }

  function renderRecommend(){
    const substats=[...new Set(petsV5.flatMap(p=>p.substats))].sort();
    let list=petsV5.filter(p=>[...selectedSubstatsV5].every(s=>p.substats.includes(s)));
    if(selectedFocusV5)list=list.filter(p=>focusInfo(p).key===selectedFocusV5);
    if(selectedFocusV5==='damage')list.sort((a,b)=>focusInfo(b).score-focusInfo(a).score);
    return `<section class="petv4-filter-panel"><div class="petv4-section-title"><div><span>QUICK RECOMMEND</span><h3>我適合哪隻寵物？</h3></div><button id="petv5Clear" type="button">清除條件</button></div><p class="petv4-help">資料直接讀取 Google Sheet「寵物介紹」。副屬性可複選，會找出同時符合全部條件的寵物。</p><div class="petv4-preset-row"><button type="button" data-v5-preset="critcombo">暴擊 + 連擊強化</button><button type="button" data-v5-preset="damage">增傷／輸出優先</button></div><h4>副屬性</h4><div class="petv4-chip-grid">${substats.map(s=>`<button type="button" class="${selectedSubstatsV5.has(s)?'active':''}" data-v5-substat="${esc(s)}">${esc(s)}</button>`).join('')}</div><h4>固有技能方向</h4><div class="petv4-focus-row">${[['damage','增傷／輸出'],['ultimate','絕招充能'],['heal','回復'],['survive','生存'],['cleanse','淨化'],['control','控場']].map(([k,l])=>`<button type="button" class="${selectedFocusV5===k?'active':''}" data-v5-focus="${k}">${l}</button>`).join('')}</div></section><div class="petv4-result-head"><div><span>推薦結果</span><h3>${list.length} 隻符合</h3></div><small>${selectedSubstatsV5.size||selectedFocusV5?'已套用篩選條件':'尚未設定條件，先顯示全部寵物'}</small></div><div class="petv4-grid">${list.length?list.map(petCard).join(''):'<div class="petv4-empty">目前沒有同時符合這些條件的寵物。</div>'}</div>`;
  }

  function renderCatalog(){
    const cats=[...new Set(petsV5.map(p=>p.category))];
    return `<div class="petv4-result-head"><div><span>PET CATALOG</span><h3>寵物圖鑑</h3></div><small>${petsV5.length} 種外觀</small></div>${cats.map(cat=>`<section class="petv4-catalog-group"><div class="petv4-catalog-title"><h3>${esc(cat)}</h3><span>${petsV5.filter(p=>p.category===cat).length} 隻</span></div><div class="petv4-grid">${petsV5.filter(p=>p.category===cat).map(petCard).join('')}</div></section>`).join('')}`;
  }

  function renderSkills(){
    const tags=[...new Set(skillsV5.map(r=>cell(r,'標籤')).filter(Boolean))].sort();
    const cats=[...new Set(skillsV5.map(r=>cell(r,'技能分類')).filter(Boolean))].sort();
    const q=skillQueryV5.trim().toLowerCase();
    const filtered=skillsV5.filter(r=>{
      const name=cell(r,'技能名稱'),tag=cell(r,'標籤'),cat=cell(r,'技能分類'),effect=cell(r,'基礎效果');
      return (!q||[name,tag,cat,effect].join(' ').toLowerCase().includes(q))&&(!skillTagV5||tag===skillTagV5)&&(!skillCategoryV5||cat===skillCategoryV5);
    });
    return `<section class="petv4-skill-search"><div class="field"><span>搜尋技能、標籤、效果</span><input id="petv5SkillSearch" type="search" value="${esc(skillQueryV5)}" placeholder="例如：暴擊、迅速、反射神經"></div><select id="petv5SkillTag"><option value="">全部標籤</option>${tags.map(t=>`<option value="${esc(t)}" ${skillTagV5===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select id="petv5SkillCategory"><option value="">全部分類</option>${cats.map(c=>`<option value="${esc(c)}" ${skillCategoryV5===c?'selected':''}>${esc(c)}</option>`).join('')}</select></section><div class="petv4-result-head"><div><span>SKILL DATABASE</span><h3>寵物技能效果</h3></div><small>${filtered.length} 筆</small></div><div class="petv4-skill-grid">${filtered.map(r=>{const name=cell(r,'技能名稱'),tag=cell(r,'標籤')||'—',cat=cell(r,'技能分類')||'其他',effect=cell(r,'基礎效果')||'官方未標示',rates=[...(r.__rates||[])];return `<button type="button" class="petv4-skill-card" data-v5-skill="${esc(`${name}|${tag}|${effect}`)}"><div><span class="petv4-tag-pill">${esc(tag)}</span><small>${esc(cat)}</small></div><h3>${esc(name)}</h3><p>${esc(effect)}</p><div class="petv4-skill-foot"><span>技能取得機率 ${esc(rates.length?rates.join(' / '):pctText(cell(r,'技能取得機率')))}</span><b>查看詳細 →</b></div></button>`;}).join('')||'<div class="petv4-empty">找不到符合條件的技能。</div>'}</div>`;
  }

  function renderTags(){
    const initialTags=[...new Set(petsV5.flatMap(p=>p.tags))];
    const skillTags=[...new Set(skillsV5.map(r=>cell(r,'標籤')).filter(Boolean))];
    const tags=[...new Set([...initialTags,...skillTags])].sort();
    return `<div class="petv4-result-head"><div><span>TAG MAP</span><h3>標籤 → 寵物／技能</h3></div><small>${tags.length} 種標籤</small></div><div class="petv4-tag-grid">${tags.map(tag=>{const pets=[...new Set(petsV5.filter(p=>p.tags.includes(tag)).map(p=>p.category))];const skills=skillsV5.filter(r=>cell(r,'標籤')===tag);return `<article class="petv4-tag-card"><h3>${esc(tag)}</h3><small>可出現寵物</small><p>${pets.length?pets.map(esc).join('、'):'初始標籤不會出現'}</p><small>對應技能</small><div>${skills.slice(0,8).map(r=>`<span>${esc(cell(r,'技能名稱'))}</span>`).join('')||'<span>官方未列技能</span>'}</div></article>`;}).join('')}</div>`;
  }

  function openSkillV5(key){
    const [name,tag,effect]=key.split('|');
    const row=skillsV5.find(r=>cell(r,'技能名稱')===name&&cell(r,'標籤')===tag&&cell(r,'基礎效果')===effect);
    if(!row)return;
    const dialog=document.querySelector('#petSkillDialog'),title=document.querySelector('#petSkillTitle'),content=document.querySelector('#petSkillContent');
    if(!dialog||!title||!content)return;
    title.textContent=name;
    const rates=[...(row.__rates||[])];
    content.innerHTML=`<h3>${esc(name)}</h3><dl><dt>標籤</dt><dd>${esc(tag||'—')}</dd><dt>技能分類</dt><dd>${esc(cell(row,'技能分類')||'其他')}</dd><dt>技能取得機率</dt><dd>${esc(rates.length?rates.join(' / '):pctText(cell(row,'技能取得機率')))}</dd><dt>基礎效果</dt><dd>${esc(effect||'官方未標示')}</dd><dt>標籤一致時</dt><dd>${esc(cell(row,'標籤一致強化效果')||'無額外標籤一致效果')}</dd><dt>備註</dt><dd>${esc(cell(row,'備註')||'—')}</dd></dl>`;
    if(dialog.open)dialog.close();dialog.showModal();
  }

  function bindV5(home){
    home.querySelectorAll('[data-v5-mode]').forEach(b=>b.addEventListener('click',()=>{modeV5=b.dataset.v5Mode;renderPetTool();}));
    home.querySelectorAll('[data-v5-substat]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.v5Substat;selectedSubstatsV5.has(v)?selectedSubstatsV5.delete(v):selectedSubstatsV5.add(v);renderPetTool();}));
    home.querySelectorAll('[data-v5-focus]').forEach(b=>b.addEventListener('click',()=>{selectedFocusV5=selectedFocusV5===b.dataset.v5Focus?'':b.dataset.v5Focus;renderPetTool();}));
    home.querySelectorAll('[data-v5-preset]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.v5Preset==='critcombo'){selectedSubstatsV5.clear();selectedSubstatsV5.add('暴擊');selectedSubstatsV5.add('連擊強化');selectedFocusV5='';}else{selectedSubstatsV5.clear();selectedFocusV5='damage';}renderPetTool();}));
    document.querySelector('#petv5Clear')?.addEventListener('click',()=>{selectedSubstatsV5.clear();selectedFocusV5='';renderPetTool();});
    document.querySelector('#petv5SkillSearch')?.addEventListener('input',e=>{skillQueryV5=e.target.value;renderPetTool();setTimeout(()=>document.querySelector('#petv5SkillSearch')?.focus(),0);});
    document.querySelector('#petv5SkillTag')?.addEventListener('change',e=>{skillTagV5=e.target.value;renderPetTool();});
    document.querySelector('#petv5SkillCategory')?.addEventListener('change',e=>{skillCategoryV5=e.target.value;renderPetTool();});
    home.querySelectorAll('[data-v5-skill]').forEach(b=>b.addEventListener('click',()=>openSkillV5(b.dataset.v5Skill)));
    document.querySelector('#petBackGuideV5')?.addEventListener('click',showGuideHome);
  }

  renderPetTool=function(){
    const home=document.querySelector('#petToolHome');if(!home)return;
    if(!loadedV5){home.innerHTML=errorV5?`<div class="guide-error">寵物資料讀取失敗：${esc(errorV5)}<br><button type="button" id="petV5Retry">重新載入</button></div>`:'<div class="guide-error">正在取得寵物介紹與技能資料……</div>';document.querySelector('#petV5Retry')?.addEventListener('click',()=>{errorV5='';loadedV5=false;showPetTool();});return;}
    const body=modeV5==='recommend'?renderRecommend():modeV5==='catalog'?renderCatalog():modeV5==='skills'?renderSkills():renderTags();
    home.innerHTML=`<div class="guide-home-head"><div><p class="guide-kicker">PET GUIDE / LIVE SHEET</p><h2>寵物推薦・技能查詢</h2><p class="guide-intro">寵物資料直接同步 Google Sheet「寵物介紹」；技能效果直接同步「寵物_技能」。</p></div><button class="rune-back" id="petBackGuideV5" type="button">← 返回新手教學</button></div><div class="petv4-tabs"><button type="button" data-v5-mode="recommend" class="${modeV5==='recommend'?'active':''}">快速推薦</button><button type="button" data-v5-mode="catalog" class="${modeV5==='catalog'?'active':''}">寵物圖鑑</button><button type="button" data-v5-mode="skills" class="${modeV5==='skills'?'active':''}">技能效果</button><button type="button" data-v5-mode="tags" class="${modeV5==='tags'?'active':''}">標籤對照</button></div>${body}`;
    bindV5(home);
  };

  showPetTool=function(){
    ['guideHome','guideArticle','spiritTraceHome','runeHome','runeDetail','loadoutHome','loadoutDetail','customRuneBuilder'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true;});
    const home=document.getElementById('petToolHome');if(home)home.hidden=false;
    renderPetTool();
    if(!loadedV5&&!loadingV5)loadV5().then(renderPetTool);
  };

  // 覆蓋舊技能詳細開啟邏輯，避免依賴已淘汰的寵物標籤技能對照/技能標籤變更資料表。
  petOpenSkill=function(row){
    const key=`${cell(row,'技能名稱')}|${cell(row,'標籤')}|${cell(row,'基礎效果')}`;
    openSkillV5(key);
  };
})();
