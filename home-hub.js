(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function call(name){
    const fn=window[name];
    if(typeof fn==='function') return fn();
  }

  function ensureHome(){
    const membersTab=$('membersTab'), guidesTab=$('guidesTab'), membersView=$('membersView'), guideView=$('guideView');
    if(!membersTab||!guidesTab||!membersView||!guideView) return false;
    if($('homeView')) return true;

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
        <div class="home-hub-kicker">MABINOGI MOBILE</div>
        <h2>快速找到你要的功能</h2>
        <p>公會・攻略・配裝・寵物・行情</p>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><h3>主要功能</h3></div>
        <div class="home-hub-primary">
          <button class="home-hub-card" type="button" data-home-target="members">
            <span class="home-hub-card-icon">♙</span>
            <strong>公會成員</strong>
            <small>角色・日誌</small>
          </button>
          <button class="home-hub-card" type="button" data-home-target="guide">
            <span class="home-hub-card-icon">✦</span>
            <strong>新手攻略</strong>
            <small>養成・工具</small>
          </button>
          <button class="home-hub-card" type="button" data-home-target="loadout">
            <span class="home-hub-card-icon">◆</span>
            <strong>配裝符文</strong>
            <small>職業・符文</small>
          </button>
          <button class="home-hub-card" type="button" data-home-target="pets">
            <span class="home-hub-card-icon">◎</span>
            <strong>寵物資料</strong>
            <small>技能・標籤</small>
          </button>
          <button class="home-hub-card home-hub-card-live" type="button" data-home-target="live">
            <span class="home-hub-card-icon">▥</span>
            <strong>交易所</strong>
            <small>價格・掛售</small>
          </button>
          <button class="home-hub-card home-hub-card-live" type="button" data-home-target="live">
            <span class="home-hub-card-icon">◉</span>
            <strong>黑洞時間</strong>
            <small>即時倒數</small>
          </button>
        </div>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><h3>常用工具</h3></div>
        <div class="home-hub-quick">
          <button type="button" data-home-target="spirit"><span class="quick-icon">✧</span><span><b>精靈痕跡</b><small>等級養成</small></span></button>
          <button type="button" data-home-target="dice"><span class="quick-icon">◫</span><span><b>骰子進度</b><small>裝備養成</small></span></button>
          <button type="button" data-home-target="runes"><span class="quick-icon">◇</span><span><b>符文圖鑑</b><small>效果查詢</small></span></button>
          <button type="button" data-home-target="custom"><span class="quick-icon">⌘</span><span><b>自訂配裝</b><small>自由搭配</small></span></button>
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
    const home=$('homeTab'), members=$('membersTab'), guides=$('guidesTab');
    home?.setAttribute('aria-selected',String(active==='home'));
    members?.setAttribute('aria-selected',String(active==='members'));
    guides?.setAttribute('aria-selected',String(active==='guides'));
  }

  window.showSiteHome=function(){
    if(!ensureHome())return;
    $('homeView').hidden=false;
    $('membersView').hidden=true;
    $('guideView').hidden=true;
    setTabs('home');
    window.scrollTo({top:0,behavior:'auto'});
  };

  function hideHome(){
    const home=$('homeView');
    if(home)home.hidden=true;
  }

  function navigate(target){
    hideHome();
    if(target==='members'){
      if(typeof window.switchView==='function')window.switchView('members');
      setTabs('members');
      return;
    }
    if(typeof window.switchView==='function')window.switchView('guides');
    setTabs('guides');
    const map={guide:'showGuideHome',dice:'showGuideArticle',spirit:'showSpiritTraceTool',runes:'showRuneHome',loadout:'showLoadoutHome',custom:'showCustomRuneBuilder',pets:'showPetTool',live:'showLiveData'};
    if(map[target]) call(map[target]);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#membersTab,#guidesTab,#diceGuideEntry,#spiritTraceEntry,#runeGuideEntry,#loadoutEntry,#customRuneBuilderEntry,#petToolEntry,#runeRecommendationEntry')) hideHome();
  },true);

  const init=()=>ensureHome()?null:setTimeout(init,40);
  init();
})();