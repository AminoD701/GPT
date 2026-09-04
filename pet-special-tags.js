(() => {
  'use strict';

  const SPECIAL_TAGS = {
    '迅速': {
      note: '所有寵物的初始 5 種標籤都不會出現「迅速」。必須使用空白標籤牌重新洗標籤才有機會取得。',
      skillRule: '迅速標籤的技能只會出現在第 2 條洗出的技能欄；第 1 條技能欄不會洗出迅速技能。'
    },
    '致命': {
      note: '所有寵物的初始 5 種標籤都不會出現「致命」。必須使用空白標籤牌重新洗標籤才有機會取得。',
      skillRule: '致命標籤的技能只會出現在第 2 條洗出的技能欄；第 1 條技能欄不會洗出致命技能。'
    }
  };

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function ensureStyles() {
    if (document.getElementById('petSpecialTagStyles')) return;
    const style = document.createElement('style');
    style.id = 'petSpecialTagStyles';
    style.textContent = `
      .pet-special-tag-note{margin:14px 0 18px;padding:14px 16px;border:1px solid rgba(215,181,109,.34);border-radius:14px;background:linear-gradient(135deg,rgba(215,181,109,.08),rgba(154,130,216,.06))}
      .pet-special-tag-note strong{display:block;margin-bottom:6px;color:var(--gold);font-size:13px}
      .pet-special-tag-note p{margin:4px 0;color:var(--muted);font-size:12px;line-height:1.7}
      .pet-special-tag-note b{color:#f5f5f7}
      .pet-special-tag-badge{display:inline-flex;align-items:center;margin-left:7px;padding:2px 7px;border:1px solid rgba(239,154,154,.34);border-radius:999px;background:rgba(239,154,154,.08);color:#f6b1b1;font-size:9px;font-weight:700;vertical-align:middle}
      .pet-special-tag-card{border-color:rgba(215,181,109,.38)!important;background:linear-gradient(145deg,rgba(52,43,26,.48),rgba(25,22,36,.75))!important}
      .pet-special-tag-card .pet-special-rule{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);color:#e8d6a9;font-size:11px;line-height:1.65}
    `;
    document.head.appendChild(style);
  }

  function globalNoteMarkup() {
    return `<section class="pet-special-tag-note" data-pet-special-global><strong>特殊標籤：迅速／致命</strong><p><b>這兩個標籤不會出現在任何寵物的初始 5 種標籤中。</b> 必須透過空白標籤牌重新洗標籤才有機會取得。</p><p>另外，「迅速」與「致命」標籤的技能<b>只會出現在第 2 條洗出的技能欄</b>，第 1 條技能欄無法洗出。</p></section>`;
  }

  function addGlobalNote(home) {
    if (home.querySelector('[data-pet-special-global]')) return;
    const tabs = home.querySelector('.petv4-tabs');
    if (tabs) tabs.insertAdjacentHTML('afterend', globalNoteMarkup());
  }

  function markSkillCards(home) {
    home.querySelectorAll('.petv4-skill-card').forEach(card => {
      const tag = card.querySelector('.petv4-tag-pill')?.textContent?.trim();
      if (!SPECIAL_TAGS[tag] || card.dataset.specialTagMarked) return;
      card.dataset.specialTagMarked = '1';
      card.classList.add('pet-special-tag-card');
      const title = card.querySelector('h3');
      title?.insertAdjacentHTML('beforeend', '<span class="pet-special-tag-badge">僅第2技能欄</span>');
      const foot = card.querySelector('.petv4-skill-foot');
      foot?.insertAdjacentHTML('beforebegin', `<div class="pet-special-rule">${esc(SPECIAL_TAGS[tag].skillRule)}</div>`);
    });
  }

  function enhanceSkillFilter(home) {
    const select = home.querySelector('#petv4SkillTag');
    if (!select) return;
    Object.keys(SPECIAL_TAGS).forEach(tag => {
      if ([...select.options].some(opt => opt.value === tag)) return;
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `${tag}（特殊標籤）`;
      select.appendChild(option);
    });
    const current = select.value;
    if (SPECIAL_TAGS[current]) {
      const host = home.querySelector('.petv4-skill-search');
      if (host && !home.querySelector('[data-pet-special-filter-note]')) {
        host.insertAdjacentHTML('afterend', `<section class="pet-special-tag-note" data-pet-special-filter-note><strong>${esc(current)} 是特殊標籤</strong><p>${esc(SPECIAL_TAGS[current].note)}</p><p>${esc(SPECIAL_TAGS[current].skillRule)}</p></section>`);
      }
    }
  }

  function plainTagName(card) {
    const explicit = card.dataset.petSpecialTag;
    if (explicit) return explicit;
    const h3 = card.querySelector('h3');
    if (!h3) return '';
    const clone = h3.cloneNode(true);
    clone.querySelectorAll('.pet-special-tag-badge').forEach(node => node.remove());
    return clone.textContent.trim();
  }

  function addSpecialTagCards(home) {
    const grid = home.querySelector('.petv4-tag-grid');
    if (!grid) return;

    Object.entries(SPECIAL_TAGS).forEach(([tag, info]) => {
      const matches = [...grid.querySelectorAll('.petv4-tag-card')].filter(card => plainTagName(card) === tag);

      // 若基礎資料本身已經有迅速／致命，沿用原卡片；若之前 enhancer 重複插入，刪除多餘副本。
      let existing = matches[0] || null;
      matches.slice(1).forEach(card => card.remove());

      if (existing) {
        existing.dataset.petSpecialTag = tag;
        existing.classList.add('pet-special-tag-card');
        const h3 = existing.querySelector('h3');
        if (h3 && !h3.querySelector('.pet-special-tag-badge')) {
          h3.insertAdjacentHTML('beforeend', '<span class="pet-special-tag-badge">特殊標籤</span>');
        }
        if (!existing.querySelector('.pet-special-rule')) {
          existing.insertAdjacentHTML('beforeend', `<div class="pet-special-rule">${esc(info.note)}<br>${esc(info.skillRule)}</div>`);
        }
        return;
      }

      grid.insertAdjacentHTML('beforeend', `<article class="petv4-tag-card pet-special-tag-card" data-pet-special-tag="${esc(tag)}"><h3>${esc(tag)} <span class="pet-special-tag-badge">特殊標籤</span></h3><small>初始取得方式</small><p>任何寵物的初始標籤都不會出現；需使用空白標籤牌重新洗出。</p><small>技能欄限制</small><div><span>僅第 2 條洗出的技能欄可出現</span></div><div class="pet-special-rule">第 1 條技能欄無法洗出「${esc(tag)}」標籤技能。</div></article>`);
    });
  }

  function enhance() {
    ensureStyles();
    const home = document.querySelector('#petToolHome');
    if (!home || home.hidden) return;
    addGlobalNote(home);
    markSkillCards(home);
    enhanceSkillFilter(home);
    addSpecialTagCards(home);
  }

  if (typeof renderPetTool === 'function') {
    const baseRenderPetTool = renderPetTool;
    renderPetTool = function() {
      const result = baseRenderPetTool.apply(this, arguments);
      enhance();
      return result;
    };
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-v4-mode], [data-pet-entry], #petToolHome')) {
      setTimeout(enhance, 0);
    }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('#petv4SkillTag,#petv4SkillCategory')) setTimeout(enhance, 0);
  });

  setTimeout(enhance, 0);
})();
