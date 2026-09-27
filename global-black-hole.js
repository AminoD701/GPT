(() => {
  'use strict';

  const $=id=>document.getElementById(id);
  let timer=0;
  let data=null;

  function twTime(iso){
    if(!iso)return '—';
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '—';
    return new Intl.DateTimeFormat('zh-TW',{
      timeZone:'Asia/Taipei',
      month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit'
    }).format(d);
  }

  function remain(target){
    const ms=new Date(target).getTime()-Date.now();
    if(!Number.isFinite(ms))return '—';
    if(ms<=0)return '00:00:00';
    const t=Math.floor(ms/1000);
    const d=Math.floor(t/86400);
    const h=Math.floor((t%86400)/3600);
    const m=Math.floor((t%3600)/60);
    const s=t%60;
    return (d?d+'天 ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }

  function ensure(){
    if($('globalBlackHoleBar'))return true;
    const shell=document.querySelector('.shell');
    const search=document.querySelector('.site-search-wrap');
    if(!shell||!search)return false;

    let row=document.querySelector('.top-utility-row');
    if(!row){
      row=document.createElement('div');
      row.className='top-utility-row';
      search.insertAdjacentElement('beforebegin',row);
      row.appendChild(search);
    }

    const widget=document.createElement('button');
    widget.id='globalBlackHoleBar';
    widget.type='button';
    widget.className='global-black-hole';
    widget.setAttribute('aria-label','查看深淵黑洞倒數');
    widget.setAttribute('aria-expanded','false');
    widget.innerHTML=`
      <span class="gbh-clock">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M17 8 7 18l5 5L22 13l-5-5Zm30 0-5 5 10 10 5-5L47 8Z"/>
          <path d="M32 13a22 22 0 1 0 0 44 22 22 0 0 0 0-44Zm0 7a15 15 0 1 1 0 30 15 15 0 0 1 0-30Z"/>
          <path d="M29 24h6v11l8 5-3 5-11-7V24Z"/>
          <path d="M18 52 13 58h8l3-4-6-2Zm28 0-6 2 3 4h8l-5-6Z"/>
        </svg>
        <span class="gbh-pulse"></span>
      </span>
      <span class="gbh-copy">
        <span class="gbh-label">深淵黑洞</span>
        <strong id="gbhCountdown">--:--:--</strong>
        <span id="gbhState" class="gbh-state">讀取中</span>
      </span>
      <span class="gbh-detail">
        <span>目標時間</span>
        <b id="gbhTime">—</b>
      </span>`;

    row.insertBefore(widget,search);

    widget.addEventListener('click',()=>{
      widget.setAttribute('aria-expanded',String(widget.getAttribute('aria-expanded')!=='true'));
    });
    return true;
  }

  function tick(){
    if(!data)return;
    const now=Date.now();
    const open=new Date(data.opensAt).getTime();
    const close=new Date(data.closesAt).getTime();
    let target=data.opensAt;
    let state='距離開啟';
    const widget=$('globalBlackHoleBar');

    if(now>=open&&now<close){
      target=data.closesAt;
      state='開啟中 · 距離結束';
      widget?.classList.add('is-open');
    }else{
      widget?.classList.remove('is-open');
      if(now>=close){
        target=data.nextOpensAt;
        state=data.nextIsPrediction?'距離下輪預估':'距離下一輪';
      }
    }

    $('gbhState').textContent=state;
    $('gbhCountdown').textContent=remain(target);
    $('gbhTime').textContent=twTime(target)+(data.nextIsPrediction&&now>=close?' 預估':'');
  }

  async function load(){
    try{
      const res=await fetch('./data/black-hole.json?ts='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      data=await res.json();
      clearInterval(timer);
      tick();
      timer=setInterval(tick,1000);
    }catch(e){
      console.warn('[Black Hole Clock] load failed',e);
      if($('gbhState'))$('gbhState').textContent='資料暫時無法讀取';
      if($('gbhCountdown'))$('gbhCountdown').textContent='—';
      if($('gbhTime'))$('gbhTime').textContent='';
    }
  }

  const init=()=>{
    if(!ensure())return setTimeout(init,80);
    load();
    setInterval(load,5*60*1000);
  };
  init();
})();