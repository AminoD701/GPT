(() => {
  'use strict';

  const $=id=>document.getElementById(id);
  let marketItems=[];
  let countdownTimer=0;

  function twTime(iso,withSeconds=false){
    if(!iso)return '—';
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '—';
    return new Intl.DateTimeFormat('zh-TW',{
      timeZone:'Asia/Taipei',
      month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',
      ...(withSeconds?{second:'2-digit'}:{})
    }).format(d);
  }

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

  function remainText(target){
    const ms=new Date(target).getTime()-Date.now();
    if(!Number.isFinite(ms))return '—';
    if(ms<=0)return '00:00:00';
    const total=Math.floor(ms/1000);
    const d=Math.floor(total/86400);
    const h=Math.floor((total%86400)/3600);
    const m=Math.floor((total%3600)/60);
    const s=total%60;
    return (d?d+'天 ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
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
      <section class="live-data-hero">
        <div>
          <span class="live-data-kicker">LIVE DATA / MMD-TW</span>
          <h2>即時資料</h2>
          <p>整合深淵黑洞時間與交易所行情。資料由排程定時同步，不直接從瀏覽器跨站呼叫來源 API。</p>
        </div>
        <a href="https://mmd-tw.com/" target="_blank" rel="noopener">資料來源：MMD-TW ↗</a>
      </section>

      <section class="live-blackhole" id="liveBlackHole">
        <div class="live-section-title"><div><span>BLACK HOLE</span><h3>深淵黑洞</h3></div><small id="blackHoleUpdated">讀取中…</small></div>
        <div class="live-blackhole-grid">
          <div class="live-countdown-card">
            <span id="blackHoleState">讀取資料中</span>
            <strong id="blackHoleCountdown">--:--:--</strong>
            <small id="blackHoleTarget">—</small>
          </div>
          <div class="live-time-card"><span>本輪開啟</span><strong id="blackHoleOpen">—</strong></div>
          <div class="live-time-card"><span>本輪結束</span><strong id="blackHoleClose">—</strong></div>
          <div class="live-time-card"><span>下一輪預估</span><strong id="blackHoleNext">—</strong><small id="blackHolePrediction"></small></div>
        </div>
      </section>

      <section class="live-market">
        <div class="live-section-title"><div><span>MARKET</span><h3>交易所行情</h3></div><small id="marketUpdated">讀取中…</small></div>
        <div class="live-market-controls">
          <input id="marketSearch" type="search" placeholder="搜尋商品名稱" autocomplete="off">
          <select id="marketSort">
            <option value="price-asc">價格低到高</option>
            <option value="price-desc">價格高到低</option>
            <option value="stock-desc">掛售多到少</option>
            <option value="name">名稱</option>
          </select>
        </div>
        <div id="marketMeta" class="live-market-meta">讀取交易所資料中…</div>
        <div id="marketGrid" class="live-market-grid"></div>
      </section>
    `;
    anchor.parentElement.insertBefore(view,anchor);
    $('marketSearch')?.addEventListener('input',renderMarket);
    $('marketSort')?.addEventListener('change',renderMarket);
    return true;
  }

  function hideOtherViews(){
    ['homeView','membersView','guideView'].forEach(id=>{const el=$(id);if(el)el.hidden=true;});
    const live=$('liveDataView');if(live)live.hidden=false;
    ['homeTab','membersTab','guidesTab'].forEach(id=>$(id)?.setAttribute('aria-selected','false'));
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
  function categoryText(item){
    const c=item?.categories;
    if(Array.isArray(c))return c.join(' / ');
    if(c&&typeof c==='object')return Object.values(c).filter(Boolean).join(' / ');
    return String(c||'未分類');
  }
  function variantText(item){
    const vars=Array.isArray(item?.variants)?item.variants:[];
    if(vars.length<=1)return '';
    return vars.slice(0,4).map(v=>{
      const tags=[v?.rarity,v?.rune_season?('S'+v.rune_season):'',v?.rune_tier?('T'+v.rune_tier):''].filter(Boolean).join(' · ');
      const p=Number(v?.min_unit_price);
      return '<span>'+ (tags||'規格') +' <b>'+(Number.isFinite(p)?p.toLocaleString('en-US'):'—')+'</b></span>';
    }).join('');
  }

  function renderMarket(){
    const q=($('marketSearch')?.value||'').trim().toLowerCase();
    const sort=$('marketSort')?.value||'price-asc';
    let rows=marketItems.filter(x=>!q||String(x?.name||'').toLowerCase().includes(q));
    rows=[...rows].sort((a,b)=>{
      if(sort==='price-desc')return (minPrice(b)??-1)-(minPrice(a)??-1);
      if(sort==='stock-desc')return stock(b)-stock(a);
      if(sort==='name')return String(a?.name||'').localeCompare(String(b?.name||''),'zh-Hant');
      return (minPrice(a)??Number.MAX_SAFE_INTEGER)-(minPrice(b)??Number.MAX_SAFE_INTEGER);
    });
    const total=rows.length;
    rows=rows.slice(0,80);
    const meta=$('marketMeta');
    if(meta)meta.textContent='找到 '+total+' 筆商品'+(total>80?' · 目前顯示前 80 筆':'');
    const grid=$('marketGrid');
    if(!grid)return;
    grid.innerHTML=rows.length?rows.map(item=>{
      const price=minPrice(item),count=stock(item),img=item?.image_url||'';
      return `<article class="market-item-card">
        <div class="market-item-top">
          <div class="market-item-image">${img?'<img src="'+img+'" alt="" loading="lazy">':'<span>◇</span>'}</div>
          <div><h4>${String(item?.name||'未命名')}</h4><p>${categoryText(item)}</p></div>
        </div>
        <div class="market-item-stats">
          <div><span>最低單價</span><strong>${price==null?'—':price.toLocaleString('en-US')}</strong></div>
          <div><span>掛售數量</span><strong>${count.toLocaleString('en-US')}</strong></div>
        </div>
        <div class="market-variants">${variantText(item)}</div>
      </article>`;
    }).join(''):'<div class="live-empty">沒有符合的商品。</div>';
  }

  async function loadBlackHole(){
    try{
      const res=await fetch('./data/black-hole.json?ts='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      $('blackHoleOpen').textContent=twTime(data.opensAt,true);
      $('blackHoleClose').textContent=twTime(data.closesAt,true);
      $('blackHoleNext').textContent=twTime(data.nextOpensAt,true);
      $('blackHolePrediction').textContent=data.nextIsPrediction?'預測時間':'';
      $('blackHoleUpdated').textContent='資料更新 '+ageText(data.updatedAt||data.fetchedAt);

      const tick=()=>{
        const now=Date.now();
        const open=new Date(data.opensAt).getTime();
        const close=new Date(data.closesAt).getTime();
        let target=data.opensAt,state='距離開啟';
        if(now>=open&&now<close){target=data.closesAt;state='黑洞開啟中 · 距離結束';}
        else if(now>=close){target=data.nextOpensAt;state=data.nextIsPrediction?'距離下一輪預估':'距離下一輪';}
        $('blackHoleState').textContent=state;
        $('blackHoleCountdown').textContent=remainText(target);
        $('blackHoleTarget').textContent='目標時間 '+twTime(target,true);
      };
      clearInterval(countdownTimer);tick();countdownTimer=setInterval(tick,1000);
    }catch(e){
      console.warn('[Live Data] black-hole load failed',e);
      $('blackHoleState').textContent='黑洞資料暫時無法讀取';
      $('blackHoleUpdated').textContent='同步資料尚未產生';
    }
  }

  async function loadMarket(){
    try{
      const res=await fetch('./data/market-catalog.json?ts='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      marketItems=Array.isArray(data?.items)?data.items:[];
      $('marketUpdated').textContent='資料同步 '+ageText(data.fetchedAt);
      renderMarket();
    }catch(e){
      console.warn('[Live Data] market load failed',e);
      marketItems=[];
      $('marketUpdated').textContent='同步資料尚未產生';
      $('marketMeta').textContent='交易所資料正在等待第一次排程同步。';
      $('marketGrid').innerHTML='<div class="live-empty">目前尚無本地交易所快照。</div>';
    }
  }

  window.showLiveData=function(){
    if(!ensure())return;
    hideOtherViews();
    window.scrollTo({top:0,behavior:'auto'});
    loadBlackHole();
    loadMarket();
  };

  const init=()=>ensure()?null:setTimeout(init,60);
  init();
})();