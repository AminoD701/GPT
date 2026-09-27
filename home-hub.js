(() => {
  'use strict';

  const $=id=>document.getElementById(id);

  const ICONS={
    members:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="22" r="8"/><circle cx="43" cy="25" r="6"/><path d="M10 50c1-10 7-16 14-16s13 6 14 16H10Zm27 0c0-7-2-12-6-16 3-3 7-5 12-5 7 0 12 7 13 21H37Z"/></svg>',
    guide:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 10h26a8 8 0 0 1 8 8v36H22a8 8 0 0 1-8-8V10Zm8 8v28h18V18H22Z"/><path d="M30 23h8v4h-8zm0 8h8v4h-8zm0 8h6v4h-6z"/><path d="m49 13 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/></svg>',
    loadout:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m33 7 8 8-7 7 15 15 5-5 4 4-12 12-4-4 5-5-15-15-7 7-8-8L33 7Zm0 6L23 23l2 2 10-10-2-2Z"/><path d="M9 48h21v6H9z"/></svg>',
    pets:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="20" r="7"/><circle cx="44" cy="20" r="7"/><circle cx="15" cy="35" r="6"/><circle cx="49" cy="35" r="6"/><path d="M32 28c10 0 18 9 18 18 0 7-6 11-18 11S14 53 14 46c0-9 8-18 18-18Z"/></svg>',
    market:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 14h44v6H10zM15 22h34v30H15z"/><path d="M20 30h9v9h-9zm15 0h9v9h-9zM20 43h24v5H20z"/><circle cx="49" cy="16" r="9"/><path d="M46 16h6m-3-3v6"/></svg>',
    blackhole:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="8"/><path d="M32 8c14 0 24 11 24 24S45 56 32 56c-11 0-20-7-23-17h7c3 6 9 10 16 10 10 0 17-7 17-17S42 15 32 15c-8 0-14 5-17 11l8 1-12 9-5-14 7 2C17 14 24 8 32 8Z"/></svg>',
    spirit:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 6 7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2 7-14Z"/><circle cx="32" cy="32" r="5"/></svg>',
    dice:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="44" rx="10"/><circle cx="23" cy="23" r="4"/><circle cx="41" cy="23" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="23" cy="41" r="4"/><circle cx="41" cy="41" r="4"/></svg>',
    runes:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 5 19 11v22L32 59 13 48V16L32 5Zm0 8-12 7v14l12 13 12-13V20l-12-7Z"/><path d="m32 19 7 13-7 9-7-9 7-13Z"/></svg>',
    custom:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 12h36v40H14z"/><path d="M21 20h22v5H21zm0 10h14v5H21zm0 10h22v5H21z"/><circle cx="43" cy="32" r="6"/><path d="M43 23v18M34 32h18"/></svg>'
  };

  function icon(name){return ICONS[name]||ICONS.guide}

  function call(name){
    const fn=window[name];
    if(typeof fn==='function') return fn();
  }

  function ensureHome(){
    const membersTab=$('membersTab'),guidesTab=$('guidesTab'),membersView=$('membersView'),guideView=$('guideView');
    if(!membersTab||!guidesTab||!membersView||!guideView)return false;
    if($('homeView'))return true;

    const tabs=membersTab.parentElement;
    const homeTab=document.createElement('button');
    homeTab.id='homeTab';
    homeTab.type='button';
    homeTab.className='site-tab';
    homeTab.dataset.homeTab='1';
    homeTab.setAttribute('aria-selected','false');
    homeTab.textContent='首頁';
    tabs.insertBefore(homeTab,membersTab);

    const home=document.createElement('section');
    home.id='homeView';
    home.className='home-hub';
    home.hidden=true;
    home.innerHTML=`
      <section class="home-hub-hero">
        <div class="home-hub-hero-mark">${icon('runes')}</div>
        <div>
          <span class="home-hub-kicker">MABINOGI MOBILE</span>
          <h2>功能入口</h2>
          <p>一眼找到需要的資料</p>
        </div>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><h3>主要功能</h3><span>MAIN</span></div>
        <div class="home-hub-primary">
          <button class="home-hub-card tone-gold" type="button" data-home-target="members">
            <span class="home-hub-card-icon">${icon('members')}</span>
            <span class="home-hub-card-copy"><strong>公會成員</strong><small>角色・日誌</small></span>
          </button>
          <button class="home-hub-card tone-blue" type="button" data-home-target="guide">
            <span class="home-hub-card-icon">${icon('guide')}</span>
            <span class="home-hub-card-copy"><strong>新手攻略</strong><small>養成・工具</small></span>
          </button>
          <button class="home-hub-card tone-violet" type="button" data-home-target="loadout">
            <span class="home-hub-card-icon">${icon('loadout')}</span>
            <span class="home-hub-card-copy"><strong>配裝符文</strong><small>職業・符文</small></span>
          </button>
          <button class="home-hub-card tone-mint" type="button" data-home-target="pets">
            <span class="home-hub-card-icon">${icon('pets')}</span>
            <span class="home-hub-card-copy"><strong>寵物資料</strong><small>技能・標籤</small></span>
          </button>
          <button class="home-hub-card tone-coral" type="button" data-home-target="live">
            <span class="home-hub-card-icon">${icon('market')}</span>
            <span class="home-hub-card-copy"><strong>交易所</strong><small>價格・掛售</small></span>
          </button>
        </div>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><h3>常用工具</h3><span>TOOLS</span></div>
        <div class="home-hub-quick">
          <button class="quick-spirit" type="button" data-home-target="spirit"><span class="quick-icon">${icon('spirit')}</span><span><b>精靈痕跡</b><small>等級養成</small></span></button>
          <button class="quick-dice" type="button" data-home-target="dice"><span class="quick-icon">${icon('dice')}</span><span><b>骰子進度</b><small>裝備養成</small></span></button>
          <button class="quick-runes" type="button" data-home-target="runes"><span class="quick-icon">${icon('runes')}</span><span><b>符文圖鑑</b><small>效果查詢</small></span></button>
          <button class="quick-custom" type="button" data-home-target="custom"><span class="quick-icon">${icon('custom')}</span><span><b>自訂配裝</b><small>自由搭配</small></span></button>
        </div>
      </section>`;

    membersView.parentElement.insertBefore(home,membersView);

    homeTab.addEventListener('click',()=>window.showSiteHome());
    home.addEventListener('click',e=>{
      const button=e.target.closest('[data-home-target]');
      if(!button)return;
      navigate(button.dataset.homeTarget);
    });
    return true;
  }

  function setTabs(active){
    $('homeTab')?.setAttribute('aria-selected',String(active==='home'));
    $('membersTab')?.setAttribute('aria-selected',String(active==='members'));
    $('guidesTab')?.setAttribute('aria-selected',String(active==='guides'));
  }

  window.showSiteHome=function(){
    if(!ensureHome())return;
    $('homeView').hidden=false;
    $('membersView').hidden=true;
    $('guideView').hidden=true;
    setTabs('home');
    window.scrollTo({top:0,behavior:'auto'});
  };

  function hideHome(){if($('homeView'))$('homeView').hidden=true}

  function navigate(target){
    hideHome();
    if(target==='members'){
      window.switchView?.('members');
      setTabs('members');
      return;
    }
    window.switchView?.('guides');
    setTabs('guides');
    const map={guide:'showGuideHome',dice:'showGuideArticle',spirit:'showSpiritTraceTool',runes:'showRuneHome',loadout:'showLoadoutHome',custom:'showCustomRuneBuilder',pets:'showPetTool',live:'showLiveData'};
    if(map[target])call(map[target]);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#membersTab,#guidesTab,#diceGuideEntry,#spiritTraceEntry,#runeGuideEntry,#loadoutEntry,#customRuneBuilderEntry,#petToolEntry,#runeRecommendationEntry'))hideHome();
  },true);

  const init=()=>ensureHome()?null:setTimeout(init,40);
  init();
})();