'use strict';

/* 全局错误捕获：写入 document.title，便于桌面端诊断（错误会同步到窗口标题） */
window.addEventListener('error', (e) => { document.title = 'JS-ERR: ' + e.message; });
window.addEventListener('unhandledrejection', (e) => {
  const m = e.reason && e.reason.message ? e.reason.message : String(e.reason);
  document.title = 'REJ-ERR: ' + m;
});

/* ============================================================
   薪跳 · 桌面小组件
   业务逻辑对应《需求文档.md》第 4 章（业务规则与核心逻辑）
   ============================================================ */

/* ---------- 常量 ---------- */
const LS_KEY = 'xintiao_state_v1';          // localStorage 键（4.7）
const DAY = 86400000;
const TICK_MS = 250;                        // 逐秒跳动：每 250ms 重算一次（4.2）
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/* 4 种卡通头像（内联 SVG：猫 / 狐狸 / 熊猫 / 小鸡） */
const AVATARS = {
  cat: {
    name: '猫',
    svg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M30 34L18 8L46 26Z" fill="#F2B98C"/>
      <path d="M66 34L78 8L50 26Z" fill="#F2B98C"/>
      <path d="M32 29L25 16L42 25Z" fill="#F8D3E0"/>
      <path d="M64 29L71 16L54 25Z" fill="#F8D3E0"/>
      <circle cx="48" cy="52" r="31" fill="#F8E3C2"/>
      <circle cx="48" cy="52" r="31" fill="none" stroke="#E8CFA6" stroke-width="2"/>
      <path d="M34 46Q39 41 44 46" stroke="#45404D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M52 46Q57 41 62 46" stroke="#45404D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="59" r="4.5" fill="#F5A9B8" opacity="0.75"/>
      <circle cx="63" cy="59" r="4.5" fill="#F5A9B8" opacity="0.75"/>
      <path d="M28 53L16 50" stroke="#D9B98A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M28 58L16 61" stroke="#D9B98A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M68 53L80 50" stroke="#D9B98A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M68 58L80 61" stroke="#D9B98A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M46 56.5v2.5" stroke="#45404D" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M40 62Q48 68 56 62" stroke="#45404D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  fox: {
    name: '狐狸',
    svg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24 38L14 8L42 24Z" fill="#F08C4A"/>
      <path d="M72 38L82 8L54 24Z" fill="#F08C4A"/>
      <path d="M27 31L22 17L37 24Z" fill="#FBE3C8"/>
      <path d="M69 31L74 17L59 24Z" fill="#FBE3C8"/>
      <path d="M48 14Q70 16 70 42Q70 70 48 80Q26 70 26 42Q26 16 48 14Z" fill="#F08C4A"/>
      <ellipse cx="48" cy="60" rx="17" ry="13" fill="#FBEBD6"/>
      <path d="M34 44Q38 39 42 44" stroke="#45404D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M54 44Q58 39 62 44" stroke="#45404D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="48" cy="57" r="3.5" fill="#45404D"/>
      <path d="M44 64Q48 68 52 64" stroke="#E5484D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="58" r="4.5" fill="#F5A9B8" opacity="0.7"/>
      <circle cx="63" cy="58" r="4.5" fill="#F5A9B8" opacity="0.7"/>
    </svg>`,
  },
  panda: {
    name: '熊猫',
    svg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="25" cy="28" r="13" fill="#3E3B45"/>
      <circle cx="71" cy="28" r="13" fill="#3E3B45"/>
      <circle cx="48" cy="52" r="32" fill="#FFFFFF"/>
      <circle cx="48" cy="52" r="32" fill="none" stroke="#EFE2D9" stroke-width="2.5"/>
      <ellipse cx="36" cy="52" rx="11" ry="13.5" fill="#3E3B45"/>
      <ellipse cx="60" cy="52" rx="11" ry="13.5" fill="#3E3B45"/>
      <circle cx="36" cy="52" r="4.2" fill="#fff"/>
      <circle cx="60" cy="52" r="4.2" fill="#fff"/>
      <circle cx="36" cy="52" r="2" fill="#3E3B45"/>
      <circle cx="60" cy="52" r="2" fill="#3E3B45"/>
      <ellipse cx="48" cy="60" rx="4" ry="3" fill="#3E3B45"/>
      <path d="M44 65Q48 69 52 65" stroke="#3E3B45" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="29" cy="64" r="4" fill="#F5A9B8" opacity="0.6"/>
      <circle cx="67" cy="64" r="4" fill="#F5A9B8" opacity="0.6"/>
    </svg>`,
  },
  chick: {
    name: '小鸡',
    svg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="48" cy="54" r="31" fill="#FCD55F"/>
      <circle cx="48" cy="54" r="31" fill="none" stroke="#EBBE38" stroke-width="2.5"/>
      <path d="M48 13Q56 20 48 26Q40 20 48 13Z" fill="#E5484D"/>
      <circle cx="37" cy="50" r="5" fill="#45404D"/>
      <circle cx="59" cy="50" r="5" fill="#45404D"/>
      <circle cx="39" cy="48" r="1.8" fill="#fff"/>
      <circle cx="61" cy="48" r="1.8" fill="#fff"/>
      <path d="M42 60L54 60L48 68Z" fill="#F28C4B"/>
      <circle cx="29" cy="62" r="4" fill="#F5A9B8" opacity="0.7"/>
      <circle cx="67" cy="62" r="4" fill="#F5A9B8" opacity="0.7"/>
    </svg>`,
  },
};

/* 今日状态（3.2.4） */
const STATUSES = [
  { id: 'energy', icon: '⚡', label: '元气满满' },
  { id: 'fish',   icon: '🐟', label: '摸鱼中' },
  { id: 'bus',    icon: '🚌', label: '想下班' },
  { id: 'lie',    icon: '🛋', label: '已躺平' },
  { id: 'coffee', icon: '☕', label: '咖啡续命' },
];

/* 头部随机语录池（设置中可选随机推送） */
const DEFAULT_MOTTO = '加油，今天的你也很棒 ✨';
const RANDOM_MOTTOS = [
  '今天也是元气满满的一天 ✨',
  '摸鱼要摸出仪式感 🐟',
  '钱少事多，开心就好 😌',
  '工资到账前，先加油打气 ⚡',
  '再坚持一下，就快下班啦 🚌',
  '咖啡续命，快乐加倍 ☕',
  '认真搬砖，快乐数钱 🧱',
  '打工人的浪漫：准时下班 🌇',
  '今天不加班，就是赚到 🎉',
  '努力赚钱，梦想不远 💪',
  '没有一顿饭解决不了的烦心事 🍜',
  '稳住，我们能赢 🏆',
];

/* 法定节假日（4.6）
   2026 年按《国务院办公厅关于 2026 年部分节假日安排的通知》（国办发明电〔2025〕7 号）；
   2027 年官方调休方案尚未发布，按法定/农历日期预置（春节自除夕起）。
   start 为该节假日放假的自然日首日。 */
const HOLIDAYS_2026_2027 = [
  { name: '元旦',   start: '2026-01-01' },
  { name: '春节',   start: '2026-02-15' },
  { name: '清明',   start: '2026-04-04' },
  { name: '劳动节', start: '2026-05-01' },
  { name: '端午',   start: '2026-06-19' },
  { name: '中秋',   start: '2026-09-25' },
  { name: '国庆',   start: '2026-10-01' },
  { name: '元旦',   start: '2027-01-01' },
  { name: '春节',   start: '2027-02-05' },
  { name: '清明',   start: '2027-04-05' },
  { name: '劳动节', start: '2027-05-01' },
  { name: '端午',   start: '2027-06-09' },
  { name: '中秋',   start: '2027-09-15' },
  { name: '国庆',   start: '2027-10-01' },
];

/* 默认状态（4.7 持久化字段） */
const DEFAULT_STATE = {
  income: 300,
  workStart: '09:00',
  workEnd: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:30',
  avatar: 'cat',
  showHoliday: true,
  status: null,          // 今日状态 id，未选为 null
  motto: { random: true, text: '' },   // 头部语录：random=随机推送，text=固定语录
  tasks: [],             // { id, text, done }
  pos: null,             // { x, y } 组件位置
  collapsed: true,       // true = 收起为胶囊
  remind: { work: '', off: '' },   // 上下班提醒最后一次触发的日期
};

/* ---------- 状态 ---------- */
let state = loadState();

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const widget = $('widget');
const pill = $('pill');
const panel = $('panel');
const pillAvatar = $('pillAvatar');
const pillStatus = $('pillStatus');
const panelAvatar = $('panelAvatar');
const statusBtn = $('statusBtn');
const statusPop = $('statusPop');
const dateText = $('dateText');
const mottoText = $('mottoText');
const settingsBtn = $('settingsBtn');
const collapseBtn = $('collapseBtn');
const panelMoney = $('panelMoney');
const pillMoney = $('pillMoney');
const progressFill = $('progressFill');
const percentText = $('percentText');
const hintText = $('hintText');
const holidayCard = $('holidayCard');
const holidayText = $('holidayText');
const todoList = $('todoList');
const doneList = $('doneList');
const todoAdd = $('todoAdd');
const doneAdd = $('doneAdd');
const toast = $('toast');
const settingsOverlay = $('settingsOverlay');
const incomeInput = $('incomeInput');
const workStartInput = $('workStartInput');
const workEndInput = $('workEndInput');
const lunchStartInput = $('lunchStartInput');
const lunchEndInput = $('lunchEndInput');
const holidaySwitch = $('holidaySwitch');
const mottoInput = $('mottoInput');
const mottoRandomSwitch = $('mottoRandomSwitch');
const dialogError = $('dialogError');
const settingsCancel = $('settingsCancel');
const settingsSave = $('settingsSave');
const avatarGrid = $('avatarGrid');
const autostartSection = $('autostartSection');
const autostartSwitch = $('autostartSwitch');

/* ---------- 桌面组件模式（Tauri 宿主） ---------- */
const IS_TAURI = typeof window.__TAURI__ !== 'undefined' && !!window.__TAURI__.window;
const desktopWin = IS_TAURI ? window.__TAURI__.window.getCurrentWindow() : null;
const DESKTOP_POS_KEY = 'xintiao_desktop_pos_v1';
document.body.classList.toggle('tauri-mode', IS_TAURI);

/* ---------- 工具函数 ---------- */
const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/* ---------- 持久化（4.7） ---------- */
function loadState() {
  const base = { ...DEFAULT_STATE, remind: { ...DEFAULT_STATE.remind } };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    const merged = {
      ...base,
      ...s,
      tasks: Array.isArray(s.tasks) ? s.tasks : [],
      pos: s.pos && typeof s.pos.x === 'number' && typeof s.pos.y === 'number' ? s.pos : null,
      remind: { ...base.remind, ...(s.remind || {}) },
    };
    if (!AVATARS[merged.avatar]) merged.avatar = base.avatar;
    if (merged.status && !STATUSES.some((x) => x.id === merged.status)) merged.status = null;
    return merged;
  } catch {
    return base;
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* 存储不可用时静默降级 */ }
}

/* ---------- 金额翻页（4.2 逐秒跳动） ---------- */
const moneyStr = (v) => '¥' + Number(v).toFixed(2);

/* 每个数字位一个独立 roller；strip 内为 0-9 再加一个兜底 0（9→0 进位时向下滚动到它） */
function buildMoney(el, v = 0) {
  const cells = [];
  el.textContent = '';
  for (const ch of moneyStr(v)) {
    if (/\d/.test(ch)) {
      const roller = document.createElement('span');
      roller.className = 'roller';
      const strip = document.createElement('span');
      strip.className = 'roller__strip';
      for (let d = 0; d <= 9; d++) {
        const i = document.createElement('i');
        i.textContent = d;
        strip.appendChild(i);
      }
      const sentinel = document.createElement('i');
      sentinel.textContent = '0';
      strip.appendChild(sentinel);
      roller.appendChild(strip);
      el.appendChild(roller);
      strip.style.transition = 'none';
      strip.style.transform = `translateY(${-ch}em)`;
      strip.style.transition = '';
      cells.push({ roller, strip, d: +ch, snapTimer: null });
    } else {
      const s = document.createElement('span');
      s.className = 'money__static';
      s.textContent = ch;
      el.appendChild(s);
      cells.push({ static: ch });
    }
  }
  return cells;
}

function snapStrip(c) {
  c.strip.style.transition = 'none';
  c.strip.style.transform = 'translateY(0em)';
  void c.strip.offsetHeight;
  c.strip.style.transition = '';
}

/* 仅滚动发生变化的位，未变动位保持静止（4.2） */
function setDigit(c, d) {
  if (c.d === d) return;
  if (c.snapTimer) {
    clearTimeout(c.snapTimer);
    c.snapTimer = null;
    snapStrip(c);
  }
  if (c.d === 9 && d === 0) {
    // 进位：9 → 0 向下滚到兜底字符，动画结束后瞬间回卷（视觉上仍是 0）
    c.strip.style.transform = `translateY(${-10}em)`;
    c.snapTimer = setTimeout(() => snapStrip(c), 400);
  } else {
    c.strip.style.transform = `translateY(${-d}em)`;
  }
  c.d = d;
}

function updateMoney(el, cells, v) {
  const s = moneyStr(v);
  if (s.length !== cells.length) return buildMoney(el, v);   // 位数结构变化（如跨整元）→ 重建
  for (let i = 0; i < s.length; i++) {
    const c = cells[i];
    if (c.static !== undefined) continue;
    if (c.d !== +s[i]) setDigit(c, +s[i]);
  }
  return cells;
}

let pillMoneyCells = buildMoney(pillMoney, 0);
let panelMoneyCells = buildMoney(panelMoney, 0);

/* ---------- 薪资计算（4.1 精确到秒） ---------- */
function calcSalary() {
  const now = new Date();
  const start = toMin(state.workStart);
  const end = toMin(state.workEnd);
  const ls = toMin(state.lunchStart);
  const le = toMin(state.lunchEnd);
  const elapsedMin =
    (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() - start * 60) / 60;
  const totalMin = (end - start) - (le - ls);

  let validMin, hint;
  if (elapsedMin < 0) {
    validMin = 0;                                     hint = '未到上班时间';
  } else if (elapsedMin < ls - start) {
    validMin = elapsedMin;                             hint = '加油，今天的你最棒';
  } else if (elapsedMin <= le - start) {
    validMin = ls - start;                             hint = '午休中，充个电吧';
  } else if (elapsedMin <= end - start) {
    validMin = elapsedMin - (le - ls);                 hint = '专注冲鸭';
  } else {
    validMin = totalMin;                               hint = '今天的你已满勤，明天继续';
  }

  const percent = totalMin > 0 ? Math.min(100, Math.max(0, (validMin / totalMin) * 100)) : 0;
  return { percent, earned: state.income * (percent / 100), hint };
}

/* ---------- 节假日倒计时（3.2.6 / 4.6） ---------- */
function holidayInfo() {
  const nowT = startOfDay(new Date());
  for (const h of HOLIDAYS_2026_2027) {
    const s = new Date(h.start + 'T00:00:00').getTime();
    if (nowT >= s && nowT <= s + 2 * DAY) return `正处于${h.name}假期中 🎉`;
    if (s > nowT) return `距离${h.name}还有 ${Math.ceil((s - nowT) / DAY)} 天`;
  }
  return '暂无节假日安排';
}

let lastHolidayText = null;
function renderHoliday() {
  const show = state.showHoliday;
  holidayCard.hidden = !show;                    // 关闭后整块不渲染、不占位（3.2.6）
  const text = show ? holidayInfo() : '';
  if (text !== lastHolidayText) {
    holidayText.textContent = text;
    lastHolidayText = text;
  }
}

/* ---------- 日期 ---------- */
function updateDate() {
  const d = new Date();
  const s = `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;
  if (dateText.textContent !== s) dateText.textContent = s;
}

/* ---------- 头部语录（随机推送 / 固定语录） ---------- */
function renderMotto() {
  const t = state.motto.random
    ? RANDOM_MOTTOS[Math.floor(Math.random() * RANDOM_MOTTOS.length)]
    : (state.motto.text || DEFAULT_MOTTO);
  if (mottoText.textContent !== t) mottoText.textContent = t;
}

/* ---------- 头像与今日状态（3.2.3 / 3.2.4） ---------- */
function renderAvatars() {
  pillAvatar.innerHTML = AVATARS[state.avatar].svg;
  panelAvatar.innerHTML = AVATARS[state.avatar].svg;
  avatarGrid.querySelectorAll('.avatar-grid__item').forEach((btn) => {
    btn.classList.toggle('avatar-grid__item--active', btn.dataset.avatar === state.avatar);
  });
}

function buildAvatarGrid() {
  for (const [id, a] of Object.entries(AVATARS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'avatar-grid__item';
    btn.dataset.avatar = id;
    btn.innerHTML = `${a.svg}<span>${a.name}</span>`;
    btn.addEventListener('click', () => {
      state.avatar = id;                           // 4 种头像即时切换（验收 8）
      saveState();
      renderAvatars();
    });
    avatarGrid.appendChild(btn);
  }
}

function renderStatus() {
  const s = STATUSES.find((x) => x.id === state.status);
  statusBtn.textContent = s ? s.icon : '+';        // 未选 +，已选表情（3.2.4）
  pillStatus.textContent = s ? s.icon : '+';       // 胶囊徽标同步：收起后仍可看到状态
  statusPop.querySelectorAll('.status-pop__item').forEach((btn) => {
    btn.classList.toggle('status-pop__item--active', btn.dataset.status === state.status);
  });
}

function buildStatusPop() {
  for (const s of STATUSES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'status-pop__item';
    btn.dataset.status = s.id;
    btn.innerHTML = `<span class="status-pop__icon">${s.icon}</span><span class="status-pop__label">${s.label}</span>`;
    statusPop.appendChild(btn);
  }
}

function setStatusPop(open) {
  statusPop.hidden = !open;
  statusBtn.classList.toggle('avatar__status--open', open);
}

/* ---------- 任务（3.2.7 / 3.2.8 / 4.4 / 4.5） ---------- */
function taskItem(t) {
  const li = document.createElement('li');
  li.className = 'task' + (t.done ? ' task--done' : '');
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'task__check';
  check.setAttribute('aria-label', t.done ? '标记为未完成' : '标记为完成');
  check.textContent = '✓';
  const text = document.createElement('span');
  text.className = 'task__text';
  text.textContent = t.text;
  li.append(check, text);
  const del = document.createElement('button');   // 删除：TODO / DONE 一致，hover 显示（4.5）
  del.type = 'button';
  del.className = 'task__del';
  del.setAttribute('aria-label', '删除任务');
  del.textContent = '×';
  li.appendChild(del);
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    state.tasks = state.tasks.filter((x) => x.id !== t.id);
    saveState();
    renderTasks();
  });
  li.addEventListener('click', () => {             // 勾选圆或任务区点击 → toggle（4.5）
    t.done = !t.done;
    saveState();
    renderTasks();
  });
  return li;
}

