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
        <div class="home-hub-kicker">MABINOGI MOBILE / DEIAN GUILD HUB</div>
        <h2>攻略與公會資料，一個入口就夠。</h2>
        <p>整合公會角色資料、養成工具、職業配裝、符文與寵物資料。用最短的路徑找到你現在需要的資訊。</p>
        <div class="home-hub-status">
          <span><i></i> Google Sheet 資料同步</span>
          <span><i></i> 工作日誌跨裝置共用</span>
          <span><i></i> 攻略工具持續整理</span>
        </div>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><div><h3>主要入口</h3><p>依照你現在想做的事情選擇。</p></div><p>4 個核心區域</p></div>
        <div class="home-hub-primary">
          <button class="home-hub-card" type="button" data-home-target="members">
            <span class="home-hub-card-icon">◇</span><small>GUILD ROSTER</small><strong>公會成員</strong><p>查看成員本尊、六角色配置與共用工作日誌。</p><span class="home-hub-card-foot"><span>開啟成員名單</span><span>→</span></span>
          </button>
          <button class="home-hub-card" type="button" data-home-target="guide">
            <span class="home-hub-card-icon">✦</span><small>PLAYER GUIDE</small><strong>新手攻略</strong><p>從養成、骰子到精靈痕跡，快速找到需要的工具。</p><span class="home-hub-card-foot"><span>查看攻略工具</span><span>→</span></span>
          </button>
          <button class="home-hub-card" type="button" data-home-target="loadout">
            <span class="home-hub-card-icon">◆</span><small>BUILD & RUNES</small><strong>配裝・符文</strong><p>職業完整配裝、傳說符文與自訂搭配集中查詢。</p><span class="home-hub-card-foot"><span>查看職業配裝</span><span>→</span></span>
          </button>
          <button class="home-hub-card" type="button" data-home-target="pets">
            <span class="home-hub-card-icon">◎</span><small>PET DATABASE</small><strong>寵物資料</strong><p>用副屬性、固有技能、技能效果與標籤快速找寵物。</p><span class="home-hub-card-foot"><span>開啟寵物推薦</span><span>→</span></span>
          </button>
        </div>
      </section>

      <section class="home-hub-section">
        <div class="home-hub-section-head"><div><h3>快速入口</h3><p>直接前往常用工具，不必逐層尋找。</p></div></div>
        <div class="home-hub-quick">
          <button type="button" data-home-target="spirit"><span><b>精靈痕跡</b><small>職業等級養成</small></span><em>→</em></button>
          <button type="button" data-home-target="dice"><span><b>骰子與裝備進度</b><small>養成進度工具</small></span><em>→</em></button>
          <button type="button" data-home-target="runes"><span><b>傳說符文圖鑑</b><small>完整效果查詢</small></span><em>→</em></button>
          <button type="button" data-home-target="custom"><span><b>自訂符文配裝</b><small>自由搭配模擬</small></span><em>→</em></button>
        </div>
      </section>

      <section class="home-hub-bottom">
        <div class="home-hub-panel">
          <h3>近期功能</h3>
          <div class="home-hub-updates">
            <div class="home-hub-update"><span>公會工具</span><p>角色每日／每週工作日誌已改為跨裝置共用進度。</p></div>
            <div class="home-hub-update"><span>寵物資料</span><p>支援副屬性快速推薦、技能效果查詢與特殊標籤規則。</p></div>
            <div class="home-hub-update"><span>網站體驗</span><p>重新整理後會保留目前瀏覽位置，減少重複操作。</p></div>
          </div>
        </div>
        <div class="home-hub-panel">
          <h3>公會資料</h3>
          <div class="home-hub-numbers">
            <div class="home-hub-number"><strong id="homeMemberTotal">—</strong><span>公會成員</span></div>
            <div class="home-hub-number"><strong id="homeRoleTotal">—</strong><span>已登錄角色</span></div>
          </div>
        </div>
      </section>`;

    membersView.parentElement.insertBefore(home,membersView);

    const syncNumbers=()=>{
      const member=$('memberTotal')?.textContent?.trim();
      const role=$('roleTotal')?.textContent?.trim();
      if($('homeMemberTotal')&&member) $('homeMemberTotal').textContent=member;
      if($('homeRoleTotal')&&role) $('homeRoleTotal').textContent=role;
    };
    syncNumbers();
    const obs=new MutationObserver(syncNumbers);
    if($('memberTotal')) obs.observe($('memberTotal'),{childList:true,subtree:true,characterData:true});
    if($('roleTotal')) obs.observe($('roleTotal'),{childList:true,subtree:true,characterData:true});

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
    const map={guide:'showGuideHome',dice:'showGuideArticle',spirit:'showSpiritTraceTool',runes:'showRuneHome',loadout:'showLoadoutHome',custom:'showCustomRuneBuilder',pets:'showPetTool'};
    if(map[target]) call(map[target]);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#membersTab,#guidesTab,#diceGuideEntry,#spiritTraceEntry,#runeGuideEntry,#loadoutEntry,#customRuneBuilderEntry,#petToolEntry,#runeRecommendationEntry')) hideHome();
  },true);

  const init=()=>ensureHome()?null:setTimeout(init,40);
  init();
})();
