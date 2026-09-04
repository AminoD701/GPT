(() => {
  'use strict';

  const STORAGE_KEY = 'mabi-guild-character-task-progress-v1';
  const VERSION = 1;
  const HOUR = 60 * 60 * 1000;
  const TAIPEI_RESET_SHIFT = 2 * HOUR;

  const TASKS = [
    { id: 'abyss-1', name: '深淵1－沉默的迴廊', cycle: 'weekly' },
    { id: 'abyss-2', name: '深淵2－崩塌的祭壇', cycle: 'weekly' },
    { id: 'abyss-3', name: '深淵3－毀滅的殿堂', cycle: 'weekly' },
    { id: 'raid-gris', name: '團隊副本－格里斯貝恩', cycle: 'weekly' },
    { id: 'deep-dungeon', name: '深層地下城', cycle: 'daily' },
    { id: 'part-time', name: '兼職任務', cycle: 'weekly' },
    { id: 'tir-food', name: '提爾克那－食材兌換', cycle: 'weekly' },
    { id: 'tir-alloy', name: '提爾克那－合金鋼錠', cycle: 'daily', materials: [{ name: '鋼錠', qty: 8 }] },
    { id: 'tir-board', name: '提爾克那－佈告欄', cycle: 'weekly' },
    { id: 'dun-food', name: '杜巴頓－食材兌換', cycle: 'weekly' },
    { id: 'dun-special-steel', name: '杜巴頓－特殊鋼錠', cycle: 'daily', materials: [{ name: '合金鋼錠', qty: 8 }] },
    { id: 'dun-board', name: '杜巴頓－佈告欄', cycle: 'weekly' },
    { id: 'cobh-food', name: '庫漢－食材兌換', cycle: 'weekly' },
    { id: 'cobh-board', name: '庫漢－佈告欄', cycle: 'weekly' },
    { id: 'dugald-lumber', name: '杜加德走廊－高級木材', cycle: 'daily', materials: [{ name: '炒蔬菜', qty: 2 }] }
  ];

  const DAILY_TASKS = TASKS.filter(task => task.cycle === 'daily');
  const WEEKLY_TASKS = TASKS.filter(task => task.cycle === 'weekly');
  let memoryState = null;
  let storageAvailable = true;
  let activeRoleIndex = 0;
  let resetTimer = null;

  const $ = selector => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function shiftedResetDate(now = Date.now()) {
    return new Date(now + TAIPEI_RESET_SHIFT);
  }

  function isoDateUTC(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function cycleKeys(now = Date.now()) {
    const shifted = shiftedResetDate(now);
    const daily = isoDateUTC(shifted);
    const day = shifted.getUTCDay();
    const daysSinceMonday = (day + 6) % 7;
    const monday = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysSinceMonday));
    return { daily, weekly: isoDateUTC(monday) };
  }

  function freshState() {
    const keys = cycleKeys();
    return { version: VERSION, dailyKey: keys.daily, weeklyKey: keys.weekly, members: {} };
  }

  function readState() {
    if (memoryState) return memoryState;
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      memoryState = parsed && parsed.version === VERSION && parsed.members ? parsed : freshState();
    } catch (error) {
      console.warn('[Task Tracker] 無法讀取 localStorage，改用暫存模式。', error);
      storageAvailable = false;
      memoryState = freshState();
    }
    return memoryState;
  }

  function writeState() {
    if (!memoryState) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
      console.warn('[Task Tracker] 無法儲存 localStorage。', error);
    }
  }

  function clearCycle(cycle) {
    const state = readState();
    Object.values(state.members || {}).forEach(member => {
      Object.values(member.roles || {}).forEach(role => {
        if (role && typeof role === 'object') role[cycle] = {};
      });
    });
  }

  function applyResets() {
    const state = readState();
    const keys = cycleKeys();
    let changed = false;
    if (state.dailyKey !== keys.daily) {
      clearCycle('daily');
      state.dailyKey = keys.daily;
      changed = true;
    }
    if (state.weeklyKey !== keys.weekly) {
      clearCycle('weekly');
      state.weeklyKey = keys.weekly;
      changed = true;
    }
    if (changed) writeState();
    return changed;
  }

  function nextDailyResetDelay() {
    const shifted = shiftedResetDate();
    const nextMidnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1);
    return Math.max(1000, nextMidnight - shifted.getTime() + 200);
  }

  function scheduleResetCheck() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      applyResets();
      if ($('#memberDialog')?.open) renderTracker();
      scheduleResetCheck();
    }, nextDailyResetDelay());
  }

  function memberKey() {
    const mainId = $('#modalMainId')?.textContent?.trim() || '';
    const line = $('#modalLine')?.textContent?.trim() || '';
    const guild = $('#modalGuild')?.textContent?.trim() || '';
    return [guild, mainId, line].join('||') || 'unknown-member';
  }

  function roleLabels() {
    const rows = [...document.querySelectorAll('#modalRoles .role-row')];
    return Array.from({ length: 6 }, (_, index) => {
      const row = rows[index];
      const tag = row?.querySelector('.role-tag')?.textContent?.trim() || `角色${index + 1}`;
      const cells = [...(row?.querySelectorAll('.role-cell span') || [])]
        .map(node => node.textContent.trim())
        .filter(Boolean);
      const id = cells.at(-1) || '';
      return {
        title: tag.replace(/\s+/g, ' '),
        subtitle: id && id !== '—' ? id : ''
      };
    });
  }

  function ensureRoleState(memberId, roleIndex) {
    const state = readState();
    state.members[memberId] ||= { roles: {} };
    state.members[memberId].roles ||= {};
    state.members[memberId].roles[roleIndex] ||= { daily: {}, weekly: {} };
    const role = state.members[memberId].roles[roleIndex];
    role.daily ||= {};
    role.weekly ||= {};
    return role;
  }

  function taskDone(role, task) {
    return Boolean(role?.[task.cycle]?.[task.id]);
  }

  function setTaskDone(memberId, roleIndex, task, done) {
    const role = ensureRoleState(memberId, roleIndex);
    role[task.cycle][task.id] = Boolean(done);
    writeState();
  }

  function progressFor(role, tasks) {
    const done = tasks.reduce((sum, task) => sum + (taskDone(role, task) ? 1 : 0), 0);
    return { done, total: tasks.length, pct: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
  }

  function remainingMaterials(role) {
    const totals = new Map();
    TASKS.forEach(task => {
      if (taskDone(role, task) || !task.materials?.length) return;
      task.materials.forEach(material => totals.set(material.name, (totals.get(material.name) || 0) + material.qty));
    });
    return [...totals.entries()].map(([name, qty]) => ({ name, qty }));
  }

  function taskMarkup(task, role) {
    const checked = taskDone(role, task);
    const material = task.materials?.length
      ? `<span class="mabi-task-material">需要：${task.materials.map(item => `${escapeHtml(item.name)} ×${item.qty}`).join('、')}</span>`
      : '';
    return `<label class="mabi-task-item ${checked ? 'is-done' : ''}">
      <input type="checkbox" data-task-id="${escapeHtml(task.id)}" ${checked ? 'checked' : ''}>
      <span class="mabi-task-check" aria-hidden="true"></span>
      <span class="mabi-task-copy"><strong>${escapeHtml(task.name)}</strong>${material}</span>
      <span class="mabi-task-cycle ${task.cycle}">${task.cycle === 'daily' ? '每日' : '每週'}</span>
    </label>`;
  }

  function sectionMarkup(title, tasks, role, progress, hint) {
    return `<section class="mabi-task-group">
      <div class="mabi-task-group-head">
        <div><span class="mabi-task-group-kicker">${escapeHtml(hint)}</span><h4>${escapeHtml(title)}</h4></div>
        <strong>${progress.done} / ${progress.total}</strong>
      </div>
      <div class="mabi-task-progress"><i style="width:${progress.pct}%"></i></div>
      <div class="mabi-task-list">${tasks.map(task => taskMarkup(task, role)).join('')}</div>
    </section>`;
  }

  function ensureTrackerElement() {
    const content = $('#memberDialog .modal-content');
    if (!content) return null;
    let tracker = $('#mabiTaskTracker');
    if (!tracker) {
      tracker = document.createElement('section');
      tracker.id = 'mabiTaskTracker';
      tracker.className = 'mabi-task-tracker';
      content.appendChild(tracker);
    }
    return tracker;
  }

  function renderTracker() {
    const dialog = $('#memberDialog');
    if (!dialog?.open) return;
    applyResets();
    const tracker = ensureTrackerElement();
    if (!tracker) return;

    const labels = roleLabels();
    activeRoleIndex = Math.max(0, Math.min(5, activeRoleIndex));
    const memberId = memberKey();
    const role = ensureRoleState(memberId, activeRoleIndex);
    const daily = progressFor(role, DAILY_TASKS);
    const weekly = progressFor(role, WEEKLY_TASKS);
    const materials = remainingMaterials(role);

    tracker.innerHTML = `
      <div class="mabi-task-title-row">
        <div>
          <span class="mabi-task-kicker">CHARACTER ROUTINE / CHECKLIST</span>
          <h3>角色工作進度</h3>
          <p>每日 06:00 重置；每週一 06:00 重置（台灣時間）。</p>
        </div>
        <div class="mabi-task-total"><span>目前角色</span><strong>${daily.done + weekly.done} / ${daily.total + weekly.total}</strong></div>
      </div>

      <div class="mabi-role-tabs" role="tablist" aria-label="角色工作進度">
        ${labels.map((label, index) => `<button type="button" class="mabi-role-tab ${index === activeRoleIndex ? 'active' : ''}" data-role-index="${index}" role="tab" aria-selected="${index === activeRoleIndex}">
          <strong>${escapeHtml(label.title)}</strong>${label.subtitle ? `<small>${escapeHtml(label.subtitle)}</small>` : ''}
        </button>`).join('')}
      </div>

      <div class="mabi-task-summary-grid">
        <div><span>今日</span><strong>${daily.done} / ${daily.total}</strong><small>${daily.pct}% 完成</small></div>
        <div><span>本週</span><strong>${weekly.done} / ${weekly.total}</strong><small>${weekly.pct}% 完成</small></div>
      </div>

      <div class="mabi-material-box">
        <div><span>尚需準備材料</span><small>只統計目前角色尚未完成的工作</small></div>
        <div class="mabi-material-list">${materials.length ? materials.map(item => `<span>${escapeHtml(item.name)} <b>×${item.qty}</b></span>`).join('') : '<span class="done">目前沒有待準備材料 ✓</span>'}</div>
      </div>

      <div class="mabi-task-columns">
        ${sectionMarkup('每日工作', DAILY_TASKS, role, daily, '每天 06:00 清空')}
        ${sectionMarkup('每週工作', WEEKLY_TASKS, role, weekly, '每週一 06:00 清空')}
      </div>

      <p class="mabi-task-storage-note">${storageAvailable ? '完成紀錄會保存在目前這台裝置的瀏覽器中。' : '瀏覽器目前無法永久儲存，這次勾選只會暫時保留。'}</p>
    `;

    tracker.querySelectorAll('[data-role-index]').forEach(button => {
      button.addEventListener('click', () => {
        activeRoleIndex = Number(button.dataset.roleIndex) || 0;
        renderTracker();
      });
    });

    tracker.querySelectorAll('[data-task-id]').forEach(input => {
      input.addEventListener('change', () => {
        const task = TASKS.find(item => item.id === input.dataset.taskId);
        if (!task) return;
        setTaskDone(memberId, activeRoleIndex, task, input.checked);
        renderTracker();
      });
    });
  }

  function observeMemberDialog() {
    const dialog = $('#memberDialog');
    const roles = $('#modalRoles');
    if (!dialog || !roles) return;

    const observer = new MutationObserver(mutations => {
      if (!dialog.open) return;
      if (mutations.some(item => item.type === 'attributes' || item.type === 'childList' || item.type === 'characterData')) {
        activeRoleIndex = 0;
        queueMicrotask(renderTracker);
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    observer.observe(roles, { childList: true, subtree: true, characterData: true });
    dialog.addEventListener('close', () => { activeRoleIndex = 0; });
  }

  applyResets();
  observeMemberDialog();
  scheduleResetCheck();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const changed = applyResets();
    if (changed && $('#memberDialog')?.open) renderTracker();
  });
})();