const emptyItem = (text) => {
  const li = document.createElement('li');
  li.className = 'task task--empty';
  li.textContent = text;
  return li;
};

function renderTasks() {
  const todo = state.tasks.filter((t) => !t.done);
  const done = state.tasks.filter((t) => t.done);
  todoList.replaceChildren(
    ...(todo.length ? todo.map(taskItem) : [emptyItem('暂无待办，点击 + 添加')])
  );
  doneList.replaceChildren(
    ...(done.length ? done.map(taskItem) : [emptyItem('暂无已完成，点击 + 添加')])
  );
  if (editing) editing.list.appendChild(editing.li);   // 渲染后重新挂载编辑行
}

/* 行内编辑器（4.4）：回车保存 / Esc 取消 / 失焦提交或取消 */
let editing = null;

function openEditor(listEl, isDone) {
  if (editing) {                                      // 已存在编辑行 → 焦点移回（4.4）
    editing.input.focus();
    return;
  }
  const li = document.createElement('li');
  li.className = 'task task--editor';
  const input = document.createElement('input');
  input.type = 'text';
  li.appendChild(input);
  listEl.appendChild(li);
  const ed = { list: listEl, li, input, settled: false };   // 闭包持有自身编辑器
  editing = ed;
  const finish = (commit) => {
    if (ed.settled) return;                  // Enter/Esc 后 blur 二次触发 → 直接返回
    const text = commit ? input.value.trim() : '';
    ed.settled = true;
    if (editing === ed) editing = null;
    li.remove();
    if (text) {
      state.tasks.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 6), text, done: isDone });
      saveState();
      renderTasks();
    }
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); finish(false); return; }  // Esc 任何时刻都取消（4.4）
    if (e.isComposing) return;          // 输入法组合中回车不保存（避免误存候选字）
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }            // 回车 → 提交保存（4.4）
  });
  input.addEventListener('blur', () => finish(input.value.trim() !== '')); // 失焦：有内容保存、空取消
  input.focus();
}

