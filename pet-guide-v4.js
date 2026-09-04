(() => {
  'use strict';

  const PETS=[
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'斑點貓',substats:['攻擊力','暴擊'],skill:'不許動',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少15%(冷卻時間10秒)'},
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'黃色貓',substats:['連擊強化','強擊強化'],skill:'不許動',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少15%(冷卻時間10秒)'},
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'雙色毛貓',substats:['攻擊力','暴擊'],skill:'不許動',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少15%(冷卻時間10秒)'},
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'三色貓',substats:['攻擊力','廣域強化'],skill:'不許動',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少15%(冷卻時間10秒)'},
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'棕色貓',substats:['暴擊','連擊強化'],skill:'不許動',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少15%(冷卻時間10秒)'},
    {category:'貓',tags:['智慧','弱化','冰','混亂','暗黑'],name:'燕尾服貓',substats:['破防','攻擊力'],skill:'不許動S',skillDesc:'施放時，於4秒期間，使寵物主人鎖定的1名敵人的移動速度減少20%(冷卻時間10秒)'},
    {category:'獵犬',tags:['結實','智慧','近戰','火苗','神聖'],name:'黃金獵犬',substats:['攻擊力','暴擊'],skill:'空隙突襲',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，同行寵物對寵物主人鎖定的1名敵人造成45的近距離傷害。(冷卻時間8秒)'},
    {category:'獵犬',tags:['結實','智慧','近戰','火苗','神聖'],name:'黑色獵犬',substats:['破防','強擊強化'],skill:'空隙突襲',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，同行寵物對寵物主人鎖定的1名敵人造成45的近距離傷害。(冷卻時間8秒)'},
    {category:'獵犬',tags:['結實','智慧','近戰','火苗','神聖'],name:'深棕色獵犬',substats:['攻擊力','廣域強化'],skill:'空隙突襲',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，同行寵物對寵物主人鎖定的1名敵人造成45的近距離傷害。(冷卻時間8秒)'},
    {category:'獵犬',tags:['結實','智慧','近戰','火苗','神聖'],name:'白色獵犬',substats:['追擊','攻擊力'],skill:'空隙突襲S',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，同行寵物對寵物主人鎖定的1名敵人造成60的近距離傷害。(冷卻時間8秒)'},
    {category:'小熊',tags:['近戰','射擊','暗黑','電擊','刀刃'],name:'灰色小熊',substats:['連段強化','暴擊'],skill:'鬥志爆發',skillDesc:'寵物主人被破防時可施放。施放時，於6秒期間，同行寵物的攻擊力增加15%。(冷卻時間8秒)'},
    {category:'小熊',tags:['近戰','射擊','暗黑','電擊','刀刃'],name:'棕色小熊',substats:['暴擊','連擊強化'],skill:'鬥志爆發',skillDesc:'寵物主人被破防時可施放。施放時，於6秒期間，同行寵物的攻擊力增加15%。(冷卻時間8秒)'},
    {category:'小熊',tags:['近戰','射擊','暗黑','電擊','刀刃'],name:'黑色小熊',substats:['恢復力','追加體力'],skill:'鬥志爆發',skillDesc:'寵物主人被破防時可施放。施放時，於6秒期間，同行寵物的攻擊力增加15%。(冷卻時間8秒)'},
    {category:'小熊',tags:['近戰','射擊','暗黑','電擊','刀刃'],name:'白色小熊',substats:['連段強化','暴擊'],skill:'鬥志爆發S',skillDesc:'寵物主人被破防時可施放。施放時，於6秒期間，同行寵物的攻擊力增加20%。(冷卻時間8秒)'},
    {category:'小狐狸',tags:['纖細','幸運兒','射擊','混亂','猛毒'],name:'淺棕色小狐狸',substats:['連擊強化','強擊強化'],skill:'元素淨化',skillDesc:'寵物主人受到持續傷害時可施放。施放時解除寵物主人正在承受的全部持續傷害效果(冷卻時間40秒)'},
    {category:'小狐狸',tags:['纖細','幸運兒','射擊','混亂','猛毒'],name:'棕色小狐狸',substats:['連擊強化','強擊強化'],skill:'元素淨化',skillDesc:'寵物主人受到持續傷害時可施放。施放時解除寵物主人正在承受的全部持續傷害效果(冷卻時間40秒)'},
    {category:'小狐狸',tags:['纖細','幸運兒','射擊','混亂','猛毒'],name:'白色小狐狸',substats:['破防','絕招'],skill:'元素淨化',skillDesc:'寵物主人受到持續傷害時可施放。施放時解除寵物主人正在承受的全部持續傷害效果(冷卻時間40秒)'},
    {category:'小狐狸',tags:['纖細','幸運兒','射擊','混亂','猛毒'],name:'黑色小狐狸',substats:['快速攻擊','快速技能'],skill:'元素淨化S',skillDesc:'寵物主人受到持續傷害時可施放。施放時解除寵物主人正在承受的全部持續傷害效果(冷卻時間30秒)'},
    {category:'博美犬',tags:['結實','毅力','神聖','電擊','冰'],name:'銀灰色博美犬',substats:['恢復力','追加體力'],skill:'究極的應援',skillDesc:'施放時，為寵物主人的絕招量條充能6%(冷卻時間40秒)'},
    {category:'博美犬',tags:['結實','毅力','神聖','電擊','冰'],name:'黑色博美犬',substats:['傷害減少','要害迴避'],skill:'究極的應援',skillDesc:'施放時，為寵物主人的絕招量條充能6%(冷卻時間40秒)'},
    {category:'博美犬',tags:['結實','毅力','神聖','電擊','冰'],name:'黑棕博美犬',substats:['強擊強化','攻擊力'],skill:'究極的應援',skillDesc:'施放時，為寵物主人的絕招量條充能6%(冷卻時間40秒)'},
    {category:'博美犬',tags:['結實','毅力','神聖','電擊','冰'],name:'棕色博美犬',substats:['攻擊力','廣域強化'],skill:'究極的應援S',skillDesc:'施放時，為寵物主人的絕招量條充能8%(冷卻時間40秒)'},
    {category:'兔子',tags:['智慧','纖細','毅力','幸運兒','弱化'],name:'棕色兔子',substats:['連擊強化','攻擊力'],skill:'恢復的祈願',skillDesc:'寵物主人被破防時可施放。施放時，將寵物主人的體力恢復寵物主人最大體力的2%(冷卻時間8秒)'},
    {category:'兔子',tags:['智慧','纖細','毅力','幸運兒','弱化'],name:'灰色兔子',substats:['強擊強化','攻擊力'],skill:'恢復的祈願',skillDesc:'寵物主人被破防時可施放。施放時，將寵物主人的體力恢復寵物主人最大體力的2%(冷卻時間8秒)'},
    {category:'兔子',tags:['智慧','纖細','毅力','幸運兒','弱化'],name:'斑點兔子',substats:['攻擊力','技能威力'],skill:'恢復的祈願',skillDesc:'寵物主人被破防時可施放。施放時，將寵物主人的體力恢復寵物主人最大體力的2%(冷卻時間8秒)'},
    {category:'兔子',tags:['智慧','纖細','毅力','幸運兒','弱化'],name:'白兔子',substats:['追擊','攻擊力'],skill:'恢復的祈願S',skillDesc:'寵物主人被破防時可施放。施放時，將寵物主人的體力恢復寵物主人最大體力的3%(冷卻時間8秒)'},
    {category:'浣熊',tags:['纖細','幸運兒','弱化','射擊','猛毒'],name:'灰色浣熊',substats:['防禦力','傷害減少'],skill:'不屈的願望',skillDesc:'寵物主人被破防時可施放。施放時，於4秒期間，寵物主人的傷害減少增加18(冷卻時間8秒)'},
    {category:'浣熊',tags:['纖細','幸運兒','弱化','射擊','猛毒'],name:'深棕浣熊',substats:['防禦力','傷害減少'],skill:'不屈的願望',skillDesc:'寵物主人被破防時可施放。施放時，於4秒期間，寵物主人的傷害減少增加18(冷卻時間8秒)'},
    {category:'浣熊',tags:['纖細','幸運兒','弱化','射擊','猛毒'],name:'淺棕浣熊',substats:['傷害減少','要害迴避'],skill:'不屈的願望',skillDesc:'寵物主人被破防時可施放。施放時，於4秒期間，寵物主人的傷害減少增加18(冷卻時間8秒)'},
    {category:'浣熊',tags:['纖細','幸運兒','弱化','射擊','猛毒'],name:'淺灰色浣熊',substats:['暴擊','連擊強化'],skill:'不屈的願望S',skillDesc:'寵物主人被破防時可施放。施放時，於5秒期間，寵物主人的傷害減少增加18(冷卻時間8秒)'},
    {category:'幼狼',tags:['結實','毅力','近戰','刀刃','火苗'],name:'深灰色小狼',substats:['破防','攻擊力'],skill:'破防嚎叫',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，於6秒期間內，寵物主人的無防備傷害增加2%(冷卻時間8秒)'},
    {category:'幼狼',tags:['結實','毅力','近戰','刀刃','火苗'],name:'青灰色小狼',substats:['連擊強化','攻擊力'],skill:'破防嚎叫',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，於6秒期間內，寵物主人的無防備傷害增加2%(冷卻時間8秒)'},
    {category:'幼狼',tags:['結實','毅力','近戰','刀刃','火苗'],name:'白色小狼',substats:['防禦力','追加體力'],skill:'破防嚎叫',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，於6秒期間內，寵物主人的無防備傷害增加2%(冷卻時間8秒)'},
    {category:'幼狼',tags:['結實','毅力','近戰','刀刃','火苗'],name:'黑色小狼',substats:['攻擊力','技能威力'],skill:'破防嚎叫S',skillDesc:'寵物主人鎖定的敵人處於破防狀態時可施放。施放時，於7秒期間內，寵物主人的無防備傷害增加3%(冷卻時間8秒)'}
  ];

  const SUBSTATS=[...new Set(PETS.flatMap(p=>p.substats))];
  let v4Mode='recommend';
  const selectedSubstats=new Set();
  let selectedFocus='';
  let skillQuery='';
  let skillTag='';
  let skillCategory='';
  const $q=s=>document.querySelector(s);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function focusInfo(p){
    const s=p.skill;
    if(s.startsWith('破防嚎叫'))return {key:'damage',label:'主人增傷',score:3};
    if(s.startsWith('空隙突襲'))return {key:'damage',label:'寵物直接輸出',score:1};
    if(s.startsWith('鬥志爆發'))return {key:'damage',label:'寵物攻擊增益',score:2};
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
    let list=PETS.filter(p=>[...selectedSubstats].every(s=>p.substats.includes(s)));
    if(selectedFocus)list=list.filter(p=>focusInfo(p).key===selectedFocus);
    if(selectedFocus==='damage')list.sort((a,b)=>focusInfo(b).score-focusInfo(a).score);
    const criteria=[selectedSubstats.size?`副屬性：${[...selectedSubstats].join(' + ')}`:'',selectedFocus?`固有技能：${({damage:'增傷／輸出',ultimate:'絕招充能',heal:'回復',survive:'生存',cleanse:'淨化',control:'控場'})[selectedFocus]}`:''].filter(Boolean).join('；');
    return `<section class="petv4-filter-panel"><div class="petv4-section-title"><div><span>QUICK RECOMMEND</span><h3>我適合哪隻寵物？</h3></div><button id="petv4Clear" type="button">清除條件</button></div><p class="petv4-help">副屬性可複選，系統會用「全部條件都符合」篩選。固有技能則用功能方向快速分類。</p><div class="petv4-preset-row"><button type="button" data-preset="critcombo">暴擊 + 連擊強化</button><button type="button" data-preset="damage">增傷／輸出優先</button></div><h4>副屬性</h4><div class="petv4-chip-grid">${SUBSTATS.map(s=>`<button type="button" class="${selectedSubstats.has(s)?'active':''}" data-substat="${esc(s)}">${esc(s)}</button>`).join('')}</div><h4>固有技能方向</h4><div class="petv4-focus-row">${[['damage','增傷／輸出'],['ultimate','絕招充能'],['heal','回復'],['survive','生存'],['cleanse','淨化'],['control','控場']].map(([k,l])=>`<button type="button" class="${selectedFocus===k?'active':''}" data-focus="${k}">${l}</button>`).join('')}</div></section><div class="petv4-result-head"><div><span>推薦結果</span><h3>${list.length} 隻符合</h3></div><small>${esc(criteria||'尚未設定條件，先顯示全部寵物')}</small></div><div class="petv4-grid">${list.length?list.map(petCard).join(''):'<div class="petv4-empty">目前沒有同時符合這些條件的寵物，試著減少一個篩選條件。</div>'}</div>`;
  }

  function renderCatalog(){
    const cats=[...new Set(PETS.map(p=>p.category))];
    return `<div class="petv4-result-head"><div><span>PET CATALOG</span><h3>寵物圖鑑</h3></div><small>${PETS.length} 種外觀</small></div>${cats.map(cat=>`<section class="petv4-catalog-group"><div class="petv4-catalog-title"><h3>${esc(cat)}</h3><span>${PETS.filter(p=>p.category===cat).length} 隻</span></div><div class="petv4-grid">${PETS.filter(p=>p.category===cat).map(petCard).join('')}</div></section>`).join('')}`;
  }

  function skillRows(){
    if(typeof petSkillRows==='undefined'||!Array.isArray(petSkillRows))return [];
    return petSkillRows.filter(r=>petCell(r,['技能名稱']));
  }

  function renderSkills(){
    const rows=skillRows();
    if(!rows.length)return '<div class="petv4-empty">寵物技能資料載入中……</div>';
    const tags=[...new Set(rows.map(r=>petCell(r,['標籤'])).filter(Boolean))].sort();
    const cats=[...new Set(rows.map(r=>petCell(r,['技能分類'])).filter(Boolean))].sort();
    const q=skillQuery.trim().toLowerCase();
    const filtered=rows.filter(r=>{
      const name=petCell(r,['技能名稱'])||'',tag=petCell(r,['標籤'])||'',cat=petCell(r,['技能分類'])||'',effect=petCell(r,['基礎效果'])||'';
      return (!q||[name,tag,cat,effect].join(' ').toLowerCase().includes(q))&&(!skillTag||tag===skillTag)&&(!skillCategory||cat===skillCategory);
    });
    return `<section class="petv4-skill-search"><div class="field"><span>搜尋技能、標籤、效果</span><input id="petv4SkillSearch" type="search" value="${esc(skillQuery)}" placeholder="例如：暴擊、迅速、反射神經"></div><select id="petv4SkillTag"><option value="">全部標籤</option>${tags.map(t=>`<option value="${esc(t)}" ${skillTag===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select id="petv4SkillCategory"><option value="">全部分類</option>${cats.map(c=>`<option value="${esc(c)}" ${skillCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select></section><div class="petv4-result-head"><div><span>SKILL DATABASE</span><h3>寵物技能效果</h3></div><small>${filtered.length} 筆</small></div><div class="petv4-skill-grid">${filtered.map(r=>{const name=petCell(r,['技能名稱'])||'—',tag=petCell(r,['標籤'])||'—',cat=petCell(r,['技能分類'])||'其他',effect=petCell(r,['基礎效果'])||'官方未標示';return `<button type="button" class="petv4-skill-card" data-pet-skill-key="${esc(`${name}|${effect}`)}"><div><span class="petv4-tag-pill">${esc(tag)}</span><small>${esc(cat)}</small></div><h3>${esc(name)}</h3><p>${esc(effect)}</p><div class="petv4-skill-foot"><span>技能取得機率 ${esc(petPercentText(petCell(r,['技能取得機率'])))}</span><b>查看詳細 →</b></div></button>`;}).join('')||'<div class="petv4-empty">找不到符合條件的技能。</div>'}</div>`;
  }

  function renderTags(){
    if(typeof petTagRows==='undefined'||!Array.isArray(petTagRows)||!petTagRows.length)return '<div class="petv4-empty">標籤資料載入中……</div>';
    const tags=[...new Set(petTagRows.map(r=>petCell(r,['標籤'])).filter(Boolean))].sort();
    return `<div class="petv4-result-head"><div><span>TAG MAP</span><h3>標籤 → 寵物／技能</h3></div><small>${tags.length} 種標籤</small></div><div class="petv4-tag-grid">${tags.map(tag=>{const pets=[...new Set(petTagRows.filter(r=>petCell(r,['標籤'])===tag).map(r=>petCell(r,['寵物種類'])).filter(Boolean))];const skills=skillRows().filter(r=>petCell(r,['標籤'])===tag);return `<article class="petv4-tag-card"><h3>${esc(tag)}</h3><small>可出現寵物</small><p>${pets.map(esc).join('、')||'—'}</p><small>對應技能</small><div>${skills.slice(0,6).map(r=>`<span>${esc(petCell(r,['技能名稱']))}</span>`).join('')||'<span>官方未列技能</span>'}</div></article>`;}).join('')}</div>`;
  }

  function bind(home){
    home.querySelectorAll('[data-v4-mode]').forEach(b=>b.addEventListener('click',()=>{v4Mode=b.dataset.v4Mode;renderPetTool();}));
    home.querySelectorAll('[data-substat]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.substat;selectedSubstats.has(v)?selectedSubstats.delete(v):selectedSubstats.add(v);renderPetTool();}));
    home.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>{selectedFocus=selectedFocus===b.dataset.focus?'':b.dataset.focus;renderPetTool();}));
    home.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.preset==='critcombo'){selectedSubstats.clear();selectedSubstats.add('暴擊');selectedSubstats.add('連擊強化');selectedFocus='';}else{selectedSubstats.clear();selectedFocus='damage';}renderPetTool();}));
    $q('#petv4Clear')?.addEventListener('click',()=>{selectedSubstats.clear();selectedFocus='';renderPetTool();});
    $q('#petv4SkillSearch')?.addEventListener('input',e=>{skillQuery=e.target.value;renderPetTool();setTimeout(()=>{$q('#petv4SkillSearch')?.focus();},0);});
    $q('#petv4SkillTag')?.addEventListener('change',e=>{skillTag=e.target.value;renderPetTool();});
    $q('#petv4SkillCategory')?.addEventListener('change',e=>{skillCategory=e.target.value;renderPetTool();});
    home.querySelectorAll('[data-pet-skill-key]').forEach(button=>button.addEventListener('click',()=>{const [name,effect]=button.dataset.petSkillKey.split('|');const row=skillRows().find(r=>petCell(r,['技能名稱'])===name&&petCell(r,['基礎效果'])===effect);if(row)petOpenSkill(row);}));
    $q('#petBackGuideV4')?.addEventListener('click',showGuideHome);
  }

  renderPetTool=function(){
    const home=$q('#petToolHome');if(!home)return;
    const body=v4Mode==='recommend'?renderRecommend():v4Mode==='catalog'?renderCatalog():v4Mode==='skills'?renderSkills():renderTags();
    home.innerHTML=`<div class="guide-home-head"><div><p class="guide-kicker">PET GUIDE / MATCH & SKILL</p><h2>寵物推薦・技能查詢</h2><p class="guide-intro">先用副屬性與固有技能方向找適合的寵物，再查技能效果與對應標籤。</p></div><button class="rune-back" id="petBackGuideV4" type="button">← 返回新手教學</button></div><div class="petv4-tabs"><button type="button" data-v4-mode="recommend" class="${v4Mode==='recommend'?'active':''}">快速推薦</button><button type="button" data-v4-mode="catalog" class="${v4Mode==='catalog'?'active':''}">寵物圖鑑</button><button type="button" data-v4-mode="skills" class="${v4Mode==='skills'?'active':''}">技能效果</button><button type="button" data-v4-mode="tags" class="${v4Mode==='tags'?'active':''}">標籤對照</button></div>${body}`;
    bind(home);
  };
})();
