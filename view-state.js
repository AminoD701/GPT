(() => {
  'use strict';

  const KEY = 'mabi-site-last-view-v3';
  const PAGE_HASH = {
    home:'#home',
    members:'#members',
    guide:'#guide',
    dice:'#guide/dice',
    spirit:'#guide/spirit-trace',
    runes:'#runes',
    loadout:'#builds',
    custom:'#runes/custom',
    pets:'#pets',
    'rune-recommend':'#runes/recommend'
  };
  const HASH_PAGE = Object.fromEntries(Object.entries(PAGE_HASH).map(([k,v])=>[v,k]));
  let applyingHash = false;

  function save(view) {
    try { localStorage.setItem(KEY, view); } catch {}
  }

  function saved() {
    try { return localStorage.getItem(KEY) || 'home'; } catch { return 'home'; }
  }

  function cleanHash() {
    return decodeURI(location.hash || '').replace(/\/+$/,'');
  }

  function setHash(hash, replace=false) {
    if (!hash || cleanHash() === hash) return;
    applyingHash = true;
    if (replace) history.replaceState(null,'',hash);
    else history.pushState(null,'',hash);
    applyingHash = false;
  }

  function openGuideShell() {
    document.getElementById('homeView')?.setAttribute('hidden','');
    if (typeof window.switchView === 'function') {
      window.switchView('guides');
      return;
    }
    const members = document.getElementById('membersView');
    const guide = document.getElementById('guideView');
    if (members) members.hidden = true;
    if (guide) guide.hidden = false;
    document.getElementById('membersTab')?.setAttribute('aria-selected','false');
    document.getElementById('guidesTab')?.setAttribute('aria-selected','true');
    document.getElementById('homeTab')?.setAttribute('aria-selected','false');
  }

  function restore(view) {
    save(view);
    if (view === 'home') {
      window.showSiteHome?.();
      return;
    }
    if (view === 'members') {
      document.getElementById('homeView')?.setAttribute('hidden','');
      window.switchView?.('members');
      document.getElementById('homeTab')?.setAttribute('aria-selected','false');
      return;
    }
    openGuideShell();
    const calls = {
      guide:'showGuideHome',
      dice:'showGuideArticle',
      spirit:'showSpiritTraceTool',
      runes:'showRuneHome',
      loadout:'showLoadoutHome',
      custom:'showCustomRuneBuilder',
      pets:'showPetTool',
      'rune-recommend':'showRuneRecommendationHome'
    };
    const fn = window[calls[view]];
    if (typeof fn === 'function') fn();
    else window.showGuideHome?.();
  }

  function openMemberByName(name) {
    restore('members');
    const wanted = String(name || '').trim();
    if (!wanted) return;
    let tries = 0;
    const attempt = () => {
      const cards = [...document.querySelectorAll('#memberGrid .member-card')];
      const card = cards.find(c => {
        const id = c.querySelector('.main-id')?.textContent?.trim();
        return id === wanted;
      });
      if (card) {
        card.click();
        return;
      }
      if (++tries < 80) setTimeout(attempt,100);
    };
    attempt();
  }

  function applyCurrentHash() {
    const hash = cleanHash();
    if (!hash) {
      const view = saved();
      setHash(PAGE_HASH[view] || '#home', true);
      restore(view);
      return;
    }

    if (hash.startsWith('#members/')) {
      const name = decodeURIComponent(hash.slice('#members/'.length));
      openMemberByName(name);
      return;
    }

    const view = HASH_PAGE[hash] || 'home';
    restore(view);
  }

  function pageFromElement(el) {
    if (el.closest('#homeTab')) return 'home';
    if (el.closest('#membersTab')) return 'members';
    if (el.closest('#guidesTab')) return 'guide';

    const homeTarget = el.closest('[data-home-target]')?.dataset.homeTarget;
    const homeMap = {members:'members',guide:'guide',dice:'dice',spirit:'spirit',runes:'runes',loadout:'loadout',custom:'custom',pets:'pets'};
    if (homeTarget && homeMap[homeTarget]) return homeMap[homeTarget];

    if (el.closest('#diceGuideEntry')) return 'dice';
    if (el.closest('#spiritTraceEntry')) return 'spirit';
    if (el.closest('#runeGuideEntry')) return 'runes';
    if (el.closest('#loadoutEntry')) return 'loadout';
    if (el.closest('#customRuneBuilderEntry')) return 'custom';
    if (el.closest('#petToolEntry')) return 'pets';
    if (el.closest('#runeRecommendationEntry')) return 'rune-recommend';

    if (el.matches('#backToGuideHome,#spiritTraceBack,#runeBackToGuide,#loadoutBackToGuide,#petBackGuide,#petBackGuideV4')) return 'guide';
    if (el.matches('#loadoutBackToClasses')) return 'loadout';
    if (el.matches('#runeBackToClasses,#backToRuneCatalog')) return 'runes';
    return '';
  }

  document.addEventListener('click', event => {
    const el = event.target.closest('button,[data-rune-class],a');
    if (!el) return;

    const memberCard = el.closest('#memberGrid .member-card');
    if (memberCard) {
      const name = memberCard.querySelector('.main-id')?.textContent?.trim();
      if (name) {
        save('members');
        setHash(`#members/${encodeURIComponent(name)}`);
      }
      return;
    }

    if (el.closest('#closeModal')) {
      setHash('#members');
      save('members');
      return;
    }

    const view = pageFromElement(el);
    if (!view) return;
    save(view);
    setHash(PAGE_HASH[view]);
  }, true);

  document.getElementById('memberDialog')?.addEventListener('close',()=>{
    if (cleanHash().startsWith('#members/')) setHash('#members', true);
  });

  window.addEventListener('hashchange',()=>{
    if (!applyingHash) applyCurrentHash();
  });
  window.addEventListener('popstate',()=>{
    if (!applyingHash) applyCurrentHash();
  });

  const restoreWhenReady = () => {
    const ready = document.getElementById('membersTab') && document.getElementById('guidesTab') && document.getElementById('homeTab');
    if (!ready) return setTimeout(restoreWhenReady,50);
    applyCurrentHash();
  };
  setTimeout(restoreWhenReady,0);
})();