/* ---------- 上下班提醒（3.2.9） ---------- */
function checkReminders() {
  const now = new Date();
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const day = todayStr();
  if (hhmm === state.workStart && state.remind.work !== day) {
    state.remind.work = day;                         // 同一时刻整天最多一次（4.7）
    saveState();
    showToast('上班时间到，今天也加油 ☀️');
  }
  if (hhmm === state.workEnd && state.remind.off !== day) {
    state.remind.off = day;
    saveState();
    showToast('下班时间到，记得打卡 🌙');
  }
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.remove('toast--out');
  void toast.offsetWidth;                            // 重启 chipPop 动画
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('toast--out');
    setTimeout(() => { toast.hidden = true; }, 320);
  }, 3200);
}

/* ---------- 主循环（4.2：tick 每 250ms 一次） ---------- */
function tick() {
  const { percent, earned, hint } = calcSalary();
  const v = earned.toFixed(2);
  pillMoneyCells = updateMoney(pillMoney, pillMoneyCells, v);     // 收起态与展开态共享数据源
  panelMoneyCells = updateMoney(panelMoney, panelMoneyCells, v);
  percentText.textContent = percent.toFixed(1) + '%';
  progressFill.style.width = percent + '%';
  hintText.textContent = hint;
  updateDate();
  renderHoliday();
  checkReminders();
}

