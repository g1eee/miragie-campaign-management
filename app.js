/* ============================================================
   Campaign Tracker by GIE — monday.com style work management
   Vanilla JS + localStorage. No build step, no dependencies.
   ============================================================ */
"use strict";

/* ---------------- Constants ---------------- */

const LS_KEY = "gie_campaign_tracker_v1";

const STATUSES = [
  { id: "working", label: "Working on it", color: "#fdab3d" },
  { id: "done",    label: "Done",          color: "#00c875" },
  { id: "stuck",   label: "Stuck",         color: "#e2445c" },
  { id: "none",    label: "Not Started",   color: "#c4c4c4" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical",  color: "#333333" },
  { id: "high",     label: "High",      color: "#401694" },
  { id: "medium",   label: "Medium",    color: "#5559df" },
  { id: "low",      label: "Low",       color: "#579bfc" },
  { id: "none",     label: "",          color: "#c4c4c4" },
];

const GROUP_COLORS = ["#579bfc", "#00c875", "#a25ddc", "#fdab3d", "#e2445c", "#ffcb00", "#0086c0", "#9d99b9"];
const AVATAR_COLORS = ["#0073ea", "#a25ddc", "#00c875", "#fdab3d", "#e2445c", "#0086c0", "#9d50dd", "#ff642e"];

const COLUMNS = [
  { id: "owner",    label: "Owner",        w: 96 },
  { id: "status",   label: "Status",       w: 140 },
  { id: "date",     label: "Due date",     w: 132 },
  { id: "priority", label: "Priority",     w: 132 },
  { id: "updated",  label: "Last updated", w: 150 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------------- Icons (inline SVG) ---------------- */

const PATHS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  personPlus: '<circle cx="10" cy="8" r="4"/><path d="M2 21c0-4 4-6 8-6s8 2 8 6M19 6v6M16 9h6"/>',
  filter: '<path d="M4 5h16l-6.5 7.5V19l-3-1.5v-5L4 5z"/>',
  sort: '<path d="M7 4v15M7 19l-3-3M7 19l3-3M17 20V5M17 5l-3 3M17 5l3 3"/>',
  eyeOff: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevRight: '<path d="M9 6l6 6-6 6"/>',
  chevLeft: '<path d="M15 6l-6 6 6 6"/>',
  dots: '<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V7a2 2 0 0 1 2-2h8"/>',
  open: '<path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M14 4h6v6M20 4l-9 9"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  kanban: '<rect x="4" y="4" width="4.5" height="14" rx="1"/><rect x="10" y="4" width="4.5" height="9" rx="1"/><rect x="16" y="4" width="4.5" height="16" rx="1"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  warning: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17.6v.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  chat: '<path d="M12 3a9 9 0 0 0-7.5 14L3 21l4.2-1.4A9 9 0 1 0 12 3z"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  pencil: '<path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z"/>',
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  collapse: '<path d="M11 6L5 12l6 6M19 6l-6 6 6 6"/>',
  expand: '<path d="M13 6l6 6-6 6M5 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14M5 12l7 7 7-7"/>',
};

function ico(name, size = 16) {
  const s = document.createElement("span");
  s.className = "ico";
  s.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || ""}</svg>`;
  return s;
}

/* ---------------- Tiny DOM helper ---------------- */

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : String(kid));
  }
  return el;
}

const q = (sel, root = document) => root.querySelector(sel);

/* ---------------- Utils ---------------- */

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso, withYear = "auto") {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const showYear = withYear === true || (withYear === "auto" && y !== new Date().getFullYear());
  return `${MONTHS[m - 1]} ${d}${showYear ? ", " + y : ""}`;
}

function fmtRange(minIso, maxIso) {
  if (!minIso) return "-";
  if (minIso === maxIso) return fmtDate(minIso);
  const [y1, m1, d1] = minIso.split("-").map(Number);
  const [y2, m2, d2] = maxIso.split("-").map(Number);
  if (y1 === y2 && m1 === m2) return `${MONTHS[m1 - 1]} ${d1} - ${d2}`;
  if (y1 === y2) return `${MONTHS[m1 - 1]} ${d1} - ${MONTHS[m2 - 1]} ${d2}`;
  return `${fmtDate(minIso, true)} - ${fmtDate(maxIso, true)}`;
}

function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - ts) / 1000;
  if (s < 90) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  const d = new Date(ts);
  return fmtDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
}

const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
const statusOf = (t) => STATUSES.find(s => s.id === t.status) || STATUSES[3];
const prioOf = (t) => PRIORITIES.find(p => p.id === t.priority) || PRIORITIES[4];

/* ---------------- State ---------------- */

let state = null;

const ui = {
  search: "",
  person: null,
  fStatus: new Set(),
  fPriority: new Set(),
  sort: null,            // {field, dir}
  sel: new Set(),
  cal: null,             // {y, m}
  panel: null,           // taskId
  editTask: null,        // taskId -> start inline name edit after render
  refocus: null,         // {sel, caret}
  sideCollapsed: false,
  sideSearch: "",
  drag: null,            // {type:'task'|'card'|'chip', taskId}
};

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { state = JSON.parse(raw); return; }
  } catch (e) { /* corrupted -> reseed */ }
  state = seed();
  save();
}

function mkTask(name, opts = {}) {
  return {
    id: uid(),
    name,
    owners: opts.owners || [],
    status: opts.status || "none",
    due: opts.due || "",
    priority: opts.priority || "none",
    desc: opts.desc || "",
    updates: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: opts.by || "u1",
  };
}

function seed() {
  const b1 = {
    id: uid(),
    name: "Campaign Tracker",
    desc: "Manage any type of campaign. Assign owners, set timelines and keep track of where your campaign stands.",
    view: "table",
    hidden: [],
    groups: [
      {
        id: uid(), name: "To-Do", color: "#579bfc", collapsed: false,
        tasks: [
          mkTask("Task 1", { owners: ["u1"], status: "working", due: addDaysISO(-1), priority: "low" }),
          mkTask("Task 2", { status: "done", due: addDaysISO(0), priority: "high" }),
          mkTask("Task 3", { status: "stuck", due: addDaysISO(1), priority: "medium" }),
        ],
      },
      { id: uid(), name: "Completed", color: "#00c875", collapsed: false, tasks: [] },
    ],
  };
  const b2 = {
    id: uid(),
    name: "Dashboard and reporting",
    desc: "Track KPIs, reports and analytics tasks for all running campaigns.",
    view: "table",
    hidden: [],
    groups: [
      {
        id: uid(), name: "This week", color: "#a25ddc", collapsed: false,
        tasks: [
          mkTask("Design KPI dashboard", { owners: ["u3"], status: "working", due: addDaysISO(2), priority: "high" }),
          mkTask("Collect campaign metrics", { owners: ["u2"], status: "done", due: addDaysISO(-2), priority: "medium" }),
          mkTask("Monthly report draft", { due: addDaysISO(5), priority: "low" }),
        ],
      },
      {
        id: uid(), name: "Backlog", color: "#0086c0", collapsed: false,
        tasks: [mkTask("Automate weekly email report", {})],
      },
    ],
  };
  return {
    theme: "light",
    user: "u1",
    people: [
      { id: "u1", name: "Gie", color: "#0073ea" },
      { id: "u2", name: "Andi Pratama", color: "#a25ddc" },
      { id: "u3", name: "Sari Dewi", color: "#00c875" },
      { id: "u4", name: "Budi Santoso", color: "#fdab3d" },
    ],
    activeBoard: b1.id,
    boards: [b1, b2],
  };
}

const getBoard = () => state.boards.find(b => b.id === state.activeBoard) || state.boards[0];
const personById = (id) => state.people.find(p => p.id === id);
const me = () => personById(state.user) || state.people[0];

function locateTask(taskId) {
  for (const b of state.boards) {
    for (const g of b.groups) {
      const idx = g.tasks.findIndex(t => t.id === taskId);
      if (idx > -1) return { board: b, group: g, idx, task: g.tasks[idx] };
    }
  }
  return null;
}

function touch(task) {
  task.updatedAt = Date.now();
  task.updatedBy = state.user;
}

/* ---------------- Dropdown manager ---------------- */

let openDd = null;

function closeDropdowns() {
  if (openDd) { openDd.el.remove(); openDd = null; }
}

function openDropdown(anchor, build, opts = {}) {
  closeDropdowns();
  const el = h("div", { class: "dropdown" });
  const close = () => closeDropdowns();
  build(el, close);
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  if (opts.minWidth) el.style.minWidth = opts.minWidth + "px";
  let x = opts.alignRight ? r.right - el.offsetWidth : r.left;
  x = Math.max(8, Math.min(x, window.innerWidth - el.offsetWidth - 8));
  let y = r.bottom + 6;
  if (y + el.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - el.offsetHeight - 6);
  el.style.left = x + "px";
  el.style.top = y + "px";
  openDd = { el, anchor, build };
}

function refreshDd() {
  if (!openDd) return;
  openDd.el.innerHTML = "";
  openDd.build(openDd.el, closeDropdowns);
}

document.addEventListener("mousedown", (e) => {
  if (openDd && !openDd.el.contains(e.target) && !(openDd.anchor.isConnected && openDd.anchor.contains(e.target))) {
    closeDropdowns();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (openDd) { closeDropdowns(); return; }
    if (ui.panel) { ui.panel = null; renderPanel(); }
  }
});

/* ---------------- Toasts ---------------- */

function toast(msg, undoFn) {
  const t = h("div", { class: "toast" }, h("span", {}, msg));
  if (undoFn) {
    t.append(h("button", { class: "toast-undo", onclick: () => { t.remove(); undoFn(); } }, "Undo"));
  }
  const x = h("button", { class: "toast-x", onclick: () => t.remove() });
  x.append(ico("x", 13));
  t.append(x);
  q("#toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 350); }, undoFn ? 8000 : 4000);
}

/* ---------------- Inline editing ---------------- */

function inlineEdit(holder, value, commit, opts = {}) {
  const input = h("input", { class: "inline-input", value, style: opts.style || "" });
  holder.replaceChildren(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (ok) => {
    if (done) return;
    done = true;
    const v = input.value.trim();
    if (ok && v) commit(v);
    else render();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    else if (e.key === "Escape") finish(false);
    e.stopPropagation();
  });
  input.addEventListener("blur", () => finish(true));
  input.addEventListener("click", (e) => e.stopPropagation());
}

/* ---------------- Mutations ---------------- */

function addTask(group, name, atTop = false) {
  const t = mkTask(name, { by: state.user });
  if (atTop) group.tasks.unshift(t); else group.tasks.push(t);
  save();
  return t;
}

function duplicateTasks(ids) {
  let n = 0;
  for (const id of ids) {
    const loc = locateTask(id);
    if (!loc) continue;
    const copy = JSON.parse(JSON.stringify(loc.task));
    copy.id = uid();
    copy.name = loc.task.name + " (copy)";
    copy.updates = copy.updates.map(u => ({ ...u, id: uid() }));
    touch(copy);
    loc.group.tasks.splice(loc.idx + 1, 0, copy);
    n++;
  }
  ui.sel.clear();
  save();
  render();
  toast(`${n} task${n > 1 ? "s" : ""} duplicated`);
}

function deleteTasks(ids) {
  const snaps = [];
  for (const id of ids) {
    const loc = locateTask(id);
    if (loc) snaps.push(loc);
  }
  // remove highest indices first per group
  [...snaps].sort((a, b) => b.idx - a.idx).forEach(s => {
    const i = s.group.tasks.indexOf(s.task);
    if (i > -1) s.group.tasks.splice(i, 1);
  });
  ui.sel.clear();
  if (snaps.some(s => s.task.id === ui.panel)) ui.panel = null;
  save();
  render();
  toast(`${snaps.length} task${snaps.length > 1 ? "s" : ""} deleted`, () => {
    snaps.sort((a, b) => a.idx - b.idx).forEach(s => {
      s.group.tasks.splice(Math.min(s.idx, s.group.tasks.length), 0, s.task);
    });
    save();
    render();
  });
}

function moveTasksToGroup(ids, group) {
  for (const id of ids) {
    const loc = locateTask(id);
    if (!loc || loc.group === group) continue;
    loc.group.tasks.splice(loc.idx, 1);
    group.tasks.push(loc.task);
    touch(loc.task);
  }
  ui.sel.clear();
  save();
  render();
}

function moveTaskTo(taskId, group, index) {
  const loc = locateTask(taskId);
  if (!loc) return;
  loc.group.tasks.splice(loc.idx, 1);
  if (loc.group === group && index > loc.idx) index--;
  index = Math.max(0, Math.min(index, group.tasks.length));
  group.tasks.splice(index, 0, loc.task);
  save();
  render();
}

function addGroup(board) {
  const used = board.groups.map(g => g.color);
  const color = GROUP_COLORS.find(c => !used.includes(c)) || GROUP_COLORS[board.groups.length % GROUP_COLORS.length];
  const g = { id: uid(), name: "New Group", color, collapsed: false, tasks: [] };
  board.groups.push(g);
  save();
  render();
}

function deleteGroup(board, group) {
  const idx = board.groups.indexOf(group);
  if (idx < 0) return;
  board.groups.splice(idx, 1);
  group.tasks.forEach(t => ui.sel.delete(t.id));
  save();
  render();
  toast(`Group "${group.name}" deleted`, () => {
    board.groups.splice(Math.min(idx, board.groups.length), 0, group);
    save();
    render();
  });
}

function addBoard() {
  const b = {
    id: uid(),
    name: "New Board",
    desc: "Click to add a description for this board.",
    view: "table",
    hidden: [],
    groups: [
      { id: uid(), name: "Group 1", color: "#579bfc", collapsed: false, tasks: [] },
    ],
  };
  state.boards.push(b);
  switchBoard(b.id);
  toast("Board created");
}

function regenIds(board) {
  board.id = uid();
  for (const g of board.groups) {
    g.id = uid();
    for (const t of g.tasks) {
      t.id = uid();
      t.updates.forEach(u => u.id = uid());
    }
  }
}

function duplicateBoard(board) {
  const copy = JSON.parse(JSON.stringify(board));
  copy.name = board.name + " (copy)";
  regenIds(copy);
  state.boards.splice(state.boards.indexOf(board) + 1, 0, copy);
  switchBoard(copy.id);
  toast("Board duplicated");
}

function deleteBoard(board) {
  if (state.boards.length <= 1) { toast("Workspace needs at least one board"); return; }
  const idx = state.boards.indexOf(board);
  state.boards.splice(idx, 1);
  if (state.activeBoard === board.id) state.activeBoard = state.boards[Math.max(0, idx - 1)].id;
  resetBoardUi();
  save();
  render();
  toast(`Board "${board.name}" deleted`, () => {
    state.boards.splice(Math.min(idx, state.boards.length), 0, board);
    state.activeBoard = board.id;
    save();
    render();
  });
}

function switchBoard(id) {
  state.activeBoard = id;
  resetBoardUi();
  save();
  render();
}

function resetBoardUi() {
  ui.sel.clear();
  ui.panel = null;
  ui.person = null;
  ui.fStatus.clear();
  ui.fPriority.clear();
  ui.sort = null;
  ui.search = "";
  ui.cal = null;
  const gs = q("#global-search");
  if (gs) gs.value = "";
}

/* ---------------- Filtering / sorting ---------------- */

function filtersActive() {
  return ui.fStatus.size + ui.fPriority.size;
}

function visibleTasks(group) {
  let ts = group.tasks.filter(t => {
    if (ui.search && !t.name.toLowerCase().includes(ui.search.toLowerCase())) return false;
    if (ui.person && !t.owners.includes(ui.person)) return false;
    if (ui.fStatus.size && !ui.fStatus.has(t.status)) return false;
    if (ui.fPriority.size && !ui.fPriority.has(t.priority)) return false;
    return true;
  });
  if (ui.sort) {
    const { field, dir } = ui.sort;
    const sgn = dir === "asc" ? 1 : -1;
    const sIdx = (t) => STATUSES.findIndex(s => s.id === t.status);
    const pIdx = (t) => PRIORITIES.findIndex(p => p.id === t.priority);
    ts = [...ts].sort((a, b) => {
      switch (field) {
        case "name": return sgn * a.name.localeCompare(b.name);
        case "status": return sgn * (sIdx(a) - sIdx(b));
        case "priority": return sgn * (pIdx(a) - pIdx(b));
        case "date": {
          const av = a.due || "9999-99-99", bv = b.due || "9999-99-99";
          return sgn * av.localeCompare(bv);
        }
        case "updated": return sgn * (a.updatedAt - b.updatedAt);
        default: return 0;
      }
    });
  }
  return ts;
}

/* ---------------- Render: root ---------------- */

function render() {
  closeDropdowns();
  renderSidebar();
  renderMain();
  renderPanel();
  renderBulk();
  renderTopbar();
  applyRefocus();
}

function softRender() {
  renderMain();
  renderPanel();
  renderBulk();
  applyRefocus();
}

function applyRefocus() {
  if (!ui.refocus) return;
  const el = q(ui.refocus.sel);
  ui.refocus = null;
  if (el) el.focus();
}

function renderTopbar() {
  document.documentElement.dataset.theme = state.theme;
  const themeBtn = q("#theme-btn");
  themeBtn.replaceChildren(ico(state.theme === "light" ? "moon" : "sun", 17));
  const bell = q("#bell-btn");
  bell.replaceChildren(ico("bell", 17));
  const meBtn = q("#me-btn");
  meBtn.replaceChildren(avatarEl(me(), 30));
}

function avatarEl(person, size = 26) {
  if (!person) return h("span", { class: "avatar-empty" }, ico("person", 14));
  const a = h("span", { class: "avatar", title: person.name, style: `background:${person.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px` }, initials(person.name));
  return a;
}

/* ---------------- Render: sidebar ---------------- */

function renderSidebar() {
  const sb = q("#sidebar");
  sb.className = ui.sideCollapsed ? "collapsed" : "";
  sb.replaceChildren();

  const collapseBtn = h("button", { class: "icon-btn", title: ui.sideCollapsed ? "Expand" : "Collapse", onclick: () => { ui.sideCollapsed = !ui.sideCollapsed; renderSidebar(); } });
  collapseBtn.append(ico(ui.sideCollapsed ? "expand" : "collapse", 15));

  const wsChip = h("div", { class: "ws-chip" }, h("span", { class: "ws-logo" }, "M"), h("span", {}, "Main workspace"));
  sb.append(h("div", { class: "side-row" }, wsChip, collapseBtn));

  if (!ui.sideCollapsed) {
    const search = h("input", { type: "text", placeholder: "Search boards", value: ui.sideSearch });
    search.addEventListener("input", () => {
      ui.sideSearch = search.value;
      renderBoardList(q("#board-list"));
    });
    sb.append(h("div", { class: "side-search" }, ico("search", 14), search));

    const addBtn = h("button", { title: "Add board", onclick: () => addBoard() });
    addBtn.append(ico("plus", 15));
    sb.append(h("div", { class: "side-section" }, h("span", {}, "Boards"), addBtn));
  }

  const list = h("div", { id: "board-list" });
  sb.append(list);
  renderBoardList(list);
}

function renderBoardList(list) {
  list.replaceChildren();
  const filter = ui.sideSearch.toLowerCase();
  for (const b of state.boards) {
    if (filter && !b.name.toLowerCase().includes(filter)) continue;
    const menuBtn = h("button", { class: "item-menu", title: "Board menu" });
    menuBtn.append(ico("dots", 14));
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      boardMenu(menuBtn, b);
    });
    const item = h("div", {
      class: "side-item" + (b.id === state.activeBoard ? " active" : ""),
      title: b.name,
      onclick: () => { if (b.id !== state.activeBoard) switchBoard(b.id); },
    }, ico("table", 15), h("span", { class: "side-label" }, b.name), menuBtn);
    list.append(item);
  }
}

function boardMenu(anchor, board) {
  openDropdown(anchor, (el, close) => {
    el.append(
      ddItem("pencil", "Rename board", () => {
        close();
        if (board.id !== state.activeBoard) switchBoard(board.id);
        startBoardTitleEdit();
      }),
      ddItem("copy", "Duplicate board", () => { close(); duplicateBoard(board); }),
      ddItem("download", "Export to CSV", () => { close(); exportCSV(board); }),
      h("hr", { class: "dd-sep" }),
      ddItem("trash", "Delete board", () => { close(); deleteBoard(board); }, "danger"),
    );
  }, { minWidth: 200 });
}

function ddItem(icon, label, onclick, cls = "") {
  const it = h("div", { class: "dd-item " + cls, onclick });
  if (icon) it.append(ico(icon, 15));
  it.append(h("span", {}, label));
  return it;
}

/* ---------------- Render: main ---------------- */

function renderMain() {
  const main = q("#main");
  main.replaceChildren();
  const board = getBoard();
  if (!board) return;

  main.append(boardHeadEl(board));
  main.append(toolbarEl(board));

  if (board.view === "table") main.append(tableViewEl(board));
  else if (board.view === "kanban") main.append(kanbanViewEl(board));
  else main.append(calendarViewEl(board));
}

function boardHeadEl(board) {
  const title = h("span", { class: "board-title", title: "Click to rename" }, board.name);
  title.addEventListener("click", () => {
    inlineEdit(title, board.name, (v) => { board.name = v; save(); render(); }, { style: "font-size:24px;font-weight:700;max-width:480px" });
  });

  const inviteBtn = h("button", { class: "btn-invite" });
  inviteBtn.append(ico("personPlus", 15), h("span", {}, `Invite / ${state.people.length}`));
  inviteBtn.addEventListener("click", () => peopleManager(inviteBtn));

  const menuBtn = h("button", { class: "icon-btn", title: "Board menu" });
  menuBtn.append(ico("dots", 17));
  menuBtn.addEventListener("click", () => boardMenu(menuBtn, board));

  const desc = h("div", { class: "board-desc", title: "Click to edit description" }, board.desc || "Add a description...");
  desc.addEventListener("click", () => {
    inlineEdit(desc, board.desc, (v) => { board.desc = v; save(); render(); });
  });

  const tabs = h("div", { class: "tabs" });
  const TAB_DEFS = [
    { id: "table", label: "Main table", icon: "table" },
    { id: "kanban", label: "Kanban", icon: "kanban" },
    { id: "calendar", label: "Calendar", icon: "calendar" },
  ];
  for (const td of TAB_DEFS) {
    const tab = h("button", { class: "tab" + (board.view === td.id ? " active" : ""), onclick: () => { board.view = td.id; save(); render(); } });
    tab.append(ico(td.icon, 14), h("span", {}, td.label));
    tabs.append(tab);
  }
  const plusTab = h("button", { class: "tab", title: "Add view", onclick: () => toast("Demo: views are fixed (table / kanban / calendar)") });
  plusTab.append(ico("plus", 14));
  tabs.append(plusTab);

  return h("div", { class: "board-head" },
    h("div", { class: "bh-top" }, title, h("div", { class: "bh-spacer" }), inviteBtn, menuBtn),
    desc,
    tabs,
  );
}

function startBoardTitleEdit() {
  const title = q(".board-title");
  if (title) title.click();
}

function peopleManager(anchor) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Team members"));
    for (const p of state.people) {
      const row = h("div", { class: "dd-item" }, avatarEl(p, 26), h("span", { style: "flex:1" }, p.name + (p.id === state.user ? " (you)" : "")));
      if (p.id !== state.user) {
        const del = h("button", { class: "row-act", title: "Remove" });
        del.append(ico("x", 13));
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          state.people = state.people.filter(x => x.id !== p.id);
          for (const b of state.boards) for (const g of b.groups) for (const t of g.tasks) {
            t.owners = t.owners.filter(o => o !== p.id);
          }
          if (ui.person === p.id) ui.person = null;
          save();
          softRender();
          refreshDd();
        });
        row.append(del);
      }
      el.append(row);
    }
    el.append(h("hr", { class: "dd-sep" }));
    const input = h("input", { type: "text", placeholder: "Teammate name..." });
    const addBtn = h("button", {}, "Invite");
    const doAdd = () => {
      const name = input.value.trim();
      if (!name) return;
      state.people.push({ id: uid(), name, color: AVATAR_COLORS[state.people.length % AVATAR_COLORS.length] });
      input.value = "";
      save();
      softRender();
      refreshDd();
      toast(`${name} added to the team`);
    };
    addBtn.addEventListener("click", doAdd);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); e.stopPropagation(); });
    el.append(h("div", { class: "dd-input-row" }, input, addBtn));
  }, { minWidth: 260, alignRight: true });
}

/* ---------------- Render: toolbar ---------------- */

function toolbarEl(board) {
  const bar = h("div", { class: "toolbar" });

  const newBtn = h("button", { class: "btn-primary" });
  newBtn.append(h("span", {}, "New task"), ico("chevDown", 13));
  newBtn.addEventListener("click", () => {
    let g = board.groups[0];
    if (!g) { addGroup(board); return; }
    if (board.groups.length > 1) {
      openDropdown(newBtn, (el, close) => {
        el.append(h("div", { class: "dd-title" }, "Add task to group"));
        for (const gr of board.groups) {
          el.append(ddItem(null, gr.name, () => { close(); newTaskIn(board, gr); }));
        }
      });
    } else {
      newTaskIn(board, g);
    }
  });
  bar.append(newBtn);

  // search
  const searchWrap = h("div", { class: "board-search-wrap" });
  const sInput = h("input", { id: "board-search", type: "text", placeholder: "Search", value: ui.search });
  sInput.addEventListener("input", () => {
    ui.search = sInput.value;
    const gs = q("#global-search");
    if (gs && gs.value !== ui.search) gs.value = ui.search;
    rerenderViewOnly(board);
  });
  searchWrap.append(ico("search", 15), sInput);
  bar.append(searchWrap);

  // person filter
  const personBtn = h("button", { class: "tb-btn" + (ui.person ? " active" : "") });
  if (ui.person) personBtn.append(avatarEl(personById(ui.person), 20), h("span", {}, "Person"));
  else personBtn.append(ico("person", 15), h("span", {}, "Person"));
  personBtn.addEventListener("click", () => {
    openDropdown(personBtn, (el, close) => {
      el.append(h("div", { class: "dd-title" }, "Filter by person"));
      for (const p of state.people) {
        const it = h("div", { class: "dd-item", onclick: () => { ui.person = ui.person === p.id ? null : p.id; close(); softRender(); } },
          avatarEl(p, 24), h("span", {}, p.name), ui.person === p.id ? ico("check", 14) : null);
        el.append(it);
      }
      if (ui.person) {
        el.append(h("hr", { class: "dd-sep" }), h("button", { class: "dd-footer-btn", onclick: () => { ui.person = null; close(); softRender(); } }, "Clear"));
      }
    }, { minWidth: 220 });
  });
  bar.append(personBtn);

  // filter
  const nFilters = filtersActive();
  const filterBtn = h("button", { class: "tb-btn" + (nFilters ? " active" : "") });
  filterBtn.append(ico("filter", 15), h("span", {}, "Filter"));
  if (nFilters) filterBtn.append(h("span", { class: "count-badge" }, nFilters));
  filterBtn.addEventListener("click", () => filterPanel(filterBtn));
  bar.append(filterBtn);

  // sort
  const sortBtn = h("button", { class: "tb-btn" + (ui.sort ? " active" : "") });
  sortBtn.append(ico("sort", 15), h("span", {}, "Sort"));
  sortBtn.addEventListener("click", () => sortPanel(sortBtn));
  bar.append(sortBtn);

  // hide columns
  const nHidden = board.hidden.length;
  const hideBtn = h("button", { class: "tb-btn" + (nHidden ? " active" : "") });
  hideBtn.append(ico("eyeOff", 15), h("span", {}, "Hide"));
  if (nHidden) hideBtn.append(h("span", { class: "count-badge" }, nHidden));
  hideBtn.addEventListener("click", () => hidePanel(hideBtn, board));
  bar.append(hideBtn);

  return bar;
}

function rerenderViewOnly(board) {
  // re-render only the view area, keep toolbar input focus
  const main = q("#main");
  const old = main.querySelector(".board-canvas, .kanban, .calendar");
  if (!old) return;
  let fresh;
  if (board.view === "table") fresh = tableViewEl(board);
  else if (board.view === "kanban") fresh = kanbanViewEl(board);
  else fresh = calendarViewEl(board);
  old.replaceWith(fresh);
}

function newTaskIn(board, group) {
  const t = addTask(group, "New task", true);
  group.collapsed = false;
  ui.editTask = t.id;
  save();
  render();
}

function filterPanel(anchor) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Status"));
    for (const s of STATUSES) {
      const cb = h("input", { type: "checkbox" });
      cb.checked = ui.fStatus.has(s.id);
      const row = h("label", { class: "dd-check" }, cb,
        h("span", { style: `display:inline-block;width:12px;height:12px;border-radius:3px;background:${s.color}` }),
        h("span", {}, s.label || "—"));
      cb.addEventListener("change", () => {
        cb.checked ? ui.fStatus.add(s.id) : ui.fStatus.delete(s.id);
        softRender();
        refreshDd();
      });
      el.append(row);
    }
    el.append(h("div", { class: "dd-title" }, "Priority"));
    for (const p of PRIORITIES) {
      const cb = h("input", { type: "checkbox" });
      cb.checked = ui.fPriority.has(p.id);
      const row = h("label", { class: "dd-check" }, cb,
        h("span", { style: `display:inline-block;width:12px;height:12px;border-radius:3px;background:${p.color}` }),
        h("span", {}, p.label || "—"));
      cb.addEventListener("change", () => {
        cb.checked ? ui.fPriority.add(p.id) : ui.fPriority.delete(p.id);
        softRender();
        refreshDd();
      });
      el.append(row);
    }
    if (filtersActive()) {
      el.append(h("hr", { class: "dd-sep" }), h("button", {
        class: "dd-footer-btn",
        onclick: () => { ui.fStatus.clear(); ui.fPriority.clear(); close(); softRender(); },
      }, "Clear all filters"));
    }
  }, { minWidth: 220 });
}

function sortPanel(anchor) {
  const FIELDS = [
    { id: "name", label: "Name" },
    { id: "status", label: "Status" },
    { id: "date", label: "Due date" },
    { id: "priority", label: "Priority" },
    { id: "updated", label: "Last updated" },
  ];
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Sort by"));
    for (const f of FIELDS) {
      const active = ui.sort && ui.sort.field === f.id;
      const it = h("div", { class: "dd-item", onclick: () => {
        if (active) ui.sort.dir = ui.sort.dir === "asc" ? "desc" : "asc";
        else ui.sort = { field: f.id, dir: "asc" };
        softRender();
        refreshDd();
      } }, h("span", { style: "flex:1" }, f.label));
      if (active) it.append(ico(ui.sort.dir === "asc" ? "arrowUp" : "arrowDown", 14));
      el.append(it);
    }
    if (ui.sort) {
      el.append(h("hr", { class: "dd-sep" }), h("button", { class: "dd-footer-btn", onclick: () => { ui.sort = null; close(); softRender(); } }, "Clear sort"));
    }
  }, { minWidth: 200 });
}

function hidePanel(anchor, board) {
  openDropdown(anchor, (el) => {
    el.append(h("div", { class: "dd-title" }, "Display columns"));
    for (const c of COLUMNS) {
      const cb = h("input", { type: "checkbox" });
      cb.checked = !board.hidden.includes(c.id);
      const row = h("label", { class: "dd-check" }, cb, h("span", {}, c.label));
      cb.addEventListener("change", () => {
        if (cb.checked) board.hidden = board.hidden.filter(x => x !== c.id);
        else board.hidden.push(c.id);
        save();
        softRender();
        refreshDd();
      });
      el.append(row);
    }
  }, { minWidth: 200 });
}

/* ---------------- Render: table view ---------------- */

function gridTemplate(board) {
  const cols = COLUMNS.filter(c => !board.hidden.includes(c.id));
  return `36px minmax(300px, 1fr) ${cols.map(c => c.w + "px").join(" ")} 40px`.replace(/\s+/g, " ");
}

function tableViewEl(board) {
  const canvas = h("div", { class: "board-canvas h-scroll" });
  const wrap = h("div", { class: "group-wrap" });
  canvas.append(wrap);

  if (!board.groups.length) {
    wrap.append(h("div", { class: "empty-board" }, "This board is empty. Add a group to get started."));
  }

  for (const group of board.groups) {
    wrap.append(groupEl(board, group));
  }

  const addG = h("button", { class: "add-group-btn", onclick: () => addGroup(board) });
  addG.append(ico("plus", 15), h("span", {}, "Add new group"));
  wrap.append(addG);

  return canvas;
}

function groupEl(board, group) {
  const tpl = gridTemplate(board);
  const cols = COLUMNS.filter(c => !board.hidden.includes(c.id));
  const tasks = visibleTasks(group);
  const root = h("div", { class: "group", style: `--gcolor:${group.color}` });

  // ---- header line
  const caret = h("button", { class: "group-caret" + (group.collapsed ? " closed" : ""), style: `color:${group.color}` });
  caret.append(ico("chevDown", 17));
  caret.addEventListener("click", () => { group.collapsed = !group.collapsed; save(); render(); });

  const name = h("span", { class: "group-name", style: `color:${group.color}` }, group.name);
  name.addEventListener("click", () => {
    inlineEdit(name, group.name, (v) => { group.name = v; save(); render(); }, { style: "font-size:16px;font-weight:600" });
  });

  const count = h("span", { class: "group-count" }, `${tasks.length} Task${tasks.length === 1 ? "" : "s"}`);

  const menuBtn = h("button", { class: "group-menu-btn" });
  menuBtn.append(ico("dots", 15));
  menuBtn.addEventListener("click", () => groupMenu(menuBtn, board, group, name));

  root.append(h("div", { class: "group-header" }, caret, name, count, menuBtn));

  // ---- collapsed: compact bar
  if (group.collapsed) {
    const bar = h("div", { class: "collapsed-bar", onclick: () => { group.collapsed = false; save(); render(); } },
      h("b", { style: `color:${group.color}` }, group.name),
      h("span", { class: "muted" }, `${tasks.length} Task${tasks.length === 1 ? "" : "s"}`),
      h("div", { style: "flex:1" }),
      batteryEl(tasks, "status"),
    );
    bar.querySelector(".battery").style.width = "180px";
    root.append(bar);
    return root;
  }

  const table = h("div", { class: "g-table" });
  root.append(table);

  // ---- header row
  const headRow = h("div", { class: "g-row head-row", style: `grid-template-columns:${tpl}` });
  const allChecked = tasks.length > 0 && tasks.every(t => ui.sel.has(t.id));
  const headCb = h("input", { type: "checkbox" });
  headCb.checked = allChecked;
  headCb.addEventListener("change", () => {
    tasks.forEach(t => headCb.checked ? ui.sel.add(t.id) : ui.sel.delete(t.id));
    softRender();
  });
  headRow.append(h("div", { class: "cell check-col" }, headCb));
  headRow.append(h("div", { class: "cell name-col" }, "Task"));
  for (const c of cols) headRow.append(h("div", { class: "cell" }, c.label));
  const addCol = h("div", { class: "cell add-col", title: "Add column (demo)" }, ico("plus", 14));
  addCol.addEventListener("click", () => toast("Demo: column set is fixed"));
  headRow.append(addCol);
  table.append(headRow);

  // ---- task rows
  for (const task of tasks) {
    table.append(taskRowEl(board, group, task, tpl, cols));
  }

  // ---- add task row
  const addRow = h("div", { class: "g-row add-task-row", style: `grid-template-columns:36px 1fr` });
  addRow.append(h("div", { class: "cell check-col" }, h("input", { type: "checkbox", disabled: true, style: "opacity:.35" })));
  const addInput = h("input", { type: "text", placeholder: "+ Add task", "data-add": group.id });
  addInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && addInput.value.trim()) {
      addTask(group, addInput.value.trim());
      ui.refocus = { sel: `[data-add="${group.id}"]` };
      render();
    }
  });
  addRow.append(h("div", { class: "cell", style: "border-left:1px solid var(--border)" }, addInput));
  attachRowDropZone(addRow, group, () => group.tasks.length);
  table.append(addRow);

  // ---- summary row
  if (group.tasks.length) {
    const sum = h("div", { class: "g-row summary-row", style: `grid-template-columns:${tpl}` });
    sum.append(h("div", { class: "cell check-col", style: "border-left:none" }), h("div", { class: "cell" }));
    for (const c of cols) {
      const cell = h("div", { class: "cell" });
      if (c.id === "status") cell.append(batteryEl(tasks, "status"));
      else if (c.id === "priority") cell.append(batteryEl(tasks, "priority"));
      else if (c.id === "date") cell.append(rangePillEl(tasks));
      sum.append(cell);
    }
    sum.append(h("div", { class: "cell", style: "border-left:none" }));
    table.append(sum);
  }

  return root;
}

function batteryEl(tasks, kind) {
  const defs = kind === "status" ? STATUSES : PRIORITIES;
  const total = tasks.length;
  const bat = h("div", { class: "battery" });
  if (!total) return bat;
  for (const d of defs) {
    const n = tasks.filter(t => (kind === "status" ? t.status : t.priority) === d.id).length;
    if (!n) continue;
    const pct = Math.round((n / total) * 100);
    bat.append(h("span", {
      style: `background:${d.color};flex:${n} 1 0`,
      title: `${d.label || "—"} ${n}/${total} (${pct}%)`,
    }));
  }
  return bat;
}

function rangePillEl(tasks) {
  const dates = tasks.map(t => t.due).filter(Boolean).sort();
  if (!dates.length) return h("span", { class: "range-pill empty" }, "No dates");
  return h("span", { class: "range-pill", title: `${dates.length} task date${dates.length > 1 ? "s" : ""}` }, fmtRange(dates[0], dates[dates.length - 1]));
}

function groupMenu(anchor, board, group, nameEl) {
  openDropdown(anchor, (el, close) => {
    el.append(
      ddItem("pencil", "Rename group", () => { close(); nameEl.click(); }),
      ddItem(group.collapsed ? "expand" : "collapse", group.collapsed ? "Expand group" : "Collapse group", () => {
        close();
        group.collapsed = !group.collapsed;
        save();
        render();
      }),
    );
    const gi = board.groups.indexOf(group);
    if (gi > 0) el.append(ddItem("arrowUp", "Move group up", () => {
      close();
      board.groups.splice(gi, 1);
      board.groups.splice(gi - 1, 0, group);
      save();
      render();
    }));
    if (gi < board.groups.length - 1) el.append(ddItem("arrowDown", "Move group down", () => {
      close();
      board.groups.splice(gi, 1);
      board.groups.splice(gi + 1, 0, group);
      save();
      render();
    }));
    el.append(h("div", { class: "dd-title" }, "Group color"));
    const pal = h("div", { class: "palette" });
    for (const c of GROUP_COLORS) {
      pal.append(h("div", {
        class: "swatch" + (group.color === c ? " sel" : ""),
        style: `background:${c}`,
        onclick: () => { group.color = c; save(); close(); render(); },
      }));
    }
    el.append(pal, h("hr", { class: "dd-sep" }),
      ddItem("trash", "Delete group", () => { close(); deleteGroup(board, group); }, "danger"));
  }, { minWidth: 210 });
}

/* ---------------- Render: task row ---------------- */

function taskRowEl(board, group, task, tpl, cols) {
  const row = h("div", {
    class: "g-row" + (ui.sel.has(task.id) ? " selected" : ""),
    style: `grid-template-columns:${tpl}`,
    dataset: { task: task.id },
  });

  // checkbox + drag handle
  const cb = h("input", { type: "checkbox" });
  cb.checked = ui.sel.has(task.id);
  cb.addEventListener("change", () => {
    cb.checked ? ui.sel.add(task.id) : ui.sel.delete(task.id);
    softRender();
  });
  const handle = h("span", { class: "drag-handle", draggable: "true", title: "Drag to move" });
  handle.append(ico("grip", 13));
  handle.addEventListener("dragstart", (e) => {
    ui.drag = { type: "task", taskId: task.id };
    e.dataTransfer.effectAllowed = "move";
    row.classList.add("dragging");
  });
  handle.addEventListener("dragend", () => {
    ui.drag = null;
    document.querySelectorAll(".dragging, .drop-above, .drop-below").forEach(x => x.classList.remove("dragging", "drop-above", "drop-below"));
  });
  row.append(h("div", { class: "cell check-col" }, handle, cb));

  // name cell
  const nameSpan = h("span", { class: "task-name", title: "Click to edit" });
  renderTaskName(nameSpan, task);
  nameSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    startNameEdit(nameSpan, task);
  });

  const openBtn = h("button", { class: "row-act", title: "Open task" });
  openBtn.append(ico("open", 14));
  openBtn.addEventListener("click", (e) => { e.stopPropagation(); ui.panel = task.id; renderPanel(); });

  const rowMenuBtn = h("button", { class: "row-act", title: "Task menu" });
  rowMenuBtn.append(ico("dots", 14));
  rowMenuBtn.addEventListener("click", (e) => { e.stopPropagation(); taskMenu(rowMenuBtn, board, group, task); });

  const nameCell = h("div", { class: "cell name-col" }, nameSpan);
  if (task.updates.length) {
    const chip = h("button", { class: "updates-chip", title: `${task.updates.length} update(s)` });
    chip.append(ico("chat", 13), h("span", {}, task.updates.length));
    chip.addEventListener("click", (e) => { e.stopPropagation(); ui.panel = task.id; renderPanel(); });
    nameCell.append(chip);
  }
  nameCell.append(h("span", { class: "row-actions" }, openBtn, rowMenuBtn));
  row.append(nameCell);

  // dynamic cells
  for (const c of cols) {
    if (c.id === "owner") row.append(ownerCellEl(task));
    else if (c.id === "status") row.append(statusCellEl(task));
    else if (c.id === "date") row.append(dateCellEl(task));
    else if (c.id === "priority") row.append(priorityCellEl(task));
    else if (c.id === "updated") row.append(updatedCellEl(task));
  }

  row.append(h("div", { class: "cell" }));

  // drop zone (reorder)
  attachRowDnd(row, group, task);

  // auto edit after "New task"
  if (ui.editTask === task.id) {
    ui.editTask = null;
    requestAnimationFrame(() => startNameEdit(nameSpan, task));
  }

  return row;
}

function renderTaskName(span, task) {
  span.replaceChildren();
  const text = task.name;
  const s = ui.search.trim().toLowerCase();
  if (s) {
    const i = text.toLowerCase().indexOf(s);
    if (i > -1) {
      span.append(text.slice(0, i), h("mark", { class: "hl" }, text.slice(i, i + s.length)), text.slice(i + s.length));
      return;
    }
  }
  span.append(text);
}

function startNameEdit(span, task) {
  inlineEdit(span, task.name, (v) => {
    task.name = v;
    touch(task);
    save();
    render();
  });
}

function ownerCellEl(task) {
  const cell = h("div", { class: "cell owner-cell", title: "Assign owner" });
  const owners = task.owners.map(personById).filter(Boolean);
  if (!owners.length) cell.append(h("span", { class: "avatar-empty" }, ico("person", 13)));
  else {
    const stack = h("span", { class: "avatar-stack" });
    owners.slice(0, 2).forEach(p => stack.append(avatarEl(p, 26)));
    if (owners.length > 2) stack.append(h("span", { class: "avatar", style: "background:var(--text-2);width:26px;height:26px;font-size:10px" }, `+${owners.length - 2}`));
    cell.append(stack);
    cell.title = owners.map(p => p.name).join(", ");
  }
  cell.addEventListener("click", () => ownerPicker(cell, task.id));
  return cell;
}

function ownerPicker(anchor, taskId) {
  openDropdown(anchor, (el) => {
    el.append(h("div", { class: "dd-title" }, "Assign people"));
    const task = locateTask(taskId)?.task;
    if (!task) return;
    for (const p of state.people) {
      const has = task.owners.includes(p.id);
      const it = h("div", { class: "dd-item", onclick: () => {
        const t = locateTask(taskId)?.task;
        if (!t) return;
        if (t.owners.includes(p.id)) t.owners = t.owners.filter(x => x !== p.id);
        else t.owners.push(p.id);
        touch(t);
        save();
        softRender();
        refreshDd();
      } }, avatarEl(p, 24), h("span", { style: "flex:1" }, p.name), has ? ico("check", 14) : null);
      el.append(it);
    }
  }, { minWidth: 220 });
}

function statusCellEl(task) {
  const s = statusOf(task);
  const cell = h("div", { class: "cell", style: "padding:0 8px" });
  const fill = h("div", { class: "cell-fill", style: `background:${s.color}`, title: s.label }, s.id === "none" ? "" : s.label);
  fill.addEventListener("click", () => statusPicker(fill, task.id));
  cell.append(fill);
  return cell;
}

function statusPicker(anchor, taskId) {
  openDropdown(anchor, (el, close) => {
    for (const s of STATUSES) {
      el.append(h("div", {
        class: "dd-color",
        style: `background:${s.color}`,
        onclick: () => {
          const t = locateTask(taskId)?.task;
          if (!t) return;
          t.status = s.id;
          touch(t);
          save();
          close();
          softRender();
        },
      }, s.label));
    }
  }, { minWidth: 170 });
}

function dateCellEl(task) {
  const cell = h("div", { class: "cell date-cell" + (task.due ? "" : " empty"), title: "Set due date" });
  if (!task.due) {
    cell.append(ico("calendar", 14));
  } else {
    const isDone = task.status === "done";
    const overdue = !isDone && task.due < todayISO();
    if (overdue) {
      const w = h("span", { class: "overdue-ico", title: "Overdue" });
      w.append(ico("warning", 13));
      cell.append(w);
    }
    if (isDone) {
      const c = h("span", { class: "done-ico", title: "Done on time" });
      c.append(ico("check", 13));
      cell.append(c);
    }
    cell.append(h("span", { class: isDone ? "date-done" : "" }, fmtDate(task.due)));
  }
  cell.addEventListener("click", () => datePicker(cell, task.id));
  return cell;
}

function datePicker(anchor, taskId) {
  openDropdown(anchor, (el, close) => {
    const t = locateTask(taskId)?.task;
    if (!t) return;
    const input = h("input", { type: "date", value: t.due });
    input.addEventListener("change", () => {
      const tk = locateTask(taskId)?.task;
      if (!tk) return;
      tk.due = input.value;
      touch(tk);
      save();
      close();
      softRender();
    });
    const todayBtn = h("button", { onclick: () => {
      const tk = locateTask(taskId)?.task;
      if (!tk) return;
      tk.due = todayISO();
      touch(tk);
      save();
      close();
      softRender();
    } }, "Today");
    const clearBtn = h("button", { onclick: () => {
      const tk = locateTask(taskId)?.task;
      if (!tk) return;
      tk.due = "";
      touch(tk);
      save();
      close();
      softRender();
    } }, "Clear");
    el.append(h("div", { class: "date-pop" }, input, h("div", { class: "date-pop-row" }, todayBtn, clearBtn)));
  }, { minWidth: 220 });
}

function priorityCellEl(task) {
  const p = prioOf(task);
  const cell = h("div", { class: "cell", style: "padding:0 8px" });
  const fill = h("div", { class: "cell-fill", style: `background:${p.color}`, title: p.label || "No priority" }, p.label);
  fill.addEventListener("click", () => priorityPicker(fill, task.id));
  cell.append(fill);
  return cell;
}

function priorityPicker(anchor, taskId) {
  openDropdown(anchor, (el, close) => {
    for (const p of PRIORITIES) {
      el.append(h("div", {
        class: "dd-color",
        style: `background:${p.color}`,
        onclick: () => {
          const t = locateTask(taskId)?.task;
          if (!t) return;
          t.priority = p.id;
          touch(t);
          save();
          close();
          softRender();
        },
      }, p.label || "—"));
    }
  }, { minWidth: 170 });
}

function updatedCellEl(task) {
  const cell = h("div", { class: "cell updated-cell" });
  const p = personById(task.updatedBy);
  if (p) cell.append(avatarEl(p, 22));
  cell.append(h("span", {}, relTime(task.updatedAt)));
  return cell;
}

function taskMenu(anchor, board, group, task) {
  openDropdown(anchor, (el, close) => {
    el.append(
      ddItem("open", "Open task", () => { close(); ui.panel = task.id; renderPanel(); }),
      ddItem("copy", "Duplicate", () => { close(); duplicateTasks([task.id]); }),
    );
    const others = board.groups.filter(g => g !== group);
    if (others.length) {
      el.append(h("div", { class: "dd-title" }, "Move to group"));
      for (const g of others) {
        el.append(ddItem(null, g.name, () => { close(); moveTasksToGroup([task.id], g); }));
      }
    }
    el.append(h("hr", { class: "dd-sep" }), ddItem("trash", "Delete task", () => { close(); deleteTasks([task.id]); }, "danger"));
  }, { minWidth: 190 });
}

/* ---------------- Drag & drop (table) ---------------- */

function attachRowDnd(row, group, task) {
  row.addEventListener("dragover", (e) => {
    if (!ui.drag || ui.drag.taskId === task.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = row.getBoundingClientRect();
    const below = e.clientY > r.top + r.height / 2;
    row.classList.toggle("drop-above", !below);
    row.classList.toggle("drop-below", below);
  });
  row.addEventListener("dragleave", () => row.classList.remove("drop-above", "drop-below"));
  row.addEventListener("drop", (e) => {
    if (!ui.drag) return;
    e.preventDefault();
    const r = row.getBoundingClientRect();
    const below = e.clientY > r.top + r.height / 2;
    let idx = group.tasks.indexOf(task);
    if (below) idx++;
    const id = ui.drag.taskId;
    ui.drag = null;
    moveTaskTo(id, group, idx);
  });
}

function attachRowDropZone(row, group, idxFn) {
  row.addEventListener("dragover", (e) => {
    if (!ui.drag) return;
    e.preventDefault();
    row.classList.add("drop-above");
  });
  row.addEventListener("dragleave", () => row.classList.remove("drop-above"));
  row.addEventListener("drop", (e) => {
    if (!ui.drag) return;
    e.preventDefault();
    const id = ui.drag.taskId;
    ui.drag = null;
    moveTaskTo(id, group, idxFn());
  });
}

/* ---------------- Render: kanban view ---------------- */

function kanbanViewEl(board) {
  const kb = h("div", { class: "kanban" });
  for (const s of STATUSES) {
    const tasks = [];
    for (const g of board.groups) {
      for (const t of visibleTasks(g)) if (t.status === s.id) tasks.push({ t, g });
    }
    const col = h("div", { class: "kb-col" });
    col.append(h("div", { class: "kb-head", style: `background:${s.color}` }, s.label, h("span", {}, `${tasks.length}`)));
    const cards = h("div", { class: "kb-cards" });
    for (const { t, g } of tasks) cards.append(kanbanCardEl(t, g));
    col.append(cards);

    col.addEventListener("dragover", (e) => {
      if (!ui.drag) return;
      e.preventDefault();
      col.classList.add("drop-target");
    });
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) col.classList.remove("drop-target");
    });
    col.addEventListener("drop", (e) => {
      if (!ui.drag) return;
      e.preventDefault();
      col.classList.remove("drop-target");
      const t = locateTask(ui.drag.taskId)?.task;
      ui.drag = null;
      if (!t || t.status === s.id) return;
      t.status = s.id;
      touch(t);
      save();
      render();
    });
    kb.append(col);
  }
  return kb;
}

function kanbanCardEl(task, group) {
  const card = h("div", { class: "kb-card", draggable: "true" });
  card.append(h("div", { class: "kb-title" }, task.name));
  const meta = h("div", { class: "kb-meta" });
  meta.append(h("span", { class: "kb-dot", style: `background:${group.color}`, title: group.name }));
  meta.append(h("span", {}, group.name));
  if (task.due) meta.append(h("span", {}, "· " + fmtDate(task.due)));
  if (task.priority !== "none") {
    const p = prioOf(task);
    meta.append(h("span", { class: "kb-prio", style: `background:${p.color}` }, p.label));
  }
  if (task.owners.length) {
    const stack = h("span", { class: "avatar-stack", style: "margin-left:auto" });
    task.owners.map(personById).filter(Boolean).slice(0, 3).forEach(p => stack.append(avatarEl(p, 22)));
    meta.append(stack);
  }
  card.append(meta);
  card.addEventListener("dragstart", (e) => {
    ui.drag = { type: "card", taskId: task.id };
    e.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    ui.drag = null;
    card.classList.remove("dragging");
    document.querySelectorAll(".drop-target").forEach(x => x.classList.remove("drop-target"));
  });
  card.addEventListener("click", () => { ui.panel = task.id; renderPanel(); });
  return card;
}

/* ---------------- Render: calendar view ---------------- */

function calendarViewEl(board) {
  const now = new Date();
  if (!ui.cal) ui.cal = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = ui.cal;

  const cal = h("div", { class: "calendar" });

  const prev = h("button", { class: "icon-btn", onclick: () => { shiftMonth(-1); } });
  prev.append(ico("chevLeft", 16));
  const next = h("button", { class: "icon-btn", onclick: () => { shiftMonth(1); } });
  next.append(ico("chevRight", 16));
  const todayBtn = h("button", { class: "cal-today-btn", onclick: () => { ui.cal = null; softRender(); } }, "Today");
  cal.append(h("div", { class: "cal-head" }, h("h3", {}, `${MONTHS_FULL[m]} ${y}`), prev, next, todayBtn,
    h("span", { class: "muted", style: "margin-left:8px;font-size:12px" }, "Drag tasks between days to reschedule")));

  const gridHead = h("div", { class: "cal-grid-head" });
  WEEKDAYS.forEach(w => gridHead.append(h("div", {}, w)));
  cal.append(gridHead);

  // map tasks by date
  const byDate = new Map();
  for (const g of board.groups) {
    for (const t of visibleTasks(g)) {
      if (!t.due) continue;
      if (!byDate.has(t.due)) byDate.set(t.due, []);
      byDate.get(t.due).push(t);
    }
  }

  const first = new Date(y, m, 1);
  const startOffset = first.getDay();
  const grid = h("div", { class: "cal-grid" });
  const today = todayISO();

  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - startOffset + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const other = d.getMonth() !== m;
    const cell = h("div", { class: "cal-cell" + (other ? " other" : "") });
    const dayNum = h("div", { class: "cal-daynum" }, iso === today ? h("b", {}, d.getDate()) : String(d.getDate()));
    cell.append(dayNum);

    const tasks = byDate.get(iso) || [];
    tasks.slice(0, 3).forEach(t => {
      const s = statusOf(t);
      const chip = h("button", { class: "cal-chip", style: `background:${s.color}`, title: `${t.name} — ${s.label}`, draggable: "true" }, t.name);
      chip.addEventListener("click", () => { ui.panel = t.id; renderPanel(); });
      chip.addEventListener("dragstart", (e) => {
        ui.drag = { type: "chip", taskId: t.id };
        e.dataTransfer.effectAllowed = "move";
      });
      chip.addEventListener("dragend", () => { ui.drag = null; });
      cell.append(chip);
    });
    if (tasks.length > 3) cell.append(h("div", { class: "cal-more" }, `+${tasks.length - 3} more`));

    cell.addEventListener("dragover", (e) => {
      if (!ui.drag) return;
      e.preventDefault();
      cell.classList.add("dragover");
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("dragover"));
    cell.addEventListener("drop", (e) => {
      if (!ui.drag) return;
      e.preventDefault();
      cell.classList.remove("dragover");
      const t = locateTask(ui.drag.taskId)?.task;
      ui.drag = null;
      if (!t) return;
      t.due = iso;
      touch(t);
      save();
      softRender();
      toast(`"${t.name}" moved to ${fmtDate(iso)}`);
    });

    grid.append(cell);
  }
  cal.append(grid);
  return cal;
}

function shiftMonth(delta) {
  const { y, m } = ui.cal;
  const d = new Date(y, m + delta, 1);
  ui.cal = { y: d.getFullYear(), m: d.getMonth() };
  softRender();
}

/* ---------------- Render: bulk bar ---------------- */

function renderBulk() {
  const root = q("#bulk-root");
  root.replaceChildren();
  const n = ui.sel.size;
  if (!n) return;
  const board = getBoard();

  const bar = h("div", { class: "bulk-bar" });
  bar.append(h("div", { class: "bulk-count" }, n));
  bar.append(h("div", { class: "bulk-label" }, `Task${n > 1 ? "s" : ""} selected`));

  const mkAct = (icon, label, fn) => {
    const b = h("button", { class: "bulk-act", onclick: fn });
    b.append(ico(icon, 16), h("span", {}, label));
    return b;
  };

  bar.append(mkAct("copy", "Duplicate", () => duplicateTasks([...ui.sel])));

  const moveBtn = mkAct("open", "Move to", () => {
    openDropdown(moveBtn, (el, close) => {
      el.append(h("div", { class: "dd-title" }, "Move to group"));
      for (const g of board.groups) {
        el.append(ddItem(null, g.name, () => { close(); moveTasksToGroup([...ui.sel], g); }));
      }
    });
  });
  bar.append(moveBtn);

  bar.append(mkAct("trash", "Delete", () => deleteTasks([...ui.sel])));
  bar.append(mkAct("x", "Clear", () => { ui.sel.clear(); softRender(); }));

  root.append(bar);
}

/* ---------------- Render: item panel ---------------- */

function renderPanel() {
  const root = q("#panel-root");
  root.replaceChildren();
  if (!ui.panel) return;
  const loc = locateTask(ui.panel);
  if (!loc) { ui.panel = null; return; }
  const { task, group } = loc;

  const panel = h("div", { class: "item-panel" });

  // header
  const title = h("div", { class: "ip-title", title: "Click to rename" }, task.name);
  title.addEventListener("click", () => {
    inlineEdit(title, task.name, (v) => { task.name = v; touch(task); save(); render(); }, { style: "font-size:19px;font-weight:700" });
  });
  const closeBtn = h("button", { class: "icon-btn", onclick: () => { ui.panel = null; renderPanel(); } });
  closeBtn.append(ico("x", 16));
  const delBtn = h("button", { class: "icon-btn", title: "Delete task", onclick: () => deleteTasks([task.id]) });
  delBtn.append(ico("trash", 15));
  panel.append(h("div", { class: "ip-head" }, title, delBtn, closeBtn));
  panel.append(h("div", { class: "ip-section", style: "padding-top:2px" },
    h("span", { class: "muted", style: "font-size:12px" }, "in "),
    h("b", { style: `color:${group.color};font-size:12px` }, group.name)));

  // fields
  const fields = h("div", { class: "ip-fields" });

  const s = statusOf(task);
  const statusPill = h("button", { class: "ip-pill", style: `background:${s.color}` }, s.label);
  statusPill.addEventListener("click", () => statusPicker(statusPill, task.id));
  fields.append(h("span", { class: "ip-label" }, "Status"), statusPill);

  const p = prioOf(task);
  const prioPill = h("button", { class: "ip-pill", style: `background:${p.color}` }, p.label || "—");
  prioPill.addEventListener("click", () => priorityPicker(prioPill, task.id));
  fields.append(h("span", { class: "ip-label" }, "Priority"), prioPill);

  const ownerBtn = h("button", { class: "ip-plain" });
  const owners = task.owners.map(personById).filter(Boolean);
  if (owners.length) {
    const stack = h("span", { class: "avatar-stack" });
    owners.slice(0, 3).forEach(x => stack.append(avatarEl(x, 22)));
    ownerBtn.append(stack, h("span", {}, owners.map(x => x.name.split(" ")[0]).join(", ")));
  } else {
    ownerBtn.append(ico("personPlus", 15), h("span", { class: "muted" }, "Assign"));
  }
  ownerBtn.addEventListener("click", () => ownerPicker(ownerBtn, task.id));
  fields.append(h("span", { class: "ip-label" }, "Owner"), ownerBtn);

  const dateBtn = h("button", { class: "ip-plain" });
  dateBtn.append(ico("calendar", 15), h("span", { class: task.due ? "" : "muted" }, task.due ? fmtDate(task.due) : "Set date"));
  dateBtn.addEventListener("click", () => datePicker(dateBtn, task.id));
  fields.append(h("span", { class: "ip-label" }, "Due date"), dateBtn);

  fields.append(h("span", { class: "ip-label" }, "Last updated"),
    h("span", { class: "muted", style: "font-size:13px" }, `${relTime(task.updatedAt)} by ${personById(task.updatedBy)?.name || "?"}`));

  panel.append(fields);

  // description
  const desc = h("textarea", { class: "ip-desc", placeholder: "Add a description..." });
  desc.value = task.desc;
  desc.addEventListener("change", () => {
    task.desc = desc.value;
    touch(task);
    save();
  });
  panel.append(h("div", { class: "ip-section" }, h("h4", {}, "Description"), desc));

  // updates
  const updates = h("div", { class: "ip-updates" });
  updates.append(h("h4", { style: "font-size:13px;color:var(--text-2)" }, `Updates (${task.updates.length})`));

  const composer = h("div", { class: "ip-composer" });
  const ta = h("textarea", { placeholder: "Write an update... (Ctrl+Enter to post)" });
  const postBtn = h("button", { class: "btn-primary" }, "Update");
  const post = () => {
    const text = ta.value.trim();
    if (!text) return;
    task.updates.unshift({ id: uid(), by: state.user, text, at: Date.now() });
    touch(task);
    save();
    render();
  };
  postBtn.addEventListener("click", post);
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.ctrlKey) post(); });
  composer.append(ta, postBtn);
  updates.append(composer);

  for (const u of task.updates) {
    const author = personById(u.by);
    const del = h("button", { class: "row-act", title: "Delete update", onclick: () => {
      task.updates = task.updates.filter(x => x.id !== u.id);
      save();
      render();
    } });
    del.append(ico("trash", 13));
    updates.append(h("div", { class: "update-card" },
      h("div", { class: "update-head" }, avatarEl(author, 24), h("b", {}, author ? author.name : "Unknown"), h("time", {}, relTime(u.at)), del),
      h("div", { class: "update-text" }, u.text)));
  }

  panel.append(updates);
  root.append(panel);
}

/* ---------------- CSV export ---------------- */

function exportCSV(board) {
  const rows = [["Group", "Task", "Owners", "Status", "Due date", "Priority", "Description"]];
  for (const g of board.groups) {
    for (const t of g.tasks) {
      rows.push([
        g.name,
        t.name,
        t.owners.map(id => personById(id)?.name || "").filter(Boolean).join("; "),
        statusOf(t).label,
        t.due || "",
        prioOf(t).label,
        t.desc || "",
      ]);
    }
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `${board.name}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  toast("CSV exported");
}

/* ---------------- Topbar wiring (static) ---------------- */

function wireTopbar() {
  q("#theme-btn").addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    save();
    render();
  });

  q("#bell-btn").addEventListener("click", (e) => {
    openDropdown(e.currentTarget, (el) => {
      el.append(h("div", { class: "dd-item disabled" }, "🎉 No new notifications"));
    }, { alignRight: true, minWidth: 220 });
  });

  q("#me-btn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    openDropdown(btn, (el, close) => {
      el.append(h("div", { class: "dd-title" }, "Profile"));
      const input = h("input", { type: "text", value: me().name, placeholder: "Your name" });
      const okBtn = h("button", {}, "Save");
      const doSave = () => {
        const v = input.value.trim();
        if (!v) return;
        me().name = v;
        save();
        close();
        render();
        toast("Profile updated");
      };
      okBtn.addEventListener("click", doSave);
      input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doSave(); ev.stopPropagation(); });
      el.append(h("div", { class: "dd-input-row" }, input, okBtn));
      el.append(h("hr", { class: "dd-sep" }));
      el.append(ddItem(state.theme === "light" ? "moon" : "sun", state.theme === "light" ? "Dark mode" : "Light mode", () => {
        state.theme = state.theme === "light" ? "dark" : "light";
        save();
        close();
        render();
      }));
      el.append(ddItem("trash", "Reset demo data", () => {
        close();
        localStorage.removeItem(LS_KEY);
        load();
        resetBoardUi();
        render();
        toast("Demo data reset");
      }, "danger"));
    }, { alignRight: true, minWidth: 240 });
  });

  const gs = q("#global-search");
  gs.addEventListener("input", () => {
    ui.search = gs.value;
    rerenderViewOnly(getBoard());
    const bs = q("#board-search");
    if (bs && bs.value !== ui.search) bs.value = ui.search;
  });
}

/* ---------------- Init ---------------- */

load();
wireTopbar();
render();
