(() => {
  'use strict';

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function dedupeSkillCards() {
    const home = document.querySelector('#petToolHome');
    if (!home || home.hidden) return;

    const grid = home.querySelector('.petv4-skill-grid');
    if (!grid) return;

    const cards = [...grid.querySelectorAll('.petv4-skill-card')];
    if (!cards.length) return;

    const seen = new Map();
    cards.forEach(card => {
      const name = normalizeText(card.querySelector('h3')?.childNodes?.[0]?.textContent || card.querySelector('h3')?.textContent);
      const tag = normalizeText(card.querySelector('.petv4-tag-pill')?.textContent);
      const effect = normalizeText(card.querySelector('p')?.textContent);
      const key = `${name}|${tag}|${effect}`;
      const rateText = normalizeText(card.querySelector('.petv4-skill-foot span')?.textContent).replace(/^技能取得機率\s*/, '');

      if (!seen.has(key)) {
        seen.set(key, { card, rates: new Set(rateText ? [rateText] : []) });
        return;
      }

      const entry = seen.get(key);
      if (rateText) entry.rates.add(rateText);
      card.remove();
    });

    seen.forEach(({ card, rates }) => {
      const rateNode = card.querySelector('.petv4-skill-foot span');
      if (!rateNode || !rates.size) return;
      const values = [...rates];
      rateNode.textContent = values.length > 1
        ? `技能取得機率 ${values.join(' / ')}`
        : `技能取得機率 ${values[0]}`;
    });

    const resultHead = grid.previousElementSibling;
    const count = grid.querySelectorAll('.petv4-skill-card').length;
    if (resultHead?.classList?.contains('petv4-result-head')) {
      const small = resultHead.querySelector('small');
      if (small) small.textContent = `${count} 筆`;
    }
  }

  if (typeof renderPetTool === 'function') {
    const baseRenderPetTool = renderPetTool;
    renderPetTool = function() {
      const result = baseRenderPetTool.apply(this, arguments);
      dedupeSkillCards();
      return result;
    };
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-v4-mode], #petToolHome')) setTimeout(dedupeSkillCards, 0);
  });
  document.addEventListener('input', event => {
    if (event.target.matches('#petv4SkillSearch')) setTimeout(dedupeSkillCards, 0);
  });
  document.addEventListener('change', event => {
    if (event.target.matches('#petv4SkillTag,#petv4SkillCategory')) setTimeout(dedupeSkillCards, 0);
  });

  setTimeout(dedupeSkillCards, 0);
})();