/* ---------- 拖拽（3.2.2 / 验收 7） ---------- */
function clampPos(x, y) {
  const r = widget.getBoundingClientRect();
  const m = 10;
  x = Math.max(m, Math.min(x, window.innerWidth - r.width - m));
  y = Math.max(m, Math.min(y, window.innerHeight - r.height - m));
  return { x, y };
}

function applyPos(p) {
  state.pos = p;
  widget.style.left = p.x + 'px';
  widget.style.top = p.y + 'px';
}

let drag = null;

function dragSource(e) {
  if (e.target.closest('.pill')) return 'pill';       // 胶囊任意处可拖
  if (e.target.closest('.panel') &&
      !e.target.closest('button, input, .status-pop, .task-list')) return 'panel';
  return null;                                        // 任务列表区域留给滚动，不触发拖拽
}

widget.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const source = dragSource(e);
  if (!source) return;
  drag = {
    id: e.pointerId,
    source,
    sx: e.clientX,
    sy: e.clientY,
    ox: state.pos ? state.pos.x : window.innerWidth - 348 - 24,
    oy: state.pos ? state.pos.y : Math.max(24, Math.round(window.innerHeight * 0.12)),
    moved: false,
  };
  widget.setPointerCapture(e.pointerId);
});

widget.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx;
  const dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) > 6) {
    drag.moved = true;
    widget.classList.add('is-drag');
    if (IS_TAURI) {
      desktopWin.startDragging().catch(() => {});  // 桌面模式：整体拖动窗口
      return;                                       // 之后交给系统拖拽循环
    }
  }
  if (drag.moved && !IS_TAURI) applyPos(clampPos(drag.ox + dx, drag.oy + dy));
});

