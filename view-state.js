(() => {
  'use strict';

  const KEY = 'mabi-site-last-view-v2';
  const valid = new Set(['home','members','guide','dice','spirit','runes','loadout','custom','pets','rune-recommend']);

  function save(view) {
    if (!valid.has(view)) return;
    try { localStorage.setItem(KEY, view); } catch {}
  }

  function saved() {
    try {
      const value = localStorage.getItem(KEY) || 'home';
      return valid.has(value) ? value : 'home';
    } catch { return 'home'; }
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
    if (view === 'home') {
      if (typeof window.showSiteHome === 'function') window.showSiteHome();
      return;
    }
    if (view === 'members') {
      document.getElementById('homeView')?.setAttribute('hidden','');
      if (typeof window.switchView === 'function') window.switchView('members');
      document.getElementById('homeTab')?.setAttribute('aria-selected','false');
      return;
    }

    openGuideShell();
    const calls = {
      guide: 'showGuideHome',
      dice: 'showGuideArticle',
      spirit: 'showSpiritTraceTool',
      runes: 'showRuneHome',
      loadout: 'showLoadoutHome',
      custom: 'showCustomRuneBuilder',
      pets: 'showPetTool',
      'rune-recommend': 'showRuneRecommendationHome'
    };
    const fn = window[calls[view]];
    if (typeof fn === 'function') fn();
    else if (typeof window.showGuideHome === 'function') window.showGuideHome();
  }

  document.addEventListener('click', event => {
    const el = event.target.closest('button,[data-rune-class],a');
    if (!el) return;

    if (el.closest('#homeTab')) return save('home');
    if (el.closest('#membersTab')) return save('members');
    if (el.closest('#guidesTab')) return save('guide');

    const homeTarget=el.closest('[data-home-target]')?.dataset.homeTarget;
    const homeMap={members:'members',guide:'guide',dice:'dice',spirit:'spirit',runes:'runes',loadout:'loadout',custom:'custom',pets:'pets'};
    if(homeTarget&&homeMap[homeTarget]) return save(homeMap[homeTarget]);

    if (el.closest('#diceGuideEntry')) return save('dice');
    if (el.closest('#spiritTraceEntry')) return save('spirit');
    if (el.closest('#runeGuideEntry')) return save('runes');
    if (el.closest('#loadoutEntry')) return save('loadout');
    if (el.closest('#customRuneBuilderEntry')) return save('custom');
    if (el.closest('#petToolEntry')) return save('pets');
    if (el.closest('#runeRecommendationEntry')) return save('rune-recommend');

    if (el.matches('#backToGuideHome,#spiritTraceBack,#runeBackToGuide,#loadoutBackToGuide,#petBackGuide,#petBackGuideV4')) return save('guide');
    if (el.matches('#loadoutBackToClasses')) return save('loadout');
    if (el.matches('#runeBackToClasses,#backToRuneCatalog')) return save('runes');
  }, true);

  const restoreWhenReady = () => {
    const ready = document.getElementById('membersTab') && document.getElementById('guidesTab') && document.getElementById('homeTab');
    if (!ready) return setTimeout(restoreWhenReady, 50);
    restore(saved());
  };
  setTimeout(restoreWhenReady, 0);
})();
