(() => {
  'use strict';

  const STORAGE_KEY = 'mabi-guild-character-task-progress-v1';
  const VERSION = 1;
  const HOUR = 60 * 60 * 1000;
  // 台灣時間 UTC+8，06:00 重置等同以 UTC+2 的日期切換。
  const TAIPEI_RESET_SHIFT = 2 * HOUR;

  const TASKS = [
    { id:'abyss-1', name:'深淵1－沉默的迴廊', cycle:'weekly' },
    { id:'abyss-2', name:'深淵2－崩塌的祭壇', cycle:'weekly' },
    { id:'abyss-3', name:'深淵3－毀滅的殿堂', cycle:'weekly' },
    { id:'raid-gris', name:'團隊副本－格里斯貝恩', cycle:'weekly' },
    { id:'deep-dungeon', name:'深層地下城', cycle:'daily' },
    { id:'part-time', name:'兼職任務', cycle:'weekly' },
    { id:'tir-food', name:'提爾克那－食材兌換', cycle:'weekly' },
    { id:'tir-alloy', name:'提爾克那－合金鋼錠', cycle:'daily', materials:[{name:'鋼錠',qty:8}] },
    { id:'tir-board', name:'提爾克那－佈告欄', cycle:'weekly' },
    { id:'dun-food', name:'杜巴頓－食材兌換', cycle:'weekly' },
    { id:'dun-special-steel', name:'杜巴頓－特殊鋼錠', cycle:'daily', materials:[{name:'合金鋼錠',qty:8}] },
    { id:'dun-board', name:'杜巴頓－佈告欄', cycle:'weekly' },
    { id:'cobh-food', name:'庫漢－食材兌換', cycle:'weekly' },
    { id:'cobh-board', name:'庫漢－佈告欄', cycle:'weekly' },
    { id:'dugald-lumber', name:'杜加德走廊－高級木材', cycle:'daily', materials:[{name:'炒蔬菜',qty:2}] }
  ];

  const DAILY_TASKS = TASKS.filter(task => task.cycle === 'daily');
  const WEEKLY_TASKS = TASKS.filter(task => task.cycle === 'weekly');
  let memoryState = null;
  let storageAvailable = true;
  let selectedRoleIndex = 0;
  let selectedMemberId = '';
  let selectedRoleLabel = { title:'角色', subtitle:'' };
  let resetTimer = null;

  const $ = selector => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function shiftedResetDate(now = Date.now()) { return new Date(now + TAIPEI_RESET_SHIFT); }
  function isoDateUTC(date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`; }
  function cycleKeys(now = Date.now()) {
    const shifted = shiftedResetDate(now);
    const daily = isoDateUTC(shifted);
    const daysSinceMonday = (shifted.getUTCDay() + 6) % 7;
    const monday = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysSinceMonday));
    return { daily, weekly:isoDateUTC(monday) };
  }

  function freshState() {
    const keys = cycleKeys();
    return { version:VERSION, dailyKey:keys.daily, weeklyKey:keys.weekly, members:{} };
  }

  function readState() {
    if (memoryState) return memoryState;
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      memoryState = parsed && parsed.version === VERSION && parsed.members ? parsed : freshState();
    } catch (error) {
      storageAvailable = false;
      memoryState = freshState();
      console.warn('[Task Tracker] localStorage 讀取失敗，改用暫存模式。', error);
    }
    return memoryState;
  }

  function writeState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
      console.warn('[Task Tracker] localStorage 儲存失敗。', error);
    }
  }

  function clearCycle(cycle) {
    const state = readState();
    Object.values(state.members || {}).forEach(member => Object.values(member.roles || {}).forEach(role => { if (role && typeof role === 'object') role[cycle] = {}; }));
  }

  function applyResets() {
    const state = readState();
    const keys = cycleKeys();
    let changed = false;
    if (state.dailyKey !== keys.daily) { clearCycle('daily'); state.dailyKey = keys.daily; changed = true; }
    if (state.weeklyKey !== keys.weekly) { clearCycle('weekly'); state.weeklyKey = keys.weekly; changed = true; }
    if (changed) writeState();
    return changed;
  }

  function nextDailyResetDelay() {
    const shifted = shiftedResetDate();
    const nextMidnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()+1);
    return Math.max(1000, nextMidnight - shifted.getTime() + 250);
  }

  function scheduleResetCheck() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      applyResets();
      refreshRoleLaunchers();
      if ($('#mabiTaskDialog')?.open) renderTaskDialog();
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
    return Array.from({length:6}, (_, index) => {
      const row = rows[index];
      const tag = row?.querySelector('.role-tag')?.textContent?.trim() || `角色${index+1}`;
      const cells = [...(row?.querySelectorAll('.role-cell span') || [])].map(node => node.textContent.trim()).filter(Boolean);
      const id = cells.at(-1) || '';
      return { title:tag.replace(/\s+/g,' '), subtitle:id && id !== '—' ? id : '' };
    });
  }

  function ensureRoleState(memberId, roleIndex) {
    const state = readState();
    state.members[memberId] ||= { roles:{} };
    state.members[memberId].roles ||= {};
    state.members[memberId].roles[roleIndex] ||= { daily:{}, weekly:{} };
    const role = state.members[memberId].roles[roleIndex];
    role.daily ||= {};
    role.weekly ||= {};
    return role;
  }

  function taskDone(role, task) { return Boolean(role?.[task.cycle]?.[task.id]); }
  function setTaskDone(memberId, roleIndex, task, done) {
    const role = ensureRoleState(memberId, roleIndex);
    role[task.cycle][task.id] = Boolean(done);
    writeState();
  }
  function progressFor(role, tasks) {
    const done = tasks.reduce((sum, task) => sum + (taskDone(role,task) ? 1 : 0), 0);
    return { done, total:tasks.length, pct:tasks.length ? Math.round(done/tasks.length*100) : 0 };
  }
  function remainingMaterials(role) {
    const totals = new Map();
    TASKS.forEach(task => {
      if (taskDone(role,task) || !task.materials?.length) return;
      task.materials.forEach(item => totals.set(item.name,(totals.get(item.name)||0)+item.qty));
    });
    return [...totals.entries()].map(([name,qty]) => ({name,qty}));
  }

  function ensureTaskDialog() {
    let dialog = $('#mabiTaskDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'mabiTaskDialog';
    dialog.className = 'mabi-task-dialog';
    dialog.innerHTML = `<div class="mabi-task-dialog-top"><div><span class="mabi-task-kicker">CHARACTER ROUTINE / CHECKLIST</span><h2 id="mabiTaskDialogTitle">角色工作日誌</h2><p id="mabiTaskDialogSub"></p></div><button type="button" class="mabi-task-dialog-close" aria-label="關閉工作日誌">×</button></div><div class="mabi-task-dialog-content"><section id="mabiTaskTracker"></section></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.mabi-task-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    return dialog;
  }

  function taskMarkup(task, role) {
    const checked = taskDone(role, task);
    const material = task.materials?.length ? `<span class="mabi-task-material">需要：${task.materials.map(item => `${escapeHtml(item.name)} ×${item.qty}`).join('、')}</span>` : '';
    return `<label class="mabi-task-item ${checked?'is-done':''}"><input type="checkbox" data-task-id="${escapeHtml(task.id)}" ${checked?'checked':''}><span class="mabi-task-check" aria-hidden="true"></span><span class="mabi-task-copy"><strong>${escapeHtml(task.name)}</strong>${material}</span><span class="mabi-task-cycle ${task.cycle}">${task.cycle==='daily'?'每日':'每週'}</span></label>`;
  }

  function sectionMarkup(title, tasks, role, progress, hint) {
    return `<section class="mabi-task-group"><div class="mabi-task-group-head"><div><span class="mabi-task-group-kicker">${escapeHtml(hint)}</span><h4>${escapeHtml(title)}</h4></div><strong>${progress.done} / ${progress.total}</strong></div><div class="mabi-task-progress"><i style="width:${progress.pct}%"></i></div><div class="mabi-task-list">${tasks.map(task=>taskMarkup(task,role)).join('')}</div></section>`;
  }

  function renderTaskDialog(restoreScroll = null) {
    const dialog = ensureTaskDialog();
    if (!selectedMemberId) return;
    applyResets();
    const role = ensureRoleState(selectedMemberId, selectedRoleIndex);
    const daily = progressFor(role, DAILY_TASKS);
    const weekly = progressFor(role, WEEKLY_TASKS);
    const materials = remainingMaterials(role);
    const content = dialog.querySelector('.mabi-task-dialog-content');
    const oldScroll = restoreScroll ?? content.scrollTop;

    $('#mabiTaskDialogTitle').textContent = `${selectedRoleLabel.title}｜工作日誌`;
    $('#mabiTaskDialogSub').textContent = selectedRoleLabel.subtitle ? `角色：${selectedRoleLabel.subtitle}` : '角色工作進度';
    $('#mabiTaskTracker').innerHTML = `<div class="mabi-task-title-row"><div><h3>每日／每週工作</h3><p>每日 06:00 重置；每週一 06:00 重置（台灣時間）。</p></div><div class="mabi-task-total"><span>目前完成</span><strong>${daily.done+weekly.done} / ${daily.total+weekly.total}</strong></div></div><div class="mabi-task-summary-grid"><div><span>今日</span><strong>${daily.done} / ${daily.total}</strong><small>${daily.pct}% 完成</small></div><div><span>本週</span><strong>${weekly.done} / ${weekly.total}</strong><small>${weekly.pct}% 完成</small></div></div><div class="mabi-material-box"><div><span>尚需準備材料</span><small>只統計這個角色尚未完成的工作</small></div><div class="mabi-material-list">${materials.length?materials.map(item=>`<span>${escapeHtml(item.name)} <b>×${item.qty}</b></span>`).join(''):'<span class="done">目前沒有待準備材料 ✓</span>'}</div></div><div class="mabi-task-columns">${sectionMarkup('每日工作',DAILY_TASKS,role,daily,'每天 06:00 清空')}${sectionMarkup('每週工作',WEEKLY_TASKS,role,weekly,'每週一 06:00 清空')}</div><p class="mabi-task-storage-note">${storageAvailable?'完成紀錄會保存在目前這台裝置的瀏覽器中。':'瀏覽器目前無法永久儲存，這次勾選只會暫時保留。'}</p>`;

    content.scrollTop = oldScroll;
    $('#mabiTaskTracker').querySelectorAll('[data-task-id]').forEach(input => {
      input.addEventListener('change', () => {
        const scrollTop = content.scrollTop;
        const task = TASKS.find(item => item.id === input.dataset.taskId);
        if (!task) return;
        setTaskDone(selectedMemberId, selectedRoleIndex, task, input.checked);
        renderTaskDialog(scrollTop);
        refreshRoleLaunchers();
      });
    });
  }

  function openRoleTasks(index) {
    applyResets();
    selectedRoleIndex = Math.max(0, Math.min(5, Number(index)||0));
    selectedMemberId = memberKey();
    selectedRoleLabel = roleLabels()[selectedRoleIndex] || {title:`角色${selectedRoleIndex+1}`,subtitle:''};
    const dialog = ensureTaskDialog();
    renderTaskDialog(0);
    if (!dialog.open) dialog.showModal();
  }

  function refreshRoleLaunchers() {
    const roles = $('#modalRoles');
    if (!roles) return;
    const rows = [...roles.querySelectorAll('.role-row')];
    const id = memberKey();
    rows.forEach((row,index) => {
      row.classList.add('mabi-task-launch');
      row.dataset.taskRoleIndex = String(index);
      row.tabIndex = 0;
      row.setAttribute('role','button');
      const role = ensureRoleState(id,index);
      const daily = progressFor(role,DAILY_TASKS);
      const weekly = progressFor(role,WEEKLY_TASKS);
      let hint = row.querySelector('.mabi-role-task-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'mabi-role-task-hint';
        row.appendChild(hint);
      }
      hint.innerHTML = `<span>查看工作日誌</span><b>日 ${daily.done}/${daily.total} · 週 ${weekly.done}/${weekly.total}</b><i>→</i>`;
    });
  }

  function initRoleInteraction() {
    const roles = $('#modalRoles');
    const memberDialog = $('#memberDialog');
    if (!roles || !memberDialog) return;

    roles.addEventListener('click', event => {
      const row = event.target.closest('.role-row[data-task-role-index]');
      if (row) openRoleTasks(row.dataset.taskRoleIndex);
    });
    roles.addEventListener('keydown', event => {
      const row = event.target.closest('.role-row[data-task-role-index]');
      if (!row || !['Enter',' '].includes(event.key)) return;
      event.preventDefault();
      openRoleTasks(row.dataset.taskRoleIndex);
    });

    const observer = new MutationObserver(() => {
      if (memberDialog.open) queueMicrotask(refreshRoleLaunchers);
    });
    observer.observe(memberDialog,{attributes:true,attributeFilter:['open']});
    observer.observe(roles,{childList:true,subtree:true});
    memberDialog.addEventListener('close', () => { if ($('#mabiTaskDialog')?.open) $('#mabiTaskDialog').close(); });
  }

  applyResets();
  ensureTaskDialog();
  initRoleInteraction();
  scheduleResetCheck();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (applyResets()) {
      refreshRoleLaunchers();
      if ($('#mabiTaskDialog')?.open) renderTaskDialog();
    }
  });
})();