widget.addEventListener('pointerup', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const { source, moved } = drag;
  drag = null;
  widget.classList.remove('is-drag');
  if (moved) {
    saveState();                                     // 拖拽结束持久化位置
  } else if (source === 'pill') {
    setCollapsed(false);                             // 胶囊整体点击展开
  }
});

widget.addEventListener('pointercancel', (e) => {
  if (drag && e.pointerId === drag.id) drag = null;
  widget.classList.remove('is-drag');
});

/* ---------- 桌面组件模式：窗口位置 / 尺寸 ---------- */
let desktopPosTimer = null;

/* 内容尺寸变化（收起/展开、任务增删、节假日开关）→ 窗口自动贴合 */
async function syncWindowSize() {
  if (!IS_TAURI) return;
  try {
    const r = widget.getBoundingClientRect();
    const w = Math.ceil(r.width), h = Math.ceil(r.height);
    const s = await desktopWin.outerSize();
    const scale = window.devicePixelRatio || 1;
    const sw = Math.round(s.width / scale), sh = Math.round(s.height / scale);
    if (Math.abs(sw - w) > 1 || Math.abs(sh - h) > 1) {
      const p = await desktopWin.outerPosition();
      await desktopWin.setSize(new window.__TAURI__.window.LogicalSize(w, h));
      const q = await desktopWin.outerPosition();
      if (q.x !== p.x || q.y !== p.y) {          // resize 偶发漂移 → 锚定左上角
        await desktopWin.setPosition(new window.__TAURI__.window.PhysicalPosition(p.x, p.y));
      }
    }
  } catch (err) { console.warn('syncWindowSize failed:', err); }
}

