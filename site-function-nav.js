(() => {
  'use strict';

  const ROUTES=[
    {key:'home',hash:'#home',label:'首頁',sub:'快速入口',tone:'blue',icon:'<svg viewBox="0 0 48 48"><path d="M6 23 24 7l18 16v18H29V29H19v12H6V23Zm6 3v9h3V25h18v10h3v-9L24 15 12 26Z"/></svg>'},
    {key:'members',hash:'#members',label:'公會',sub:'角色・日誌',tone:'gold',icon:'<svg viewBox="0 0 48 48"><circle cx="18" cy="17" r="6"/><circle cx="33" cy="19" r="5"/><path d="M7 39c1-8 5-13 11-13s10 5 11 13H7Zm22 0c0-5-1-9-4-12 2-2 5-3 8-3 6 0 10 5 11 15H29Z"/></svg>'},
    {key:'guide',hash:'#guide',label:'攻略',sub:'養成・工具',tone:'cyan',icon:'<svg viewBox="0 0 48 48"><path d="M10 7h20a7 7 0 0 1 7 7v27H17a7 7 0 0 1-7-7V7Zm7 7v20h13V14H17Z"/><path d="m37 8 2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1 2-5Z"/></svg>'},
    {key:'builds',hash:'#builds',label:'配裝',sub:'職業・裝備',tone:'violet',icon:'<svg viewBox="0 0 48 48"><path d="m25 5 6 6-5 5 11 11 4-4 3 3-9 9-3-3 4-4-11-11-5 5-6-6L25 5Zm0 5-7 7 2 2 7-7-2-2Z"/><path d="M7 36h17v5H7z"/></svg>'},
    {key:'pets',hash:'#pets',label:'寵物',sub:'技能・推薦',tone:'mint',icon:'<svg viewBox="0 0 48 48"><circle cx="15" cy="15" r="5"/><circle cx="33" cy="15" r="5"/><circle cx="11" cy="26" r="4"/><circle cx="37" cy="26" r="4"/><path d="M24 21c8 0 14 7 14 14 0 6-5 9-14 9s-14-3-14-9c0-7 6-14 14-14Z"/></svg>'},
    {key:'market',hash:'#live',label:'交易所',sub:'價格・分類',tone:'coral',icon:'<svg viewBox="0 0 48 48"><path d="M8 11h32v5H8zm4 8h24v23H12z"/><path d="M16 24h7v7h-7zm10 0h6v7h-6zM16 34h16v4H16z"/><circle cx="37" cy="12" r="7"/><path d="M34 12h6m-3-3v6"/></svg>'}
  ];

  const CONTEXT={
    members:{title:'公會成員',sub:'角色 / 分身 / 工作日誌',tone:'gold',icon:ROUTES[1].icon},
    guide:{title:'攻略工具',sub:'養成 / 查詢 / 實用工具',tone:'cyan',icon:ROUTES[2].icon},
    dice:{title:'骰子進度',sub:'裝備 / 養成',tone:'blue',icon:'<svg viewBox="0 0 48 48"><rect x="7" y="7" width="34" height="34" rx="8"/><circle cx="17" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><circle cx="24" cy="24" r="3"/><circle cx="17" cy="31" r="3"/><circle cx="31" cy="31" r="3"/></svg>'},
    spirit:{title:'精靈痕跡',sub:'職業等級 / 經驗試算',tone:'gold',icon:'<svg viewBox="0 0 48 48"><path d="m24 4 6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12Z"/><circle cx="24" cy="24" r="4"/></svg>'},
    runes:{title:'符文資料',sub:'圖鑑 / 效果 / 分類',tone:'violet',icon:'<svg viewBox="0 0 48 48"><path d="m24 4 15 9v22l-15 9-15-9V13l15-9Zm0 7-9 6v14l9 6 9-6V17l-9-6Z"/><path d="m24 16 6 8-6 8-6-8 6-8Z"/></svg>'},
    loadout:{title:'職業配裝',sub:'職業 / 裝備 / 符文',tone:'violet',icon:ROUTES[3].icon},
    custom:{title:'自訂配裝',sub:'符文 / 模擬 / 比較',tone:'mint',icon:'<svg viewBox="0 0 48 48"><path d="M10 7h28v34H10z"/><path d="M16 14h16v4H16zm0 8h10v4H16zm0 8h16v4H16z"/><circle cx="32" cy="24" r="5"/><path d="M32 17v14M25 24h14"/></svg>'},
    pets:{title:'寵物資料',sub:'技能 / 標籤 / 推薦',tone:'mint',icon:ROUTES[4].icon},
    'rune-recommend':{title:'符文推薦',sub:'職業 / 詞條 / 優先度',tone:'rose',icon:'<svg viewBox="0 0 48 48"><path d="m24 5 6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12Z"/><path d="m24 15 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/></svg>'}
  };

  function routeKey(){
    const h=(location.hash||'#home').toLowerCase();
    if(h.startsWith('#members'))return 'members';
    if(h.startsWith('#guide/dice'))return 'dice';
    if(h.startsWith('#guide/spirit-trace'))return 'spirit';
    if(h.startsWith('#runes/recommend'))return 'rune-recommend';
    if(h.startsWith('#runes/custom'))return 'custom';
    if(h.startsWith('#runes'))return 'runes';
    if(h.startsWith('#builds'))return 'loadout';
    if(h.startsWith('#pets'))return 'pets';
    if(h.startsWith('#live'))return 'market';
    if(h.startsWith('#guide'))return 'guide';
    return 'home';
  }

  function ensure(){
    if(document.getElementById('siteFunctionNav'))return true;
    const shell=document.querySelector('.shell');
    const header=shell?.querySelector('header');
    if(!shell||!header)return false;

    const nav=document.createElement('nav');
    nav.id='siteFunctionNav';
    nav.className='site-function-nav';
    nav.setAttribute('aria-label','網站主要功能');
    nav.innerHTML=ROUTES.map(r=>`<button type="button" data-route="${r.key}" data-hash="${r.hash}" class="sfn-${r.tone}"><span class="sfn-icon">${r.icon}</span><span class="sfn-copy"><b>${r.label}</b><small>${r.sub}</small></span></button>`).join('');

    const utility=document.querySelector('.top-utility-row');
    const black=document.getElementById('globalBlackHoleBar');
    if(utility)utility.insertAdjacentElement('beforebegin',nav);
    else if(black)black.insertAdjacentElement('beforebegin',nav);
    else header.insertAdjacentElement('afterend',nav);

    const context=document.createElement('section');
    context.id='sectionContextBanner';
    context.className='section-context-banner';
    context.hidden=true;
    const firstView=document.getElementById('homeView')||document.getElementById('membersView');
    if(firstView?.parentElement)firstView.parentElement.insertBefore(context,firstView);

    nav.addEventListener('click',e=>{
      const btn=e.target.closest('[data-hash]');
      if(!btn)return;
      const hash=btn.dataset.hash;
      if(location.hash===hash){
        if(hash==='#home')window.showSiteHome?.();
        else if(hash==='#members'){window.hideLiveDataView?.();window.switchView?.('members');}
        else if(hash==='#guide'){window.hideLiveDataView?.();window.switchView?.('guides');window.showGuideHome?.();}
        else if(hash==='#builds'){window.hideLiveDataView?.();window.switchView?.('guides');window.showLoadoutHome?.();}
        else if(hash==='#pets'){window.hideLiveDataView?.();window.switchView?.('guides');window.showPetTool?.();}
        else if(hash==='#live')window.showLiveData?.();
      }else location.hash=hash;
      setTimeout(sync,0);
    });

    sync();
    return true;
  }

  function sync(){
    const key=routeKey();
    document.documentElement.dataset.siteRoute=key;
    document.querySelectorAll('#siteFunctionNav [data-route]').forEach(btn=>{
      const active=(key==='loadout'&&btn.dataset.route==='builds')||(key==='market'&&btn.dataset.route==='market')||(key===btn.dataset.route)||(key==='dice'||key==='spirit')&&btn.dataset.route==='guide'||(key==='runes'||key==='custom'||key==='rune-recommend')&&btn.dataset.route==='builds';
      btn.toggleAttribute('aria-current',!!active);
    });

    const banner=document.getElementById('sectionContextBanner');
    if(!banner)return;
    const info=CONTEXT[key];
    if(!info||key==='home'||key==='market'){
      banner.hidden=true;
      return;
    }
    banner.hidden=false;
    banner.dataset.tone=info.tone;
    banner.innerHTML=`<span class="section-context-icon">${info.icon}</span><span class="section-context-copy"><b>${info.title}</b><small>${info.sub}</small></span>`;
  }

  window.addEventListener('hashchange',()=>setTimeout(sync,0));
  window.addEventListener('popstate',()=>setTimeout(sync,0));
  document.addEventListener('click',()=>setTimeout(sync,0),true);
  const init=()=>ensure()?null:setTimeout(init,80);
  init();
})();