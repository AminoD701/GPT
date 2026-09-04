(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const routes = [
    {title:'首頁',desc:'網站總入口',keywords:'首頁 home 入口',action:()=>window.showSiteHome?.()},
    {title:'公會成員',desc:'查看公會成員、六角色配置與工作日誌',keywords:'公會 成員 roster 角色 工作日誌',action:()=>window.switchView?.('members')},
    {title:'新手攻略',desc:'攻略工具分類首頁',keywords:'新手 攻略 教學 guide',action:()=>{window.switchView?.('guides');window.showGuideHome?.();}},
    {title:'骰子與裝備進度',desc:'養成進度工具',keywords:'骰子 裝備 進度 養成',action:()=>{window.switchView?.('guides');window.showGuideArticle?.();}},
    {title:'職業等級・精靈痕跡',desc:'精靈痕跡養成工具',keywords:'精靈 痕跡 職業 等級',action:()=>{window.switchView?.('guides');window.showSpiritTraceTool?.();}},
    {title:'傳說符文圖鑑',desc:'武器、防具、飾品與徽章符文效果',keywords:'符文 傳說 圖鑑 武器 防具 飾品 徽章 rune',action:()=>{window.switchView?.('guides');window.showRuneHome?.();}},
    {title:'職業完整配裝',desc:'職業流派、配裝與替代符文',keywords:'職業 配裝 流派 build 裝備',action:()=>{window.switchView?.('guides');window.showLoadoutHome?.();}},
    {title:'推薦符文詞條',desc:'查詢各職業推薦詞條',keywords:'推薦 符文 詞條 屬性',action:()=>{window.switchView?.('guides');window.showRuneRecommendationHome?.();}},
    {title:'自訂符文配裝',desc:'自由搭配符文與效果',keywords:'自訂 符文 配裝 模擬',action:()=>{window.switchView?.('guides');window.showCustomRuneBuilder?.();}},
    {title:'寵物推薦・技能查詢',desc:'副屬性、固有技能、技能效果與標籤',keywords:'寵物 推薦 技能 標籤 副屬性 pet 迅速 致命',action:()=>{window.switchView?.('guides');window.showPetTool?.();}}
  ];

  function normalize(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function ensure(){
    if($('siteSearchInput')) return true;
    const tabs=document.querySelector('.site-tabs');
    if(!tabs) return false;
    const wrap=document.createElement('div');
    wrap.className='site-search-wrap';
    wrap.innerHTML=`<div class="site-search-box"><span class="site-search-icon">⌕</span><input id="siteSearchInput" type="search" autocomplete="off" placeholder="搜尋公會成員、攻略、符文或寵物資料"><span class="site-search-shortcut">/ 搜尋</span></div><div id="siteSearchResults" class="site-search-results" hidden></div>`;
    tabs.insertAdjacentElement('afterend',wrap);
    bind();
    return true;
  }

  function collectMembers(q){
    const out=[];
    document.querySelectorAll('#memberGrid .member-card').forEach(card=>{
      const text=normalize(card.textContent);
      if(!text.includes(q)) return;
      const name=card.querySelector('.main-id')?.textContent?.trim()||'公會成員';
      const guild=card.querySelector('.line-name')?.textContent?.trim()||'';
      out.push({title:name,desc:guild||'公會成員資料',kind:'公會成員',action:()=>card.click()});
    });
    return out;
  }

  function collectVisibleActions(q){
    const out=[];
    const seen=new Set();
    const selectors=['#guideView button','.rune-card','.rune-class-card','.loadout-class-card','.petv4-skill-card','.petv4-pet-card'];
    document.querySelectorAll(selectors.join(',')).forEach(el=>{
      if(el.closest('.site-search-wrap')) return;
      const text=normalize(el.textContent);
      if(!text||!text.includes(q)) return;
      const title=(el.querySelector('h3,h4,strong,b')?.textContent||el.textContent).trim().replace(/\s+/g,' ').slice(0,44);
      if(!title||seen.has(title)) return;
      seen.add(title);
      out.push({title,desc:'網站資料結果',kind:'資料',action:()=>{try{el.click();}catch{}}});
    });
    return out.slice(0,8);
  }

  function search(query){
    const q=normalize(query);
    if(!q) return [];
    const base=routes.filter(r=>normalize(`${r.title} ${r.desc} ${r.keywords}`).includes(q)).map(r=>({...r,kind:'快速入口'}));
    return [...base,...collectMembers(q),...collectVisibleActions(q)].slice(0,12);
  }

  let current=[];
  let active=-1;
  function render(value){
    const box=$('siteSearchResults');
    current=search(value); active=-1;
    if(!normalize(value)){box.hidden=true;box.innerHTML='';return;}
    box.hidden=false;
    if(!current.length){box.innerHTML='<div class="site-search-empty">找不到符合的資料，換個關鍵字試試看。</div>';return;}
    let last='';
    box.innerHTML=current.map((r,i)=>{
      const section=r.kind!==last?`<div class="site-search-section">${r.kind}</div>`:'';
      last=r.kind;
      return `${section}<button class="site-search-result" type="button" data-search-index="${i}"><span><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.desc||'')}</small></span><em>→</em></button>`;
    }).join('');
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function run(index){const item=current[index];if(!item)return; $('siteSearchInput').blur(); $('siteSearchResults').hidden=true; item.action?.();}
  function setActive(next){
    const items=[...document.querySelectorAll('.site-search-result')];
    if(!items.length)return;
    active=(next+items.length)%items.length;
    items.forEach((el,i)=>el.classList.toggle('is-active',i===active));
    items[active]?.scrollIntoView({block:'nearest'});
  }

  function bind(){
    const input=$('siteSearchInput'), results=$('siteSearchResults');
    input.addEventListener('input',()=>render(input.value));
    input.addEventListener('focus',()=>{if(input.value)render(input.value);});
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();setActive(active+1);}
      else if(e.key==='ArrowUp'){e.preventDefault();setActive(active-1);}
      else if(e.key==='Enter'){e.preventDefault();run(active>=0?active:0);}
      else if(e.key==='Escape'){results.hidden=true;input.blur();}
    });
    results.addEventListener('click',e=>{const b=e.target.closest('[data-search-index]');if(b)run(Number(b.dataset.searchIndex));});
    document.addEventListener('click',e=>{if(!e.target.closest('.site-search-wrap'))results.hidden=true;});
    document.addEventListener('keydown',e=>{
      if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement?.tagName||'')){e.preventDefault();input.focus();}
    });
  }

  const init=()=>ensure()?null:setTimeout(init,50);
  init();
})();
