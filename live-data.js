(() => {
  'use strict';

  const $=id=>document.getElementById(id);
  let marketItems=[];
  let selectedMain='全部';
  let selectedMiddle='全部';
  let selectedChild='全部';

  const MAIN_ORDER=['武器','防具','飾品','道具','工具'];
  const ICONS={
    '全部': iconGrid(),
    '武器': iconSword(),
    '防具': iconShield(),
    '飾品': iconGem(),
    '道具': iconBag(),
    '工具': iconHammer()
  };
  const ACCENTS={
    '全部':'#78b7ff',
    '武器':'#ff8a72',
    '防具':'#66c7ff',
    '飾品':'#c99cff',
    '道具':'#f0c66c',
    '工具':'#62d2aa'
  };

  function iconGrid(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>'}
  function iconSword(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3 21 3l0 6.5-8.8 8.8-2.5-2.5 8.8-8.8H16l-7.6 7.6-2.1-2.1L14.5 3ZM5.6 14.4l4 4-1.4 1.4-4-4 1.4-1.4Zm-2 3 3 3-1.5 1.5-3-3 1.5-1.5Z"/></svg>'}
  function iconShield(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 20 5v6c0 5.2-3.4 9-8 11-4.6-2-8-5.8-8-11V5l8-3Zm0 4.1L8 7.6V11c0 3.2 1.8 5.6 4 7 2.2-1.4 4-3.8 4-7V7.6l-4-1.5Z"/></svg>'}
  function iconGem(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 3-4 5 9 13 9-13-4-5H7Zm1.2 2h7.6l2 2.5H6.2L8.2 5ZM6.4 9.5h11.2L12 17.6 6.4 9.5Z"/></svg>'}
  function iconBag(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6V5a4 4 0 0 1 8 0v1h3l1 15H4L5 6h3Zm2 0h4V5a2 2 0 0 0-4 0v1Zm-3.1 2-.7 11h11.6l-.7-11H6.9Z"/></svg>'}
  function iconHammer(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.7 3.3 7 7-2.8 2.8-2-2-8.7 8.7H3.2v-4l8.7-8.7-2-2 2.8-2.8 1 1Zm.2 5.2 2.8 2.8 1.2-1.2-2.8-2.8-1.2 1.2ZM5.2 16.8v1h1l7.8-7.8-1-1-7.8 7.8Z"/></svg>'}

  function ageText(iso){
    if(!iso)return '—';
    const diff=Math.max(0,Date.now()-new Date(iso).getTime());
    const min=Math.floor(diff/60000);
    if(min<1)return '剛剛';
    if(min<60)return min+' 分鐘前';
    const hr=Math.floor(min/60);
    if(hr<24)return hr+' 小時前';
    return Math.floor(hr/24)+' 天前';
  }

  function ensure(){
    if($('liveDataView'))return true;
    const anchor=$('membersView');
    if(!anchor)return false;

    const view=document.createElement('section');
    view.id='liveDataView';
    view.className='live-data-view';
    view.hidden=true;
    view.innerHTML=`
      <section class="market-shell">
        <header class="market-hero">
          <div class="market-hero-icon">${iconSword()}</div>
          <div class="market-hero-copy">
            <span>MARKET</span>
            <h2>交易所</h2>
            <p>價格查詢・分類篩選</p>
          </div>
          <div class="market-sync">
            <small id="marketUpdated">讀取中…</small>
            <a href="https://mmd-tw.com/" target="_blank" rel="noopener">資料來源 MMD-TW ↗</a>
          </div>
        </header>

        <div class="market-toolbar">
          <label class="market-search">
            <span class="market-search-icon">⌕</span>
            <input id="marketSearch" type="search" placeholder="搜尋道具名稱" autocomplete="off">
          </label>
          <select id="marketSort" aria-label="排序">
            <option value="price-asc">價格低到高</option>
            <option value="price-desc">價格高到低</option>
            <option value="stock-desc">掛售多到少</option>
            <option value="name">名稱排序</option>
          </select>
        </div>

        <nav class="market-main-tabs" id="marketMainTabs" aria-label="交易所主分類"></nav>
        <nav class="market-sub-tabs" id="marketMiddleTabs" aria-label="交易所次分類"></nav>
        <nav class="market-child-tabs" id="marketChildTabs" aria-label="交易所細分類"></nav>

        <div class="market-result-head">
          <span id="marketBreadcrumb">全部商品</span>
          <small id="marketMeta">讀取交易所資料中…</small>
        </div>

        <div id="marketGrid" class="market-list"></div>
      </section>`;

    anchor.parentElement.insertBefore(view,anchor);
    $('marketSearch')?.addEventListener('input',renderMarket);
    $('marketSort')?.addEventListener('change',renderMarket);
    $('marketMainTabs')?.addEventListener('click',onMainClick);
    $('marketMiddleTabs')?.addEventListener('click',onMiddleClick);
    $('marketChildTabs')?.addEventListener('click',onChildClick);
    return true;
  }

  function hideOtherViews(){
    ['homeView','membersView','guideView'].forEach(id=>{const el=$(id);if(el)el.hidden=true;});
    const live=$('liveDataView');if(live)live.hidden=false;
    ['homeTab','membersTab','guidesTab'].forEach(id=>$(id)?.setAttribute('aria-selected','false'));
  }

  function categoryParts(item){
    const list=Array.isArray(item?.categories)?item.categories:[];
    const first=list.find(x=>x&&typeof x==='object')||null;
    if(first){
      return {
        main:String(first.ParentDisplayName||first.CategoryType||'其他').trim()||'其他',
        middle:String(first.MiddleDisplayName||'').trim(),
        child:String(first.ChildDisplayName||'').trim()
      };
    }
    const strings=list.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim());
    return {main:strings[0]||'其他',middle:strings[1]||'',child:strings[2]||''};
  }

  function allMainCategories(){
    const set=new Set(marketItems.map(x=>categoryParts(x).main).filter(Boolean));
    const known=MAIN_ORDER.filter(x=>set.has(x));
    const rest=[...set].filter(x=>!MAIN_ORDER.includes(x)).sort((a,b)=>a.localeCompare(b,'zh-Hant'));
    return ['全部',...known,...rest];
  }

  function filteredByMain(){
    return selectedMain==='全部'?marketItems:marketItems.filter(x=>categoryParts(x).main===selectedMain);
  }

  function middleCategories(){
    const set=new Set(filteredByMain().map(x=>categoryParts(x).middle).filter(Boolean));
    return ['全部',...[...set].sort((a,b)=>a.localeCompare(b,'zh-Hant'))];
  }

  function childCategories(){
    let rows=filteredByMain();
    if(selectedMiddle!=='全部')rows=rows.filter(x=>categoryParts(x).middle===selectedMiddle);
    const set=new Set(rows.map(x=>categoryParts(x).child).filter(Boolean));
    return ['全部',...[...set].sort((a,b)=>a.localeCompare(b,'zh-Hant'))];
  }

  function mainIcon(name){return ICONS[name]||iconGrid()}
  function accent(name){return ACCENTS[name]||'#8aa4c8'}

  function renderCategoryTabs(){
    const main=$('marketMainTabs');
    if(main){
      main.innerHTML=allMainCategories().map(name=>`
        <button type="button" class="market-main-tab ${name===selectedMain?'active':''}" data-main="${escapeAttr(name)}" style="--accent:${accent(name)}">
          <span class="market-main-icon">${mainIcon(name)}</span>
          <span>${escapeHtml(name)}</span>
        </button>`).join('');
    }

    const middles=middleCategories();
    if(!middles.includes(selectedMiddle)){selectedMiddle='全部';selectedChild='全部';}
    const middle=$('marketMiddleTabs');
    if(middle){
      middle.hidden=middles.length<=1;
      middle.innerHTML=middles.map(name=>`<button type="button" class="${name===selectedMiddle?'active':''}" data-middle="${escapeAttr(name)}">${escapeHtml(name)}</button>`).join('');
    }

    const children=childCategories();
    if(!children.includes(selectedChild))selectedChild='全部';
    const child=$('marketChildTabs');
    if(child){
      child.hidden=children.length<=1;
      child.innerHTML=children.map(name=>`<button type="button" class="${name===selectedChild?'active':''}" data-child="${escapeAttr(name)}">${escapeHtml(name)}</button>`).join('');
    }

    updateBreadcrumb();
  }

  function onMainClick(e){
    const btn=e.target.closest('[data-main]');
    if(!btn)return;
    selectedMain=btn.dataset.main;
    selectedMiddle='全部';
    selectedChild='全部';
    renderCategoryTabs();
    renderMarket();
  }

  function onMiddleClick(e){
    const btn=e.target.closest('[data-middle]');
    if(!btn)return;
    selectedMiddle=btn.dataset.middle;
    selectedChild='全部';
    renderCategoryTabs();
    renderMarket();
  }

  function onChildClick(e){
    const btn=e.target.closest('[data-child]');
    if(!btn)return;
    selectedChild=btn.dataset.child;
    renderCategoryTabs();
    renderMarket();
  }

  function updateBreadcrumb(){
    const parts=[];
    if(selectedMain!=='全部')parts.push(selectedMain);
    if(selectedMiddle!=='全部')parts.push(selectedMiddle);
    if(selectedChild!=='全部')parts.push(selectedChild);
    $('marketBreadcrumb').textContent=parts.length?parts.join(' › '):'全部商品';
  }

  function minPrice(item){
    const vars=Array.isArray(item?.variants)?item.variants:[];
    const vals=vars.map(v=>Number(v?.min_unit_price)).filter(Number.isFinite);
    return vals.length?Math.min(...vals):null;
  }

  function stock(item){
    const vars=Array.isArray(item?.variants)?item.variants:[];
    return vars.reduce((n,v)=>n+(Number(v?.total_stack_count)||0),0);
  }

  function variantText(item){
    const vars=Array.isArray(item?.variants)?item.variants:[];
    if(vars.length<=1)return '';
    return '<div class="market-variant-row">'+vars.slice(0,5).map(v=>{
      const bits=[];
      if(Number(v?.rarity)>0)bits.push('R'+v.rarity);
      if(Number(v?.rune_season)>0)bits.push('S'+v.rune_season);
      if(Number(v?.rune_tier)>=0)bits.push('T'+v.rune_tier);
      const price=Number(v?.min_unit_price);
      return '<span>'+(bits.join(' · ')||'規格')+' <b>'+(Number.isFinite(price)?price.toLocaleString('en-US'):'—')+'</b></span>';
    }).join('')+'</div>';
  }

  function matchesCategory(item){
    const c=categoryParts(item);
    if(selectedMain!=='全部'&&c.main!==selectedMain)return false;
    if(selectedMiddle!=='全部'&&c.middle!==selectedMiddle)return false;
    if(selectedChild!=='全部'&&c.child!==selectedChild)return false;
    return true;
  }

  function renderMarket(){
    const q=($('marketSearch')?.value||'').trim().toLowerCase();
    const sort=$('marketSort')?.value||'price-asc';

    let rows=marketItems.filter(item=>{
      if(!matchesCategory(item))return false;
      if(!q)return true;
      const c=categoryParts(item);
      return [item?.name,c.main,c.middle,c.child].some(v=>String(v||'').toLowerCase().includes(q));
    });

    rows=[...rows].sort((a,b)=>{
      if(sort==='price-desc')return (minPrice(b)??-1)-(minPrice(a)??-1);
      if(sort==='stock-desc')return stock(b)-stock(a);
      if(sort==='name')return String(a?.name||'').localeCompare(String(b?.name||''),'zh-Hant');
      return (minPrice(a)??Number.MAX_SAFE_INTEGER)-(minPrice(b)??Number.MAX_SAFE_INTEGER);
    });

    const total=rows.length;
    const visible=rows.slice(0,120);
    $('marketMeta').textContent=total+' 筆'+(total>visible.length?' · 顯示前 '+visible.length+' 筆':'');
    updateBreadcrumb();

    const grid=$('marketGrid');
    if(!grid)return;

    grid.innerHTML=visible.length?visible.map(item=>{
      const price=minPrice(item);
      const count=stock(item);
      const img=item?.image_url||'';
      const c=categoryParts(item);
      const crumb=[c.main,c.middle,c.child].filter(Boolean).join(' / ');
      return `<article class="market-item-card">
        <div class="market-item-image">${img?'<img src="'+escapeAttr(img)+'" alt="" loading="lazy">':'<span>'+mainIcon(c.main)+'</span>'}</div>
        <div class="market-item-body">
          <div class="market-item-name">${escapeHtml(String(item?.name||'未命名'))}</div>
          <div class="market-item-category">${escapeHtml(crumb||'未分類')}</div>
          <div class="market-item-bottom">
            <div class="market-price"><span>最低價</span><strong>${price==null?'—':price.toLocaleString('en-US')}</strong></div>
            <div class="market-stock"><span>掛售</span><strong>${count.toLocaleString('en-US')}</strong></div>
          </div>
          ${variantText(item)}
        </div>
      </article>`;
    }).join(''):'<div class="live-empty">沒有符合條件的商品。</div>';
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function escapeAttr(s){return escapeHtml(s)}

  async function loadMarket(){
    try{
      const res=await fetch('./data/market-catalog.json?ts='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      marketItems=Array.isArray(data?.items)?data.items:[];
      $('marketUpdated').textContent='同步 '+ageText(data.fetchedAt);
      renderCategoryTabs();
      renderMarket();
    }catch(e){
      console.warn('[Market] load failed',e);
      marketItems=[];
      $('marketUpdated').textContent='資料尚未同步';
      $('marketMeta').textContent='0 筆';
      $('marketGrid').innerHTML='<div class="live-empty">交易所資料正在等待同步。</div>';
      renderCategoryTabs();
    }
  }

  window.showLiveData=function(){
    if(!ensure())return;
    hideOtherViews();
    window.scrollTo({top:0,behavior:'auto'});
    loadMarket();
  };

  const init=()=>ensure()?null:setTimeout(init,60);
  init();
})();