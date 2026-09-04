(() => {
  'use strict';

  const items=[
    {key:'home',label:'首頁',icon:'⌂',hash:'#home'},
    {key:'members',label:'公會',icon:'♙',hash:'#members'},
    {key:'guide',label:'攻略',icon:'✦',hash:'#guide'},
    {key:'builds',label:'配裝',icon:'◆',hash:'#builds'},
    {key:'pets',label:'寵物',icon:'◎',hash:'#pets'}
  ];

  function ensure(){
    if(document.getElementById('mobileAppNav')) return;
    const nav=document.createElement('nav');
    nav.id='mobileAppNav';
    nav.className='mobile-app-nav';
    nav.setAttribute('aria-label','手機主要導覽');
    nav.innerHTML=items.map(item=>`<button type="button" data-app-nav="${item.key}" aria-label="${item.label}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join('');
    document.body.appendChild(nav);
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('[data-app-nav]');
      if(!btn)return;
      const item=items.find(x=>x.key===btn.dataset.appNav);
      if(!item)return;
      if(location.hash===item.hash){ applyRoute(item.key); sync(); }
      else location.hash=item.hash;
    });
    sync();
  }

  function applyRoute(key){
    if(key==='home') return window.showSiteHome?.();
    if(key==='members') return window.switchView?.('members');
    window.switchView?.('guides');
    const map={guide:'showGuideHome',builds:'showLoadoutHome',pets:'showPetTool'};
    window[map[key]]?.();
  }

  function currentKey(){
    const h=(location.hash||'#home').toLowerCase();
    if(h.startsWith('#members')) return 'members';
    if(h.startsWith('#pets')) return 'pets';
    if(h.startsWith('#builds')) return 'builds';
    if(h.startsWith('#runes/custom')) return 'builds';
    if(h.startsWith('#runes')) return 'builds';
    if(h.startsWith('#guide')) return 'guide';
    return 'home';
  }

  function sync(){
    const key=currentKey();
    document.querySelectorAll('#mobileAppNav [data-app-nav]').forEach(btn=>{
      if(btn.dataset.appNav===key) btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
    });
  }

  window.addEventListener('hashchange',()=>setTimeout(sync,0));
  document.addEventListener('click',()=>setTimeout(sync,0),true);
  const init=()=>document.body?ensure():setTimeout(init,30);
  init();
})();