async function restoreDesktopPos() {
  try {
    const raw = localStorage.getItem(DESKTOP_POS_KEY);
    if (!raw) return;
    const { x, y } = JSON.parse(raw);
    if (typeof x !== 'number' || typeof y !== 'number') return;
    const monitors = await desktopWin.availableMonitors();
    const inside = monitors.some((m) =>
      x >= m.position.x && x < m.position.x + m.size.width &&
      y >= m.position.y && y < m.position.y + m.size.height
    );
    if (inside) await desktopWin.setPosition(new window.__TAURI__.window.PhysicalPosition(x, y));
  } catch { /* 显示器布局变化等异常 → 回退默认位置 */ }
}

function initDesktop() {
  new ResizeObserver(syncWindowSize).observe(widget);
  desktopWin.onMoved(() => {                        // 拖动结束 300ms 后落盘窗口位置
    clearTimeout(desktopPosTimer);
    desktopPosTimer = setTimeout(async () => {
      try {
        const p = await desktopWin.outerPosition();
        localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify({ x: p.x, y: p.y }));
      } catch { /* 忽略 */ }
    }, 300);
  });
  restoreDesktopPos()
    .then(() => syncWindowSize())
    .then(() => desktopWin.show())
    .then(() => { document.title = '薪跳'; })     // 初始化成功，恢复正式标题
    .catch((err) => { document.title = 'INIT-ERR: ' + (err && err.message ? err.message : String(err)); });
}

