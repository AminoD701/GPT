(() => {
  'use strict';

  const GROUPS = [
    {key:'growth',title:'養成',icon:'✧',ids:['diceGuideEntry','spiritTraceEntry']},
    {key:'build',title:'配裝',icon:'◆',ids:['loadoutEntry','runeRecommendationEntry']},
    {key:'rune',title:'符文',icon:'◇',ids:['runeGuideEntry','customRuneBuilderEntry']},
    {key:'pet',title:'寵物',icon:'◎',ids:['petToolEntry']}
  ];

  function cleanEntry(entry){
    const p=entry.querySelector('p'); if(p) p.remove();
    const foot=entry.querySelector('.guide-entry-foot'); if(foot) foot.remove();
    const label=entry.querySelector('.guide-label'); if(label) label.remove();
  }

  function buildGroup(group,entries){
    const section=document.createElement('section');
    section.className='guide-category guide-category-'+group.key;
    section.dataset.guideCategory=group.key;

    const head=document.createElement('div');
    head.className='guide-category-head';
    head.innerHTML='<div><span class="guide-category-icon">'+group.icon+'</span><h3>'+group.title+'</h3></div>';

    const grid=document.createElement('div');
    grid.className='guide-category-grid';
    entries.forEach(entry=>{cleanEntry(entry);grid.appendChild(entry);});

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
    if(other.length)frag.appendChild(buildGroup({key:'other',title:'其他',icon:'＋'},other));

    grid.innerHTML='';
    grid.appendChild(frag);
    grid.dataset.categorized='1';
    grid.classList.add('guide-home-categorized');

    const intro=document.querySelector('.guide-home-head .guide-intro');
    if(intro)intro.textContent='選擇要找的功能';
    return true;
  }

  const init=()=>organize()?null:setTimeout(init,80);
  init();
})();