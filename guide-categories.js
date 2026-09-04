(() => {
  'use strict';

  const GROUPS = [
    {
      key: 'growth',
      title: '養成工具',
      desc: '角色成長、等級與日常養成相關工具。',
      ids: ['diceGuideEntry', 'spiritTraceEntry']
    },
    {
      key: 'build',
      title: '職業・配裝',
      desc: '職業完整配裝、推薦方向與詞條查詢。',
      ids: ['loadoutEntry', 'runeRecommendationEntry']
    },
    {
      key: 'rune',
      title: '符文工具',
      desc: '傳說符文圖鑑與自由搭配模擬。',
      ids: ['runeGuideEntry', 'customRuneBuilderEntry']
    },
    {
      key: 'pet',
      title: '寵物資料',
      desc: '副屬性推薦、固有技能、技能效果與標籤查詢。',
      ids: ['petToolEntry']
    }
  ];

  function entryName(entry) {
    return entry?.querySelector('h3')?.textContent?.trim() || '';
  }

  function buildGroup(group, entries) {
    const section = document.createElement('section');
    section.className = `guide-category guide-category-${group.key}`;
    section.dataset.guideCategory = group.key;

    const head = document.createElement('div');
    head.className = 'guide-category-head';
    head.innerHTML = `<div><span>${String(group.key).toUpperCase()}</span><h3>${group.title}</h3><p>${group.desc}</p></div><small>${entries.length} 個工具</small>`;

    const grid = document.createElement('div');
    grid.className = 'guide-category-grid';
    entries.forEach(entry => grid.appendChild(entry));

    section.append(head, grid);
    return section;
  }

  function organize() {
    const grid = document.querySelector('.guide-home-grid');
    if (!grid || grid.dataset.categorized === '1') return !!grid;

    const allEntries = [...grid.children].filter(el => el.classList?.contains('guide-entry'));
    if (!allEntries.length) return false;

    const used = new Set();
    const frag = document.createDocumentFragment();

    GROUPS.forEach(group => {
      const entries = group.ids
        .map(id => document.getElementById(id))
        .filter(el => el && el.parentElement === grid);
      if (!entries.length) return;
      entries.forEach(el => used.add(el));
      frag.appendChild(buildGroup(group, entries));
    });

    const other = allEntries.filter(el => !used.has(el));
    if (other.length) {
      frag.appendChild(buildGroup({
        key: 'other',
        title: '其他攻略',
        desc: '其他實用工具與資料入口。'
      }, other));
    }

    grid.innerHTML = '';
    grid.appendChild(frag);
    grid.dataset.categorized = '1';
    grid.classList.add('guide-home-categorized');

    const head = document.querySelector('.guide-home-head');
    const intro = head?.querySelector('.guide-intro');
    if (intro) intro.textContent = '依用途分類攻略與工具，找到需要的內容會更快。';
    return true;
  }

  function init() {
    if (organize()) return;
    setTimeout(init, 80);
  }

  init();
})();
