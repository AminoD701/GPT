(() => {
  'use strict';

  function dialog(){ return document.querySelector('#mabiTaskDialog'); }
  function content(){ return document.querySelector('#mabiTaskDialog .mabi-task-dialog-content'); }

  function forceDialogTop(savedContentTop){
    const d=dialog(), c=content();
    if(!d||!c)return;
    d.scrollTop=0;
    if(Number.isFinite(savedContentTop)) c.scrollTop=savedContentTop;
  }

  document.addEventListener('pointerdown', event => {
    const item=event.target.closest?.('#mabiTaskDialog .mabi-task-item');
    if(!item)return;
    const c=content();
    if(c) item.dataset.savedScrollTop=String(c.scrollTop);
    // Prevent the hidden checkbox from receiving focus and scrolling the <dialog>
    // element itself. Label click still toggles the checkbox normally.
    event.preventDefault();
  }, true);

  document.addEventListener('change', event => {
    const input=event.target.closest?.('#mabiTaskDialog [data-task-id]');
    if(!input)return;
    const item=input.closest('.mabi-task-item');
    const saved=Number(item?.dataset.savedScrollTop ?? content()?.scrollTop ?? 0);
    input.blur();
    forceDialogTop(saved);
    requestAnimationFrame(() => {
      forceDialogTop(saved);
      requestAnimationFrame(() => forceDialogTop(saved));
    });
  }, true);

  document.addEventListener('click', event => {
    if(!event.target.closest?.('#mabiTaskDialog .mabi-task-item'))return;
    const c=content();
    const saved=c?.scrollTop ?? 0;
    requestAnimationFrame(() => forceDialogTop(saved));
  }, true);

  document.addEventListener('scroll', event => {
    const d=dialog();
    if(event.target===d && d.scrollTop!==0) d.scrollTop=0;
  }, true);
})();
