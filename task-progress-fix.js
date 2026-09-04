(() => {
  'use strict';

  function clampScroll(content, value) {
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    return Math.max(0, Math.min(max, value));
  }

  function restoreTaskViewport(content, taskId, oldTop, oldScrollTop) {
    const selector = `#mabiTaskTracker [data-task-id="${CSS.escape(taskId)}"]`;
    const nextInput = document.querySelector(selector);

    if (nextInput) {
      const newTop = nextInput.getBoundingClientRect().top;
      const delta = newTop - oldTop;
      if (Number.isFinite(delta)) {
        content.scrollTop = clampScroll(content, content.scrollTop + delta);
        return;
      }
    }

    content.scrollTop = clampScroll(content, oldScrollTop);
  }

  document.addEventListener('change', event => {
    const input = event.target.closest?.('#mabiTaskTracker [data-task-id]');
    if (!input) return;

    const content = document.querySelector('#memberDialog .modal-content');
    if (!content) return;

    const taskId = input.dataset.taskId || '';
    const oldTop = input.getBoundingClientRect().top;
    const oldScrollTop = content.scrollTop;

    // task-progress.js 會在 change 事件中重新建立 checklist DOM。
    // 瀏覽器在 dialog 的捲動容器上可能因此保留錯誤的 scroll anchor，
    // 造成畫面看起來整片空白。重新定位到同一個 checkbox 可避免此問題。
    requestAnimationFrame(() => {
      restoreTaskViewport(content, taskId, oldTop, oldScrollTop);
      requestAnimationFrame(() => restoreTaskViewport(content, taskId, oldTop, oldScrollTop));
    });
  }, true);
})();
