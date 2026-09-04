(() => {
  'use strict';

  const title = document.getElementById('guildName');
  if (!title) return;

  let applying = false;
  const apply = () => {
    if (applying) return;
    const hasStructure = title.querySelector('.site-title-main') && title.querySelector('.site-title-sub');
    if (hasStructure) return;
    applying = true;
    title.innerHTML = '<span class="site-title-main">瑪奇Mobile｜迪恩</span><span class="site-title-sub">公會成員名單</span>';
    applying = false;
  };

  apply();
  const observer = new MutationObserver(() => apply());
  observer.observe(title, { childList: true, characterData: true, subtree: true });
})();
