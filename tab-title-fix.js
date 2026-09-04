(() => {
  'use strict';
  const TITLE = '【おやす米 - 瑪奇Mobile攻略網】｜迪恩｜';
  const apply = () => { if (document.title !== TITLE) document.title = TITLE; };
  apply();
  const observer = new MutationObserver(apply);
  const head = document.head || document.documentElement;
  if (head) observer.observe(head, { childList: true, subtree: true, characterData: true });
})();
