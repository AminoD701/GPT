(() => {
  'use strict';

  const title = document.getElementById('guildName');
  if (!title) return;

  let applying = false;
  const apply = () => {
    if (applying) return;
    const main = title.querySelector('.site-title-main');
    const sub = title.querySelector('.site-title-sub');
    if (main && sub && main.textContent === '【おやす米的瑪奇Mobile攻略網】' && sub.textContent === '｜迪恩伺服器｜') return;
    applying = true;
    title.innerHTML = '<span class="site-title-main">【おやす米的瑪奇Mobile攻略網】</span><span class="site-title-sub">｜迪恩伺服器｜</span>';
    applying = false;
  };

  apply();
  const observer = new MutationObserver(() => apply());
  observer.observe(title, { childList: true, characterData: true, subtree: true });
})();
