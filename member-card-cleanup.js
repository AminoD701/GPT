(() => {
  'use strict';

  function removeRoleDisplayBadges(root=document) {
    const cards = root.querySelectorAll?.('#memberGrid .member-card') || [];
    cards.forEach(card => {
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_ELEMENT);
      const targets = [];
      while (walker.nextNode()) {
        const el = walker.currentNode;
        if ((el.textContent || '').trim() !== '角色展示') continue;
        if (el.children.length === 0 || [...el.children].every(child => !(child.textContent || '').trim())) {
          targets.push(el);
        }
      }
      targets.forEach(el => el.remove());
    });
  }

  removeRoleDisplayBadges();
  document.addEventListener('DOMContentLoaded', () => removeRoleDisplayBadges());

  const memberGrid = document.querySelector('#memberGrid');
  if (memberGrid) {
    const observer = new MutationObserver(() => removeRoleDisplayBadges(memberGrid));
    observer.observe(memberGrid, { childList: true, subtree: true });
  }
})();
