(() => {
  'use strict';

  // The checklist renderer rebuilds its inner DOM after a checkbox change.
  // Preserve the dialog scroll position and remove focus before that rebuild so
  // the browser cannot scroll-anchor to a detached checkbox near the bottom.
  document.addEventListener('change', event => {
    const input = event.target.closest?.('#mabiTaskDialog [data-task-id]');
    if (!input) return;

    const content = document.querySelector('#mabiTaskDialog .mabi-task-dialog-content');
    if (!content) return;

    const savedTop = content.scrollTop;
    input.blur();

    const restore = () => {
      const max = Math.max(0, content.scrollHeight - content.clientHeight);
      content.scrollTop = Math.max(0, Math.min(savedTop, max));
    };

    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }, true);
})();
