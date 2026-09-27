(() => {
  'use strict';

  const ICONS={
    growth:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 30 16l13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12Z"/><circle cx="24" cy="24" r="4"/></svg>',
    build:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m25 5 6 6-5 5 11 11 4-4 3 3-9 9-3-3 4-4-11-11-5 5-6-6L25 5Zm0 5-7 7 2 2 7-7-2-2Z"/><path d="M7 36h17v5H7z"/></svg>',
    rune:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 15 9v22l-15 9-15-9V13l15-9Zm0 7-9 6v14l9 6 9-6V17l-9-6Z"/><path d="m24 16 6 8-6 8-6-8 6-8Z"/></svg>',
    pet:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="15" cy="15" r="5"/><circle cx="33" cy="15" r="5"/><circle cx="11" cy="26" r="4"/><circle cx="37" cy="26" r="4"/><path d="M24 21c8 0 14 7 14 14 0 6-5 9-14 9s-14-3-14-9c0-7 6-14 14-14Z"/></svg>',
    other:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M21 8h6v13h13v6H27v13h-6V27H8v-6h13V8Z"/></svg>'
  };

  const GROUPS=[
    {key:'growth',title:'養成',ids:['diceGuideEntry','spiritTraceEntry']},
    {key:'build',title:'配裝',ids:['loadoutEntry','runeRecommendationEntry']},
    {key:'rune',title:'符文',ids:['runeGuideEntry','customRuneBuilderEntry']},
    {key:'pet',title:'寵物',ids:['petToolEntry']}
  ];

  function cleanEntry(entry,key){
    entry.dataset.visualTone=key;
    entry.querySelector('p')?.remove();
    entry.querySelector('.guide-entry-foot')?.remove();
    entry.querySelector('.guide-label')?.remove();
  }

  function buildGroup(group,entries){
    const section=document.createElement('section');
    section.className='guide-category guide-category-'+group.key;
    section.dataset.guideCategory=group.key;
    const head=document.createElement('div');
    head.className='guide-category-head';
    head.innerHTML='<div><span class="guide-category-icon">'+(ICONS[group.key]||ICONS.other)+'</span><h3>'+group.title+'</h3></div>';
    const grid=document.createElement('div');
    grid.className='guide-category-grid';
    entries.forEach(entry=>{cleanEntry(entry,group.key);grid.appendChild(entry);});
    section.append(head,grid);
    return section;
  }

  function organize(){
    const grid=document.querySelector('.guide-home-grid');
    if(!grid||grid.dataset.categorized==='1')return !!grid;
    const all=[...grid.children].filter(el=>el.classList?.contains('guide-entry'));
    if(!all.length)return false;
    const used=new Set(),frag=document.createDocumentFragment();

    GROUPS.forEach(group=>{
      const entries=group.ids.map(id=>document.getElementById(id)).filter(el=>el&&el.parentElement===grid);
      if(!entries.length)return;
      entries.forEach(el=>used.add(el));
      frag.appendChild(buildGroup(group,entries));
    });

    const other=all.filter(el=>!used.has(el));
    if(other.length)frag.appendChild(buildGroup({key:'other',title:'其他'},other));

    grid.innerHTML='';
    grid.appendChild(frag);
    grid.dataset.categorized='1';
    grid.classList.add('guide-home-categorized');
    const intro=document.querySelector('.guide-home-head .guide-intro');
    if(intro)intro.textContent='選擇功能';
    return true;
  }

  const init=()=>organize()?null:setTimeout(init,80);
  init();
})();