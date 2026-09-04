(() => {
  'use strict';

  function ensureBottomSpace() {
    const dialog = document.querySelector('#memberDialog');
    const content = dialog?.querySelector('.modal-content');
    const roles = dialog?.querySelector('#modalRoles');
    if (!dialog?.open || !content || !roles) return;

    let spacer = dialog.querySelector('#memberBottomSpacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'memberBottomSpacer';
      spacer.setAttribute('aria-hidden', 'true');
      spacer.style.height = '72px';
      spacer.style.minHeight = '72px';
      spacer.style.flex = '0 0 72px';
      spacer.style.width = '100%';
      spacer.style.pointerEvents = 'none';
      roles.insertAdjacentElement('afterend', spacer);
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#memberGrid .member-card')) {
      setTimeout(ensureBottomSpace, 0);
      setTimeout(ensureBottomSpace, 50);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.closest('#memberGrid .member-card')) {
      setTimeout(ensureBottomSpace, 0);
      setTimeout(ensureBottomSpace, 50);
    }
  });
})();
