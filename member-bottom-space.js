(() => {
  'use strict';

  function hideCharacterDisplayBadges() {
    const grid = document.querySelector('#memberGrid');
    if (!grid) return;
    grid.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === '角色展示') {
        el.style.display = 'none';
      }
    });
  }

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
      roles.insertAdjacentElement('afterend', spacer);
    }

    spacer.style.height = '34px';
    spacer.style.minHeight = '34px';
    spacer.style.flex = '0 0 34px';
    spacer.style.width = '100%';
    spacer.style.pointerEvents = 'none';
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

  hideCharacterDisplayBadges();
  setTimeout(hideCharacterDisplayBadges, 100);
})();
