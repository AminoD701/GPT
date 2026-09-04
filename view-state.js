(() => {
  'use strict';

  const KEY = 'mabi-site-last-view-v1';
  const valid = new Set(['members','guide','dice','spirit','runes','loadout','custom','pets','rune-recommend']);

  function save(view) {
    if (!valid.has(view)) return;
    try { localStorage.setItem(KEY, view); } catch {}
  }

  function saved() {
    try {
      const value = localStorage.getItem(KEY) || 'members';
      return valid.has(value) ? value : 'members';
    } catch { return 'members'; }
  }

  function openGuideShell() {
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
  }

  function restore(view) {
    if (view === 'members') {
      if (typeof window.switchView === 'function') window.switchView('members');
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

  // Capture clicks before the site's own handlers run, so the chosen page is
  // saved even when the existing view function later re-renders the DOM.
  document.addEventListener('click', event => {
    const el = event.target.closest('button,[data-rune-class],a');
    if (!el) return;

    if (el.closest('#membersTab')) return save('members');
    if (el.closest('#guidesTab')) return save('guide');
    if (el.closest('#diceGuideEntry')) return save('dice');
    if (el.closest('#spiritTraceEntry')) return save('spirit');
    if (el.closest('#runeGuideEntry')) return save('runes');
    if (el.closest('#loadoutEntry')) return save('loadout');
    if (el.closest('#customRuneBuilderEntry')) return save('custom');
    if (el.closest('#petToolEntry')) return save('pets');
    if (el.closest('#runeRecommendationEntry')) return save('rune-recommend');

    // Back buttons should persist the destination page as well.
    if (el.matches('#backToGuideHome,#spiritTraceBack,#runeBackToGuide,#loadoutBackToGuide,#petBackGuide,#petBackGuideV4')) return save('guide');
    if (el.matches('#loadoutBackToClasses')) return save('loadout');
    if (el.matches('#runeBackToClasses,#backToRuneCatalog')) return save('runes');
  }, true);

  // Restore only after all original scripts have initialized their views.
  const restoreWhenReady = () => {
    const tabsReady = document.getElementById('membersTab') && document.getElementById('guidesTab');
    if (!tabsReady) return setTimeout(restoreWhenReady, 50);
    restore(saved());
  };
  setTimeout(restoreWhenReady, 0);
})();
