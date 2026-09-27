(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let timer=0,data=null;
  function twTime(iso){
    if(!iso)return '—'; const d=new Date(iso); if(Number.isNaN(d.getTime()))return '—';
    return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);
  }
  function remain(target){
    const ms=new Date(target).getTime()-Date.now(); if(!Number.isFinite(ms))return '—'; if(ms<=0)return '00:00:00';
    const t=Math.floor(ms/1000),d=Math.floor(t/86400),h=Math.floor((t%86400)/3600),m=Math.floor((t%3600)/60),s=t%60;
    return (d?d+'天 ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }
  function ensure(){
    if($('globalBlackHoleBar'))return true;
    const shell=document.querySelector('.shell'),header=shell?.querySelector('header'); if(!shell||!header)return false;
    const bar=document.createElement('button');
    bar.id='globalBlackHoleBar'; bar.type='button'; bar.className='global-black-hole'; bar.setAttribute('aria-label','查看深淵黑洞與交易所');
    bar.innerHTML='<span class="gbh-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="6"/><path d="M24 5c11 0 19 8 19 19s-8 19-19 19c-9 0-16-5-19-13h6c2 5 7 8 13 8 8 0 14-6 14-14S32 10 24 10c-6 0-11 3-13 8l6 1-9 7-4-11 5 2C12 9 17 5 24 5Z"/></svg></span><span class="gbh-label">深淵黑洞</span><span class="gbh-state" id="gbhState">讀取中</span><strong class="gbh-countdown" id="gbhCountdown">--:--:--</strong><span class="gbh-time" id="gbhTime">—</span><span class="gbh-arrow">查看行情 →</span>';
    header.insertAdjacentElement('afterend',bar);
    bar.addEventListener('click',()=>{location.hash='#live';});
    return true;
  }
  function tick(){
    if(!data)return; const now=Date.now(),open=new Date(data.opensAt).getTime(),close=new Date(data.closesAt).getTime();
    let target=data.opensAt,state='距離開啟';
    if(now>=open&&now<close){target=data.closesAt;state='開啟中 · 距離結束';}
    else if(now>=close){target=data.nextOpensAt;state=data.nextIsPrediction?'距離下輪預估':'距離下一輪';}
    if($('gbhState'))$('gbhState').textContent=state;
    if($('gbhCountdown'))$('gbhCountdown').textContent=remain(target);
    if($('gbhTime'))$('gbhTime').textContent=twTime(target)+(data.nextIsPrediction&&now>=close?' 預估':'');
  }
  async function load(){
    try{
      const res=await fetch('./data/black-hole.json?ts='+Date.now(),{cache:'no-store'}); if(!res.ok)throw new Error('HTTP '+res.status);
      data=await res.json(); clearInterval(timer); tick(); timer=setInterval(tick,1000);
    }catch(e){
      console.warn('[Black Hole Bar] load failed',e);
      if($('gbhState'))$('gbhState').textContent='資料暫時無法讀取'; if($('gbhCountdown'))$('gbhCountdown').textContent='—'; if($('gbhTime'))$('gbhTime').textContent='';
    }
  }
  const init=()=>{if(!ensure())return setTimeout(init,60); load(); setInterval(load,5*60*1000);};
  init();
})();