/* ---------- 收起 / 展开 ---------- */
function applyCollapsed() {
  pill.hidden = !state.collapsed;
  panel.hidden = state.collapsed;
}

function setCollapsed(c) {
  state.collapsed = c;
  saveState();
  applyCollapsed();
  if (state.pos) applyPos(clampPos(state.pos.x, state.pos.y));   // 形态切换后重新贴边
}

/* ---------- 设置弹窗（3.2.10 / 第 5 章校验） ---------- */
function openSettings() {
  incomeInput.value = state.income;
  workStartInput.value = state.workStart;
  workEndInput.value = state.workEnd;
  lunchStartInput.value = state.lunchStart;
  lunchEndInput.value = state.lunchEnd;
  holidaySwitch.checked = state.showHoliday;
  mottoInput.value = state.motto.text;
  mottoRandomSwitch.checked = state.motto.random;
  dialogError.hidden = true;
  settingsOverlay.hidden = false;
}

function closeSettings() {
  settingsOverlay.hidden = true;
}

const showDialogError = (msg) => {
  dialogError.textContent = msg;
  dialogError.hidden = false;
};

/* ---------- 事件绑定 ---------- */
statusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setStatusPop(statusPop.hidden);
});

statusPop.addEventListener('click', (e) => {
  const item = e.target.closest('.status-pop__item');
  if (!item) return;
  state.status = item.dataset.status === state.status ? null : item.dataset.status;
  saveState();
  renderStatus();
  setStatusPop(false);
});

/* 浮层：点其它区域自动收起（3.2.3） */
document.addEventListener('pointerdown', (e) => {
  if (!statusPop.hidden && !statusPop.contains(e.target) && !statusBtn.contains(e.target)) {
    setStatusPop(false);
  }
});

/* Esc：收起状态浮层 / 关闭设置弹窗 */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  setStatusPop(false);
  if (!settingsOverlay.hidden) closeSettings();
});

settingsBtn.addEventListener('click', openSettings);
settingsCancel.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettings();
});
collapseBtn.addEventListener('click', () => setCollapsed(true));
todoAdd.addEventListener('click', () => openEditor(todoList, false));
doneAdd.addEventListener('click', () => openEditor(doneList, true));

settingsSave.addEventListener('click', () => {
  const workStart = workStartInput.value;
  const workEnd = workEndInput.value;
  const lunchStart = lunchStartInput.value;
  const lunchEnd = lunchEndInput.value;
  const income = Number(incomeInput.value);
  if (!workStart || !workEnd || !lunchStart || !lunchEnd) {
    return showDialogError('请填写完整的时间');
  }
  if (toMin(workEnd) <= toMin(workStart)) return showDialogError('下班时间需晚于上班时间');
  if (toMin(lunchEnd) <= toMin(lunchStart)) return showDialogError('午休结束需晚于午休开始');
  if (toMin(lunchStart) < toMin(workStart) || toMin(lunchEnd) > toMin(workEnd)) {
    return showDialogError('午休时段需在上下班时间内');
  }
  if (!isFinite(income) || income <= 0) return showDialogError('请输入大于 0 的数字');
  const mottoTextVal = mottoInput.value.trim();
  if (!mottoRandomSwitch.checked && !mottoTextVal) {
    return showDialogError('固定语录不能为空，或打开随机语录');
  }
  state.income = income;
  state.workStart = workStart;
  state.workEnd = workEnd;
  state.lunchStart = lunchStart;
  state.lunchEnd = lunchEnd;
  state.showHoliday = holidaySwitch.checked;
  state.motto = { random: mottoRandomSwitch.checked, text: mottoTextVal };
  saveState();
  closeSettings();
  tick();                                            // 保存后立即重算并刷新面板（3.2.10）
  renderMotto();
});

/* 开机自启（仅桌面组件模式） */
if (IS_TAURI) {
  autostartSection.hidden = false;
  window.__TAURI__.core.invoke('get_autostart')
    .then((v) => { autostartSwitch.checked = !!v; })
    .catch(() => {});
  autostartSwitch.addEventListener('change', () => {
    window.__TAURI__.core.invoke('set_autostart_cmd', { enabled: autostartSwitch.checked })
      .catch(() => { autostartSwitch.checked = !autostartSwitch.checked; });
  });
}

/* 窗口尺寸变化时把组件拉回可视区 */
window.addEventListener('resize', () => {
  if (state.pos) applyPos(clampPos(state.pos.x, state.pos.y));
});

/* ---------- 初始化 ---------- */
function initPos() {
  const dx = window.innerWidth - 348 - 24;           // 默认靠右悬浮
  const dy = Math.max(24, Math.round(window.innerHeight * 0.12));
  applyPos(clampPos(state.pos ? state.pos.x : dx, state.pos ? state.pos.y : dy));
}

function init() {
  buildAvatarGrid();
  buildStatusPop();
  renderAvatars();
  renderStatus();
  renderMotto();
  renderTasks();
  if (IS_TAURI) {
    initDesktop();                                   // 恢复窗口位置 + 尺寸贴合 + 显示
  } else {
    initPos();
  }
  applyCollapsed();
  setCollapsed(state.collapsed);
  tick();
  setInterval(tick, TICK_MS);
}

init();
