/* ============================================================
   Campaign Tracker by GIE — monday.com style work management
   Vanilla JS + localStorage. No build step, no dependencies.
   ============================================================ */
"use strict";

/* ---------------- Constants ---------------- */

const LS_KEY = "gie_campaign_tracker_v1";

const DEFAULT_STATUSES = [
  { id: "working", label: "Working on it", color: "#fdab3d" },
  { id: "done",    label: "Done",          color: "#00c875" },
  { id: "stuck",   label: "Stuck",         color: "#e2445c" },
  { id: "none",    label: "Not Started",   color: "#c4c4c4" },
];

const DEFAULT_PRIORITIES = [
  { id: "critical", label: "Critical",  color: "#333333" },
  { id: "high",     label: "High",      color: "#401694" },
  { id: "medium",   label: "Medium",    color: "#5559df" },
  { id: "low",      label: "Low",       color: "#579bfc" },
  { id: "none",     label: "",          color: "#c4c4c4" },
];

// Live label sets — rebound to state.statuses / state.priorities in migrate()
// so users can rename labels and pick custom colors.
let STATUSES = DEFAULT_STATUSES;
let PRIORITIES = DEFAULT_PRIORITIES;

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

const VIEW_META = [
  { id: "table",     label: "Table",        tabLabel: "Main table", icon: "table" },
  { id: "gantt",     label: "Gantt",        icon: "gantt" },
  { id: "chart",     label: "Chart",        icon: "chart" },
  { id: "calendar",  label: "Calendar",     icon: "calendar" },
  { id: "kanban",    label: "Kanban",       icon: "kanban" },
  { id: "doc",       label: "Doc",          icon: "doc" },
  { id: "gallery",   label: "File gallery", icon: "gallery" },
  { id: "form",      label: "Form",         icon: "form" },
  { id: "dashboard", label: "Dashboard",    icon: "dashboard" },
];
const viewMeta = (id) => VIEW_META.find(v => v.id === id) || VIEW_META[0];
const viewTab = (id) => { const v = viewMeta(id); return v.tabLabel || v.label; };

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
  gantt: '<path d="M5 6h9M5 12h6M5 18h12" stroke-width="2.4"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-7M4 20h16"/>',
  dashboard: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5L6 21"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  agent: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 4v4M8.5 13h.01M15.5 13h.01M9 17h6"/>',
  vibe: '<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z"/>',
  workflow: '<rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M6 9v3.5a2 2 0 0 0 2 2h7"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.9-1.4-1.9-3.3-2.2 1a7.6 7.6 0 0 0-1.8-1L15 3H9.9l-.4 2.3a7.6 7.6 0 0 0-1.8 1l-2.2-1L3.6 8.6 5.5 10a7.6 7.6 0 0 0 0 2l-1.9 1.4 1.9 3.3 2.2-1a7.6 7.6 0 0 0 1.8 1l.4 2.3h5.1l.4-2.3a7.6 7.6 0 0 0 1.8-1l2.2 1 1.9-3.3z"/>',
  template: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  filterFunnel: '<path d="M4 5h16l-6.5 7.5V19l-3-1.5v-5L4 5z"/>',
  numbers: '<path d="M9 4L7 20M17 4l-2 16M5 9h15M4 15h15"/>',
  battery: '<rect x="2.5" y="8" width="16" height="8" rx="2"/><path d="M21 11v2"/><rect x="4.5" y="10" width="8" height="4" rx="1" fill="currentColor" stroke="none"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M12 3v9h9A9 9 0 0 0 12 3z" opacity="0.55"/>',
  line: '<path d="M4 5v14h16"/><path d="M7 14l4-4 3 3 5-6"/>',
  widget: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
  link: '<path d="M9 15l6-6M10.5 6.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 17.5l-1 1a3.5 3.5 0 0 1-5-5l1-1"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.3-8A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1-.5 8.5H7z"/>',
  cloudCheck: '<path d="M7 18a4 4 0 0 1-.3-8A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1-.5 8.5"/><path d="M9 14l2 2 4-4"/>',
  cursor: '<path d="M5 3l7 17 2.2-7.2L21 10.5z"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
  target: '<circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
  paperclip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z"/>',
  starFill: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>',
  archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
  badge: '<path d="M12 3l2 2h3v3l2 2-2 2v3h-3l-2 2-2-2H7v-3l-2-2 2-2V5h3z"/><path d="M9.5 12l1.7 1.7L15 10"/>',
  move: '<path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
  checkbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  formula: '<path d="M14 4h-2.5a2 2 0 0 0-2 2v12a2 2 0 0 1-2 2M6 12h7"/><path d="M14 13l4 5M18 13l-4 5"/>',
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
const statusOf = (t) => STATUSES.find(s => s.id === t.status) || { id: t.status, label: "", color: "#c4c4c4" };
const prioOf = (t) => PRIORITIES.find(p => p.id === t.priority) || { id: t.priority, label: "", color: "#c4c4c4" };

/* ---------------- State ---------------- */

let state = null;

const ui = {
  search: "",
  person: null,
  fStatus: new Set(),
  fPriority: new Set(),
  fGroup: new Set(),     // quick-filter: visible group ids
  sort: null,            // {field, dir}
  sel: new Set(),
  cal: null,             // {y, m}
  panel: null,           // taskId
  editTask: null,        // taskId -> start inline name edit after render
  refocus: null,         // {sel, caret}
  sideCollapsed: false,
  sideSearch: "",
  drag: null,            // {type:'task'|'card'|'chip', taskId}
  colDrag: null,         // {boardId, colId} — custom column reorder
  coverEditing: false,   // workspace cover reposition mode
  home: false,           // workspace home view
  homeTab: "content",    // recents | content | collaborators | permissions
  whSel: new Set(),      // selected asset (board) ids in content tab
  whArchived: false,     // content tab showing archived assets
  whF: { modified: null, types: new Set(), creators: new Set(), membership: null, cleanup: false }, // content filter panel
  whFCreatorQ: "",       // "created by" search text in the filter panel
  authResolved: false,   // cloud session checked at least once (gate: loading vs form)
  noAccess: false,       // signed in but not on the team allow-list
  wfSel: null,           // selected workflow node id ("trigger" | stepId)
  wfPanel: null,         // "history" | null
  wfTab: "history",      // history | analytics
  wfZoom: 1,
};

let cloudTimer = null;
function saveLocal() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function save() {
  saveLocal();
  if (typeof window !== "undefined" && window.CLOUD && window.CLOUD.available() && window.CLOUD.user()) {
    clearTimeout(cloudTimer);
    // shared team workspace (all members write the same row)
    cloudTimer = setTimeout(() => window.CLOUD.saveTeam(state), 800);
  }
}

function cloudOn() { return typeof window !== "undefined" && window.CLOUD && window.CLOUD.available(); }

let cloudUserId = null;
function initCloud() {
  if (!cloudOn()) return;
  window.CLOUD.init(async (u) => {
    ui.authResolved = true;
    // Supabase re-fires this on token refresh / tab refocus. Only react when the
    // signed-in user actually CHANGES — otherwise we'd reload state and bounce the
    // user back to Workspace home mid-work.
    const sameUser = u && cloudUserId === u.id;
    cloudUserId = u ? u.id : null;
    if (sameUser) return;
    ui.noAccess = false;
    if (u) {
      const team = await window.CLOUD.loadTeam();
      if (team && Array.isArray(team.boards)) {
        state = team; migrate(); reconcileIdentity(); saveLocal();
        ui.home = true;   // land on Workspace home on first sign-in
        render();
        toast("☁ Team workspace loaded");
        return;
      }
      // no shared workspace yet
      if ((window.CLOUD.email() || "").toLowerCase() === ADMIN_EMAIL) {
        reconcileIdentity();
        await window.CLOUD.saveTeam(state);   // admin seeds the team baseline from local
        toast("☁ Team workspace created");
      } else {
        // signed in but not invited (RLS blocks read) — keep them out
        ui.noAccess = true;
      }
    }
    render();
  });
}

function cloudAuthModal() {
  openModal((card, close) => {
    const closeBtn = h("button", { class: "icon-btn", onclick: close });
    closeBtn.append(ico("x", 16));
    card.append(h("div", { class: "modal-head" }, h("div", { class: "ip-title", style: "flex:1" }, "Team sign in"), closeBtn));
    const body = h("div", { class: "modal-body" });
    body.append(h("p", { class: "muted", style: "margin-bottom:14px" }, "Sign in to the shared team workspace. Admin (" + ADMIN_EMAIL + ") manages members; invited members sign up with the email they were invited with."));
    const email = h("input", { type: "email", class: "lbl-input", placeholder: "you@email.com", style: "width:100%;height:38px;margin-bottom:10px" });
    const pw = h("input", { type: "password", class: "lbl-input", placeholder: "Password (min 6 chars)", style: "width:100%;height:38px" });
    const msg = h("div", { class: "muted", style: "min-height:18px;margin-top:10px;font-size:12px" });
    body.append(email, pw, msg);
    card.append(body);
    const signIn = h("button", { class: "btn-primary" }, "Sign in");
    const signUp = h("button", { class: "modal-cancel" }, "Create account");
    const run = async (fn) => {
      const e = email.value.trim(), p = pw.value;
      if (!e || p.length < 6) { msg.textContent = "Enter an email and a password of at least 6 characters."; return; }
      msg.textContent = "Working…";
      const r = await fn(e, p);
      if (r.error) { msg.textContent = r.error; return; }
      if (r.needsConfirm) { msg.textContent = "Account created — confirm via the email we sent, then sign in."; return; }
      close();
      toast("☁ Signed in — syncing to cloud");
    };
    signIn.addEventListener("click", () => run((e, p) => window.CLOUD.signIn(e, p)));
    signUp.addEventListener("click", () => run((e, p) => window.CLOUD.signUp(e, p)));
    pw.addEventListener("keydown", (ev) => { if (ev.key === "Enter") signIn.click(); });
    card.append(h("div", { class: "modal-foot" }, signUp, signIn));
    setTimeout(() => email.focus(), 0);
  });
}

function load() {
  let parsed = null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (e) { /* corrupted -> reseed */ }
  state = parsed || seed();
  migrate();
  save();
}

// Backfill fields added in later versions so old localStorage keeps working.
function migrate() {
  if (!Array.isArray(state.workspaces)) {
    const old = state.workspace || {};
    state.workspaces = [{ id: "w1", name: old.name || "Main workspace", desc: old.desc || "", color: "#00854d", letter: "M" }];
    state.activeWorkspace = "w1";
  }
  if (!state.activeWorkspace || !state.workspaces.find(w => w.id === state.activeWorkspace)) {
    state.activeWorkspace = state.workspaces[0].id;
  }
  for (const w of state.workspaces) {
    if (!w.color) w.color = "#00854d";
    if (!w.letter) w.letter = (w.name[0] || "W").toUpperCase();
    if (w.desc == null) w.desc = "";
  }
  for (const p of state.people) {
    if (!("avatar" in p)) p.avatar = null;
    if (!p.title) p.title = "Team member";
    if (!p.email) p.email = (p.name || "user").toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "") + "@campaign.co";
    p.role = p.role ? normRole(p.role) : (p.id === state.user ? OWNER_ROLE : DEFAULT_MEMBER_ROLE);
  }
  // Ownership is tied to the admin EMAIL, never to whoever is currently signed in.
  // (In the shared team blob, state.user changes per member — must not grant SPV.)
  for (const p of state.people) {
    if (p.role === OWNER_ROLE && (p.email || "").toLowerCase() !== ADMIN_EMAIL) p.role = DEFAULT_MEMBER_ROLE;
  }
  let adminPerson = state.people.find(p => (p.email || "").toLowerCase() === ADMIN_EMAIL);
  if (!adminPerson) {
    // backfill: the legacy seed owner (u1) with the old placeholder email becomes admin
    adminPerson = state.people.find(p => p.id === "u1" || p.email === "gie@campaign.co");
    if (adminPerson) adminPerson.email = ADMIN_EMAIL;
  }
  if (adminPerson) adminPerson.role = OWNER_ROLE;
  // clean white theme now; accent comes from the avatar character
  state.skin = "default";
  // one-time: give members anime character avatars (user-supplied art)
  if (!state.animeApplied) {
    state.people.forEach((p, i) => { if (!p.avatar) p.avatar = ANIME_CHARS[i % ANIME_CHARS.length].img; });
    state.animeApplied = true;
  }
  for (const b of state.boards) {
    if (!b.workspaceId) b.workspaceId = state.workspaces[0].id;
    if (!b.kind) b.kind = "board";
    if (!Array.isArray(b.views)) b.views = ["table", "kanban", "calendar"];
    if (!b.view || !b.views.includes(b.view)) b.view = b.views[0] || "table";
    if (!b.hidden) b.hidden = [];
    if (b.doc == null) b.doc = "";
    if (!Array.isArray(b.widgets)) b.widgets = [];
    if (!Array.isArray(b.columns)) b.columns = [];
    if (!b.colNames) b.colNames = {};
    if (!b.chartConfig) b.chartConfig = { chartType: "donut", metric: "status" };
    if (!b.createdAt) b.createdAt = Date.now();
    if (!b.creator) b.creator = state.user || "u1";
    if (!b.icon) b.icon = "table";
    if (!("archived" in b)) b.archived = false;
    if (!("fav" in b)) b.fav = false;
    if (b.kind === "workflow") {
      if (!b.flow) b.flow = { active: false, trigger: null, steps: [], runs: [] };
      if (!Array.isArray(b.flow.steps)) b.flow.steps = [];
      if (!Array.isArray(b.flow.runs)) b.flow.runs = [];
      // convert legacy rules model
      if (!b.flow.trigger && Array.isArray(b.rules) && b.rules.length) {
        const r = b.rules[0];
        b.flow.trigger = r.trigger.type === "status"
          ? { type: "status_changes", config: { statusValue: r.trigger.value } }
          : { type: "item_created", config: {} };
        const a = r.action || {};
        const step = a.type === "setStatus" ? { kind: "action", type: "change_status", config: { value: a.value } }
          : a.type === "setPriority" ? { kind: "action", type: "set_priority", config: { value: a.value } }
          : { kind: "action", type: "notify", config: {} };
        step.id = uid();
        b.flow.steps.push(step);
        b.flow.active = !!r.active;
        delete b.rules;
      }
    }
    for (const g of b.groups || []) for (const t of g.tasks) {
      if (!t.cells) t.cells = {};
      if (!Array.isArray(t.files)) t.files = [];
    }
  }
  if (!state.wfFired) state.wfFired = {};
  if (!Array.isArray(state.workflows)) state.workflows = [];
  if (!Array.isArray(state.statuses) || !state.statuses.length) state.statuses = JSON.parse(JSON.stringify(DEFAULT_STATUSES));
  if (!Array.isArray(state.priorities) || !state.priorities.length) state.priorities = JSON.parse(JSON.stringify(DEFAULT_PRIORITIES));
  STATUSES = state.statuses;
  PRIORITIES = state.priorities;
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
    cells: {},        // custom column values: { colId: value }
    files: [],        // [{id,name,dataURL}]
    updates: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: opts.by || "u1",
  };
}

const COLUMN_TYPES = [
  { type: "text",     name: "Text",        icon: "doc",      color: "#0086c0", cat: "Essentials",  desc: "Add any text" },
  { type: "status",   name: "Status",      icon: "kanban",   color: "#00c875", cat: "Essentials",  desc: "Track progress with colored labels" },
  { type: "dropdown", name: "Dropdown",    icon: "chevDown", color: "#a25ddc", cat: "Essentials",  desc: "Pick one or more labels" },
  { type: "date",     name: "Date",        icon: "calendar", color: "#5559df", cat: "Essentials",  desc: "Pick a date" },
  { type: "people",   name: "People",      icon: "person",   color: "#579bfc", cat: "Essentials",  desc: "Assign team members" },
  { type: "numbers",  name: "Numbers",     icon: "numbers",  color: "#fdab3d", cat: "Essentials",  desc: "Track any number" },
  { type: "files",    name: "Files",       icon: "paperclip",color: "#ff158a", cat: "Super useful", desc: "Attach files" },
  { type: "checkbox", name: "Checkbox",    icon: "checkbox", color: "#00c875", cat: "Super useful", desc: "Mark done / not done" },
  { type: "doc",      name: "monday Doc",  icon: "doc",      color: "#0086c0", cat: "Super useful", desc: "Write a longer note" },
  { type: "lastupdate", name: "Last updated", icon: "clock",  color: "#66ccff", cat: "Super useful", desc: "Show when the item was last updated" },
  { type: "connect",  name: "Connect boards", icon: "link",  color: "#a25ddc", cat: "Super useful", desc: "Link an item from another board" },
  { type: "extract",  name: "Extract info",icon: "vibe",     color: "#ff642e", cat: "Super useful", desc: "AI-extract data (demo)" },
  { type: "timeline", name: "Timeline",    icon: "gantt",    color: "#037f4c", cat: "Super useful", desc: "Set a start–end date range" },
  { type: "priority", name: "Priority",    icon: "bolt",     color: "#401694", cat: "Super useful", desc: "Set priority labels" },
];
const colTypeMeta = (type) => COLUMN_TYPES.find(c => c.type === type) || COLUMN_TYPES[0];
// types that store a single chosen label id (rendered/edited like Status)
const LABEL_TYPES = ["status", "dropdown", "priority"];

const LABEL_PALETTE = ["#fdab3d", "#00c875", "#e2445c", "#579bfc", "#a25ddc", "#5559df", "#0086c0", "#ff642e", "#9d50dd", "#333333", "#ffcb00", "#c4c4c4"];

function defaultLabels(type) {
  if (type === "status") return [
    { id: uid(), label: "Working on it", color: "#fdab3d" },
    { id: uid(), label: "Done", color: "#00c875" },
    { id: uid(), label: "Stuck", color: "#e2445c" },
    { id: uid(), label: "", color: "#c4c4c4" },
  ];
  if (type === "priority") return [
    { id: uid(), label: "Critical", color: "#333333" },
    { id: uid(), label: "High", color: "#401694" },
    { id: uid(), label: "Medium", color: "#5559df" },
    { id: uid(), label: "Low", color: "#579bfc" },
  ];
  return [
    { id: uid(), label: "Option 1", color: "#579bfc" },
    { id: uid(), label: "Option 2", color: "#a25ddc" },
  ];
}

function mkColumn(type) {
  const meta = colTypeMeta(type);
  const col = { id: uid(), type, name: meta.name, width: type === "text" || type === "doc" || type === "timeline" ? 220 : 150 };
  if (LABEL_TYPES.includes(type)) col.labels = defaultLabels(type);
  return col;
}

function seed() {
  const b1 = {
    id: uid(),
    name: "Campaign Tracker",
    desc: "Manage any type of campaign. Assign owners, set timelines and keep track of where your campaign stands.",
    view: "table",
    views: ["table", "calendar", "kanban"],
    icon: "table",
    workspaceId: "w1",
    hidden: [],
    doc: "",
    widgets: [],
    creator: "u1",
    createdAt: Date.now(),
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
    views: ["table", "dashboard", "chart"],
    icon: "dashboard",
    workspaceId: "w1",
    hidden: [],
    doc: "",
    widgets: [
      { id: uid(), type: "numbers", title: "Total tasks", settings: { metric: "total" } },
      { id: uid(), type: "chart", title: "Status overview", settings: { chartType: "donut", metric: "status" } },
      { id: uid(), type: "chart", title: "Tasks by priority", settings: { chartType: "bar", metric: "priority" } },
      { id: uid(), type: "battery", title: "Status battery", settings: { metric: "status" } },
    ],
    creator: "u1",
    createdAt: Date.now(),
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
    workspaces: [{ id: "w1", name: "Main workspace", desc: "", color: "#00854d", letter: "M" }],
    activeWorkspace: "w1",
    people: [
      { id: "u1", name: "Gie", title: "Marketing Lead", email: "portfoliog1eee@gmail.com", role: "SPV", color: "#0073ea", avatar: null },
      { id: "u2", name: "Andi Pratama", title: "Content Strategist", email: "andi@campaign.co", role: "Admin", color: "#a25ddc", avatar: null },
      { id: "u3", name: "Sari Dewi", title: "Social Media Manager", email: "sari@campaign.co", role: "Marketing", color: "#00c875", avatar: null },
      { id: "u4", name: "Budi Santoso", title: "Graphic Designer", email: "budi@campaign.co", role: "Desainer", color: "#fdab3d", avatar: null },
    ],
    activeBoard: b1.id,
    boards: [b1, b2],
  };
}

const getWorkspace = () => state.workspaces.find(w => w.id === state.activeWorkspace) || state.workspaces[0];
const wsBoards = () => state.boards.filter(b => b.workspaceId === state.activeWorkspace);
const getBoard = () => state.boards.find(b => b.id === state.activeBoard) || wsBoards()[0] || state.boards[0];
const personById = (id) => state.people.find(p => p.id === id);
const me = () => personById(state.user) || state.people[0];
const ADMIN_EMAIL = "portfoliog1eee@gmail.com";
// Roles: SPV is the owner-level role (full control). The rest are member-level
// (can use boards, can't create workspaces). Viewer removed.
const OWNER_ROLE = "SPV";
const MEMBER_ROLES = ["Admin", "Marketing", "Desainer"];
const DEFAULT_MEMBER_ROLE = "Marketing";
// normalize any legacy role string to the new set
function normRole(r) {
  if (r === OWNER_ROLE) return OWNER_ROLE;
  if (r === "Owner") return OWNER_ROLE;
  if (MEMBER_ROLES.includes(r)) return r;
  return DEFAULT_MEMBER_ROLE; // "Member", "Viewer", missing → default member role
}
// main admin = the owner account (full control: can create workspaces, manage members).
// When signed into the cloud, admin is decided by the SERVER-VERIFIED email (tamper-resistant);
// offline/local falls back to the local owner role so the demo stays fully usable.
function isAdmin() {
  if (cloudOn() && window.CLOUD.user()) return (window.CLOUD.email() || "").toLowerCase() === ADMIN_EMAIL;
  const u = me();
  return !!u && (u.role === OWNER_ROLE || (u.email || "").toLowerCase() === ADMIN_EMAIL);
}
// signed into the shared team cloud?
const teamOn = () => cloudOn() && !!window.CLOUD.user();

// map the signed-in email to a person in the shared workspace, so "you" + role are correct
function reconcileIdentity() {
  if (!teamOn()) return;
  const email = (window.CLOUD.email() || "").toLowerCase();
  if (!email) return;
  let p = state.people.find(x => (x.email || "").toLowerCase() === email);
  if (!p) {
    p = { id: uid(), name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()), title: "Team member", email, role: email === ADMIN_EMAIL ? OWNER_ROLE : DEFAULT_MEMBER_ROLE, color: AVATAR_COLORS[state.people.length % AVATAR_COLORS.length], avatar: null };
    state.people.push(p);
  }
  if (email === ADMIN_EMAIL) p.role = OWNER_ROLE;
  state.user = p.id;
}
const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());

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
  // "item updated" trigger — skip the burst right after creation
  if (Date.now() - (task.createdAt || 0) > 1500) runWorkflows({ type: "updated", task });
}

/* ---------------- Dropdown manager ---------------- */

let openDd = null;

function closeDropdowns() {
  if (openDd) { openDd.el.remove(); openDd = null; }
}

function openDropdown(anchor, build, opts = {}) {
  // capture the anchor position BEFORE closing the current dropdown — otherwise an
  // anchor that lived inside that dropdown gets detached and reports a 0,0 rect
  // (popover would jump to the top-left corner).
  const r = anchor.getBoundingClientRect();
  closeDropdowns();
  const el = h("div", { class: "dropdown" });
  const close = () => closeDropdowns();
  build(el, close);
  document.body.appendChild(el);
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

// A small submenu that opens WITHOUT closing the parent dropdown.
// Lives inside the parent's element (so the outside-click handler keeps the parent open),
// positioned with fixed coords near the anchor. options: [{label, value, check}]
function nestedMenu(anchor, options, onPick) {
  if (!openDd) return;
  const existing = openDd.el.querySelector(".nested-menu");
  if (existing) existing.remove();
  const r = anchor.getBoundingClientRect();
  const m = h("div", { class: "dropdown nested-menu" });
  m.style.position = "fixed";
  for (const o of options) {
    m.append(h("div", { class: "dd-item", onclick: (e) => { e.stopPropagation(); m.remove(); onPick(o); } },
      h("span", { style: "flex:1" }, o.label), o.check ? ico("check", 14) : null));
  }
  openDd.el.appendChild(m);
  let x = Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8));
  let y = r.bottom + 4;
  if (y + m.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - m.offsetHeight - 4);
  m.style.left = x + "px";
  m.style.top = y + "px";
  const closer = (e) => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("mousedown", closer, true); } };
  setTimeout(() => document.addEventListener("mousedown", closer, true), 0);
}

document.addEventListener("mousedown", (e) => {
  if (openDd && !openDd.el.contains(e.target) && !(openDd.anchor.isConnected && openDd.anchor.contains(e.target))) {
    closeDropdowns();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (openDd) { closeDropdowns(); return; }
    if (q("#modal-root").firstChild) { closeModal(); return; }
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

/* ---------------- Modal ---------------- */

function closeModal() {
  const root = q("#modal-root");
  if (root) root.replaceChildren();
}

function openModal(build) {
  closeDropdowns();
  const root = q("#modal-root");
  const overlay = h("div", { class: "modal-overlay" });
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeModal(); });
  const card = h("div", { class: "modal-card" });
  build(card, closeModal);
  overlay.append(card);
  root.replaceChildren(overlay);
}

function modalPrompt(title, placeholder, value, onOk) {
  openModal((card, close) => {
    const input = h("input", { class: "modal-title-in", style: "font-size:18px", value, placeholder });
    card.append(h("div", { class: "modal-head" }, input));
    const ok = h("button", { class: "btn-primary" }, "Create");
    const submit = () => { const v = input.value.trim(); if (!v) { input.focus(); return; } close(); onOk(v); };
    ok.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") close(); });
    card.append(h("div", { class: "modal-foot" }, h("button", { class: "modal-cancel", onclick: close }, "Cancel"), ok));
    setTimeout(() => { input.focus(); input.select(); }, 0);
  });
}

function newItemModal(board, group, prefill = {}) {
  openModal((card, close) => {
    const data = {
      name: prefill.name || "",
      groupId: (group || board.groups[0] || {}).id,
      owners: new Set(prefill.owners || []),
      status: prefill.status || "none",
      due: prefill.due || "",
      priority: prefill.priority || "none",
    };

    const titleIn = h("input", { class: "modal-title-in", placeholder: "New Item", value: data.name });
    titleIn.addEventListener("input", () => data.name = titleIn.value);
    const closeBtn = h("button", { class: "icon-btn", onclick: close });
    closeBtn.append(ico("x", 16));
    card.append(h("div", { class: "modal-head" }, titleIn, closeBtn));

    const body = h("div", { class: "modal-body" });

    const field = (icon, iconColor, label, control) => h("div", { class: "mi-field" },
      h("div", { class: "mi-label" }, h("span", { class: "mi-ico", style: `background:${iconColor}` }, ico(icon, 13)), h("span", {}, label)),
      h("div", { class: "mi-control" }, control));

    // Group
    const groupBtn = h("button", { class: "mi-plain" });
    const drawGroup = () => { const g = board.groups.find(x => x.id === data.groupId) || board.groups[0]; groupBtn.replaceChildren(h("span", { class: "kb-dot", style: `background:${g ? g.color : "#999"}` }), h("span", {}, g ? g.name : "—")); };
    drawGroup();
    groupBtn.addEventListener("click", () => openDropdown(groupBtn, (dd, c) => {
      for (const g of board.groups) dd.append(ddItem(null, g.name, () => { data.groupId = g.id; drawGroup(); c(); }));
    }, { minWidth: 200 }));
    body.append(field("kanban", "#00c875", "Group", groupBtn));

    // Owner
    const ownerBtn = h("button", { class: "mi-plain muted" });
    const drawOwner = () => {
      const owners = [...data.owners].map(personById).filter(Boolean);
      ownerBtn.classList.toggle("muted", !owners.length);
      if (!owners.length) ownerBtn.replaceChildren(ico("personPlus", 15), h("span", {}, "Assign"));
      else { const stack = h("span", { class: "avatar-stack" }); owners.slice(0, 3).forEach(p => stack.append(avatarEl(p, 22))); ownerBtn.replaceChildren(stack, h("span", {}, owners.map(p => p.name.split(" ")[0]).join(", "))); }
    };
    drawOwner();
    ownerBtn.addEventListener("click", () => openDropdown(ownerBtn, (dd) => {
      dd.append(h("div", { class: "dd-title" }, "Assign people"));
      for (const p of state.people) {
        const has = data.owners.has(p.id);
        dd.append(h("div", { class: "dd-item", onclick: () => { has ? data.owners.delete(p.id) : data.owners.add(p.id); drawOwner(); refreshDd(); } },
          avatarEl(p, 24), h("span", { style: "flex:1" }, p.name), has ? ico("check", 14) : null));
      }
    }, { minWidth: 220 }));
    body.append(field("person", "#0086c0", "Owner", ownerBtn));

    // Status
    const statusBtn = h("button", { class: "mi-pill" });
    const drawStatus = () => { const s = STATUSES.find(x => x.id === data.status) || STATUSES[STATUSES.length - 1]; statusBtn.style.background = s.color; statusBtn.textContent = s.label; };
    drawStatus();
    statusBtn.addEventListener("click", () => openDropdown(statusBtn, (dd, c) => {
      for (const s of STATUSES) dd.append(h("div", { class: "dd-color", style: `background:${s.color}`, onclick: () => { data.status = s.id; drawStatus(); c(); } }, s.label));
    }, { minWidth: 170 }));
    body.append(field("kanban", "#00c875", "Status", statusBtn));

    // Due date
    const dateBtn = h("button", { class: "mi-plain" + (data.due ? "" : " muted") });
    const drawDate = () => { dateBtn.replaceChildren(ico("calendar", 15), h("span", {}, data.due ? fmtDate(data.due) : "+ Add date")); dateBtn.classList.toggle("muted", !data.due); };
    drawDate();
    dateBtn.addEventListener("click", () => openDropdown(dateBtn, (dd, c) => {
      const input = h("input", { type: "date", value: data.due });
      input.addEventListener("change", () => { data.due = input.value; drawDate(); c(); });
      const todayB = h("button", { onclick: () => { data.due = todayISO(); drawDate(); c(); } }, "Today");
      const clr = h("button", { onclick: () => { data.due = ""; drawDate(); c(); } }, "Clear");
      dd.append(h("div", { class: "date-pop" }, input, h("div", { class: "date-pop-row" }, todayB, clr)));
    }, { minWidth: 220 }));
    body.append(field("calendar", "#a25ddc", "Due date", dateBtn));

    // Priority
    const prioBtn = h("button", { class: "mi-pill" });
    const drawPrio = () => { const p = PRIORITIES.find(x => x.id === data.priority) || PRIORITIES[PRIORITIES.length - 1]; prioBtn.style.background = p.color; prioBtn.textContent = p.label || "—"; };
    drawPrio();
    prioBtn.addEventListener("click", () => openDropdown(prioBtn, (dd, c) => {
      for (const p of PRIORITIES) dd.append(h("div", { class: "dd-color", style: `background:${p.color}`, onclick: () => { data.priority = p.id; drawPrio(); c(); } }, p.label || "—"));
    }, { minWidth: 170 }));
    body.append(field("chart", "#5559df", "Priority", prioBtn));

    card.append(body);

    const createBtn = h("button", { class: "btn-primary" }, "Create Task");
    const submit = () => {
      if (!data.name.trim()) { toast("Please enter an item name"); titleIn.focus(); return; }
      let g = board.groups.find(x => x.id === data.groupId) || board.groups[0];
      if (!g) { addGroup(board); g = board.groups[0]; }
      const t = addTask(g, data.name.trim(), true);
      t.owners = [...data.owners];
      t.status = data.status;
      t.due = data.due;
      t.priority = data.priority;
      touch(t);
      g.collapsed = false;
      save();
      close();
      render();
      toast(`"${t.name}" added to ${g.name}`);
    };
    createBtn.addEventListener("click", submit);
    titleIn.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    card.append(h("div", { class: "modal-foot" }, h("button", { class: "modal-cancel", onclick: close }, "Cancel"), createBtn));

    setTimeout(() => { titleIn.focus(); titleIn.select(); }, 0);
  });
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
  runWorkflows({ type: "created", task: t });
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
    copy.createdAt = Date.now();
    touch(copy);
    loc.group.tasks.splice(loc.idx + 1, 0, copy);
    runWorkflows({ type: "created", task: copy });
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

function addBoard(opts = {}) {
  const views = opts.views || ["table", "kanban", "calendar"];
  const b = {
    id: uid(),
    name: opts.name || "New Board",
    desc: opts.desc || "Click to add a description for this board.",
    view: opts.view || views[0],
    views,
    icon: opts.icon || "table",
    kind: opts.kind || "board",
    workspaceId: opts.workspaceId || state.activeWorkspace,
    hidden: [],
    doc: "",
    widgets: [],
    columns: [],
    chartConfig: { chartType: "donut", metric: "status" },
    flow: opts.kind === "workflow" ? { active: false, trigger: null, steps: [], runs: [] } : undefined,
    creator: state.user,
    createdAt: Date.now(),
    groups: [
      { id: uid(), name: "Group 1", color: "#579bfc", collapsed: false, tasks: [] },
    ],
  };
  state.boards.push(b);
  switchBoard(b.id);
  toast(opts.toast || "Board created");
  return b;
}

/* ---------------- Workspaces ---------------- */

const WS_COLORS = ["#00854d", "#0073ea", "#a25ddc", "#e2445c", "#fdab3d", "#0086c0", "#ff642e", "#9d50dd"];

// pastel-only palette for the workspace logo editor
const WS_PASTEL = ["#ffd1d1", "#ffe0c2", "#fff1bf", "#d6f5cf", "#c2eede", "#cfe6ff", "#d7d6ff", "#ebd6ff", "#ffd6ef", "#e2e5ea"];
const WS_ICONS = ["table", "dashboard", "kanban", "calendar", "chart", "target", "bolt", "vibe", "folder", "agent", "form", "doc"];

// Anime (Frieren) character assets — files supplied by user in assets/characters/
const ANIME_CHARS = [
  { id: "frieren", name: "Frieren", img: "assets/characters/frieren.png" },
  { id: "fern",    name: "Fern",    img: "assets/characters/fern.png" },
  { id: "stark",   name: "Stark",   img: "assets/characters/stark.png" },
  { id: "himmel",  name: "Himmel",  img: "assets/characters/himmel.png" },
  { id: "heiter",  name: "Heiter",  img: "assets/characters/heiter.png" },
];
// hero portrait on workspace home — falls back to first available char art
const WH_HERO = "assets/characters/frieren.png";

// Soft Japanese palette options for the anime theme
const PALETTES = [
  { id: "sakura", name: "Sakura", dot: "#d96a8f" },
  { id: "matcha", name: "Matcha", dot: "#5b8c6e" },
  { id: "sora",   name: "Sora · sky", dot: "#4f8bb3" },
  { id: "fuji",   name: "Fuji · wisteria", dot: "#7d78c4" },
  { id: "kinari", name: "Kinari · beige", dot: "#a9885f" },
];

// pick readable glyph color (dark on pastel/light, white on saturated)
function textColorOn(hex) {
  if (!hex || hex[0] !== "#" || hex.length < 7) return "#fff";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#323338" : "#fff";
}

// render a workspace logo glyph: custom icon when set, else letter
const wsGlyph = (w, iconSize) => (w.icon ? ico(w.icon, iconSize) : w.letter);

// Clean white theme + accent color derived from the user's avatar character
const CHAR_ACCENT = {
  frieren: "#4f8f93", fern: "#7d5bc0", stark: "#d05a37", himmel: "#3f7fcf", heiter: "#4f9e63",
};
const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbaOf = (h, a) => { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; };
const darkenHex = (h, amt) => { const [r, g, b] = hexToRgb(h).map(v => Math.max(0, Math.round(v * (1 - amt)))); return `rgb(${r},${g},${b})`; };
function avatarAccent() {
  const p = (typeof me === "function") ? me() : null;
  let k = p && p.character;
  if (!k && p && p.avatar) { const m = /characters\/([a-z]+)\./i.exec(p.avatar); if (m) k = m[1].toLowerCase(); }
  return CHAR_ACCENT[k] || "#0073ea";
}
function applyAccent() {
  const acc = avatarAccent();
  const ds = document.documentElement.style;
  ds.setProperty("--primary", acc);
  ds.setProperty("--primary-hover", darkenHex(acc, 0.16));
  ds.setProperty("--primary-soft", rgbaOf(acc, 0.10));
  ds.setProperty("--primary-selected", rgbaOf(acc, 0.16));
}

function switchWorkspace(id) {
  if (ui.whSel) ui.whSel.clear();
  ui.whArchived = false;
  if (state.activeWorkspace === id) { openHome(); return; }
  state.activeWorkspace = id;
  const first = wsBoards()[0];
  state.activeBoard = first ? first.id : null;
  ui.home = true;
  resetBoardUi();
  save();
  render();
}

function addWorkspace() {
  if (!isAdmin()) { toast("Only the workspace admin can create workspaces"); return; }
  modalPrompt("Create workspace", "Workspace name", "", (name) => {
    const color = WS_COLORS[state.workspaces.length % WS_COLORS.length];
    const w = { id: uid(), name, desc: "", color, letter: (name[0] || "W").toUpperCase() };
    state.workspaces.push(w);
    state.activeWorkspace = w.id;
    const b = {
      id: uid(), name: "Getting started", desc: "Your first board in this workspace.",
      view: "table", views: ["table", "kanban", "calendar"], icon: "table",
      workspaceId: w.id, hidden: [], doc: "", widgets: [], creator: state.user, createdAt: Date.now(),
      groups: [{ id: uid(), name: "To-Do", color: "#579bfc", collapsed: false, tasks: [] }],
    };
    state.boards.push(b);
    state.activeBoard = b.id;
    ui.home = true;
    resetBoardUi();
    save();
    render();
    toast(`Workspace "${name}" created`);
  });
}

function workspaceMenu(anchor) {
  openDropdown(anchor, (el, close) => {
    const searchWrap = h("div", { class: "side-search", style: "margin:2px 0 8px" });
    const si = h("input", { type: "text", placeholder: "Search for a workspace" });
    searchWrap.append(ico("search", 14), si);
    el.append(searchWrap);

    const listHost = h("div", {});
    el.append(listHost);
    const draw = () => {
      listHost.replaceChildren();
      const f = si.value.toLowerCase();
      const matches = state.workspaces.filter(w => w.name.toLowerCase().includes(f));
      listHost.append(h("div", { class: "ws-dd-section" }, "My workspaces"));
      for (const w of matches) {
        const active = w.id === state.activeWorkspace;
        const it = h("div", { class: "dd-item" + (active ? "" : ""), style: active ? "background:var(--primary-selected)" : "", onclick: () => { close(); switchWorkspace(w.id); } },
          h("span", { class: "ws-dd-logo", style: `background:${w.color};color:${textColorOn(w.color)}` }, wsGlyph(w, 15)),
          h("span", { style: "flex:1" }, w.name),
          active ? ico("check", 14) : null);
        listHost.append(it);
      }
      if (!matches.length) listHost.append(h("div", { class: "dd-item disabled" }, "No workspaces found"));
    };
    si.addEventListener("input", draw);
    si.addEventListener("keydown", (e) => e.stopPropagation());
    draw();

    el.append(h("hr", { class: "dd-sep" }));
    if (isAdmin()) {
      el.append(ddItem("plus", "Add workspace", () => { close(); addWorkspace(); }));
    } else {
      const locked = h("div", { class: "dd-item disabled", title: "Only the workspace admin can create workspaces" },
        ico("plus", 15), h("span", { style: "flex:1" }, "Add workspace"), ico("gear", 13));
      el.append(locked);
    }
    el.append(ddItem("apps", "Browse all", () => { close(); toast("Browse all — coming soon in demo"); }));
  }, { minWidth: 260 });
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
  const idx = state.boards.indexOf(board);
  if (idx < 0) return;
  state.boards.splice(idx, 1);
  if (state.activeBoard === board.id) {
    const next = wsBoards()[0];
    if (next) { state.activeBoard = next.id; ui.home = false; }
    else { state.activeBoard = null; ui.home = true; }
  }
  resetBoardUi();
  save();
  render();
  toast(`Board "${board.name}" deleted`, () => {
    state.boards.splice(Math.min(idx, state.boards.length), 0, board);
    state.activeBoard = board.id;
    ui.home = false;
    save();
    render();
  });
}

function switchBoard(id) {
  state.activeBoard = id;
  ui.home = false;
  resetBoardUi();
  save();
  render();
}

function openHome() {
  ui.home = true;
  ui.panel = null;
  ui.sel.clear();
  if (ui.whSel) ui.whSel.clear();
  render();
}

function resetBoardUi() {
  ui.sel.clear();
  ui.panel = null;
  ui.person = null;
  ui.fStatus.clear();
  ui.fPriority.clear();
  if (ui.fGroup) ui.fGroup.clear();
  ui.sort = null;
  ui.search = "";
  ui.cal = null;
  ui.wfSel = null;
  ui.wfPanel = null;
  const gs = q("#global-search");
  if (gs) gs.value = "";
}

/* ---------------- Filtering / sorting ---------------- */

function filtersActive() {
  return ui.fStatus.size + ui.fPriority.size + (ui.fGroup ? ui.fGroup.size : 0);
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
  renderAuthGate();
}

/* ---------------- Login gate (must sign in to enter) ---------------- */

function renderAuthGate() {
  const signedIn = cloudOn() && !!window.CLOUD.user();
  const locked = cloudOn() && (!window.CLOUD.user() || ui.noAccess);
  let gate = document.getElementById("auth-gate");
  if (!locked) { if (gate) gate.remove(); document.documentElement.classList.remove("gated"); return; }
  document.documentElement.classList.add("gated");
  if (!gate) { gate = h("div", { id: "auth-gate" }); document.body.appendChild(gate); }
  gate.replaceChildren();

  const card = h("div", { class: "auth-card" });
  const brand = h("div", { class: "auth-brand" },
    h("svg", { width: "26", height: "26", viewBox: "0 0 24 24" }), // dots logo drawn below
    h("div", { class: "auth-brand-text" }, h("b", {}, "mira"), h("span", {}, "gie")));
  brand.firstChild.innerHTML = '<circle cx="5" cy="12" r="4" fill="#ff3d57"/><circle cx="12" cy="12" r="4" fill="#ffcb00"/><circle cx="19" cy="12" r="4" fill="#00c875"/>';
  card.append(brand);

  if (!ui.authResolved) {
    card.append(h("div", { class: "auth-loading" }, "Connecting…"));
    gate.append(card);
    return;
  }

  // signed in but not on the team allow-list
  if (signedIn && ui.noAccess) {
    card.append(h("h2", { class: "auth-title" }, "No access yet"));
    card.append(h("p", { class: "auth-sub" }, "You're signed in as " + (window.CLOUD.email() || "your account") + ", but you haven't been invited to this team. Ask the admin (" + ADMIN_EMAIL + ") to invite this email."));
    const out = h("button", { class: "auth-alt" }, "Sign out");
    out.addEventListener("click", async () => { out.disabled = true; await window.CLOUD.signOut(); });
    card.append(out);
    gate.append(card);
    return;
  }

  // two modes: returning user signs in; newly-invited user creates a password first
  ui.authMode = ui.authMode || "signin";
  const mode = ui.authMode;

  const tabs = h("div", { class: "auth-tabs" });
  const tabSignin = h("button", { class: "auth-tab" + (mode === "signin" ? " active" : "") }, "Sign in");
  const tabSignup = h("button", { class: "auth-tab" + (mode === "signup" ? " active" : "") }, "First time? Set password");
  tabSignin.addEventListener("click", () => { ui.authMode = "signin"; renderAuthGate(); });
  tabSignup.addEventListener("click", () => { ui.authMode = "signup"; renderAuthGate(); });
  tabs.append(tabSignin, tabSignup);
  card.append(tabs);

  card.append(h("p", { class: "auth-sub" }, mode === "signup"
    ? "Were you invited? Enter the email you were invited with and choose a password — this creates your account."
    : "Sign in with your team email and password."));

  const email = h("input", { type: "email", class: "auth-input", placeholder: "you@email.com", autocomplete: "email" });
  const pw = h("input", { type: "password", class: "auth-input", placeholder: mode === "signup" ? "Choose a password (min 6 chars)" : "Password", autocomplete: mode === "signup" ? "new-password" : "current-password" });
  const msg = h("div", { class: "auth-msg" });
  const primary = h("button", { class: "btn-primary auth-btn" }, mode === "signup" ? "Create account" : "Sign in");

  const friendlyErr = (raw) => {
    const s = (raw || "").toLowerCase();
    if (s.includes("invalid login")) return "Wrong email or password. Newly invited? Switch to “First time? Set password”.";
    if (s.includes("already registered")) return "This email already has an account — switch to “Sign in”.";
    if (s.includes("password")) return "Password must be at least 6 characters.";
    return raw;
  };

  const run = async () => {
    const e = email.value.trim(), p = pw.value;
    if (!e || p.length < 6) { msg.textContent = "Enter an email and a password of at least 6 characters."; return; }
    msg.textContent = "Working…";
    primary.disabled = true;
    const fn = mode === "signup" ? window.CLOUD.signUp : window.CLOUD.signIn;
    const r = await fn(e, p);
    primary.disabled = false;
    if (r.error) { msg.textContent = friendlyErr(r.error); return; }
    if (r.needsConfirm) { msg.textContent = "Account created — confirm via the email we sent, then sign in."; return; }
    msg.textContent = "Signed in — loading…";
    // onAuthStateChange loads the team workspace and drops this gate
  };
  primary.addEventListener("click", run);
  pw.addEventListener("keydown", (ev) => { if (ev.key === "Enter") run(); });
  email.addEventListener("keydown", (ev) => { if (ev.key === "Enter") pw.focus(); });

  card.append(email, pw, msg, primary);
  gate.append(card);
  setTimeout(() => email.focus(), 0);
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
  document.documentElement.dataset.skin = state.skin || "default";
  applyAccent();
  const themeBtn = q("#theme-btn");
  themeBtn.replaceChildren(ico(state.theme === "light" ? "moon" : "sun", 17));
  const bell = q("#bell-btn");
  bell.replaceChildren(ico("bell", 17));
  const meBtn = q("#me-btn");
  meBtn.replaceChildren(avatarEl(me(), 30));
  renderGreeting();
}

function avatarEl(person, size = 26) {
  if (!person) return h("span", { class: "avatar-empty" }, ico("person", 14));
  if (person.avatar) {
    const wrap = h("span", { class: "avatar has-photo", title: person.name, style: `width:${size}px;height:${size}px` });
    const img = h("img", { src: person.avatar, alt: person.name });
    // missing/broken image (e.g. asset not supplied yet) → fall back to initials
    img.addEventListener("error", () => {
      wrap.classList.remove("has-photo");
      wrap.style.background = person.color;
      wrap.style.fontSize = Math.round(size * 0.4) + "px";
      wrap.replaceChildren(initials(person.name));
    });
    wrap.append(img);
    return wrap;
  }
  return h("span", { class: "avatar", title: person.name, style: `background:${person.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px` }, initials(person.name));
}

/* ---------------- Render: sidebar ---------------- */

function renderSidebar() {
  const sb = q("#sidebar");
  sb.className = ui.sideCollapsed ? "collapsed" : "";
  sb.replaceChildren();

  const collapseBtn = h("button", { class: "icon-btn", title: ui.sideCollapsed ? "Expand" : "Collapse", onclick: () => { ui.sideCollapsed = !ui.sideCollapsed; renderSidebar(); } });
  collapseBtn.append(ico(ui.sideCollapsed ? "expand" : "collapse", 15));

  const w = getWorkspace();
  const wsChip = h("div", { class: "ws-chip", title: "Switch workspace" },
    h("span", { class: "ws-logo", style: `background:${w.color};color:${textColorOn(w.color)}` }, wsGlyph(w, 17)), h("span", {}, w.name), ui.sideCollapsed ? null : ico("chevDown", 14));
  wsChip.addEventListener("click", () => workspaceMenu(wsChip));

  const addNewBtn = h("button", { class: "ws-add", title: "Add new" });
  addNewBtn.append(ico("plus", 16));
  addNewBtn.addEventListener("click", (e) => { e.stopPropagation(); addNewMenu(addNewBtn); });

  sb.append(h("div", { class: "side-row" }, wsChip, ui.sideCollapsed ? null : addNewBtn, collapseBtn));

  if (ui.sideCollapsed) {
    const list = h("div", { id: "board-list" });
    sb.append(list);
    renderBoardList(list);
    return;
  }

  const search = h("input", { type: "text", placeholder: "Search boards", value: ui.sideSearch });
  search.addEventListener("input", () => {
    ui.sideSearch = search.value;
    renderBoardList(q("#board-list"));
  });
  sb.append(h("div", { class: "side-search" }, ico("search", 14), search));

  const agentsRow = h("div", { class: "side-static", onclick: () => toast("Workspace agents — coming soon in demo") },
    h("span", {}, "My workspace agents"), ico("chevRight", 14));
  sb.append(agentsRow);

  const addBtn = h("button", { title: "Add new", onclick: (e) => { e.stopPropagation(); addNewMenu(addBtn); } });
  addBtn.append(ico("plus", 15));
  sb.append(h("div", { class: "side-section" }, h("span", {}, "Content"), addBtn));

  const homeItem = h("div", {
    class: "side-item" + (ui.home ? " active" : ""),
    title: "Workspace home",
    onclick: () => openHome(),
  }, ico("home", 15), h("span", { class: "side-label" }, "Workspace home"));
  sb.append(homeItem);

  const list = h("div", { id: "board-list" });
  sb.append(list);
  renderBoardList(list);

}

function renderBoardList(list) {
  list.replaceChildren();
  const filter = ui.sideSearch.toLowerCase();
  if (!ui.sideCollapsed && !wsBoards().filter(b => !b.archived).length) {
    list.append(h("div", { class: "side-empty" }, h("b", {}, "This workspace is empty"), h("span", {}, 'Click the "+" button to begin adding your first items.')));
    return;
  }
  for (const b of wsBoards()) {
    if (b.archived) continue;
    if (filter && !b.name.toLowerCase().includes(filter)) continue;
    const menuBtn = h("button", { class: "item-menu", title: "Board menu" });
    menuBtn.append(ico("dots", 14));
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      boardMenu(menuBtn, b);
    });
    const item = h("div", {
      class: "side-item" + (!ui.home && b.id === state.activeBoard ? " active" : ""),
      title: b.name,
      onclick: () => { if (ui.home || b.id !== state.activeBoard) switchBoard(b.id); },
    }, ico(b.icon || "table", 15), h("span", { class: "side-label" }, b.name), menuBtn);
    list.append(item);
  }
}

/* ---------------- Add-new menu (sidebar +) ---------------- */

function addNewMenu(anchor) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Add new"));
    el.append(ddItem("table", "Board", () => { close(); addBoard({ name: "New Board" }); }));
    el.append(ddItem("dashboard", "Dashboard", () => {
      close();
      addBoard({ name: "New Dashboard", icon: "dashboard", view: "dashboard", views: ["dashboard"], kind: "dashboard", toast: "Dashboard created" });
    }));
    el.append(ddItem("doc", "Doc", () => {
      close();
      addBoard({ name: "New Doc", icon: "doc", view: "doc", views: ["doc", "table"], desc: "A simple doc for notes.", toast: "Doc created" });
    }));
    el.append(ddItem("form", "Form", () => {
      close();
      addBoard({ name: "New Form", icon: "form", view: "form", views: ["form", "table"], desc: "Collect items through a form.", toast: "Form created" });
    }));
    el.append(ddItem("workflow", "Workflow", () => {
      close();
      addBoard({ name: "New Workflow", icon: "workflow", views: ["table"], kind: "workflow", toast: "Workflow created" });
    }));
    el.append(h("hr", { class: "dd-sep" }));
    const soon = [
      ["agent", "Agent"],
      ["vibe", "Vibe app"],
      ["folder", "Folder"],
      ["template", "Template center"],
    ];
    for (const [icon, label] of soon) {
      const it = ddItem(icon, label, () => { close(); toast(`${label} — coming soon in demo`); }, "soon");
      it.append(h("span", { class: "dd-badge" }, "Soon"));
      el.append(it);
    }
  }, { minWidth: 230 });
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

  if (ui.home) { main.append(workspaceHomeEl()); return; }

  const board = getBoard();
  if (board && board.kind === "workflow") {
    main.append(workflowHeadEl(board));
    main.append(workflowViewEl(board));
    return;
  }
  if (!board) {
    const empty = h("div", { class: "empty-board" },
      h("div", { style: "font-size:16px;margin-bottom:10px;color:var(--text)" }, "This workspace has no boards yet"));
    const b = h("button", { class: "btn-primary", style: "margin:0 auto" });
    b.append(ico("plus", 14), h("span", {}, "Add board"));
    b.addEventListener("click", () => addBoard({ name: "New Board" }));
    empty.append(b);
    main.append(h("div", { style: "padding:60px" }, empty));
    return;
  }

  main.append(boardHeadEl(board));
  // Toolbar only for data views; doc/form/dashboard/chart/gantt have their own chrome.
  if (["table", "kanban", "calendar", "gantt"].includes(board.view)) main.append(toolbarEl(board));
  main.append(viewBodyEl(board));
}

function viewBodyEl(board) {
  if (board.kind === "workflow") return workflowViewEl(board);
  switch (board.view) {
    case "table":     return tableViewEl(board);
    case "kanban":    return kanbanViewEl(board);
    case "calendar":  return calendarViewEl(board);
    case "gantt":     return ganttViewEl(board);
    case "chart":     return chartViewEl(board);
    case "dashboard": return dashboardWidgetsEl(board);
    case "form":      return formViewEl(board);
    case "doc":       return docViewEl(board);
    case "gallery":   return galleryViewEl(board);
    default:          return tableViewEl(board);
  }
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
  for (const vid of board.views) {
    const vm = viewMeta(vid);
    const tab = h("button", { class: "tab" + (board.view === vid ? " active" : ""), draggable: "true", title: "Drag to reorder", onclick: () => { board.view = vid; save(); render(); } });
    tab.append(ico(vm.icon, 14), h("span", {}, viewTab(vid)));
    if (board.views.length > 1) {
      const x = h("span", { class: "tab-x", title: "Remove view" });
      x.append(ico("x", 12));
      x.addEventListener("click", (e) => { e.stopPropagation(); removeView(board, vid); });
      tab.append(x);
    }
    attachTabDnd(tab, board, vid);
    tabs.append(tab);
  }
  const plusTab = h("button", { class: "tab", title: "Add view" });
  plusTab.append(ico("plus", 14));
  plusTab.addEventListener("click", () => viewsMenu(plusTab, board));
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

function viewsMenu(anchor, board) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Board views"));
    for (const vm of VIEW_META) {
      const active = board.views.includes(vm.id);
      const it = h("div", { class: "dd-item", onclick: () => {
        close();
        if (!board.views.includes(vm.id)) board.views.push(vm.id);
        board.view = vm.id;
        save();
        render();
      } }, ico(vm.icon, 16), h("span", { style: "flex:1" }, vm.label), active ? ico("check", 14) : null);
      el.append(it);
    }
  }, { minWidth: 220 });
}

function addView(board, vid) {
  if (!board.views.includes(vid)) board.views.push(vid);
  board.view = vid;
  save();
  render();
}

function attachTabDnd(tab, board, vid) {
  tab.addEventListener("dragstart", (e) => {
    ui.drag = { type: "tab", vid };
    e.dataTransfer.effectAllowed = "move";
    tab.classList.add("tab-dragging");
  });
  tab.addEventListener("dragend", () => {
    ui.drag = null;
    document.querySelectorAll(".tab-dragging,.tab-drop-left,.tab-drop-right").forEach(x => x.classList.remove("tab-dragging", "tab-drop-left", "tab-drop-right"));
  });
  tab.addEventListener("dragover", (e) => {
    if (!ui.drag || ui.drag.type !== "tab" || ui.drag.vid === vid) return;
    e.preventDefault();
    const r = tab.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    tab.classList.toggle("tab-drop-right", after);
    tab.classList.toggle("tab-drop-left", !after);
  });
  tab.addEventListener("dragleave", () => tab.classList.remove("tab-drop-left", "tab-drop-right"));
  tab.addEventListener("drop", (e) => {
    if (!ui.drag || ui.drag.type !== "tab") return;
    e.preventDefault();
    const r = tab.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    const from = board.views.indexOf(ui.drag.vid);
    ui.drag = null;
    if (from < 0) return;
    const moved = board.views.splice(from, 1)[0];
    let to = board.views.indexOf(vid);
    if (after) to++;
    board.views.splice(to, 0, moved);
    save();
    render();
  });
}

function removeView(board, vid) {
  if (board.views.length <= 1) return;
  board.views = board.views.filter(v => v !== vid);
  if (board.view === vid) board.view = board.views[0];
  save();
  render();
}

function peopleManager(anchor) {
  openDropdown(anchor, (el, close) => {
    const admin = isAdmin();
    el.append(h("div", { class: "dd-title", style: "display:flex;align-items:center;justify-content:space-between" },
      h("span", {}, "Members · " + state.people.length),
      admin ? h("span", { class: "ws-role-chip", style: "background:var(--primary-soft);color:var(--primary);border:none" }, "Admin") : null));

    for (const p of state.people) {
      const isOwner = p.role === OWNER_ROLE;
      const row = h("div", { class: "pm-row" }, avatarEl(p, 30),
        h("div", { class: "pm-info" },
          h("div", { class: "pm-name" }, p.name + (p.id === state.user ? " (you)" : "")),
          h("div", { class: "pm-mail" }, p.email)));

      // role: owner fixed; admin can change others; else read-only chip
      if (!isOwner && admin && p.id !== state.user) {
        const roleBtn = h("button", { class: "ws-role-chip pm-role-btn" }, p.role || DEFAULT_MEMBER_ROLE, ico("chevDown", 11));
        roleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          nestedMenu(roleBtn, MEMBER_ROLES.map(r => ({ label: r, value: r, check: p.role === r })), (o) => {
            p.role = o.value; save();
            roleBtn.replaceChildren(o.value, ico("chevDown", 11)); // update chip in place; panel stays open
          });
        });
        row.append(roleBtn);
      } else {
        row.append(h("span", { class: "ws-role-chip" }, isOwner ? OWNER_ROLE : (p.role || DEFAULT_MEMBER_ROLE)));
      }

      const charBtn = h("button", { class: "row-act", title: "Anime character" });
      charBtn.append(ico("smile", 14));
      charBtn.addEventListener("click", (e) => { e.stopPropagation(); characterPicker(charBtn, p, () => peopleManager(anchor)); });
      row.append(charBtn);

      if (p.id !== state.user && !isOwner && admin) {
        const del = h("button", { class: "row-act", title: "Remove member" });
        del.append(ico("x", 13));
        del.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (teamOn() && p.email) { const r = await window.CLOUD.removeMember(p.email); if (r.error) { toast("Remove failed: " + r.error); return; } }
          state.people = state.people.filter(x => x.id !== p.id);
          for (const b of state.boards) for (const g of b.groups) for (const t of g.tasks) t.owners = t.owners.filter(o => o !== p.id);
          if (ui.person === p.id) ui.person = null;
          save(); softRender(); peopleManager(anchor);
        });
        row.append(del);
      }
      el.append(row);
    }

    el.append(h("hr", { class: "dd-sep" }));
    el.append(h("div", { class: "dd-title" }, "Invite by email"));

    const nameIn = h("input", { type: "text", placeholder: "Name (optional)" });
    const mailIn = h("input", { type: "email", placeholder: "name@email.com" });

    // role selector — only admin can set a role; others invite as default member role
    let inviteRole = DEFAULT_MEMBER_ROLE;
    const roleSel = h("button", { class: "pm-invite-role" }, inviteRole, ico("chevDown", 12));
    if (admin) {
      roleSel.addEventListener("click", (e) => {
        e.stopPropagation();
        nestedMenu(roleSel, MEMBER_ROLES.map(r => ({ label: r, value: r, check: inviteRole === r })), (o) => {
          inviteRole = o.value; roleSel.replaceChildren(o.value, ico("chevDown", 12));
        });
      });
    } else {
      roleSel.classList.add("disabled");
      roleSel.title = "Only admin can assign roles";
    }

    const sendBtn = h("button", { class: "btn-primary", style: "padding:7px 14px" }, "Send invite");
    const doInvite = async () => {
      const email = mailIn.value.trim().toLowerCase();
      if (!validEmail(email)) { toast("Enter a valid email"); mailIn.focus(); return; }
      if (state.people.some(p => (p.email || "").toLowerCase() === email)) { toast("That email is already a member"); return; }
      const name = nameIn.value.trim() || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const role = admin ? inviteRole : DEFAULT_MEMBER_ROLE;
      // real invite: add to the team allow-list so they can load the shared workspace
      if (teamOn()) {
        if (!isAdmin()) { toast("Only the admin can invite members"); return; }
        sendBtn.textContent = "Inviting…";
        const r = await window.CLOUD.addMember(email, role, name);
        sendBtn.textContent = "Send invite";
        if (r.error) { toast("Invite failed: " + r.error); return; }
      }
      state.people.push({ id: uid(), name, title: "Invited member", email, role, color: AVATAR_COLORS[state.people.length % AVATAR_COLORS.length], avatar: null, invited: true });
      nameIn.value = ""; mailIn.value = "";
      save(); softRender(); peopleManager(anchor);
      toast(teamOn() ? `Invited ${email} — they can now sign up & join` : `Invite sent to ${email} (demo)`);
    };
    sendBtn.addEventListener("click", doInvite);
    mailIn.addEventListener("keydown", (e) => { if (e.key === "Enter") doInvite(); e.stopPropagation(); });
    nameIn.addEventListener("keydown", (e) => e.stopPropagation());

    el.append(h("div", { class: "pm-invite" }, nameIn, h("div", { class: "pm-invite-row" }, mailIn, roleSel), sendBtn));
    el.append(h("div", { class: "pm-note" }, "Invited members can use boards but can't create new workspaces."));
  }, { minWidth: 300, alignRight: true });
}

/* ---------------- Render: toolbar ---------------- */

function toolbarEl(board) {
  const bar = h("div", { class: "toolbar" });

  const newBtn = h("button", { class: "btn-primary" });
  newBtn.append(h("span", {}, "New task"), ico("chevDown", 13));
  newBtn.addEventListener("click", () => {
    if (!board.groups.length) addGroup(board);
    newItemModal(board, board.groups[0], {});
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
  if (ui.home) { renderMain(); return; }
  const main = q("#main");
  const old = main.querySelector(".view-root");
  if (!old) return;
  // preserve scroll position so a cell action doesn't jump back to the first columns
  const sx = old.scrollLeft, sy = old.scrollTop;
  const next = viewBodyEl(board);
  old.replaceWith(next);
  if (sx || sy) { next.scrollLeft = sx; next.scrollTop = sy; }
}

function newTaskIn(board, group) {
  const t = addTask(group, "New task", true);
  group.collapsed = false;
  ui.editTask = t.id;
  save();
  render();
}

function filterPanel(anchor) {
  const board = getBoard();
  openDropdown(anchor, (el, close) => {
    el.classList.add("qf-pop");
    const all = board.groups.flatMap(g => g.tasks);
    const passes = (t, g) => (!ui.fGroup.size || ui.fGroup.has(g.id))
      && (!ui.fStatus.size || ui.fStatus.has(t.status))
      && (!ui.fPriority.size || ui.fPriority.has(t.priority))
      && (!ui.person || t.owners.includes(ui.person))
      && (!ui.search || t.name.toLowerCase().includes(ui.search.toLowerCase()));
    const shown = board.groups.reduce((a, g) => a + g.tasks.filter(t => passes(t, g)).length, 0);

    const head = h("div", { class: "qf-head" },
      h("div", {}, h("b", {}, "Quick filters"),
        h("span", { class: "muted", style: "margin-left:8px;font-size:13px" }, `Showing ${shown === all.length ? "all of " : ""}${shown} of ${all.length} items`)),
      h("button", { class: "qf-clear", onclick: () => { ui.fGroup.clear(); ui.fStatus.clear(); ui.fPriority.clear(); softRender(); refreshDd(); } }, "Clear all"));
    el.append(head);

    const cols = h("div", { class: "qf-cols" });
    const col = (title, items, set) => {
      const c = h("div", { class: "qf-col" }, h("div", { class: "qf-col-title" }, title));
      for (const it of items) {
        const on = set.has(it.id);
        const row = h("button", { class: "qf-row" + (on ? " sel" : "") },
          h("span", { class: "qf-dot", style: `background:${it.color}` }),
          h("span", { class: "qf-label" }, it.label),
          h("span", { class: "qf-count" }, it.n));
        row.addEventListener("click", () => { on ? set.delete(it.id) : set.add(it.id); softRender(); refreshDd(); });
        c.append(row);
      }
      return c;
    };

    cols.append(col("Group", board.groups.map(g => ({ id: g.id, label: g.name, color: g.color, n: g.tasks.length })), ui.fGroup));
    cols.append(col("Status", STATUSES.map(s => ({ id: s.id, label: s.label || "Blank", color: s.color, n: all.filter(t => t.status === s.id).length })), ui.fStatus));
    cols.append(col("Priority", PRIORITIES.map(p => ({ id: p.id, label: p.label || "Blank", color: p.color, n: all.filter(t => t.priority === p.id).length })), ui.fPriority));
    el.append(cols);
  }, { minWidth: 560 });
}

function sortPanel(anchor) {
  const FIELDS = [
    { id: "name", label: "Item" },
    { id: "status", label: "Status" },
    { id: "date", label: "Due date" },
    { id: "priority", label: "Priority" },
    { id: "updated", label: "Last updated" },
  ];
  openDropdown(anchor, (el) => {
    el.classList.add("sortby-pop");
    el.append(h("div", { class: "qf-head" }, h("b", {}, "Sort by"),
      h("button", { class: "qf-clear", disabled: !ui.sort, onclick: () => { ui.sort = null; softRender(); refreshDd(); } }, "Clear")));

    const colSel = h("select", { class: "sortby-sel" });
    colSel.append(h("option", { value: "" }, "Choose column"));
    for (const f of FIELDS) colSel.append(h("option", { value: f.id }, f.label));
    colSel.value = ui.sort ? ui.sort.field : "";
    colSel.addEventListener("change", () => {
      if (!colSel.value) { ui.sort = null; } else { ui.sort = { field: colSel.value, dir: (ui.sort && ui.sort.dir) || "asc" }; }
      softRender(); refreshDd();
    });

    const dirSel = h("select", { class: "sortby-sel sortby-dir" });
    dirSel.append(h("option", { value: "asc" }, "↑ Ascending"), h("option", { value: "desc" }, "↓ Descending"));
    dirSel.value = ui.sort ? ui.sort.dir : "asc";
    dirSel.disabled = !ui.sort;
    dirSel.addEventListener("change", () => { if (ui.sort) { ui.sort.dir = dirSel.value; softRender(); refreshDd(); } });

    el.append(h("div", { class: "sortby-row" }, h("span", { class: "sortby-grip" }, ico("grip", 14)), colSel, dirSel));
    el.append(h("div", { class: "sortby-new muted" }, "+ New sort"));
  }, { minWidth: 460 });
}

function hidePanel(anchor, board) {
  openDropdown(anchor, (el) => {
    el.classList.add("hide-pop");
    el.append(h("div", { class: "qf-head" }, h("b", {}, "Display columns")));
    const search = h("input", { class: "hide-search", type: "text", placeholder: "Find columns to show / hide" });
    el.append(h("div", { class: "hide-searchwrap" }, ico("search", 14), search));
    const host = h("div", {});
    el.append(host);

    // Item column = the locked text column (name). Subitem columns = everything else.
    const sub = [...COLUMNS.map(c => ({ id: c.id, label: colLabel(board, c) })),
                 ...board.columns.map(c => ({ id: c.id, label: c.name }))];

    const checkRow = (label, sub2, on, fn, cls) => {
      const cb = h("input", { type: "checkbox" }); cb.checked = on;
      cb.addEventListener("change", fn);
      return h("label", { class: "hide-row " + (cls || "") }, cb,
        h("span", { class: "hide-label" }, label),
        sub2 ? h("span", { class: "hide-sub" }, sub2) : null);
    };

    const draw = () => {
      host.replaceChildren();
      const f = search.value.toLowerCase();
      const subF = sub.filter(c => !f || c.label.toLowerCase().includes(f));
      const allOn = subF.length > 0 && subF.every(c => !board.hidden.includes(c.id));

      host.append(checkRow("All columns", subF.length + " selected", allOn, () => {
        const turnOn = !allOn;
        subF.forEach(c => { if (turnOn) board.hidden = board.hidden.filter(x => x !== c.id); else if (!board.hidden.includes(c.id)) board.hidden.push(c.id); });
        save(); softRender(); draw();
      }, "hide-all"));

      if (!f || "item".includes(f)) {
        host.append(h("div", { class: "hide-group" }, "Item columns"));
        const locked = h("label", { class: "hide-row hide-locked", title: "The Item column can't be hidden" },
          h("input", { type: "checkbox", checked: true, disabled: true }),
          h("span", { class: "hide-label" }, colLabel(board, { id: "name", label: "Item" })));
        host.append(locked);
      }

      if (subF.length) {
        host.append(h("div", { class: "hide-group" }, "Subitem columns"));
        for (const c of subF) host.append(checkRow(c.label, null, !board.hidden.includes(c.id), () => {
          if (board.hidden.includes(c.id)) board.hidden = board.hidden.filter(x => x !== c.id);
          else board.hidden.push(c.id);
          save(); softRender(); draw();
        }));
      } else {
        host.append(h("div", { class: "muted", style: "padding:8px" }, "No matches"));
      }
    };
    search.addEventListener("input", draw);
    search.addEventListener("keydown", (e) => e.stopPropagation());
    draw();
  }, { minWidth: 320 });
}

/* ---------------- Render: table view ---------------- */

// Unified, reorderable column list (everything after the fixed name column).
// Order lives in board.colOrder (sys ids + custom col ids); name column is always first and is NOT in it.
function orderedCols(board) {
  const sysMap = {}; for (const c of COLUMNS) sysMap[c.id] = c;
  const customMap = {}; for (const c of board.columns) customMap[c.id] = c;
  const known = new Set([...Object.keys(sysMap), ...Object.keys(customMap)]);
  let order = Array.isArray(board.colOrder) ? board.colOrder.filter(id => known.has(id)) : [];
  if (!order.length) order = [...COLUMNS.map(c => c.id), ...board.columns.map(c => c.id)];
  for (const c of COLUMNS) if (!order.includes(c.id)) order.push(c.id);
  for (const c of board.columns) if (!order.includes(c.id)) order.push(c.id);
  board.colOrder = order;
  const out = [];
  for (const id of order) {
    if (board.hidden.includes(id)) continue;
    if (sysMap[id]) out.push({ kind: "sys", id, w: colW(board, id), sys: sysMap[id] });
    else if (customMap[id]) out.push({ kind: "custom", id, w: colW(board, id), col: customMap[id] });
  }
  return out;
}

// effective column width (per-board override in board.colWidths, else default)
function colW(board, id) {
  const ov = board.colWidths && board.colWidths[id];
  if (ov) return ov;
  const sys = COLUMNS.find(c => c.id === id); if (sys) return sys.w;
  const cc = board.columns.find(c => c.id === id); return cc ? (cc.width || 150) : 150;
}

// live-resize: update grid templates + custom col width without a full rebuild
function setColWidth(board, id, w) {
  board.colWidths = board.colWidths || {};
  board.colWidths[id] = w;
  const cc = board.columns.find(c => c.id === id); if (cc) cc.width = w;
  const main = q("#main"); if (!main) return;
  const tpl = gridTemplate(board);
  main.querySelectorAll(".g-row:not(.add-task-row)").forEach(r => { r.style.gridTemplateColumns = tpl; });
  const wrap = main.querySelector(".group-wrap"); if (wrap) wrap.style.minWidth = gridMinWidth(board) + "px";
}

// drag the right edge of a column header to resize it
function attachColResize(cell, board, id) {
  const grip = h("div", { class: "col-resize", title: "Resize column" });
  grip.addEventListener("mousedown", (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startW = colW(board, id);
    cell.setAttribute("draggable", "false");
    document.body.style.cursor = "col-resize";
    let raf = 0, w = startW;
    const move = (ev) => { w = Math.max(80, startW + (ev.clientX - startX)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; setColWidth(board, id, w); }); };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      cell.setAttribute("draggable", "true");
      setColWidth(board, id, w); save();
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
  grip.addEventListener("click", (e) => e.stopPropagation());
  cell.appendChild(grip);
}

// Rule: a Text content column is locked (cannot be dragged). Everything else can reorder.
const colReorderable = (oc) => oc.kind === "custom" ? oc.col.type !== "text" : true;

function moveColOrder(board, fromId, toId, after) {
  if (fromId === toId) return;
  orderedCols(board); // ensure board.colOrder exists
  const order = board.colOrder;
  const fi = order.indexOf(fromId); if (fi < 0) return;
  order.splice(fi, 1);
  let ti = order.indexOf(toId); if (ti < 0) { order.splice(fi, 0, fromId); return; }
  if (after) ti++;
  order.splice(ti, 0, fromId);
  save(); render();
}

function gridTemplate(board) {
  const oc = orderedCols(board);
  return `36px minmax(280px, 1fr) ${oc.map(c => c.w + "px").join(" ")} 40px`.replace(/\s+/g, " ").trim();
}

// Total intrinsic width so the canvas scrolls horizontally instead of clipping columns.
function gridMinWidth(board) {
  return 36 + 280 + orderedCols(board).reduce((a, c) => a + c.w, 0) + 40;
}

function tableViewEl(board) {
  const canvas = h("div", { class: "view-root board-canvas h-scroll" });
  const wrap = h("div", { class: "group-wrap", style: `min-width:${gridMinWidth(board)}px` });
  canvas.append(wrap);

  if (!board.groups.length) {
    wrap.append(h("div", { class: "empty-board" }, "This board is empty. Add a group to get started."));
  }

  for (const group of board.groups) {
    if (ui.fGroup.size && !ui.fGroup.has(group.id)) continue;
    wrap.append(groupEl(board, group));
  }

  const addG = h("button", { class: "add-group-btn", onclick: () => addGroup(board) });
  addG.append(ico("plus", 15), h("span", {}, "Add new group"));
  wrap.append(addG);

  // Freeze pane is handled with CSS position:sticky (see .check-col/.name-col),
  // which — unlike a JS translateX — does not inflate the scroll width.
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
  headRow.append(nameColHeaderEl(board));
  for (const oc of orderedCols(board)) headRow.append(colHeaderUnifiedEl(board, oc));
  const addCol = h("div", { class: "cell add-col", title: "Add column" }, ico("plus", 14));
  addCol.addEventListener("click", () => addColumnMenu(addCol, board, board.columns.length));
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
  addRow.append(h("div", { class: "cell name-col", style: "border-left:1px solid var(--border)" }, addInput));
  attachRowDropZone(addRow, group, () => group.tasks.length);
  table.append(addRow);

  // ---- summary row
  if (group.tasks.length) {
    const sum = h("div", { class: "g-row summary-row", style: `grid-template-columns:${tpl}` });
    sum.append(h("div", { class: "cell check-col" }), h("div", { class: "cell name-col" }));
    for (const oc of orderedCols(board)) {
      const cell = h("div", { class: "cell" });
      if (oc.kind === "sys") {
        if (oc.id === "status") cell.append(batteryEl(tasks, "status"));
        else if (oc.id === "priority") cell.append(batteryEl(tasks, "priority"));
        else if (oc.id === "date") cell.append(rangePillEl(tasks));
      } else {
        const col = oc.col;
        if (col.type === "numbers") { const total = tasks.reduce((a, t) => a + (Number(t.cells[col.id]) || 0), 0); cell.append(h("span", { style: "font-weight:700" }, total ? String(Math.round(total * 100) / 100) : "")); }
        else if (LABEL_TYPES.includes(col.type)) cell.append(colBatteryEl(tasks, col));
      }
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
    const custom = h("input", { type: "color", value: /^#([0-9a-f]{6})$/i.test(group.color) ? group.color : "#579bfc", title: "Custom color", style: "width:100%;height:32px;border:none;background:none;cursor:pointer;margin-top:4px" });
    custom.addEventListener("input", () => { group.color = custom.value; save(); render(); });
    el.append(pal, custom, h("hr", { class: "dd-sep" }),
      ddItem("trash", "Delete group", () => { close(); deleteGroup(board, group); }, "danger"));
  }, { minWidth: 210 });
}

/* ---------------- Custom columns ---------------- */

function setColVal(task, col, v) {
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) delete task.cells[col.id];
  else task.cells[col.id] = v;
  touch(task);
  save();
  runWorkflows({ type: "cell", task, col });
}

function softRenderTable(board) { if (!ui.home && getBoard() === board && board.view === "table") rerenderViewOnly(board); }

/* ---- Numbers column: validation + conditional rules ---- */
const COND_OPS = [
  { id: "equals", label: "equals" },
  { id: "ne",     label: "is not" },
  { id: "gt",     label: "greater than" },
  { id: "lt",     label: "less than" },
  { id: "gte",    label: "greater or equal" },
  { id: "lte",    label: "less or equal" },
];
function condMatch(op, a, b) {
  switch (op) { case "equals": return a === b; case "ne": return a !== b; case "gt": return a > b; case "lt": return a < b; case "gte": return a >= b; case "lte": return a <= b; }
  return false;
}
// returns {ok, msg} — checks a number against this column's Validation rule
function validateNumber(col, n) {
  const V = col.validation;
  if (!V || V.type !== "validation") return { ok: true };
  if (V.integer && !Number.isInteger(n)) return { ok: false, msg: "Whole numbers only" };
  if (V.min != null && V.min !== "" && n < Number(V.min)) return { ok: false, msg: `Minimum is ${V.min}` };
  if (V.max != null && V.max !== "" && n > Number(V.max)) return { ok: false, msg: `Maximum is ${V.max}` };
  return { ok: true };
}
// when this number changes, apply any Conditional rules that set other columns
function applyColConditionals(board, task, col, n) {
  const V = col.validation;
  if (!V || V.type !== "conditional" || !Array.isArray(V.rules)) return;
  for (const r of V.rules) {
    if (r.value === "" || r.value == null) continue;
    if (!condMatch(r.op, n, Number(r.value))) continue;
    for (const th of (r.then || [])) {
      const tc = board.columns.find(c => c.id === th.colId);
      if (!tc || th.value == null || th.value === "") continue;
      setColVal(task, tc, tc.type === "numbers" ? Number(th.value) : th.value);
    }
  }
}

function colHeaderEl(board, col) {
  const cell = h("div", { class: "cell col-head-cell", style: "justify-content:space-between;gap:4px;cursor:default" });
  cell.append(h("span", { class: "col-name", title: col.name, style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, col.name));
  const menu = h("button", { class: "col-menu-btn", title: "Column options" });
  menu.append(ico("dots", 13));
  menu.addEventListener("click", (e) => { e.stopPropagation(); colMenu(menu, board, col); });
  cell.append(menu);
  return cell;
}

// header for any reorderable column (sys or custom), wired for drag-to-reorder
function colHeaderUnifiedEl(board, oc) {
  const cell = oc.kind === "sys" ? sysColHeaderEl(board, oc.sys) : colHeaderEl(board, oc.col);
  attachColDrag(cell, board, oc.id, colReorderable(oc));
  attachColResize(cell, board, oc.id);
  return cell;
}

// canDrag=false → not grabbable (locked Text col) but still a valid drop target
function attachColDrag(cell, board, id, canDrag) {
  cell.classList.add("col-drag");
  if (canDrag) {
    cell.setAttribute("draggable", "true");
    cell.style.cursor = "grab";
    cell.title = "Drag to reorder";
    cell.addEventListener("dragstart", (e) => { ui.colDrag = { boardId: board.id, id }; e.dataTransfer.effectAllowed = "move"; cell.classList.add("col-dragging"); });
    cell.addEventListener("dragend", () => { ui.colDrag = null; document.querySelectorAll(".col-drop-left,.col-drop-right,.col-dragging").forEach(x => x.classList.remove("col-drop-left", "col-drop-right", "col-dragging")); });
  }
  cell.addEventListener("dragover", (e) => {
    if (!ui.colDrag || ui.colDrag.boardId !== board.id || ui.colDrag.id === id) return;
    e.preventDefault();
    const r = cell.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    cell.classList.toggle("col-drop-right", after);
    cell.classList.toggle("col-drop-left", !after);
  });
  cell.addEventListener("dragleave", () => cell.classList.remove("col-drop-left", "col-drop-right"));
  cell.addEventListener("drop", (e) => {
    if (!ui.colDrag || ui.colDrag.boardId !== board.id) return;
    e.preventDefault();
    cell.classList.remove("col-drop-left", "col-drop-right");
    const r = cell.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    const fromId = ui.colDrag.id;
    ui.colDrag = null;
    moveColOrder(board, fromId, id, after);
  });
}

// system column cell by id (used in unified row render)
function sysCellEl(task, id) {
  switch (id) {
    case "owner": return ownerCellEl(task);
    case "status": return statusCellEl(task);
    case "date": return dateCellEl(task);
    case "priority": return priorityCellEl(task);
    case "updated": return updatedCellEl(task);
  }
  return h("div", { class: "cell" });
}

const colLabel = (board, c) => (board.colNames && board.colNames[c.id]) || c.label;

function nameColHeaderEl(board) {
  const cell = h("div", { class: "cell name-col col-head-cell", style: "justify-content:space-between;gap:4px" });
  cell.append(h("span", { class: "col-name" }, colLabel(board, { id: "name", label: "Task" })));
  const menu = h("button", { class: "col-menu-btn", title: "Column options" });
  menu.append(ico("dots", 13));
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
    openDropdown(menu, (el, close) => el.append(ddItem("pencil", "Rename column", () => {
      close();
      modalPrompt("Rename column", "Column name", colLabel(board, { id: "name", label: "Task" }), (v) => { board.colNames.name = v; save(); render(); });
    })), { minWidth: 180 });
  });
  cell.append(menu);
  return cell;
}

function sysColHeaderEl(board, c) {
  const cell = h("div", { class: "cell col-head-cell", style: "justify-content:space-between;gap:4px;cursor:default" });
  cell.append(h("span", { class: "col-name", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, colLabel(board, c)));
  const menu = h("button", { class: "col-menu-btn", title: "Column options" });
  menu.append(ico("dots", 13));
  menu.addEventListener("click", (e) => { e.stopPropagation(); sysColMenu(menu, board, c); });
  cell.append(menu);
  return cell;
}

function sysColMenu(anchor, board, c) {
  openDropdown(anchor, (el, close) => {
    el.append(ddItem("pencil", "Rename column", () => {
      close();
      modalPrompt("Rename column", "Column name", colLabel(board, c), (v) => { board.colNames[c.id] = v; save(); render(); });
    }));
    if (c.id === "status" || c.id === "priority") el.append(ddItem("kanban", "Edit Labels", () => { close(); systemLabelEditor(anchor, c.id); }));
    el.append(h("hr", { class: "dd-sep" }), ddItem("eyeOff", "Hide column", () => { close(); if (!board.hidden.includes(c.id)) board.hidden.push(c.id); save(); render(); }));
    el.append(ddItem("trash", "Delete column", () => { close(); deleteSysColumn(board, c); }, "danger"));
  }, { minWidth: 190 });
}

// system columns hold built-in data, so "delete" removes them from this board's view
// (re-add later from the Hide menu). Undo restores immediately.
function deleteSysColumn(board, c) {
  if (!confirm(`Delete the "${colLabel(board, c)}" column from this board?`)) return;
  if (!board.hidden.includes(c.id)) board.hidden.push(c.id);
  if (Array.isArray(board.colOrder)) board.colOrder = board.colOrder.filter(id => id !== c.id);
  save();
  render();
  toast(`Column "${colLabel(board, c)}" deleted`, () => {
    board.hidden = board.hidden.filter(id => id !== c.id);
    save(); render();
  });
}

function colMenu(anchor, board, col) {
  openDropdown(anchor, (el, close) => {
    el.append(ddItem("pencil", "Rename", () => { close(); modalPrompt("Rename column", "Column name", col.name, (v) => { col.name = v; save(); render(); }); }));
    if (LABEL_TYPES.includes(col.type)) el.append(ddItem("kanban", "Edit Labels", () => { close(); labelEditor(anchor, board, col); }));
    if (col.type === "numbers") {
      const has = col.validation && col.validation.type;
      const it = ddItem("gear", "Validation rules", () => { close(); columnRulesModal(board, col); });
      if (has) it.append(h("span", { class: "dd-badge" }, "On"));
      el.append(it);
    }
    el.append(ddItem("plus", "Add column to the right", () => { close(); addColumnMenu(anchor, board, board.columns.indexOf(col) + 1); }));
    el.append(ddItem("eyeOff", "Hide column", () => { close(); if (!board.hidden.includes(col.id)) board.hidden.push(col.id); save(); render(); }));
    el.append(h("hr", { class: "dd-sep" }), ddItem("trash", "Delete column", () => { close(); deleteColumn(board, col); }, "danger"));
  }, { minWidth: 210 });
}

function columnRulesModal(board, col) {
  openModal((card, close) => {
    card.classList.add("cvr-modal");
    const data = col.validation && col.validation.type
      ? JSON.parse(JSON.stringify(col.validation))
      : { type: null, min: "", max: "", integer: false, rules: [] };
    if (!Array.isArray(data.rules)) data.rules = [];

    const closeBtn = h("button", { class: "icon-btn", onclick: close }); closeBtn.append(ico("x", 16));
    card.append(h("div", { class: "modal-head" },
      h("div", { style: "display:flex;align-items:center;gap:8px;flex:1" }, ico("gear", 18), h("b", {}, "Column validation rules")), closeBtn));

    const body = h("div", { class: "modal-body" });
    body.append(h("div", { class: "muted", style: "margin-bottom:10px" }, "Set type and configuration:"));

    // target columns selectable in "Then"
    const targets = board.columns.filter(c => c.id !== col.id && ["status", "dropdown", "numbers", "text", "date"].includes(c.type));

    const sel = (opts, cur, onChange) => {
      const s = h("select", { class: "cvr-sel" });
      for (const o of opts) s.append(h("option", { value: o.id }, o.label));
      s.value = cur != null ? String(cur) : "";
      s.addEventListener("change", () => onChange(s.value));
      return s;
    };

    /* ---- Conditional card ---- */
    const condCard = h("div", { class: "cvr-card" });
    const condRows = h("div", {});
    const drawCond = () => {
      condRows.replaceChildren();
      if (!data.rules.length) data.rules.push({ op: "equals", value: "", then: [{ colId: (targets[0] || {}).id || "", value: "" }] });
      data.rules.forEach((r, ri) => {
        const block = h("div", { class: "cvr-rule" });
        const del = h("button", { class: "row-act", title: "Remove rule", onclick: () => { data.rules.splice(ri, 1); drawCond(); } }); del.append(ico("trash", 14));
        block.append(h("div", { class: "cvr-if" },
          h("span", {}, "If"), h("span", { class: "cvr-chip" }, ico("numbers", 13), h("span", {}, col.name)),
          sel(COND_OPS.map(o => ({ id: o.id, label: o.label })), r.op, v => r.op = v),
          h("input", { class: "cvr-in", type: "number", placeholder: "Value", value: r.value, oninput: (e) => r.value = e.target.value }),
          del));

        (r.then || []).forEach((th, ti) => {
          const valHost = h("span", {});
          const drawVal = () => {
            valHost.replaceChildren();
            const tc = board.columns.find(c => c.id === th.colId);
            if (tc && (tc.type === "status" || tc.type === "dropdown")) {
              valHost.append(sel([{ id: "", label: "—" }].concat((tc.labels || []).map(l => ({ id: l.id, label: l.label || "—" }))), th.value, v => th.value = v));
            } else if (tc && tc.type === "date") {
              valHost.append(h("input", { class: "cvr-in", type: "date", value: th.value || "", onchange: (e) => th.value = e.target.value }));
            } else {
              valHost.append(h("input", { class: "cvr-in", type: tc && tc.type === "numbers" ? "number" : "text", placeholder: "Value", value: th.value || "", oninput: (e) => th.value = e.target.value }));
            }
          };
          const thenRow = h("div", { class: "cvr-then" },
            h("span", {}, "Then"),
            sel([{ id: "", label: "Column" }].concat(targets.map(t => ({ id: t.id, label: t.name }))), th.colId, v => { th.colId = v; th.value = ""; drawVal(); }),
            h("span", { class: "muted", style: "font-size:12px" }, "set to"),
            valHost);
          if ((r.then || []).length > 1) { const rm = h("button", { class: "row-act", onclick: () => { r.then.splice(ti, 1); drawCond(); } }); rm.append(ico("x", 13)); thenRow.append(rm); }
          drawVal();
          block.append(thenRow);
        });

        block.append(h("button", { class: "cvr-add", onclick: () => { r.then.push({ colId: (targets[0] || {}).id || "", value: "" }); drawCond(); } }, "+ New column"));
        condRows.append(block);
      });
      condRows.append(h("button", { class: "cvr-add", style: "margin-top:6px", onclick: () => { data.rules.push({ op: "equals", value: "", then: [{ colId: (targets[0] || {}).id || "", value: "" }] }); drawCond(); } }, "+ New rule"));
    };

    /* ---- Validation card ---- */
    const valCard = h("div", { class: "cvr-card" });
    const drawVal = () => {
      valCard.replaceChildren();
      valCard.append(h("div", { class: "cvr-row" },
        h("label", {}, "Min"), h("input", { class: "cvr-in", type: "number", placeholder: "—", value: data.min, oninput: (e) => data.min = e.target.value }),
        h("label", {}, "Max"), h("input", { class: "cvr-in", type: "number", placeholder: "—", value: data.max, oninput: (e) => data.max = e.target.value })));
      const chk = h("input", { type: "checkbox" }); chk.checked = !!data.integer;
      chk.addEventListener("change", () => data.integer = chk.checked);
      valCard.append(h("label", { class: "cvr-check" }, chk, h("span", {}, "Whole numbers only")));
      valCard.append(h("div", { class: "muted", style: "font-size:12px;margin-top:6px" }, "Values outside the range are rejected when entered."));
    };

    // radio options
    const opt = (id, title, desc, payload) => {
      const wrap = h("div", { class: "cvr-opt" + (data.type === id ? " sel" : "") });
      const radio = h("span", { class: "cvr-radio" + (data.type === id ? " on" : "") });
      wrap.append(h("div", { class: "cvr-opt-head", onclick: () => { data.type = id; refresh(); } }, radio, h("div", {}, h("b", {}, title), h("div", { class: "muted", style: "font-size:12px" }, desc))));
      wrap.append(payload);
      return wrap;
    };

    const optCond = opt("conditional", "Conditional rule", "Define a condition to set values in other columns", condCard);
    const optVal = opt("validation", "Validation rule", "Restrict the values of this column to a numeric range", valCard);
    condCard.append(condRows);

    const refresh = () => {
      optCond.classList.toggle("sel", data.type === "conditional");
      optVal.classList.toggle("sel", data.type === "validation");
      optCond.querySelector(".cvr-radio").classList.toggle("on", data.type === "conditional");
      optVal.querySelector(".cvr-radio").classList.toggle("on", data.type === "validation");
      condCard.style.display = data.type === "conditional" ? "" : "none";
      valCard.style.display = data.type === "validation" ? "" : "none";
      if (data.type === "conditional") drawCond();
      if (data.type === "validation") drawVal();
    };
    body.append(optCond, optVal);
    card.append(body);

    const saveBtn = h("button", { class: "btn-primary" }, "Save rules");
    saveBtn.addEventListener("click", () => {
      if (!data.type) { col.validation = null; }
      else if (data.type === "conditional") {
        data.rules = data.rules.filter(r => r.value !== "" && (r.then || []).some(t => t.colId && t.value !== ""));
        data.rules.forEach(r => r.then = r.then.filter(t => t.colId && t.value !== ""));
        col.validation = data.rules.length ? { type: "conditional", rules: data.rules } : null;
      } else {
        col.validation = { type: "validation", min: data.min, max: data.max, integer: !!data.integer };
      }
      save(); close(); render();
      toast(col.validation ? "Validation rules saved" : "Rules cleared");
    });
    const clearBtn = h("button", { class: "modal-cancel", onclick: () => { col.validation = null; save(); close(); render(); toast("Rules cleared"); } }, "Clear");
    card.append(h("div", { class: "modal-foot" }, clearBtn, h("button", { class: "modal-cancel", onclick: close }, "Cancel"), saveBtn));

    refresh();
  });
}

function addColumnMenu(anchor, board, index) {
  openDropdown(anchor, (el, close) => {
    el.classList.add("addcol-menu");
    const search = h("div", { class: "side-search", style: "margin:2px 0 8px" });
    const si = h("input", { type: "text", placeholder: "Search or describe your column" });
    search.append(ico("search", 14), si);
    el.append(search);
    const host = h("div", {});
    const draw = () => {
      host.replaceChildren();
      const f = si.value.toLowerCase();
      const cats = [...new Set(COLUMN_TYPES.map(t => t.cat))];
      let total = 0;
      for (const cat of cats) {
        const items = COLUMN_TYPES.filter(t => t.cat === cat && (!f || t.name.toLowerCase().includes(f)));
        if (!items.length) continue;
        host.append(h("div", { class: "dd-title" }, cat));
        const grid = h("div", { class: "addcol-grid" });
        for (const t of items) {
          grid.append(h("div", { class: "addcol-item", title: t.desc, onclick: () => { close(); addColumn(board, t.type, index); } },
            h("span", { class: "addcol-ico", style: `background:${t.color}` }, ico(t.icon, 15)), h("span", {}, t.name)));
          total++;
        }
        host.append(grid);
      }
      if (!total) host.append(h("div", { class: "muted", style: "padding:8px" }, "No matches"));
    };
    si.addEventListener("input", draw);
    si.addEventListener("keydown", (e) => e.stopPropagation());
    draw();
    el.append(host);
  }, { minWidth: 320 });
}

function addColumn(board, type, index) {
  const col = mkColumn(type);
  board.columns.push(col);
  orderedCols(board); // ensure board.colOrder exists & includes the new id (appended at end)
  if (type === "text") {
    // Rule: a Text content column is locked as the first content column.
    board.colOrder = board.colOrder.filter(id => id !== col.id);
    board.colOrder.unshift(col.id);
  }
  save();
  render();
  toast(`${colTypeMeta(type).name} column added`);
}

function deleteColumn(board, col) {
  board.columns = board.columns.filter(c => c !== col);
  if (Array.isArray(board.colOrder)) board.colOrder = board.colOrder.filter(id => id !== col.id);
  for (const g of board.groups) for (const t of g.tasks) delete t.cells[col.id];
  save();
  render();
  toast(`Column "${col.name}" deleted`);
}

function colBatteryEl(tasks, col) {
  const bat = h("div", { class: "battery" });
  if (!tasks.length) return bat;
  for (const lb of (col.labels || [])) {
    const n = tasks.filter(t => { const v = t.cells[col.id]; return col.type === "dropdown" ? (Array.isArray(v) && v.includes(lb.id)) : v === lb.id; }).length;
    if (!n) continue;
    bat.append(h("span", { style: `background:${lb.color};flex:${n} 1 0`, title: `${lb.label || "—"} ${n}` }));
  }
  return bat;
}

function cellEditorEl(board, task, col) {
  switch (col.type) {
    case "text": return textCellEl(task, col);
    case "doc": return docCellEl(task, col);
    case "numbers": return numberCellEl(task, col);
    case "formula": return formulaCellEl(board, task, col);
    case "lastupdate": return updatedCellEl(task);
    case "date": return colDateCellEl(task, col);
    case "timeline": return colTimelineCellEl(task, col);
    case "people": return colPeopleCellEl(task, col);
    case "status": case "priority": return colStatusCellEl(board, task, col);
    case "dropdown": return colDropdownCellEl(board, task, col);
    case "checkbox": return colCheckboxCellEl(task, col);
    case "files": return colFilesCellEl(task, col);
    case "connect": return colConnectCellEl(board, task, col);
    case "extract": return colExtractCellEl(task, col);
    default: return h("div", { class: "cell" });
  }
}

// --- monday Doc: multi-line note edited in a popover ---
function docCellEl(task, col) {
  const v = task.cells[col.id] || "";
  const cell = h("div", { class: "cell", title: "Click to edit note" });
  const span = h("span", { style: "width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 4px;cursor:text;color:" + (v ? "var(--text)" : "var(--text-2)") }, v || "Add note…");
  span.addEventListener("click", () => openDropdown(cell, (dd, close) => {
    const ta = h("textarea", { class: "ip-desc", style: "width:280px;height:120px", placeholder: "Write a note…" });
    ta.value = task.cells[col.id] || "";
    const save_ = h("button", { class: "btn-primary", onclick: () => { setColVal(task, col, ta.value.trim()); close(); softRenderTable(getBoard()); } }, "Save");
    dd.append(ta, h("div", { class: "date-pop-row", style: "margin-top:8px" }, save_));
    setTimeout(() => ta.focus(), 0);
  }, { minWidth: 300 }));
  cell.append(span);
  return cell;
}

// --- Formula: =expression over number columns by name, evaluated safely ---
function evalFormula(board, task, expr) {
  if (!expr) return "";
  let e = expr.replace(/^=/, "");
  // replace {Column Name} or bare column names with their numeric value
  for (const c of board.columns) {
    if (c.type !== "numbers") continue;
    const n = Number(task.cells[c.id]) || 0;
    e = e.split("{" + c.name + "}").join("(" + n + ")");
  }
  if (!/^[-+*/().\d\s]+$/.test(e)) return "⚠";
  try { const r = Function('"use strict";return (' + e + ")")(); return Number.isFinite(r) ? String(Math.round(r * 1000) / 1000) : "⚠"; }
  catch { return "⚠"; }
}
function formulaCellEl(board, task, col) {
  const expr = task.cells[col.id] || "";
  const cell = h("div", { class: "cell", style: "justify-content:flex-end", title: expr ? "Formula: " + expr : "Set formula (use {Column name}, e.g. {Budget}*1.1)" });
  const out = expr ? evalFormula(board, task, expr) : "";
  const span = h("span", { class: "num-val" + (expr ? "" : " num-hint"), style: "padding:2px 6px;cursor:text;border-radius:4px;display:flex;align-items:center;gap:4px" }, ico("formula", 12), h("span", {}, expr ? out : "fx"));
  span.addEventListener("click", () => {
    const input = h("input", { class: "inline-input", value: expr, placeholder: "={Budget}*1.1", style: "text-align:right" });
    cell.replaceChildren(input); input.focus(); input.select();
    let done = false;
    const fin = (ok) => { if (done) return; done = true; if (ok) setColVal(task, col, input.value.trim()); softRenderTable(getBoard()); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") fin(true); if (e.key === "Escape") fin(false); e.stopPropagation(); });
    input.addEventListener("blur", () => fin(true));
  });
  cell.append(span);
  return cell;
}

// --- Checkbox ---
function colCheckboxCellEl(task, col) {
  const on = !!task.cells[col.id];
  const cell = h("div", { class: "cell", style: "justify-content:center" });
  const box = h("button", { class: "cb-cell" + (on ? " on" : ""), title: on ? "Checked" : "Unchecked" }, on ? ico("check", 14) : null);
  box.addEventListener("click", () => { setColVal(task, col, on ? "" : true); softRenderTable(getBoard()); });
  cell.append(box);
  return cell;
}

// --- Timeline: start–end date range ---
function colTimelineCellEl(task, col) {
  const v = task.cells[col.id] || {};
  const cell = h("div", { class: "cell date-cell" + (v.start || v.end ? "" : " empty"), title: "Set date range" });
  if (v.start || v.end) cell.append(h("span", { class: "range-pill" }, fmtRange(v.start || v.end, v.end || v.start)));
  else cell.append(ico("gantt", 14));

  const open = () => openDropdown(cell, (dd, close) => {
    const cur = task.cells[col.id] || {};
    const field = (label, key) => {
      const val = cur[key];
      const b = h("button", { class: "tl-field" },
        h("span", { class: "muted" }, label),
        h("span", { class: val ? "" : "muted" }, val ? fmtDate(val) : "mm/dd/yyyy"),
        ico("calendar", 14));
      // clicking opens the small calendar; on pick, reopen this timeline popover
      b.addEventListener("click", () => calendarPicker(b, {
        value: val || "",
        onPick: (iso) => { const c = { ...(task.cells[col.id] || {}) }; c[key] = iso; setColVal(task, col, c); softRenderTable(getBoard()); open(); },
        onClear: () => { const c = { ...(task.cells[col.id] || {}) }; c[key] = ""; setColVal(task, col, c); softRenderTable(getBoard()); open(); },
      }));
      return b;
    };
    const clr = h("button", { onclick: () => { setColVal(task, col, ""); close(); softRenderTable(getBoard()); } }, "Clear");
    dd.append(h("div", { class: "date-pop" },
      field("Start", "start"),
      field("End", "end"),
      h("div", { class: "date-pop-row" }, clr)));
  }, { minWidth: 220 });

  cell.addEventListener("click", open);
  return cell;
}

// --- Files: list of file names (demo) ---
// file entries are objects {name, url?} (legacy plain strings still supported)
const fileName = (f) => typeof f === "string" ? f : (f && f.name) || "file";
const fileUrl = (f) => (f && typeof f === "object") ? f.url : null;

function colFilesCellEl(task, col) {
  const arr = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
  const cell = h("div", { class: "cell file-cell", title: "Manage files" });
  if (arr.length) cell.append(ico("paperclip", 14), h("span", {}, arr.length));
  else cell.append(h("span", { class: "muted", style: "display:flex;align-items:center;gap:4px" }, ico("paperclip", 14), "Add"));

  const add = (entry) => {
    const a = Array.isArray(task.cells[col.id]) ? [...task.cells[col.id]] : [];
    a.push(entry); setColVal(task, col, a); softRenderTable(getBoard());
  };

  cell.addEventListener("click", () => openDropdown(cell, (dd, close) => {
    dd.append(h("div", { class: "dd-title" }, "Files"));
    const list = h("div", {});
    const draw = () => {
      list.replaceChildren();
      const cur = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
      if (!cur.length) { list.append(h("div", { class: "muted", style: "padding:4px 2px;font-size:12px" }, "No files yet")); return; }
      cur.forEach((f, i) => {
        const del = h("button", { class: "row-act", onclick: (e) => { e.stopPropagation(); const a = [...cur]; a.splice(i, 1); setColVal(task, col, a); draw(); softRenderTable(getBoard()); } }); del.append(ico("trash", 13));
        const url = fileUrl(f);
        const isDoc = f && f.kind === "doc";
        const label = url ? h("a", { href: url, target: "_blank", rel: "noopener", style: "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", onclick: (e) => e.stopPropagation() }, fileName(f))
                          : h("span", { style: "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, fileName(f));
        const rowEl = h("div", { class: "dd-item", style: "gap:6px" + (isDoc ? ";cursor:pointer" : ""), onclick: isDoc ? (() => { close(); docEditor(task, col, f); }) : null }, ico(isDoc ? "doc" : (url ? "link" : "paperclip"), 13), label, del);
        list.append(rowEl);
      });
    };
    draw();
    dd.append(list, h("hr", { class: "dd-sep" }));

    // hidden picker for "From Computer"
    const fileIn = h("input", { type: "file", style: "display:none" });
    fileIn.addEventListener("change", () => { const f = fileIn.files[0]; if (f) { add({ name: f.name }); draw(); } fileIn.value = ""; });
    dd.append(fileIn);

    const opt = (icon, label, fn) => { const it = ddItem(icon, label, fn); dd.append(it); return it; };
    opt("download", "From Computer", () => fileIn.click());
    opt("camera", "From Webcam", () => toast("Webcam capture — coming soon in demo"));
    opt("doc", "Doc", () => {
      const entry = { id: uid(), name: "Untitled doc", kind: "doc", html: "" };
      const a = Array.isArray(task.cells[col.id]) ? [...task.cells[col.id]] : [];
      a.push(entry); setColVal(task, col, a); close(); softRenderTable(getBoard());
      docEditor(task, col, entry);
    });
    opt("link", "From Link", () => { let u = prompt("Paste a link (URL)"); if (u && u.trim()) { u = u.trim(); if (!/^https?:\/\//i.test(u)) u = "https://" + u; add({ name: u, url: u }); draw(); } });
    opt("cloud", "From Google Drive", () => toast("Google Drive — coming soon in demo"));
    opt("cloud", "From Dropbox", () => toast("Dropbox — coming soon in demo"));
    opt("folder", "From Box", () => toast("Box — coming soon in demo"));
  }, { minWidth: 230 }));
  return cell;
}

// --- monday-style Doc editor (block-based) opened from a Files "Doc" entry ---
function docEditor(task, col, entry) {
  openModal((card, close) => {
    card.classList.add("doc-modal");
    const board = getBoard();

    const persist = () => {
      entry.html = sanitizeHTML(area.innerHTML);
      entry.name = (titleIn.value.trim() || "Untitled doc");
      const arr = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
      touch(task); setColVal(task, col, arr);
    };
    const closeSave = () => { persist(); softRenderTable(board); close(); };

    // header
    const closeBtn = h("button", { class: "icon-btn", onclick: closeSave }); closeBtn.append(ico("x", 16));
    card.append(h("div", { class: "doc-head" },
      h("div", { class: "doc-crumb muted" }, board.name + " › " + task.name + " › Doc"),
      closeBtn));

    const titleIn = h("input", { class: "doc-title", value: entry.name === "Untitled doc" ? "" : entry.name, placeholder: "Untitled doc" });
    card.append(titleIn);

    // editor
    const area = h("div", { class: "doc-area", contenteditable: "true", "data-ph": "Type here. Use the toolbar for headings, lists, checklist…" });
    area.innerHTML = entry.html || "";
    const cmd = (c, v) => { area.focus(); try { document.execCommand(c, false, v || null); } catch (e) {} };
    const block = (tag) => cmd("formatBlock", tag);

    // toolbar
    const tb = h("div", { class: "doc-toolbar" });
    const tbtn = (label, title, fn, html) => {
      const b = h("button", { class: "doc-tbtn", title });
      if (html) b.innerHTML = html; else b.append(typeof label === "string" ? h("span", {}, label) : label);
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", fn);
      return b;
    };
    const blockSel = h("select", { class: "doc-block-sel", title: "Text style" });
    [["p", "Normal text"], ["h1", "Large title"], ["h2", "Medium title"], ["h3", "Small title"], ["blockquote", "Quote"], ["pre", "Code"]]
      .forEach(([t, l]) => blockSel.append(h("option", { value: t }, l)));
    blockSel.addEventListener("mousedown", (e) => e.stopPropagation());
    blockSel.addEventListener("change", () => { block(blockSel.value === "p" ? "div" : blockSel.value); });

    const insertChecklist = () => cmd("insertHTML", `<div class="doc-todo"><input type="checkbox"><span>To-do</span></div><p><br></p>`);
    const insertDivider = () => cmd("insertHTML", `<hr><p><br></p>`);
    const imgIn = h("input", { type: "file", accept: "image/*", style: "display:none" });
    imgIn.addEventListener("change", () => { const f = imgIn.files[0]; if (f) scaleImageWide(f, 900, (url) => cmd("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block">`)); imgIn.value = ""; });

    tb.append(
      blockSel,
      h("span", { class: "doc-sep" }),
      tbtn(null, "Bold", () => cmd("bold"), "<b>B</b>"),
      tbtn(null, "Italic", () => cmd("italic"), "<i>I</i>"),
      tbtn(null, "Underline", () => cmd("underline"), "<u>U</u>"),
      h("span", { class: "doc-sep" }),
      tbtn(ico("list", 16), "Bulleted list", () => cmd("insertUnorderedList")),
      tbtn(ico("numbers", 16), "Numbered list", () => cmd("insertOrderedList")),
      tbtn(ico("check", 16), "Checklist", insertChecklist),
      h("span", { class: "doc-sep" }),
      tbtn("―", "Divider", insertDivider),
      tbtn(ico("gallery", 16), "Image", () => imgIn.click()),
      tbtn(ico("link", 16), "Link", () => { let u = prompt("Link URL"); if (u) cmd("createLink", /^https?:/.test(u) ? u : "https://" + u); }),
    );
    card.append(tb, area, imgIn);

    // toggle checklist items + autosave
    area.addEventListener("click", (e) => {
      if (e.target && e.target.type === "checkbox") { e.target.toggleAttribute("checked"); persist(); }
    });
    let t = 0;
    area.addEventListener("input", () => { clearTimeout(t); t = setTimeout(persist, 500); });
    titleIn.addEventListener("input", () => { clearTimeout(t); t = setTimeout(persist, 500); });

    setTimeout(() => area.focus(), 0);
  });
}

// --- Connect boards: link an item from another board ---
function colConnectCellEl(board, task, col) {
  const v = task.cells[col.id];
  const cell = h("div", { class: "cell connect-cell", title: "Link an item" });
  if (v && v.name) cell.append(h("span", { class: "dd-tag", style: "background:#a25ddc" }, ico("link", 12), h("span", {}, v.name)));
  else cell.append(h("span", { class: "muted", style: "display:flex;align-items:center;gap:4px" }, ico("link", 14), "Connect"));
  cell.addEventListener("click", () => openDropdown(cell, (dd, close) => {
    dd.append(h("div", { class: "dd-title" }, "Link an item"));
    const others = wsBoards().filter(b => b.id !== board.id);
    if (!others.length) { dd.append(h("div", { class: "dd-item disabled" }, "No other boards")); return; }
    for (const b of others) {
      for (const g of b.groups) for (const t of g.tasks) {
        dd.append(h("div", { class: "dd-item", style: "gap:6px", onclick: () => { setColVal(task, col, { boardId: b.id, taskId: t.id, name: t.name }); close(); softRenderTable(getBoard()); } },
          ico(b.icon || "table", 13), h("span", { style: "flex:1" }, t.name), h("span", { class: "muted", style: "font-size:11px" }, b.name)));
      }
    }
    if (v) dd.append(h("hr", { class: "dd-sep" }), h("button", { class: "dd-footer-btn", onclick: () => { setColVal(task, col, ""); close(); softRenderTable(getBoard()); } }, "Clear link"));
  }, { minWidth: 260 }));
  return cell;
}

// --- Extract info: AI placeholder ---
function colExtractCellEl(task, col) {
  const v = task.cells[col.id] || "";
  const cell = h("div", { class: "cell", title: "AI extract (demo)" });
  if (v) cell.append(h("span", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, v));
  else cell.append(h("button", { class: "wh-ai", style: "pointer-events:none" }, ico("vibe", 12), h("span", {}, "Extract")));
  cell.addEventListener("click", () => {
    setColVal(task, col, "Auto-extracted ✦");
    toast("Extract info — AI coming soon (demo filled a sample)");
    softRenderTable(getBoard());
  });
  return cell;
}

function textCellEl(task, col) {
  const cell = h("div", { class: "cell", title: "Click to edit" });
  const span = h("span", { style: "width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 4px;border-radius:4px;cursor:text" }, task.cells[col.id] || "");
  span.addEventListener("click", () => {
    const input = h("input", { class: "inline-input", value: task.cells[col.id] || "" });
    cell.replaceChildren(input); input.focus(); input.select();
    let done = false;
    const fin = (ok) => { if (done) return; done = true; if (ok) setColVal(task, col, input.value.trim()); softRenderTable(getBoard()); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") fin(true); if (e.key === "Escape") fin(false); e.stopPropagation(); });
    input.addEventListener("blur", () => fin(true));
  });
  cell.append(span);
  return cell;
}

function numberCellEl(task, col) {
  const cell = h("div", { class: "cell", style: "justify-content:flex-end" });
  const v = task.cells[col.id];
  const empty = v == null || v === "";
  const span = h("span", { class: "num-val" + (empty ? " num-hint" : ""), style: "padding:2px 6px;cursor:text;border-radius:4px" }, empty ? "123" : String(v));
  span.addEventListener("click", () => {
    const input = h("input", { class: "inline-input", type: "number", value: v != null ? String(v) : "", style: "text-align:right" });
    cell.replaceChildren(input); input.focus(); input.select();
    let done = false;
    const fin = (ok) => {
      if (done) return; done = true;
      if (ok) {
        const t = input.value.trim();
        if (t === "") { setColVal(task, col, ""); }
        else {
          const n = Number(t);
          const chk = validateNumber(col, n);
          if (!chk.ok) { toast("⚠ " + col.name + ": " + chk.msg); softRenderTable(getBoard()); return; }
          setColVal(task, col, n);
          applyColConditionals(getBoard(), task, col, n);
        }
      }
      softRenderTable(getBoard());
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") fin(true); if (e.key === "Escape") fin(false); e.stopPropagation(); });
    input.addEventListener("blur", () => fin(true));
  });
  cell.append(span);
  return cell;
}

function colDateCellEl(task, col) {
  const v = task.cells[col.id];
  const cell = h("div", { class: "cell date-cell" + (v ? "" : " empty"), title: "Set date" });
  if (!v) cell.append(ico("calendar", 14)); else cell.append(h("span", {}, fmtDate(v)));
  cell.addEventListener("click", () => calendarPicker(cell, {
    value: v || "",
    onPick: (iso) => { setColVal(task, col, iso); softRenderTable(getBoard()); },
    onClear: () => { setColVal(task, col, ""); softRenderTable(getBoard()); },
  }));
  return cell;
}

function colPeopleCellEl(task, col) {
  const ids = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
  const cell = h("div", { class: "cell owner-cell" });
  const ppl = ids.map(personById).filter(Boolean);
  if (!ppl.length) cell.append(h("span", { class: "avatar-empty" }, ico("person", 13)));
  else { const stack = h("span", { class: "avatar-stack" }); ppl.slice(0, 2).forEach(p => stack.append(avatarEl(p, 26))); if (ppl.length > 2) stack.append(h("span", { class: "avatar", style: "background:var(--text-2);width:26px;height:26px;font-size:10px" }, `+${ppl.length - 2}`)); cell.append(stack); }
  cell.addEventListener("click", () => openDropdown(cell, (dd) => {
    dd.append(h("div", { class: "dd-title" }, "Assign people"));
    for (const p of state.people) {
      const cur = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
      const has = cur.includes(p.id);
      dd.append(h("div", { class: "dd-item", onclick: () => { let arr = Array.isArray(task.cells[col.id]) ? [...task.cells[col.id]] : []; arr.includes(p.id) ? arr = arr.filter(x => x !== p.id) : arr.push(p.id); setColVal(task, col, arr); softRender(); refreshDd(); } },
        avatarEl(p, 24), h("span", { style: "flex:1" }, p.name), has ? ico("check", 14) : null));
    }
  }, { minWidth: 220 }));
  return cell;
}

function colStatusCellEl(board, task, col) {
  const v = task.cells[col.id];
  const lb = (col.labels || []).find(l => l.id === v);
  const cell = h("div", { class: "cell", style: "padding:0 8px" });
  const fill = h("div", { class: "cell-fill", style: `background:${lb ? lb.color : "#c4c4c4"}`, title: lb ? lb.label : "" }, lb ? lb.label : "");
  fill.addEventListener("click", () => labelPicker(fill, board, task, col, false));
  cell.append(fill);
  return cell;
}

function colDropdownCellEl(board, task, col) {
  const v = Array.isArray(task.cells[col.id]) ? task.cells[col.id] : [];
  const cell = h("div", { class: "cell dropdown-cell", style: "flex-wrap:wrap;gap:4px;padding:4px 6px;cursor:pointer;justify-content:flex-start" });
  const sel = v.map(id => (col.labels || []).find(l => l.id === id)).filter(Boolean);
  if (!sel.length) cell.append(h("span", { class: "muted" }, "—"));
  else sel.forEach(lb => cell.append(h("span", { class: "dd-tag", style: `background:${lb.color}` }, lb.label || "—")));
  cell.addEventListener("click", () => labelPicker(cell, board, task, col, true));
  return cell;
}

function labelPicker(anchor, board, task, col, multi) {
  openDropdown(anchor, (el, close) => {
    for (const lb of (col.labels || [])) {
      const cur = task.cells[col.id];
      const on = multi ? (Array.isArray(cur) && cur.includes(lb.id)) : cur === lb.id;
      const row = h("div", { class: "dd-color", style: `background:${lb.color}`, onclick: () => {
        if (multi) { let arr = Array.isArray(task.cells[col.id]) ? [...task.cells[col.id]] : []; arr.includes(lb.id) ? arr = arr.filter(x => x !== lb.id) : arr.push(lb.id); setColVal(task, col, arr); softRender(); refreshDd(); }
        else { setColVal(task, col, lb.id); close(); softRender(); }
      } }, lb.label || "—");
      if (on) row.append(h("span", { style: "margin-left:auto" }, ico("check", 14)));
      el.append(row);
    }
    el.append(h("div", { class: "dd-color", style: "background:#c4c4c4", onclick: () => { setColVal(task, col, multi ? [] : ""); close(); softRender(); } }, "Clear"));
    el.append(h("hr", { class: "dd-sep" }), h("button", { class: "dd-footer-btn", onclick: () => { close(); labelEditor(anchor, board, col); } }, "✎ Edit Labels"));
  }, { minWidth: 190 });
}

function labelEditor(anchor, board, col) {
  openDropdown(anchor, (el) => {
    el.append(h("div", { class: "dd-title" }, "Edit Labels"));
    const host = h("div", {});
    el.append(host);
    const draw = () => {
      host.replaceChildren();
      for (const lb of col.labels) {
        const sw = h("input", { type: "color", class: "lbl-swatch", value: /^#([0-9a-f]{6})$/i.test(lb.color) ? lb.color : "#888888", title: "Custom color" });
        sw.addEventListener("input", () => { lb.color = sw.value; save(); softRenderTable(board); });
        sw.addEventListener("click", (e) => e.stopPropagation());
        const inp = h("input", { class: "lbl-input", value: lb.label, placeholder: "Label name" });
        inp.addEventListener("input", () => { lb.label = inp.value; });
        inp.addEventListener("change", () => { save(); softRenderTable(board); });
        inp.addEventListener("keydown", (e) => e.stopPropagation());
        const del = h("button", { class: "row-act", title: "Delete label" });
        del.append(ico("trash", 13));
        del.addEventListener("click", (e) => { e.stopPropagation(); col.labels = col.labels.filter(x => x !== lb); save(); draw(); softRenderTable(board); });
        host.append(h("div", { class: "lbl-row" }, sw, inp, del));
      }
    };
    draw();
    const add = h("button", { class: "dd-footer-btn", onclick: () => { col.labels.push({ id: uid(), label: "New Label", color: LABEL_PALETTE[col.labels.length % LABEL_PALETTE.length] }); save(); draw(); } }, "＋ Add label");
    el.append(h("hr", { class: "dd-sep" }), add);
  }, { minWidth: 270 });
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
  const hasUpd = task.updates.length > 0;
  const chat = h("button", { class: "updates-chip" + (hasUpd ? " has" : ""), title: hasUpd ? `${task.updates.length} update(s)` : "Add an update" });
  if (hasUpd) chat.append(ico("chat", 15), h("span", { class: "uc-count" }, task.updates.length));
  else chat.append(ico("chat", 15), h("span", { class: "uc-plus" }, "+"));
  chat.addEventListener("click", (e) => { e.stopPropagation(); ui.panel = task.id; renderPanel(); });
  nameCell.append(chat);
  // file/image attachment indicator — coloured when the item has files
  const nFiles = (task.files || []).length;
  if (nFiles) {
    const fchip = h("button", { class: "files-chip has", title: `${nFiles} file(s)` });
    fchip.append(ico("paperclip", 13), h("span", {}, nFiles));
    fchip.addEventListener("click", (e) => { e.stopPropagation(); ui.panel = task.id; renderPanel(); });
    nameCell.append(fchip);
  }
  nameCell.append(h("span", { class: "row-actions" }, openBtn, rowMenuBtn));
  row.append(nameCell);

  // dynamic cells (unified order)
  for (const oc of orderedCols(board)) {
    if (oc.kind === "sys") row.append(sysCellEl(task, oc.id));
    else row.append(cellEditorEl(board, task, oc.col));
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
          runWorkflows({ type: "status", task: t });
          close();
          softRender();
        },
      }, s.label));
    }
    el.append(h("hr", { class: "dd-sep" }),
      h("button", { class: "dd-footer-btn", onclick: () => { close(); systemLabelEditor(anchor, "status"); } }, "✎ Edit Labels"));
  }, { minWidth: 170 });
}

// Edit the built-in Status / Priority label sets: rename, custom color, add, delete.
function systemLabelEditor(anchor, kind) {
  const list = kind === "status" ? STATUSES : PRIORITIES;
  openDropdown(anchor, (el) => {
    el.append(h("div", { class: "dd-title" }, kind === "status" ? "Edit Status labels" : "Edit Priority labels"));
    const host = h("div", {});
    el.append(host);
    const draw = () => {
      host.replaceChildren();
      for (const lb of list) {
        const sw = h("input", { type: "color", class: "lbl-swatch", value: /^#([0-9a-f]{6})$/i.test(lb.color) ? lb.color : "#888888", title: "Custom color" });
        sw.addEventListener("input", () => { lb.color = sw.value; save(); softRender(); });
        sw.addEventListener("click", (e) => e.stopPropagation());
        const inp = h("input", { class: "lbl-input", value: lb.label, placeholder: "Label name" });
        inp.addEventListener("input", () => { lb.label = inp.value; });
        inp.addEventListener("change", () => { save(); softRender(); });
        inp.addEventListener("keydown", (e) => e.stopPropagation());
        const del = h("button", { class: "row-act", title: list.length <= 1 ? "Keep at least one label" : "Delete label" });
        del.append(ico("trash", 13));
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          if (list.length <= 1) { toast("Keep at least one label"); return; }
          list.splice(list.indexOf(lb), 1);
          save();
          draw();
          softRender();
        });
        host.append(h("div", { class: "lbl-row" }, sw, inp, del));
      }
    };
    draw();
    const add = h("button", { class: "dd-footer-btn", onclick: () => {
      list.push({ id: uid(), label: "New Label", color: LABEL_PALETTE[list.length % LABEL_PALETTE.length] });
      save();
      draw();
      softRender();
    } }, "＋ Add label");
    el.append(h("hr", { class: "dd-sep" }), add);
  }, { minWidth: 280 });
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

// monday-style calendar popover. opts: { value, onPick(iso), onClear() }
function calendarPicker(anchor, opts) {
  const fmtMDY = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${m}/${d}/${y}`; };
  const parseMDY = (s) => { const m = (s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!m) return null; const mm = +m[1], dd = +m[2], yy = +m[3]; if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null; return `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`; };
  let sel = opts.value || "";
  const base = sel ? new Date(sel + "T00:00:00") : new Date();
  let vy = base.getFullYear(), vm = base.getMonth();

  openDropdown(anchor, (el, close) => {
    el.classList.add("cal-pop");
    const choose = (iso) => { sel = iso; opts.onPick && opts.onPick(iso); close(); };

    const todayBtn = h("button", { class: "cal-today", onclick: () => choose(todayISO()) }, "Today");
    const clockBtn = h("button", { class: "cal-iconbtn", title: "Jump to today", onclick: () => { const t = new Date(); vy = t.getFullYear(); vm = t.getMonth(); draw(); } }, ico("clock", 16));
    el.append(h("div", { class: "cal-head" }, todayBtn, clockBtn));

    const input = h("input", { class: "cal-input", type: "text", value: fmtMDY(sel), placeholder: "MM/DD/YYYY" });
    input.addEventListener("change", () => { const iso = parseMDY(input.value); if (iso) { sel = iso; vy = +iso.slice(0, 4); vm = +iso.slice(5, 7) - 1; draw(); } });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { const iso = parseMDY(input.value); if (iso) choose(iso); } e.stopPropagation(); });
    el.append(input);

    const body = h("div", {});
    el.append(body);
    const draw = () => {
      body.replaceChildren();
      const monthSel = h("select", { class: "cal-sel" });
      MONTHS.forEach((mn, i) => monthSel.append(h("option", { value: i }, mn)));
      monthSel.value = vm;
      monthSel.addEventListener("change", () => { vm = +monthSel.value; draw(); });
      const yrSel = h("select", { class: "cal-sel" });
      const nowY = new Date().getFullYear();
      const years = [];
      for (let y = nowY - 5; y <= nowY + 6; y++) years.push(y);
      if (!years.includes(vy)) years.push(vy);
      years.sort((a, b) => a - b).forEach(y => yrSel.append(h("option", { value: y }, y)));
      yrSel.value = vy;
      yrSel.addEventListener("change", () => { vy = +yrSel.value; draw(); });
      const prev = h("button", { class: "cal-nav", onclick: () => { vm--; if (vm < 0) { vm = 11; vy--; } draw(); } }, ico("chevLeft", 16));
      const next = h("button", { class: "cal-nav", onclick: () => { vm++; if (vm > 11) { vm = 0; vy++; } draw(); } }, ico("chevRight", 16));
      body.append(h("div", { class: "cal-bar" }, monthSel, yrSel, h("div", { style: "flex:1" }), prev, next));

      const wk = h("div", { class: "cal-grid cal-wk" });
      ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach(d => wk.append(h("span", { class: "cal-wd" }, d)));
      body.append(wk);

      const grid = h("div", { class: "cal-grid" });
      const lead = (new Date(vy, vm, 1).getDay() + 6) % 7; // Monday-first
      const start = new Date(vy, vm, 1 - lead);
      const todayIso = todayISO();
      for (let i = 0; i < 42; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const cls = "cal-day" + (d.getMonth() !== vm ? " out" : "") + (iso === sel ? " sel" : "") + (iso === todayIso ? " today" : "");
        grid.append(h("button", { class: cls, onclick: () => (iso === sel && opts.onClear) ? (opts.onClear(), close()) : choose(iso) }, String(d.getDate())));
      }
      body.append(grid);
    };
    draw();

    el.append(h("hr", { class: "dd-sep" }));
    el.append(h("button", { class: "cal-autofill", onclick: () => choose(todayISO()) }, ico("vibe", 14), h("span", {}, "Autofill date")));
  }, { minWidth: 280 });
}

function datePicker(anchor, taskId) {
  const t = locateTask(taskId)?.task;
  calendarPicker(anchor, {
    value: t ? t.due : "",
    onPick: (iso) => { const tk = locateTask(taskId)?.task; if (!tk) return; tk.due = iso; touch(tk); save(); softRender(); },
    onClear: () => { const tk = locateTask(taskId)?.task; if (!tk) return; tk.due = ""; touch(tk); save(); softRender(); },
  });
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
    el.append(h("hr", { class: "dd-sep" }),
      h("button", { class: "dd-footer-btn", onclick: () => { close(); systemLabelEditor(anchor, "priority"); } }, "✎ Edit Labels"));
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
  const kb = h("div", { class: "view-root kanban" });
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
      runWorkflows({ type: "status", task: t });
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
  for (const col of getBoard().columns.slice(0, 3)) {
    const v = task.cells[col.id];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (col.type === "text" || col.type === "numbers") meta.append(h("span", {}, "· " + v));
    else if (col.type === "date") meta.append(h("span", {}, "· " + fmtDate(v)));
    else if (col.type === "status") { const lb = (col.labels || []).find(l => l.id === v); if (lb) meta.append(h("span", { class: "kb-prio", style: `background:${lb.color}` }, lb.label || "—")); }
    else if (col.type === "dropdown") (v || []).map(id => (col.labels || []).find(l => l.id === id)).filter(Boolean).slice(0, 2).forEach(lb => meta.append(h("span", { class: "kb-prio", style: `background:${lb.color}` }, lb.label || "—")));
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

  const cal = h("div", { class: "view-root calendar" });

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

    const addBtn = h("button", { class: "cal-add", title: "Add task on this day" });
    addBtn.append(ico("plus", 13));
    addBtn.addEventListener("click", (e) => { e.stopPropagation(); newItemModal(board, board.groups[0], { due: iso }); });
    cell.append(addBtn);
    cell.addEventListener("click", (e) => { if (e.target === cell || e.target === dayNum) newItemModal(board, board.groups[0], { due: iso }); });

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

/* ---------------- Shared helpers for new views ---------------- */

function allVisible(board) {
  const out = [];
  for (const g of board.groups) for (const t of visibleTasks(g)) out.push(t);
  return out;
}

function tsToIso(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToDays(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function boardModified(board) {
  let max = board.createdAt || 0;
  for (const g of board.groups) for (const t of g.tasks) if (t.updatedAt > max) max = t.updatedAt;
  return max || Date.now();
}

/* ---- Workspace "Content" filter panel ---- */
const WH_MOD_OPTS = [["m1", "1+ months ago", 30], ["m3", "3+ months ago", 90], ["m6", "6+ months ago", 180], ["y1", "1+ years ago", 365], ["y2", "2+ years ago", 730]];
const WH_TYPE_OPTS = [["board", "Board", "table"], ["dashboard", "Dashboard", "dashboard"], ["doc", "Doc", "doc"], ["workflow", "Workflow", "workflow"]];
const DAY_MS = 86400000;

function whFilterCount() {
  const f = ui.whF;
  return (f.modified ? 1 : 0) + f.types.size + f.creators.size + (f.membership ? 1 : 0) + (f.cleanup ? 1 : 0);
}

function whMatch(b) {
  const f = ui.whF;
  if (f.modified) {
    const days = (WH_MOD_OPTS.find(o => o[0] === f.modified) || [])[2] || 0;
    if (boardModified(b) > Date.now() - days * DAY_MS) return false;
  }
  if (f.types.size && !f.types.has(b.kind || "board")) return false;
  if (f.creators.size && !f.creators.has(b.creator)) return false;
  if (f.membership) {
    const owner = b.creator === state.user;
    if (f.membership === "owner" && !owner) return false;
    if (f.membership === "member" && owner) return false;
  }
  if (f.cleanup && boardModified(b) > Date.now() - 180 * DAY_MS) return false;
  return true;
}

function whFilterPanel(anchor, redraw) {
  const f = ui.whF;
  openDropdown(anchor, (el, close) => {
    el.classList.add("wh-filter-pop");
    el.append(h("div", { class: "wh-filter-head" },
      h("b", {}, "Filter by"),
      h("button", { class: "wh-filter-clear", onclick: () => { f.modified = null; f.types.clear(); f.creators.clear(); f.membership = null; f.cleanup = false; ui.whFCreatorQ = ""; redraw(); refreshDd(); } }, "Clear all")));

    const cols = h("div", { class: "wh-filter-cols" });

    // Last modified (single select)
    const c1 = h("div", { class: "wh-filter-col" }, h("div", { class: "wh-filter-label" }, "Last modified"));
    for (const [id, label] of WH_MOD_OPTS) {
      const chip = h("button", { class: "wh-filter-chip" + (f.modified === id ? " sel" : "") }, label);
      chip.addEventListener("click", () => { f.modified = f.modified === id ? null : id; redraw(); refreshDd(); });
      c1.append(chip);
    }
    cols.append(c1);

    // Asset type (multi)
    const c2 = h("div", { class: "wh-filter-col" }, h("div", { class: "wh-filter-label" }, "Asset type"));
    for (const [id, label, icon] of WH_TYPE_OPTS) {
      const chip = h("button", { class: "wh-filter-chip" + (f.types.has(id) ? " sel" : "") }, ico(icon, 14), h("span", {}, label));
      chip.addEventListener("click", () => { f.types.has(id) ? f.types.delete(id) : f.types.add(id); redraw(); refreshDd(); });
      c2.append(chip);
    }
    cols.append(c2);

    // Created by (multi, searchable)
    const c3 = h("div", { class: "wh-filter-col" }, h("div", { class: "wh-filter-label" }, "Created by"));
    const cSearch = h("input", { class: "wh-filter-search", type: "text", placeholder: "Search", value: ui.whFCreatorQ || "" });
    const cList = h("div", { class: "wh-filter-people" });
    const drawPeople = () => {
      cList.replaceChildren();
      const qv = (ui.whFCreatorQ || "").toLowerCase();
      const people = [...new Set(wsBoards().map(b => b.creator))].map(id => personById(id)).filter(Boolean).filter(p => p.name.toLowerCase().includes(qv));
      if (!people.length) { cList.append(h("div", { class: "muted", style: "font-size:12px;padding:6px 2px" }, "No people")); return; }
      for (const p of people) {
        const n = wsBoards().filter(b => b.creator === p.id).length;
        const it = h("button", { class: "wh-filter-person" + (f.creators.has(p.id) ? " sel" : "") },
          avatarEl(p, 22), h("span", { style: "flex:1;text-align:left" }, p.name.split(" ")[0]), h("span", { class: "muted" }, n));
        it.addEventListener("click", () => { f.creators.has(p.id) ? f.creators.delete(p.id) : f.creators.add(p.id); redraw(); refreshDd(); });
        cList.append(it);
      }
    };
    cSearch.addEventListener("input", () => { ui.whFCreatorQ = cSearch.value; drawPeople(); });
    c3.append(cSearch, cList);
    drawPeople();
    cols.append(c3);

    // Membership (single select)
    const c4 = h("div", { class: "wh-filter-col" }, h("div", { class: "wh-filter-label" }, "Membership"));
    for (const [id, label] of [["owner", "Owner"], ["member", "Member"]]) {
      const chip = h("button", { class: "wh-filter-chip" + (f.membership === id ? " sel" : "") }, label);
      chip.addEventListener("click", () => { f.membership = f.membership === id ? null : id; redraw(); refreshDd(); });
      c4.append(chip);
    }
    cols.append(c4);

    el.append(cols);

    // footer: cleanup suggestions + toggle
    const stale = wsBoards().filter(b => boardModified(b) <= Date.now() - 180 * DAY_MS).length;
    const foot = h("div", { class: "wh-filter-foot" });
    foot.append(h("span", { class: "wh-filter-cleanmsg" }, ico(stale ? "vibe" : "check", 14),
      h("span", {}, stale ? (stale + " cleanup suggestion" + (stale > 1 ? "s" : "") + " found") : "No cleanup suggestions found")));
    const tgl = h("button", { class: "wh-toggle" + (f.cleanup ? " on" : ""), title: "Cleanup mode" }, h("span", { class: "wh-toggle-knob" }));
    tgl.addEventListener("click", () => { f.cleanup = !f.cleanup; redraw(); refreshDd(); });
    foot.append(h("div", { class: "wh-toggle-wrap" }, ico("vibe", 14), h("span", {}, "Cleanup mode"), tgl));
    el.append(foot);
  }, { minWidth: 720, alignRight: true });
}

function statusRows(tasks) {
  return STATUSES.map(s => ({ label: s.label, n: tasks.filter(t => t.status === s.id).length, color: s.color }));
}
function priorityRows(tasks) {
  return PRIORITIES.map(p => ({ label: p.label || "None", n: tasks.filter(t => t.priority === p.id).length, color: p.color }));
}

function chartCard(title, body) {
  return h("div", { class: "chart-card" }, h("h3", {}, title), body);
}

function barChart(rows) {
  const total = rows.reduce((a, b) => a + b.n, 0) || 1;
  const wrap = h("div", {});
  for (const r of rows) {
    const pct = Math.round((r.n / total) * 100);
    wrap.append(h("div", { class: "bar-row" },
      h("div", { class: "bar-label" }, r.label),
      h("div", { class: "bar-track" }, h("div", { class: "bar-fill", style: `width:${r.n ? Math.max(pct, 3) : 0}%;background:${r.color}` })),
      h("div", { class: "bar-val" }, String(r.n))));
  }
  return wrap;
}

function donutEl(rows) {
  const total = rows.reduce((a, b) => a + b.n, 0) || 1;
  const R = 54, SW = 20, C = 2 * Math.PI * R;
  let acc = 0;
  const segs = rows.filter(r => r.n > 0).map(r => {
    const len = (r.n / total) * C;
    const seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${r.color}" stroke-width="${SW}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`;
    acc += len;
    return seg;
  }).join("");
  const wrap = h("div", { class: "donut-wrap" });
  const svgSpan = h("div", { class: "donut" });
  svgSpan.innerHTML = `<svg width="140" height="140" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="${R}" fill="none" style="stroke:var(--surface-2)" stroke-width="${SW}"/>${segs}
    <text x="70" y="65" text-anchor="middle" font-size="28" font-weight="800" style="fill:var(--text)">${rows.reduce((a, b) => a + b.n, 0)}</text>
    <text x="70" y="86" text-anchor="middle" font-size="11" style="fill:var(--text-2)">tasks</text></svg>`;
  const legend = h("div", { class: "donut-legend" });
  rows.forEach(r => legend.append(h("div", {},
    h("span", { class: "legend-dot", style: `background:${r.color}` }),
    h("span", {}, r.label || "—"),
    h("span", { class: "muted", style: "margin-left:4px" }, String(r.n)))));
  wrap.append(svgSpan, legend);
  return wrap;
}

/* ---------------- Render: chart view ---------------- */

function chartViewEl(board) {
  const root = h("div", { class: "view-root chart-view-single" });
  const cfg = board.chartConfig;
  const mkSel = (opts, cur, on) => {
    const s = h("select", { style: "height:32px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);padding:0 8px" });
    for (const o of opts) s.append(h("option", { value: o.id }, o.label));
    s.value = cur;
    s.addEventListener("change", () => on(s.value));
    return s;
  };
  const toolbar = h("div", { class: "chart-toolbar" },
    h("span", { class: "muted" }, "Chart type:"),
    mkSel([{ id: "bar", label: "Bar" }, { id: "donut", label: "Donut" }, { id: "pie", label: "Pie" }, { id: "line", label: "Line" }], cfg.chartType, (v) => { cfg.chartType = v; save(); rerenderViewOnly(board); }));
  if (cfg.chartType !== "line") toolbar.append(
    h("span", { class: "muted", style: "margin-left:10px" }, "Data:"),
    mkSel([{ id: "status", label: "By status" }, { id: "priority", label: "By priority" }, { id: "owner", label: "By owner" }, { id: "group", label: "By group" }], cfg.metric, (v) => { cfg.metric = v; save(); rerenderViewOnly(board); }));
  root.append(toolbar);

  const card = h("div", { class: "chart-card", style: "max-width:700px" });
  card.append(h("h3", {}, "Chart"));
  const body = h("div", {});
  renderWidgetBody(board, { type: "chart", settings: { chartType: cfg.chartType, metric: cfg.metric } }, body);
  card.append(body);
  root.append(card);
  return root;
}

/* ---------------- Render: dashboard view ---------------- */

/* ---------------- Dashboard: editable widget canvas ---------------- */

function widgetMetricRows(board, metric) {
  const tasks = allVisible(board);
  if (metric === "priority") return priorityRows(tasks);
  if (metric === "owner") return state.people.map(p => ({ label: p.name.split(" ")[0], n: tasks.filter(t => t.owners.includes(p.id)).length, color: p.color }));
  if (metric === "group") return board.groups.map(g => ({ label: g.name, n: visibleTasks(g).length, color: g.color }));
  return statusRows(tasks);
}

function widgetIcon(w) { return w.type === "numbers" ? "numbers" : w.type === "battery" ? "battery" : "chart"; }

function pieEl(rows) {
  const vis = rows.filter(r => r.n > 0);
  const total = vis.reduce((a, b) => a + b.n, 0) || 1;
  const cx = 70, cy = 70, R = 62;
  let inner;
  if (vis.length === 1) inner = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${vis[0].color}"/>`;
  else if (!vis.length) inner = `<circle cx="${cx}" cy="${cy}" r="${R}" style="fill:var(--surface-2)"/>`;
  else {
    let ang = -Math.PI / 2;
    inner = vis.map(r => {
      const frac = r.n / total, a2 = ang + frac * 2 * Math.PI;
      const x1 = cx + R * Math.cos(ang), y1 = cy + R * Math.sin(ang);
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      const large = frac > 0.5 ? 1 : 0;
      const d = `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      ang = a2;
      return `<path d="${d}" fill="${r.color}"/>`;
    }).join("");
  }
  const wrap = h("div", { class: "pie-wrap" });
  const svg = h("div", { class: "donut" });
  svg.innerHTML = `<svg width="148" height="148" viewBox="0 0 140 140">${inner}</svg>`;
  const legend = h("div", { class: "donut-legend" });
  rows.forEach(r => legend.append(h("div", {}, h("span", { class: "legend-dot", style: `background:${r.color}` }), h("span", {}, r.label || "—"), h("span", { class: "muted", style: "margin-left:4px" }, String(r.n)))));
  wrap.append(svg, legend);
  return wrap;
}

function lineChartEl(board) {
  const tasks = allVisible(board).filter(t => t.due);
  if (!tasks.length) return h("div", { class: "muted" }, "No dated tasks to plot over time.");
  const map = new Map();
  tasks.forEach(t => { const k = t.due.slice(0, 7); map.set(k, (map.get(k) || 0) + 1); });
  const pts = [...map.keys()].sort().map(k => ({ k, n: map.get(k) }));
  const W = 560, H = 210, padL = 30, padB = 28, padT = 16, padR = 16;
  const maxN = Math.max(...pts.map(p => p.n), 1);
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const stepX = pts.length > 1 ? innerW / (pts.length - 1) : 0;
  const xy = pts.map((p, i) => [padL + (pts.length > 1 ? i * stepX : innerW / 2), padT + innerH - (p.n / maxN) * innerH]);
  const poly = xy.map(c => c.map(n => n.toFixed(1)).join(",")).join(" ");
  const dots = xy.map(c => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="4" style="fill:var(--primary)"/>`).join("");
  const labels = pts.map((p, i) => `<text x="${xy[i][0].toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" style="fill:var(--text-2)">${MONTHS[Number(p.k.split("-")[1]) - 1]}</text>`).join("");
  const axis = `<line x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" style="stroke:var(--border)"/>`;
  const el = h("div", { style: "width:100%" });
  el.innerHTML = `<svg width="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${axis}<polyline points="${poly}" fill="none" style="stroke:var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
  return el;
}

function numbersWidget(board, w) {
  const tasks = allVisible(board);
  const M = {
    total: ["Total tasks", tasks.length, "var(--text)"],
    done: ["Completed", tasks.filter(t => t.status === "done").length, "#00c875"],
    working: ["In progress", tasks.filter(t => t.status === "working").length, "#fdab3d"],
    stuck: ["Stuck", tasks.filter(t => t.status === "stuck").length, "#e2445c"],
    overdue: ["Overdue", tasks.filter(t => t.due && t.status !== "done" && t.due < todayISO()).length, "#e2445c"],
  };
  const [label, num, color] = M[w.settings.metric] || M.total;
  return h("div", { class: "numbers-widget" }, h("div", { class: "nw-num", style: `color:${color}` }, String(num)), h("div", { class: "nw-label" }, label));
}

function batteryWidget(board, w) {
  const kind = w.settings.metric === "priority" ? "priority" : "status";
  const tasks = allVisible(board);
  const wrap = h("div", { style: "width:100%" });
  const bat = batteryEl(tasks, kind);
  bat.style.height = "34px";
  wrap.append(bat);
  const defs = kind === "status" ? STATUSES : PRIORITIES;
  const legend = h("div", { class: "donut-legend", style: "margin-top:16px;flex-direction:row;flex-wrap:wrap;gap:14px" });
  defs.forEach(d => { const n = tasks.filter(t => (kind === "status" ? t.status : t.priority) === d.id).length; if (!n) return; legend.append(h("div", {}, h("span", { class: "legend-dot", style: `background:${d.color}` }), h("span", {}, `${d.label || "—"} ${n}`))); });
  wrap.append(legend);
  return wrap;
}

function renderWidgetBody(board, w, body) {
  body.className = "widget-body";
  if (w.type === "numbers") { body.append(numbersWidget(board, w)); return; }
  if (w.type === "battery") { body.classList.add("bars"); body.append(batteryWidget(board, w)); return; }
  // chart
  const ct = w.settings.chartType || "bar";
  const rows = widgetMetricRows(board, w.settings.metric);
  if (ct === "bar") { body.classList.add("bars"); body.append(barChart(rows)); }
  else if (ct === "donut") body.append(donutEl(rows));
  else if (ct === "pie") body.append(pieEl(rows));
  else if (ct === "line") body.append(lineChartEl(board));
}

function dashData(board) {
  const ids = board.connectedBoards && board.connectedBoards.length ? board.connectedBoards : [board.id];
  const groups = [];
  for (const id of ids) { const b = state.boards.find(x => x.id === id); if (b) groups.push(...b.groups); }
  return { groups, columns: [], view: "dashboard" };
}

function widgetEl(board, w) {
  const isLine = w.type === "chart" && w.settings.chartType === "line";
  const card = h("div", { class: "widget" + (isLine ? " wide" : ""), dataset: { widget: w.id } });
  const title = h("div", { class: "widget-title", title: "Click to rename" }, w.title);
  title.addEventListener("click", () => inlineEdit(title, w.title, (v) => { w.title = v; save(); render(); }));
  const gear = h("button", { class: "widget-act", title: "Settings" });
  gear.append(ico("gear", 15));
  gear.addEventListener("click", () => widgetSettings(gear, board, w));
  const del = h("button", { class: "widget-act", title: "Remove widget" });
  del.append(ico("x", 15));
  del.addEventListener("click", () => { board.widgets = board.widgets.filter(x => x.id !== w.id); save(); render(); toast("Widget removed"); });
  card.append(h("div", { class: "widget-head" }, ico(widgetIcon(w), 15), title, gear, del));
  const body = h("div", { class: "widget-body" });
  renderWidgetBody(dashData(board), w, body);
  card.append(body);
  return card;
}

function refreshWidget(board, w) {
  const card = document.querySelector(`[data-widget="${w.id}"]`);
  if (!card) { rerenderViewOnly(board); return; }
  card.classList.toggle("wide", w.type === "chart" && w.settings.chartType === "line");
  const body = card.querySelector(".widget-body");
  body.replaceChildren();
  renderWidgetBody(dashData(board), w, body);
}

function connectBoardsModal(board) {
  const sel = new Set(board.connectedBoards || []);
  const candidates = wsBoards().filter(b => b.kind === "board" && b.id !== board.id);
  openModal((card, close) => {
    const closeBtn = h("button", { class: "icon-btn", onclick: close });
    closeBtn.append(ico("x", 16));
    card.append(h("div", { class: "modal-head", style: "flex-direction:column;align-items:stretch;gap:2px;position:relative" },
      h("div", { style: "display:flex;align-items:center" }, h("div", { style: "flex:1;font-size:20px;font-weight:700" }, "Connect boards to this dashboard"), closeBtn),
      h("div", { class: "muted", style: "font-size:13px" }, "You can always change this later")));

    const body = h("div", { class: "modal-body" });
    const searchWrap = h("div", { class: "board-search-wrap", style: "border:1px solid var(--border);width:100%;margin-bottom:12px" });
    const si = h("input", { type: "text", placeholder: "Search by Board name", style: "width:100%" });
    searchWrap.append(ico("search", 15), si);
    body.append(searchWrap);
    body.append(h("div", { class: "dd-title", style: "padding-left:0" }, "Recently Used"));
    const list = h("div", {});
    body.append(list);

    const draw = () => {
      list.replaceChildren();
      const f = si.value.toLowerCase();
      const rows = candidates.filter(b => b.name.toLowerCase().includes(f));
      if (!rows.length) { list.append(h("div", { class: "muted", style: "padding:12px 0" }, "No boards to connect in this workspace.")); return; }
      for (const b of rows) {
        const cb = h("input", { type: "checkbox" });
        cb.checked = sel.has(b.id);
        cb.addEventListener("change", () => { cb.checked ? sel.add(b.id) : sel.delete(b.id); });
        list.append(h("label", { class: "connect-row", style: "border-bottom:1px solid var(--border)" }, cb,
          ico(b.icon || "table", 16),
          h("div", { style: "display:flex;flex-direction:column" }, h("span", {}, b.name), h("span", { class: "muted", style: "font-size:11px" }, getWorkspace().name + " Workspace"))));
      }
    };
    si.addEventListener("input", draw);
    draw();
    card.append(body);

    const done = h("button", { class: "btn-primary" }, "Done");
    done.addEventListener("click", () => { board.connectedBoards = [...sel]; save(); close(); render(); });
    card.append(h("div", { class: "modal-foot" }, h("button", { class: "modal-cancel", onclick: close }, "Cancel"), done));
  });
}

function selectRow(label, options, current, onChange) {
  const row = h("div", { class: "ws-set-row" });
  row.append(h("label", {}, label));
  const sel = h("select", {});
  for (const o of options) sel.append(h("option", { value: o.id }, o.label));
  sel.value = current;
  sel.addEventListener("change", () => onChange(sel.value));
  sel.addEventListener("keydown", (e) => e.stopPropagation());
  row.append(sel);
  return row;
}

function widgetSettings(anchor, board, w) {
  openDropdown(anchor, (el) => {
    el.append(h("div", { class: "dd-title" }, "Widget settings"));
    if (w.type === "chart") {
      el.append(selectRow("Chart type", [{ id: "bar", label: "Bar chart" }, { id: "donut", label: "Donut" }, { id: "pie", label: "Pie" }, { id: "line", label: "Line" }], w.settings.chartType || "bar", (v) => { w.settings.chartType = v; save(); refreshWidget(board, w); refreshDd(); }));
      if ((w.settings.chartType || "bar") !== "line") {
        el.append(selectRow("Data", [{ id: "status", label: "By status" }, { id: "priority", label: "By priority" }, { id: "owner", label: "By owner" }, { id: "group", label: "By group" }], w.settings.metric || "status", (v) => { w.settings.metric = v; save(); refreshWidget(board, w); }));
      }
    } else if (w.type === "numbers") {
      el.append(selectRow("Metric", [{ id: "total", label: "Total tasks" }, { id: "done", label: "Completed" }, { id: "working", label: "In progress" }, { id: "stuck", label: "Stuck" }, { id: "overdue", label: "Overdue" }], w.settings.metric || "total", (v) => { w.settings.metric = v; save(); refreshWidget(board, w); }));
    } else if (w.type === "battery") {
      el.append(selectRow("Group by", [{ id: "status", label: "Status" }, { id: "priority", label: "Priority" }], w.settings.metric || "status", (v) => { w.settings.metric = v; save(); refreshWidget(board, w); }));
    }
  }, { minWidth: 230 });
}

const WIDGET_TYPES = [
  { type: "chart", icon: "chart", name: "Chart", desc: "Bar, pie, line or donut from your board", title: "Status overview", def: { chartType: "bar", metric: "status" } },
  { type: "numbers", icon: "numbers", name: "Numbers", desc: "A single key metric at a glance", title: "Total tasks", def: { metric: "total" } },
  { type: "battery", icon: "battery", name: "Battery", desc: "Your progress at a glance", title: "Status battery", def: { metric: "status" } },
];

function addWidgetMenu(anchor, board) {
  openDropdown(anchor, (el, close) => {
    el.classList.add("add-widget-menu");
    el.append(h("div", { class: "dd-title" }, "Add widget"));
    for (const t of WIDGET_TYPES) {
      const it = h("div", { class: "dd-item", onclick: () => {
        close();
        board.widgets.push({ id: uid(), type: t.type, title: t.title, settings: { ...t.def } });
        save();
        render();
        toast(`${t.name} widget added`);
      } }, h("span", { class: "aw-ico" }, ico(t.icon, 16)), h("div", { class: "aw-text" }, h("b", {}, t.name), h("span", {}, t.desc)));
      el.append(it);
    }
    el.append(h("hr", { class: "dd-sep" }));
    for (const [icon, label] of [["vibe", "Vibe app"], ["gantt", "Gantt"], ["gallery", "Files Gallery"]]) {
      const it = ddItem(icon, label, () => { close(); toast(`${label} widget — coming soon in demo`); }, "soon");
      it.append(h("span", { class: "dd-badge" }, "Soon"));
      el.append(it);
    }
  }, { minWidth: 280 });
}

function dashboardWidgetsEl(board) {
  const root = h("div", { class: "view-root", style: "flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0" });

  const toolbar = h("div", { class: "widget-toolbar" });
  const addBtn = h("button", { class: "btn-primary" });
  addBtn.append(ico("plus", 14), h("span", {}, "Add widget"));
  addBtn.addEventListener("click", () => addWidgetMenu(addBtn, board));
  const connBtn = h("button", { class: "tb-btn connect" });
  connBtn.append(ico("table", 15), h("span", {}, "Connect boards"));
  connBtn.addEventListener("click", () => connectBoardsModal(board));
  toolbar.append(addBtn, connBtn, h("span", { class: "muted", style: "font-size:12px" }, "Gear on a widget = change chart type / data"));
  root.append(toolbar);

  const canvas = h("div", { class: "widget-canvas" });
  if (!board.widgets.length) {
    const empty = h("div", { class: "widget-empty dash-hero" });
    const art = h("div", { class: "dash-hero-art" });
    art.innerHTML = `<svg width="240" height="150" viewBox="0 0 240 150" fill="none">
      <rect x="14" y="20" width="150" height="112" rx="10" fill="var(--bg)" stroke="var(--border)"/>
      <text x="30" y="42" font-size="11" font-weight="700" style="fill:var(--text)">Dashboard</text>
      <rect x="30" y="54" width="56" height="34" rx="5" fill="var(--surface-2)"/>
      <rect x="36" y="62" width="34" height="4" rx="2" fill="#fdab3d"/><rect x="36" y="70" width="44" height="4" rx="2" fill="#0073ea"/><rect x="36" y="78" width="24" height="4" rx="2" fill="#00c875"/>
      <circle cx="124" cy="71" r="17" fill="#00c875"/><path d="M124 71 L124 54 A17 17 0 0 1 139 79 Z" fill="#fdab3d"/><path d="M124 71 L139 79 A17 17 0 0 1 110 80 Z" fill="#5559df"/>
      <rect x="30" y="98" width="26" height="24" rx="4" fill="#e2445c"/><rect x="62" y="98" width="26" height="24" rx="4" fill="#5559df"/>
      <rect x="96" y="98" width="58" height="24" rx="4" fill="var(--surface-2)"/><text x="125" y="114" font-size="10" text-anchor="middle" font-weight="700" style="fill:var(--text-2)">$375M</text>
      <path d="M164 40 H196 M164 71 H210 M164 102 H196" stroke="var(--border-2)" stroke-width="1.5"/>
      <rect x="196" y="32" width="34" height="16" rx="3" fill="var(--surface-2)"/><rect x="210" y="63" width="22" height="16" rx="3" fill="var(--surface-2)"/><rect x="196" y="94" width="34" height="16" rx="3" fill="var(--surface-2)"/></svg>`;
    empty.append(art,
      h("div", { style: "font-size:20px;font-weight:700;margin-top:14px;color:var(--text)" }, "Visualize data from multiple boards"),
      h("div", { class: "muted", style: "margin:6px 0 18px" }, "Use charts, timelines, and other widgets to get insights from all of your boards at once"));
    const eb = h("button", { class: "btn-primary", style: "margin:0 auto" }, "Add your first widget");
    eb.addEventListener("click", () => addWidgetMenu(eb, board));
    empty.append(eb);
    canvas.append(empty);
  } else {
    for (const w of board.widgets) canvas.append(widgetEl(board, w));
  }
  root.append(canvas);
  return root;
}

/* ---------------- Render: gantt view ---------------- */

function ganttViewEl(board) {
  const root = h("div", { class: "view-root gantt-view" });
  const dated = allVisible(board).filter(t => t.due);
  if (!dated.length) {
    root.append(h("div", { class: "gantt-empty-note" }, "No tasks with due dates yet. Set due dates on tasks to see them on the timeline."));
    return root;
  }
  const items = dated.map(t => {
    const due = isoToDays(t.due);
    const start = Math.min(due, isoToDays(tsToIso(t.createdAt || Date.now())));
    return { t, start, end: due };
  });
  let min = Math.min(...items.map(i => i.start)) - 2;
  let max = Math.max(...items.map(i => i.end)) + 3;
  const span = Math.max(1, max - min);
  const dayPx = 26;
  const trackW = span * dayPx;
  const nameW = 220;
  const cols = `${nameW}px ${trackW}px`;

  const inner = h("div", { class: "gantt-inner", style: `width:${nameW + trackW}px;position:relative` });

  const head = h("div", { class: "gantt-head", style: `grid-template-columns:${cols}` });
  head.append(h("div", { class: "gh-name" }, "Task"));
  const monthsBar = h("div", { style: "position:relative;height:34px" });
  for (let d = min; d <= max; d++) {
    const dt = new Date(d * 86400000);
    if (dt.getUTCDate() === 1 || d === min) {
      const left = (d - min) * dayPx;
      const yr = dt.getUTCFullYear() !== new Date().getFullYear() ? " " + dt.getUTCFullYear() : "";
      monthsBar.append(h("div", { style: `position:absolute;left:${left}px;top:9px;font-size:11px;font-weight:600;color:var(--text-2);white-space:nowrap` }, `${MONTHS[dt.getUTCMonth()]}${yr}`));
    }
  }
  head.append(monthsBar);
  inner.append(head);

  for (const g of board.groups) {
    const gItems = items.filter(i => g.tasks.includes(i.t));
    if (!gItems.length) continue;
    inner.append(h("div", { class: "gantt-row", style: `grid-template-columns:${cols}` },
      h("div", { class: "gname", style: `color:${g.color};font-weight:600` }, g.name), h("div", {})));
    for (const it of gItems) {
      const row = h("div", { class: "gantt-row", style: `grid-template-columns:${cols}` });
      const nm = h("div", { class: "gname", title: it.t.name }, it.t.name);
      nm.addEventListener("click", () => { ui.panel = it.t.id; renderPanel(); });
      row.append(nm);
      const track = h("div", { class: "gantt-track" });
      const left = (it.start - min) * dayPx;
      const width = Math.max(dayPx, (it.end - it.start + 1) * dayPx);
      const s = statusOf(it.t);
      const bar = h("div", { class: "gantt-bar", style: `left:${left}px;width:${width}px;background:${s.color}`, title: `${it.t.name} — due ${fmtDate(it.t.due)}` }, fmtDate(it.t.due));
      bar.addEventListener("click", () => { ui.panel = it.t.id; renderPanel(); });
      track.append(bar);
      row.append(track);
      inner.append(row);
    }
  }

  const todayD = isoToDays(todayISO());
  if (todayD >= min && todayD <= max) {
    inner.append(h("div", { class: "gantt-today", style: `left:${nameW + (todayD - min) * dayPx}px`, title: "Today" }));
  }

  const scroll = h("div", { class: "gantt-scroll" }, inner);
  root.append(scroll);
  return root;
}

/* ---------------- Render: form view ---------------- */

function formViewEl(board) {
  const root = h("div", { class: "view-root form-view" });
  const card = h("div", { class: "form-card" });
  card.append(h("div", { class: "form-banner" }));
  const inner = h("div", { class: "form-inner" });
  inner.append(h("h2", {}, board.name), h("div", { class: "form-sub" }, "Fill in the details to add a new item to this board."));

  const data = { name: "", status: "none", priority: "none", owners: new Set(), due: "" };

  const field = (label, control) => h("div", { class: "form-field" }, h("label", {}, label), control);
  const chipGroup = (defs, isSel, toggle) => {
    const wrap = h("div", { class: "form-chips" });
    const draw = () => {
      wrap.replaceChildren();
      for (const d of defs) {
        const sel = isSel(d.id);
        const c = h("div", { class: "form-chip" + (sel ? " sel" : ""), style: sel ? `background:${d.color}` : "" }, d.label || "—");
        c.addEventListener("click", () => { toggle(d.id); draw(); });
        wrap.append(c);
      }
    };
    draw();
    return wrap;
  };

  const nameIn = h("input", { type: "text", placeholder: "e.g. Launch summer campaign" });
  nameIn.addEventListener("input", () => data.name = nameIn.value);
  inner.append(field("Item name *", nameIn));

  inner.append(field("Status", chipGroup(STATUSES, id => data.status === id, id => data.status = id)));
  inner.append(field("Priority", chipGroup(PRIORITIES, id => data.priority === id, id => data.priority = id)));

  const peopleDefs = state.people.map(p => ({ id: p.id, label: p.name.split(" ")[0], color: p.color }));
  inner.append(field("Owners", chipGroup(peopleDefs, id => data.owners.has(id), id => { data.owners.has(id) ? data.owners.delete(id) : data.owners.add(id); })));

  const dateIn = h("input", { type: "date" });
  dateIn.addEventListener("change", () => data.due = dateIn.value);
  inner.append(field("Due date", dateIn));

  const submit = h("button", { class: "btn-primary form-submit" }, "Submit item");
  submit.addEventListener("click", () => {
    if (!data.name.trim()) { toast("Please enter an item name"); nameIn.focus(); return; }
    let g = board.groups[0];
    if (!g) { addGroup(board); g = board.groups[0]; }
    const t = addTask(g, data.name.trim());
    t.status = data.status;
    t.priority = data.priority;
    t.owners = [...data.owners];
    t.due = data.due;
    touch(t);
    save();
    toast(`"${t.name}" added to ${g.name}`);
    rerenderViewOnly(board);
  });
  inner.append(submit);

  card.append(inner);
  root.append(card);
  return root;
}

/* ---------------- Render: doc view ---------------- */

function docViewEl(board) {
  const root = h("div", { class: "view-root doc-view" });
  const paper = h("div", { class: "doc-paper" });
  const ta = h("textarea", { placeholder: "Start writing your doc... (saved automatically)" });
  ta.value = board.doc || "";
  ta.addEventListener("input", () => { board.doc = ta.value; save(); });
  paper.append(ta);
  root.append(paper);
  return root;
}

/* ---------------- Render: file gallery view ---------------- */

function galleryViewEl(board) {
  const root = h("div", { class: "view-root gallery-view" });
  const files = [];
  for (const t of allVisible(board)) for (const f of (t.files || [])) files.push({ f, t });
  if (!files.length) {
    root.append(h("div", { class: "empty-board", style: "padding-top:46px" },
      h("div", { style: "font-size:42px;margin-bottom:10px" }, "🖼️"),
      h("div", { style: "font-size:16px;color:var(--text);margin-bottom:6px" }, "No files were found."),
      h("div", { class: "muted" }, "Open any item, scroll to Files and upload images — they'll appear here.")));
    return root;
  }
  const grid = h("div", { class: "gallery-grid" });
  for (const { f, t } of files) {
    const card = h("div", { class: "gallery-card", onclick: () => { ui.panel = t.id; renderPanel(); } });
    card.append(h("div", { class: "gallery-thumb", style: "padding:0;background:var(--surface-2)" }, h("img", { src: f.dataURL, alt: f.name, style: "width:100%;height:100%;object-fit:cover" })));
    card.append(h("div", { class: "gallery-info" }, h("b", {}, f.name), h("div", { class: "kb-meta" }, h("span", {}, t.name))));
    grid.append(card);
  }
  root.append(grid);
  return root;
}

/* ---------------- Render: workspace home ---------------- */

function workspaceHomeEl() {
  const w = getWorkspace();
  const root = h("div", { class: "view-root wh" });
  // ---- cover banner (per-workspace upload + drag-to-reposition; falls back to cover.jpg / gradient)
  const posY = (w.coverPos && typeof w.coverPos.y === "number") ? w.coverPos.y : 50;
  const banner = h("div", { class: "wh-banner" + (ui.coverEditing && w.cover ? " repositioning" : "") });
  if (w.cover) { banner.style.backgroundImage = `url("${w.cover}")`; banner.style.backgroundPosition = `center ${posY}%`; }
  const coverIn = h("input", { type: "file", accept: "image/*", style: "display:none" });
  coverIn.addEventListener("change", () => {
    const f = coverIn.files[0]; if (!f) return;
    scaleImageWide(f, 1600, (url) => { w.cover = url; w.coverPos = { y: 50 }; save(); render(); toast("Cover updated"); });
    coverIn.value = "";
  });

  if (ui.coverEditing && w.cover) {
    banner.append(h("div", { class: "wh-cover-hint" }, ico("move", 15), h("span", {}, "Drag the image up / down to reposition")));
    const doneBtn = h("button", { class: "wh-cover-edit wh-cover-done", onclick: (e) => { e.stopPropagation(); ui.coverEditing = false; save(); renderMain(); toast("Cover saved"); } }, ico("check", 15), h("span", {}, "Done"));
    banner.append(doneBtn);
    // vertical drag → background-position-y %
    banner.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startY = e.clientY, start = (w.coverPos && typeof w.coverPos.y === "number") ? w.coverPos.y : 50;
      const move = (ev) => {
        let p = start - ((ev.clientY - startY) / banner.offsetHeight) * 100;
        p = Math.max(0, Math.min(100, p));
        w.coverPos = { y: p };
        banner.style.backgroundPosition = `center ${p}%`;
      };
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); save(); };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  } else {
    const coverBtn = h("button", { class: "wh-cover-edit", title: "Change cover" }, ico("camera", 15), h("span", {}, "Edit cover"));
    coverBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (w.cover) openDropdown(coverBtn, (el, close) => {
        el.append(ddItem("camera", "Replace cover", () => { close(); coverIn.click(); }));
        el.append(ddItem("move", "Reposition", () => { close(); ui.coverEditing = true; renderMain(); }));
        el.append(ddItem("trash", "Remove cover", () => { close(); w.cover = null; w.coverPos = null; save(); render(); toast("Cover removed"); }, "danger"));
      }, { alignRight: true, minWidth: 180 });
      else coverIn.click();
    });
    banner.append(coverBtn);
  }
  banner.append(coverIn);
  root.append(banner);
  // hero portrait mirrors the current user's profile character; updates when you change it
  const heroOn = !!(me().avatar || WH_HERO);
  if (heroOn) {
    const hero = h("img", { class: "wh-hero", src: me().avatar || WH_HERO, alt: "" });
    hero.addEventListener("error", () => { hero.remove(); const hd = root.querySelector(".wh-head"); if (hd) hd.classList.remove("has-hero"); });
    root.append(hero);
  }
  const body = h("div", { class: "wh-body" });

  const logo = h("div", { class: "wh-logo", title: "Edit workspace icon", style: `background:${w.color};color:${textColorOn(w.color)}` },
    h("span", { class: "wh-logo-glyph" }, wsGlyph(w, 42)),
    h("span", { class: "wh-home-badge" }, ico("home", 16)),
    h("span", { class: "wh-logo-edit" }, ico("pencil", 13)));
  logo.addEventListener("click", () => logoEditor(logo, w));

  const name = h("div", { class: "wh-name" }, w.name);
  name.addEventListener("click", () => inlineEdit(name, w.name, (v) => { w.name = v; w.letter = (v[0] || "W").toUpperCase(); save(); render(); }, { style: "font-size:26px;font-weight:700" }));
  const infoBtn = h("button", { class: "wh-info-btn", title: "Workspace info" }, ico("chevDown", 18));
  infoBtn.addEventListener("click", (e) => { e.stopPropagation(); workspaceInfoMenu(infoBtn, w); });
  const titleRow = h("div", { class: "wh-title-row" }, name, infoBtn);

  const desc = h("div", { class: "wh-desc" + (w.desc ? "" : " muted") }, w.desc || "Add workspace description");
  desc.addEventListener("click", () => inlineEdit(desc, w.desc, (v) => { w.desc = v; save(); render(); }));

  const titles = h("div", { class: "wh-titles" }, titleRow, desc);

  const whAction = (icon, label, fn) => {
    const b = h("button", { class: "tb-btn", onclick: fn });
    b.append(ico(icon, 15), h("span", {}, label));
    return b;
  };
  const membersBtn = h("button", { class: "btn-invite" });
  membersBtn.append(ico("person", 15), h("span", {}, "Members"));
  membersBtn.addEventListener("click", (e) => peopleManager(e.currentTarget));
  const actions = h("div", { class: "wh-actions" },
    whAction("chat", "Feedback", () => toast("Thanks for the feedback! (demo)")),
    whAction("agent", "Agents", () => toast("Agents — coming soon in demo")),
    membersBtn);

  body.append(h("div", { class: "wh-head" + (heroOn ? " has-hero" : "") }, logo, titles, actions));

  const tabs = h("div", { class: "wh-tabs" });
  const TABS = [["recents", "Recents", "calendar"], ["content", "Content", "apps"], ["collaborators", "Collaborators", "person"], ["permissions", "Permissions", "gear"]];
  for (const [id, label, icon] of TABS) {
    const t = h("button", { class: "wh-tab" + (ui.homeTab === id ? " active" : ""), onclick: () => { ui.homeTab = id; renderMain(); } });
    t.append(ico(icon, 15), h("span", {}, label));
    tabs.append(t);
  }
  body.append(tabs);

  if (ui.homeTab === "collaborators") body.append(whCollaborators());
  else if (ui.homeTab === "recents") body.append(whRecents());
  else if (ui.homeTab === "permissions") body.append(h("div", { style: "padding:34px 0;color:var(--text-2)" }, "This workspace is private to you and invited members. Granular permission controls are coming soon in this demo."));
  else body.append(whContent());

  root.append(body);
  return root;
}

/* ---- Feature 1: workspace logo editor (pastel color + icon) ---- */
function logoEditor(anchor, w) {
  // live-apply to the on-screen logo + sidebar without re-rendering main (keeps anchor attached)
  const applied = () => {
    anchor.style.background = w.color;
    anchor.style.color = textColorOn(w.color);
    const glyph = anchor.querySelector(".wh-logo-glyph");
    if (glyph) glyph.replaceChildren(wsGlyph(w, 42));
    save();
    renderSidebar();
  };
  openDropdown(anchor, (el, close) => {
    el.classList.add("logo-editor");
    el.append(h("div", { class: "dd-title" }, "Background color"));
    const swatches = h("div", { class: "logo-swatches" });
    for (const c of WS_PASTEL) {
      const sw = h("button", { class: "logo-swatch" + (w.color === c ? " sel" : ""), style: `background:${c}`, title: c });
      sw.addEventListener("click", () => { w.color = c; applied(); logoEditor(anchor, w); });
      swatches.append(sw);
    }
    el.append(swatches);

    el.append(h("div", { class: "dd-title", style: "margin-top:6px" }, "Icon"));
    const icons = h("div", { class: "logo-icons" });
    const letterBtn = h("button", { class: "logo-icon-opt" + (!w.icon ? " sel" : ""), title: "Letter" }, h("b", {}, w.letter));
    letterBtn.addEventListener("click", () => { w.icon = null; applied(); logoEditor(anchor, w); });
    icons.append(letterBtn);
    for (const name of WS_ICONS) {
      const opt = h("button", { class: "logo-icon-opt" + (w.icon === name ? " sel" : ""), title: name }, ico(name, 18));
      opt.addEventListener("click", () => { w.icon = name; applied(); logoEditor(anchor, w); });
      icons.append(opt);
    }
    el.append(icons);
  }, { minWidth: 248 });
}

/* ---- Feature 5: workspace info popover ---- */
function workspaceInfoMenu(anchor, w) {
  openDropdown(anchor, (el, close) => {
    el.classList.add("ws-info-pop");
    el.append(h("div", { class: "ws-info-head" },
      h("span", { class: "ws-dd-logo", style: `background:${w.color};color:${textColorOn(w.color)}` }, wsGlyph(w, 16)),
      h("div", {}, h("b", {}, w.name), h("div", { class: "muted", style: "font-size:12px" }, w.desc || "No description"))));
    el.append(h("hr", { class: "dd-sep" }));

    const row = (label, valEl) => h("div", { class: "ws-info-row" }, h("span", { class: "ws-info-label" }, label), valEl);
    el.append(row("Workspace type", h("span", { class: "ws-info-val" }, ico("person", 13), h("span", {}, "Open workspace"))));

    const membersVal = h("button", { class: "ws-info-link" }, ico("person", 13), h("span", {}, "All members · " + state.people.length));
    membersVal.addEventListener("click", () => membersListMenu(membersVal));
    el.append(row("Members", membersVal));

    el.append(row("Owner", h("span", { class: "ws-info-val" }, avatarEl(me(), 18), h("span", {}, me().name))));
    el.append(row("Created", h("span", { class: "ws-info-val muted" }, "Campaign workspace")));
  }, { minWidth: 280 });
}

function membersListMenu(anchor) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Members · " + state.people.length));
    for (const p of state.people) {
      const it = h("div", { class: "dd-item", onclick: () => memberProfilePopover(it, p) },
        avatarEl(p, 28),
        h("div", { style: "flex:1;min-width:0" },
          h("div", { style: "font-weight:500" }, p.name + (p.id === state.user ? " (you)" : "")),
          h("div", { class: "muted", style: "font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" }, p.title || "Member")),
        h("span", { class: "ws-role-chip" }, p.role || DEFAULT_MEMBER_ROLE));
      el.append(it);
    }
  }, { minWidth: 260 });
}

function memberProfilePopover(anchor, p) {
  openDropdown(anchor, (el, close) => {
    el.classList.add("member-profile");
    el.append(h("div", { class: "mp-top" }, avatarEl(p, 56),
      h("div", { style: "min-width:0" },
        h("div", { class: "mp-name" }, p.name + (p.id === state.user ? " (you)" : "")),
        h("div", { class: "mp-title" }, p.title || "Team member"))));
    el.append(h("hr", { class: "dd-sep" }));
    el.append(h("div", { class: "mp-field" }, ico("mail", 14), h("a", { class: "mp-mail", href: "mailto:" + p.email }, p.email)));
    el.append(h("div", { class: "mp-field" }, ico("badge", 14), h("span", {}, "Workspace role: "), h("span", { class: "ws-role-chip" }, p.role || DEFAULT_MEMBER_ROLE)));
    el.append(h("hr", { class: "dd-sep" }));
    el.append(ddItem("smile", "Change anime character", () => characterPicker(anchor, p)));
  }, { minWidth: 250 });
}

// assign a Frieren character image as a member's avatar
function characterPicker(anchor, person, after) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Choose anime character"));
    for (const c of ANIME_CHARS) {
      const thumb = h("span", { class: "char-thumb" });
      const img = h("img", { src: c.img, alt: c.name });
      img.addEventListener("error", () => { thumb.replaceChildren(ico("person", 14)); thumb.classList.add("empty"); });
      thumb.append(img);
      const it = h("div", { class: "dd-item", onclick: () => {
        person.avatar = c.img; person.character = c.id; save(); close(); render();
        toast(`${person.name} → ${c.name}`); if (after) after();
      } }, thumb, h("span", { style: "flex:1" }, c.name), person.avatar === c.img ? ico("check", 14) : null);
      el.append(it);
    }
    el.append(h("hr", { class: "dd-sep" }));
    el.append(ddItem("trash", "Clear (use initials)", () => { person.avatar = null; person.character = null; save(); close(); render(); if (after) after(); }));
  }, { minWidth: 230 });
}

// pick a soft Japanese color palette for the anime theme
function palettePicker(anchor) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "Theme palette"));
    for (const p of PALETTES) {
      el.append(h("div", { class: "dd-item", onclick: () => { state.palette = p.id; if (state.skin !== "frieren") state.skin = "frieren"; save(); close(); render(); toast(`Palette: ${p.name}`); } },
        h("span", { class: "pal-dot", style: `background:${p.dot}` }), h("span", { style: "flex:1" }, p.name), state.palette === p.id ? ico("check", 14) : null));
    }
  }, { minWidth: 200 });
}

/* ---- Feature 4: collaborators ---- */
function whCollaborators() {
  const grid = h("div", { class: "wh-collab" });
  for (const p of state.people) {
    const card = h("div", { class: "wh-collab-card", onclick: () => memberProfilePopover(card, p) }, avatarEl(p, 44),
      h("div", { style: "min-width:0;flex:1" },
        h("b", {}, p.name + (p.id === state.user ? " · you" : "")),
        h("div", { class: "wh-collab-title" }, p.title || "Team member"),
        h("a", { class: "wh-collab-mail", href: "mailto:" + p.email, onclick: (e) => e.stopPropagation() }, p.email)),
      h("span", { class: "ws-role-chip" }, p.role || DEFAULT_MEMBER_ROLE));
    grid.append(card);
  }
  return grid;
}

/* ---- Feature 3: recents (simple list + favorite star) ---- */
function whRecents() {
  const wrap = h("div", { class: "wh-recents" });
  let boards = wsBoards().filter(b => !b.archived);
  if (!boards.length) {
    wrap.append(h("div", { class: "muted", style: "padding:24px 0" }, "No content yet. Add a board to see it here."));
    return wrap;
  }
  boards = boards.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || boardModified(b) - boardModified(a));
  for (const b of boards) {
    const star = h("button", { class: "wh-star" + (b.fav ? " on" : ""), title: b.fav ? "Remove favorite" : "Add to favorites" });
    star.append(ico(b.fav ? "starFill" : "star", 17));
    star.addEventListener("click", (e) => { e.stopPropagation(); b.fav = !b.fav; save(); renderMain(); });
    const item = h("div", { class: "wh-recent-item", onclick: () => switchBoard(b.id) },
      ico(b.icon || "table", 16),
      h("span", { class: "wh-recent-name" }, b.name),
      h("span", { class: "muted", style: "font-size:12px;margin-left:auto" }, relTime(boardModified(b))),
      star);
    wrap.append(item);
  }
  return wrap;
}

/* ---- Feature 2: content (checkbox select + row 3-dot: move/archive/delete) ---- */
function whContent() {
  const wrap = h("div", {});
  ui.whSel = ui.whSel || new Set();

  if (!wsBoards().length) {
    wrap.append(h("h3", { style: "margin:18px 0 4px;font-size:18px" }, "Nothing to show here, yet"));
    const cards = h("div", { class: "wh-empty-cards" });
    const card = (thumbClass, thumbInner, label, onclick) => {
      const c = h("div", { class: "wh-empty-card", onclick });
      const thumb = h("div", { class: "wh-empty-thumb " + thumbClass });
      if (thumbInner) thumb.append(thumbInner);
      c.append(thumb, h("div", { class: "wh-empty-label" }, label));
      return c;
    };
    cards.append(
      card("", ico("plus", 34), "Add new board", () => addBoard({ name: "New Board" })),
      card("solid", ico("table", 30), "Start with a template", () => addBoard({ name: "Campaign plan", views: ["table", "kanban", "calendar", "dashboard"], toast: "Template board created" })),
      card("magic", h("span", { style: "font-size:11px;padding:0 10px;text-align:center" }, "I need a workspace that includes…"), "Start with magic AI", () => toast("Magic AI — coming soon in demo")));
    wrap.append(cards);
    return wrap;
  }

  let filter = "";

  const tb = h("div", { class: "wh-toolbar" });
  const searchWrap = h("div", { class: "board-search-wrap", style: "border:1px solid var(--border)" });
  const si = h("input", { type: "text", placeholder: "Search" });
  si.addEventListener("input", () => { filter = si.value.toLowerCase(); drawTable(); });
  searchWrap.append(ico("search", 15), si);
  const filterBtn = h("button", { class: "tb-btn" });
  const paintFilterBtn = () => {
    const n = whFilterCount();
    filterBtn.replaceChildren(ico("filterFunnel", 15), h("span", {}, "Filters"));
    filterBtn.classList.toggle("active", !!n);
    if (n) filterBtn.append(h("span", { class: "count-badge" }, n));
  };
  paintFilterBtn();
  filterBtn.addEventListener("click", () => whFilterPanel(filterBtn, () => { drawTable(); paintFilterBtn(); }));
  const archBtn = h("button", { class: "tb-btn" + (ui.whArchived ? " active" : "") });
  archBtn.append(ico("archive", 15), h("span", {}, ui.whArchived ? "Active" : "Archived"));
  archBtn.addEventListener("click", () => { ui.whArchived = !ui.whArchived; ui.whSel.clear(); renderMain(); });
  tb.append(searchWrap, filterBtn, archBtn);
  wrap.append(tb);

  // bulk action bar (shown when rows selected)
  const bulkBar = h("div", { class: "wh-bulk" });
  wrap.append(bulkBar);

  const table = h("table", { class: "wh-table" });
  const headCheck = h("input", { type: "checkbox", class: "wh-check" });
  headCheck.addEventListener("change", () => {
    const ids = currentBoards().map(b => b.id);
    if (headCheck.checked) ids.forEach(id => ui.whSel.add(id)); else ids.forEach(id => ui.whSel.delete(id));
    drawTable();
  });
  const thead = h("thead", {}, h("tr", {},
    h("th", { class: "wh-col-act" }), h("th", { class: "wh-col-check" }, headCheck),
    h("th", {}, "Asset name"), h("th", {}, "AI summary"), h("th", {}, "Creator"),
    h("th", {}, "Creation date"), h("th", {}, "Last modified")));
  const tbody = h("tbody", {});
  table.append(thead, tbody);
  wrap.append(table);

  const currentBoards = () => {
    let boards = wsBoards().filter(b => !!b.archived === !!ui.whArchived);
    if (filter) boards = boards.filter(b => b.name.toLowerCase().includes(filter));
    boards = boards.filter(whMatch);
    return boards;
  };

  const drawBulk = () => {
    bulkBar.replaceChildren();
    const sel = [...ui.whSel].map(id => state.boards.find(b => b.id === id)).filter(Boolean);
    if (!sel.length) { bulkBar.classList.remove("show"); return; }
    bulkBar.classList.add("show");
    bulkBar.append(h("span", { class: "wh-bulk-count" }, sel.length + " selected"));
    if (!ui.whArchived) {
      const mv = h("button", { class: "wh-bulk-btn" }, ico("move", 14), h("span", {}, "Move to"));
      mv.addEventListener("click", () => moveToMenu(mv, sel));
      bulkBar.append(mv);
      const ar = h("button", { class: "wh-bulk-btn", onclick: () => archiveBoards(sel) }, ico("archive", 14), h("span", {}, "Archive"));
      bulkBar.append(ar);
    } else {
      const un = h("button", { class: "wh-bulk-btn", onclick: () => unarchiveBoards(sel) }, ico("refresh", 14), h("span", {}, "Restore"));
      bulkBar.append(un);
    }
    const del = h("button", { class: "wh-bulk-btn danger", onclick: () => deleteBoards(sel) }, ico("trash", 14), h("span", {}, "Delete"));
    bulkBar.append(del);
    const clr = h("button", { class: "wh-bulk-btn", onclick: () => { ui.whSel.clear(); drawTable(); } }, "Clear");
    bulkBar.append(clr);
  };

  const drawTable = () => {
    tbody.replaceChildren();
    const boards = currentBoards();
    headCheck.checked = boards.length > 0 && boards.every(b => ui.whSel.has(b.id));
    for (const b of boards) {
      const creator = personById(b.creator) || me();
      const aiBtn = h("button", { class: "wh-ai", onclick: (e) => { e.stopPropagation(); toast("AI summary — coming soon in demo"); } });
      aiBtn.append(ico("vibe", 13), h("span", {}, "Generate"));

      const dotsBtn = h("button", { class: "wh-row-dots", title: "Actions" });
      dotsBtn.append(ico("dots", 16));
      dotsBtn.addEventListener("click", (e) => { e.stopPropagation(); rowMenu(dotsBtn, b); });

      const chk = h("input", { type: "checkbox", class: "wh-check", checked: ui.whSel.has(b.id) });
      chk.addEventListener("click", (e) => e.stopPropagation());
      chk.addEventListener("change", () => { chk.checked ? ui.whSel.add(b.id) : ui.whSel.delete(b.id); drawBulk(); headCheck.checked = boards.every(x => ui.whSel.has(x.id)); row.classList.toggle("sel", chk.checked); });

      const row = h("tr", { class: "wh-asset-row" + (ui.whSel.has(b.id) ? " sel" : ""), onclick: () => switchBoard(b.id) },
        h("td", { class: "wh-col-act" }, dotsBtn),
        h("td", { class: "wh-col-check" }, chk),
        h("td", {}, h("div", { class: "wh-asset" }, ico(b.icon || "table", 16), h("span", {}, b.name), b.archived ? h("span", { class: "wh-arch-tag" }, "Archived") : null)),
        h("td", {}, aiBtn),
        h("td", {}, h("div", { style: "display:flex;align-items:center;gap:8px" }, avatarEl(creator, 24), h("span", { class: "muted" }, creator.name.split(" ")[0]))),
        h("td", { class: "muted" }, fmtDate(tsToIso(b.createdAt), true)),
        h("td", { class: "muted" }, fmtDate(tsToIso(boardModified(b)), true)));
      tbody.append(row);
    }
    if (!tbody.children.length) tbody.append(h("tr", {}, h("td", { colspan: "7", class: "muted", style: "padding:20px;text-align:center" }, ui.whArchived ? "No archived assets." : "No assets match your search.")));
    drawBulk();
  };

  // per-row 3-dot menu: Move to / Archive / Delete
  const rowMenu = (anchor, b) => {
    openDropdown(anchor, (el, close) => {
      if (!b.archived) {
        el.append(ddItem("move", "Move to", () => { close(); moveToMenu(anchor, [b]); }));
        el.append(ddItem("archive", "Archive", () => { close(); archiveBoards([b]); }));
      } else {
        el.append(ddItem("refresh", "Restore", () => { close(); unarchiveBoards([b]); }));
      }
      el.append(h("hr", { class: "dd-sep" }));
      el.append(ddItem("trash", "Delete", () => { close(); deleteBoards([b]); }, "danger"));
    }, { minWidth: 180 });
  };

  const moveToMenu = (anchor, boards) => {
    openDropdown(anchor, (el, close) => {
      el.append(h("div", { class: "dd-title" }, "Move to workspace"));
      const targets = state.workspaces.filter(w => w.id !== state.activeWorkspace);
      if (!targets.length) { el.append(h("div", { class: "dd-item disabled" }, "No other workspace")); return; }
      for (const w of targets) {
        el.append(h("div", { class: "dd-item", onclick: () => { close(); moveBoardsTo(boards, w); } },
          h("span", { class: "ws-dd-logo", style: `background:${w.color};color:${textColorOn(w.color)}` }, wsGlyph(w, 14)),
          h("span", {}, w.name)));
      }
    }, { minWidth: 220 });
  };

  const moveBoardsTo = (boards, w) => {
    boards.forEach(b => { b.workspaceId = w.id; });
    ui.whSel.clear(); save(); render();
    toast(`Moved ${boards.length} item${boards.length > 1 ? "s" : ""} to "${w.name}"`);
  };

  const archiveBoards = (boards) => {
    boards.forEach(b => { b.archived = true; });
    ui.whSel.clear(); save(); render();
    toast(`Archived ${boards.length} item${boards.length > 1 ? "s" : ""}`, () => { boards.forEach(b => b.archived = false); save(); render(); });
  };

  const unarchiveBoards = (boards) => {
    boards.forEach(b => { b.archived = false; });
    ui.whSel.clear(); save(); render();
    toast(`Restored ${boards.length} item${boards.length > 1 ? "s" : ""}`);
  };

  const deleteBoards = (boards) => {
    if (!confirm(`Delete ${boards.length} item${boards.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    boards.forEach(b => { const i = state.boards.indexOf(b); if (i > -1) state.boards.splice(i, 1); });
    if (!state.boards.find(b => b.id === state.activeBoard)) state.activeBoard = (wsBoards()[0] || {}).id || null;
    ui.whSel.clear(); save(); render();
    toast(`Deleted ${boards.length} item${boards.length > 1 ? "s" : ""}`);
  };

  drawTable();
  return wrap;
}

/* ================= Workflow: step-based automation builder ================= */

const WF_TRIGGERS = [
  { type: "date_arrives",   icon: "clock",   label: "When date arrives" },
  { type: "item_created",   icon: "plus",    label: "When an item is created" },
  { type: "status_changes", icon: "kanban",  label: "When a status changes to something" },
  { type: "item_updated",   icon: "pencil",  label: "When an item is updated" },
  { type: "column_changes", icon: "table",   label: "When a column changes" },
];

const WF_ACTIONS = [
  { type: "create_item",   icon: "plus",    label: "Create item",        cat: "Featured" },
  { type: "change_status", icon: "kanban",  label: "Change status",      cat: "Featured" },
  { type: "move_group",    icon: "open",    label: "Move item to group", cat: "Featured" },
  { type: "set_priority",  icon: "chart",   label: "Change priority",    cat: "Columns" },
  { type: "notify",        icon: "bell",    label: "Notify me",          cat: "Communication" },
];

const wfTrigMeta = (t) => WF_TRIGGERS.find(x => x.type === t) || WF_TRIGGERS[1];
const wfActMeta = (t) => WF_ACTIONS.find(x => x.type === t) || WF_ACTIONS[4];
const statusLabel = (id) => (STATUSES.find(s => s.id === id) || {}).label || "—";
const prioLabel = (id) => (PRIORITIES.find(p => p.id === id) || {}).label || "—";

function ensureFlow(board) { if (!board.flow) board.flow = { active: false, trigger: null, steps: [] }; }

/* ---- execution engine ---- */

let wfRunning = false;

// ctx.type: "created" | "status" | "cell" | "updated"
function runWorkflows(ctx) {
  if (wfRunning || !state) return;
  const loc = ctx.task ? locateTask(ctx.task.id) : null;
  const srcBoard = loc ? loc.board : null;
  const wfBoards = state.boards.filter(b => b.kind === "workflow" && b.flow && b.flow.active && b.flow.trigger);
  if (!wfBoards.length) return;
  const event = ctx.type === "created" ? "item_created" : ctx.type === "status" ? "status_changes" : ctx.type === "cell" ? "column_changes" : "item_updated";
  wfRunning = true;
  let fired = false;
  try {
    for (const wb of wfBoards) {
      const tr = wb.flow.trigger;
      const cfg = tr.config || {};
      if (tr.type !== event) continue;
      // board scope: explicit boardId wins; otherwise any board in the workflow's workspace
      if (cfg.boardId) { if (!srcBoard || cfg.boardId !== srcBoard.id) continue; }
      else if (srcBoard && srcBoard.workspaceId !== wb.workspaceId) continue;
      if (tr.type === "status_changes" && cfg.statusValue && cfg.statusValue !== "any" && ctx.task.status !== cfg.statusValue) continue;
      if (tr.type === "column_changes" && cfg.colId && ctx.col && cfg.colId !== ctx.col.id) continue;
      runFlowStepsLogged(wb, ctx.task);
      fired = true;
    }
  } finally { wfRunning = false; }
  if (fired) saveLocal();
}

function evalCondition(step, task) {
  const c = step.config || {};
  if (c.field === "priority") return task.priority === c.value;
  return task.status === c.value;
}

function runFlowStepsLogged(wb, task) {
  const results = [];
  let stopped = false;
  for (const step of wb.flow.steps) {
    if (step.kind === "condition") {
      if (!evalCondition(step, task)) { results.push("Condition not met — stopped"); stopped = true; break; }
      results.push("Condition passed");
    } else if (step.kind === "wait") {
      results.push(`Waited ${(step.config && step.config.days) || 1} day(s) — instant in demo`);
    } else if (step.kind === "action") {
      results.push(applyFlowAction(wb, step, task) || wfActMeta(step.type).label);
    }
  }
  wb.flow.runs = wb.flow.runs || [];
  wb.flow.runs.unshift({ id: uid(), at: Date.now(), trigger: wfTrigMeta(wb.flow.trigger.type).label, task: task ? task.name : "", detail: results.join(" · "), ok: !stopped });
  if (wb.flow.runs.length > 50) wb.flow.runs.length = 50;
}

function applyFlowAction(wb, step, task) {
  const c = step.config || {};
  if (step.type === "change_status") {
    task.status = c.value || "done"; touch(task); save();
    toast(`⚡ ${task.name}: status → ${statusLabel(task.status)}`);
    return `Status → ${statusLabel(task.status)}`;
  }
  if (step.type === "set_priority") {
    task.priority = c.value || "high"; touch(task); save();
    toast(`⚡ ${task.name}: priority → ${prioLabel(task.priority)}`);
    return `Priority → ${prioLabel(task.priority)}`;
  }
  if (step.type === "move_group") {
    const loc = locateTask(task.id);
    if (loc && c.groupId) {
      const g = loc.board.groups.find(x => x.id === c.groupId);
      if (g && g !== loc.group) { loc.group.tasks.splice(loc.idx, 1); g.tasks.push(task); save(); toast(`⚡ ${task.name} → ${g.name}`); return `Moved to ${g.name}`; }
    }
    return "Move skipped";
  }
  if (step.type === "notify") { toast(`⚡ ${c.message || task.name}`); return `Notified: ${c.message || task.name}`; }
  if (step.type === "create_item") {
    const board = wfTargetBoard(wb) || (locateTask(task.id) || {}).board;
    if (board) {
      const g = board.groups.find(x => x.id === c.groupId) || board.groups[0];
      if (g) { g.tasks.push(mkTask(c.name || "New item", { by: state.user })); save(); toast(`⚡ Created "${c.name || "New item"}"`); return `Created "${c.name || "New item"}" in ${board.name}`; }
    }
    return "Create skipped";
  }
  return "";
}

/* ---- date-arrives scheduler (real, in-app) ---- */

function parseTimeStr(s) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((s || "").trim());
  if (!m) return { h: 9, m: 0 };
  let hh = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) hh += 12;
  return { h: hh, m: Number(m[2]) };
}

function isoShiftDays(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function checkDateWorkflows() {
  if (!state || wfRunning) return;
  const today = todayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let fired = false;
  wfRunning = true;
  try {
    for (const wb of state.boards) {
      if (wb.kind !== "workflow" || !wb.flow || !wb.flow.active || !wb.flow.trigger || wb.flow.trigger.type !== "date_arrives") continue;
      const cfg = wb.flow.trigger.config || {};
      const tb = state.boards.find(b => b.id === cfg.boardId);
      if (!tb) continue;
      const t0 = parseTimeStr(cfg.time);
      if (nowMin < t0.h * 60 + t0.m) continue;
      for (const g of tb.groups) for (const t of g.tasks) {
        const dateVal = (cfg.dateCol && cfg.dateCol !== "due") ? t.cells[cfg.dateCol] : t.due;
        if (!dateVal) continue;
        if (isoShiftDays(dateVal, -(cfg.offset || 0)) !== today) continue;
        const key = `${wb.id}:${t.id}:${dateVal}`;
        if (state.wfFired[key]) continue;
        state.wfFired[key] = Date.now();
        runFlowStepsLogged(wb, t);
        fired = true;
      }
    }
  } finally { wfRunning = false; }
  if (fired) { save(); softRender(); }
}

let wfSchedTimer = null;
function startWfScheduler() {
  checkDateWorkflows();
  clearInterval(wfSchedTimer);
  wfSchedTimer = setInterval(checkDateWorkflows, 30000);
}

/* ---- builder UI ---- */

function wfNodeMeta(node, isTrigger) {
  if (isTrigger) return wfTrigMeta(node.type);
  if (node.kind === "action") return wfActMeta(node.type);
  if (node.kind === "condition") return { icon: "table", label: `If ${(node.config && node.config.field) || "status"} is something` };
  if (node.kind === "wait") return { icon: "clock", label: "Wait" };
  return { icon: "bolt", label: "Step" };
}

function wfTargetBoard(board) {
  const id = board.flow.trigger && board.flow.trigger.config && board.flow.trigger.config.boardId;
  return state.boards.find(b => b.id === id) || state.boards.find(b => b.workspaceId === board.workspaceId && b.kind === "board") || null;
}

function wfChip(color, label) {
  return h("span", { class: "wf-chip" }, h("i", { style: `background:${color}` }), label);
}

function wfConfigured(node, isTrigger) {
  const c = node.config || {};
  if (isTrigger) return !!c.boardId;
  if (node.kind === "condition" || node.kind === "wait") return true;
  if (node.type === "change_status" || node.type === "set_priority") return !!c.value;
  if (node.type === "move_group") return !!c.groupId;
  if (node.type === "create_item") return !!c.name;
  return true; // notify
}

function wfSubEl(board, node, isTrigger) {
  const c = node.config || {};
  if (!wfConfigured(node, isTrigger)) return h("div", { class: "wf-step-sub link" }, "Set up this step");
  const sub = h("div", { class: "wf-step-sub" });
  const lbl = (t) => h("span", { class: "muted" }, t);
  const tb = wfTargetBoard(board);
  if (isTrigger) {
    const b = state.boards.find(x => x.id === c.boardId);
    if (node.type === "date_arrives") {
      sub.append(lbl("Date setup:"), h("span", {}, `${c.offset ? `${c.offset} day(s) before` : "Exact date"}, at ${c.time || "9:00 AM"} (UTC+07:00)`));
    } else if (node.type === "status_changes") {
      sub.append(lbl("Board:"), h("span", {}, b ? b.name : "?"));
      if (c.statusValue && c.statusValue !== "any") { const s = STATUSES.find(x => x.id === c.statusValue); if (s) sub.append(lbl("Status:"), wfChip(s.color, s.label)); }
      else sub.append(lbl("Status:"), h("span", {}, "Any"));
    } else if (node.type === "column_changes") {
      const col = b && (b.columns || []).find(x => x.id === c.colId);
      sub.append(lbl("Board:"), h("span", {}, b ? b.name : "?"), lbl("Column:"), h("span", {}, col ? col.name : "Any"));
    } else {
      sub.append(lbl("Board:"), h("span", {}, b ? b.name : "?"));
    }
    return sub;
  }
  if (node.kind === "action") {
    if (node.type === "change_status") { const s = STATUSES.find(x => x.id === c.value); sub.append(lbl("Status:"), wfChip(s ? s.color : "#c4c4c4", s ? s.label : "?")); }
    else if (node.type === "set_priority") { const p = PRIORITIES.find(x => x.id === c.value); sub.append(lbl("Priority:"), wfChip(p ? p.color : "#c4c4c4", p ? p.label : "?")); }
    else if (node.type === "move_group") { const g = tb && tb.groups.find(x => x.id === c.groupId); sub.append(lbl("Group:"), h("span", {}, g ? g.name : "?")); }
    else if (node.type === "notify") sub.append(lbl("Message:"), h("span", {}, c.message || "me"));
    else if (node.type === "create_item") sub.append(lbl("Board:"), h("span", {}, tb ? tb.name : "?"), lbl("Item:"), h("span", {}, `"${c.name}"`));
    return sub;
  }
  if (node.kind === "condition") {
    const isPrio = c.field === "priority";
    const d = isPrio ? PRIORITIES.find(x => x.id === c.value) : STATUSES.find(x => x.id === c.value);
    sub.append(lbl(isPrio ? "Priority:" : "Status:"), wfChip(d ? d.color : "#c4c4c4", d ? (d.label || "—") : "?"));
    return sub;
  }
  if (node.kind === "wait") { sub.append(lbl("Wait:"), h("span", {}, `${c.days || 1} day(s)`)); return sub; }
  return sub;
}

function wfStepCard(board, id, node, num) {
  const isTrigger = id === "trigger";
  const meta = wfNodeMeta(node, isTrigger);
  const card = h("div", { class: "wf-step" + (ui.wfSel === id ? " sel" : "") });
  if (isTrigger) card.append(h("span", { class: "wf-badge trig" }, ico("bolt", 14)));
  if (node.kind === "condition") card.append(h("span", { class: "wf-badge cond" }, h("span", { class: "wf-badge-in" }, ico("bolt", 12))));
  if (num != null) card.append(h("span", { class: "wf-step-num" }, String(num)));
  card.append(h("span", { class: "wf-step-ico" + (isTrigger ? " trig" : "") }, ico(meta.icon, 16)));
  card.append(h("div", { style: "flex:1;min-width:0" },
    h("div", { class: "wf-step-title" }, meta.label),
    wfSubEl(board, node, isTrigger)));
  const menu = h("button", { class: "row-act", title: "Options" });
  menu.append(ico("dots", 15));
  menu.addEventListener("click", (e) => { e.stopPropagation(); wfStepMenu(menu, board, id, node, isTrigger); });
  card.append(menu);
  card.addEventListener("click", () => { ui.wfSel = id; ui.wfPanel = null; rerenderViewOnly(board); });
  return card;
}

function wfStepMenu(anchor, board, id, node, isTrigger) {
  openDropdown(anchor, (el, close) => {
    el.append(ddItem("gear", "Set up this step", () => { close(); ui.wfSel = id; rerenderViewOnly(board); }));
    if (isTrigger) el.append(ddItem("bolt", "Change trigger", () => { close(); board.flow.trigger = null; ui.wfSel = null; save(); rerenderViewOnly(board); }));
    else el.append(h("hr", { class: "dd-sep" }), ddItem("trash", "Delete step", () => { close(); board.flow.steps = board.flow.steps.filter(s => s.id !== id); if (ui.wfSel === id) ui.wfSel = null; save(); rerenderViewOnly(board); }, "danger"));
  }, { minWidth: 200 });
}

function wfTriggerPicker(anchor, board) {
  openDropdown(anchor, (el, close) => {
    const si = h("input", { type: "text", placeholder: "What happens to trigger this workflow?" });
    const sw = h("div", { class: "side-search", style: "margin:2px 0 8px" }, ico("search", 14), si);
    el.append(sw);
    el.append(h("div", { class: "dd-title" }, "Suggested for you"));
    const host = h("div", {});
    el.append(host);
    const draw = () => {
      host.replaceChildren();
      const f = si.value.toLowerCase();
      for (const t of WF_TRIGGERS) {
        if (f && !t.label.toLowerCase().includes(f)) continue;
        host.append(ddItem(t.icon, t.label, () => {
          close();
          board.flow.trigger = { type: t.type, config: {} };
          ui.wfSel = "trigger";
          save();
          rerenderViewOnly(board);
        }));
      }
    };
    si.addEventListener("input", draw);
    si.addEventListener("keydown", (e) => e.stopPropagation());
    draw();
  }, { minWidth: 320 });
}

function wfInsertStep(board, step, insertAt) {
  const at = insertAt == null ? board.flow.steps.length : Math.max(0, Math.min(insertAt, board.flow.steps.length));
  board.flow.steps.splice(at, 0, step);
  ui.wfSel = step.id;
  ui.wfPanel = null;
  save();
  rerenderViewOnly(board);
}

function wfNextPicker(anchor, board, insertAt) {
  openDropdown(anchor, (el, close) => {
    el.append(h("div", { class: "dd-title" }, "What should happen next?"));
    el.append(ddItem("bolt", "Action", () => { close(); wfActionPicker(anchor, board, insertAt); }));
    el.append(ddItem("filterFunnel", "Condition", () => {
      close();
      wfInsertStep(board, { id: uid(), kind: "condition", config: { field: "status", value: (STATUSES[1] || STATUSES[0]).id } }, insertAt);
    }));
    el.append(ddItem("clock", "Wait", () => {
      close();
      wfInsertStep(board, { id: uid(), kind: "wait", config: { days: 1 } }, insertAt);
    }));
    const ag = ddItem("vibe", "Agents", () => { close(); toast("Agents — coming soon in demo"); }, "soon");
    ag.append(h("span", { class: "dd-badge" }, "Soon"));
    el.append(ag);
  }, { minWidth: 260 });
}

function wfActionPicker(anchor, board, insertAt) {
  openDropdown(anchor, (el, close) => {
    const si = h("input", { type: "text", placeholder: "What should happen next?" });
    el.append(h("div", { class: "side-search", style: "margin:2px 0 8px" }, ico("search", 14), si));
    el.append(h("div", { class: "dd-title" }, "Featured"));
    const host = h("div", {});
    el.append(host);
    const draw = () => {
      host.replaceChildren();
      const f = si.value.toLowerCase();
      for (const a of WF_ACTIONS) {
        if (f && !a.label.toLowerCase().includes(f)) continue;
        host.append(ddItem(a.icon, a.label, () => {
          close();
          const def = a.type === "change_status" ? { value: (STATUSES[1] || STATUSES[0]).id } : a.type === "set_priority" ? { value: (PRIORITIES[1] || PRIORITIES[0]).id } : a.type === "create_item" ? { name: "New item" } : {};
          wfInsertStep(board, { id: uid(), kind: "action", type: a.type, config: def }, insertAt);
        }));
      }
    };
    si.addEventListener("input", draw);
    si.addEventListener("keydown", (e) => e.stopPropagation());
    draw();
  }, { minWidth: 300 });
}

function wfField(label, control, req) {
  return h("div", { class: "wf-field" }, h("label", {}, label, req ? h("span", { style: "color:var(--danger)" }, " *") : null), control);
}
function wfSelectF(opts, cur, on) {
  const s = h("select", { class: "wf-select" });
  for (const o of opts) s.append(h("option", { value: o.id }, o.label));
  s.value = cur != null ? cur : (opts[0] && opts[0].id);
  s.addEventListener("change", () => on(s.value));
  return s;
}

function wfSettingsPanel(board) {
  const id = ui.wfSel;
  const isTrigger = id === "trigger";
  const node = isTrigger ? board.flow.trigger : board.flow.steps.find(s => s.id === id);
  if (!node) { ui.wfSel = null; return h("div", { style: "display:none" }); }
  const meta = wfNodeMeta(node, isTrigger);
  const c = node.config = node.config || {};
  const reRun = () => { save(); rerenderViewOnly(board); };
  const saveOnly = () => { save(); };

  const panel = h("div", { class: "wf-panel" });
  const closeBtn = h("button", { class: "icon-btn", onclick: () => { ui.wfSel = null; rerenderViewOnly(board); } });
  closeBtn.append(ico("x", 16));
  panel.append(h("div", { class: "wf-panel-head" }, h("span", { class: "wf-step-ico" + (isTrigger ? " trig" : "") }, ico(meta.icon, 16)), h("b", { style: "flex:1" }, meta.label), closeBtn));
  const body = h("div", { class: "wf-panel-body" });
  panel.append(body);

  const boardOpts = state.boards.filter(b => b.workspaceId === board.workspaceId && b.kind === "board").map(b => ({ id: b.id, label: b.name }));
  const targetBoard = wfTargetBoard(board);

  if (isTrigger) {
    body.append(wfField("Board", wfSelectF([{ id: "", label: "Choose board" }, ...boardOpts], c.boardId || "", (v) => { c.boardId = v || null; reRun(); }), true));
    if (node.type === "status_changes") {
      body.append(wfField("Status is", wfSelectF([{ id: "any", label: "Any status" }, ...STATUSES.map(s => ({ id: s.id, label: s.label }))], c.statusValue || "any", (v) => { c.statusValue = v; reRun(); }), true));
    } else if (node.type === "column_changes") {
      const cols = (targetBoard && targetBoard.columns) || [];
      body.append(wfField("Column", wfSelectF([{ id: "", label: "Any column" }, ...cols.map(x => ({ id: x.id, label: x.name }))], c.colId || "", (v) => { c.colId = v || null; reRun(); })));
    } else if (node.type === "date_arrives") {
      const dateCols = [{ id: "due", label: "Due date" }, ...((targetBoard && targetBoard.columns) || []).filter(x => x.type === "date").map(x => ({ id: x.id, label: x.name }))];
      body.append(wfField("Date column", wfSelectF(dateCols, c.dateCol || "due", (v) => { c.dateCol = v; reRun(); }), true));
      body.append(wfField("Date setup", wfSelectF([{ id: "0", label: "When the date arrives" }, { id: "1", label: "1 day before" }, { id: "2", label: "2 days before" }, { id: "7", label: "1 week before" }], String(c.offset || 0), (v) => { c.offset = Number(v); reRun(); })));
      body.append(wfField("Time", wfSelectF(["7:30 AM", "9:00 AM", "12:00 PM", "5:00 PM"].map(t => ({ id: t, label: t })), c.time || "9:00 AM", (v) => { c.time = v; reRun(); })));
      body.append(h("div", { class: "muted", style: "font-size:11px;margin-top:6px" }, "Checked every 30s while the app is open. Fires once per item per date."));
    }
  } else if (node.kind === "action") {
    if (node.type === "change_status") body.append(wfField("Set status to", wfSelectF(STATUSES.map(s => ({ id: s.id, label: s.label })), c.value || (STATUSES[1] || STATUSES[0]).id, (v) => { c.value = v; reRun(); }), true));
    else if (node.type === "set_priority") body.append(wfField("Set priority to", wfSelectF(PRIORITIES.filter(p => p.id !== "none").map(p => ({ id: p.id, label: p.label })), c.value || (PRIORITIES[1] || PRIORITIES[0]).id, (v) => { c.value = v; reRun(); }), true));
    else if (node.type === "move_group") {
      const groups = (targetBoard && targetBoard.groups) || [];
      body.append(wfField("Move to group", wfSelectF([{ id: "", label: "Choose group" }, ...groups.map(g => ({ id: g.id, label: g.name }))], c.groupId || "", (v) => { c.groupId = v || null; reRun(); }), true));
    } else if (node.type === "create_item") {
      const groups = (targetBoard && targetBoard.groups) || [];
      const nameIn = h("input", { class: "wf-input", value: c.name || "", placeholder: "Item name" });
      nameIn.addEventListener("input", () => { c.name = nameIn.value; });
      nameIn.addEventListener("change", reRun);
      body.append(wfField("Item name", nameIn, true));
      body.append(wfField("In group", wfSelectF([{ id: "", label: "First group" }, ...groups.map(g => ({ id: g.id, label: g.name }))], c.groupId || "", (v) => { c.groupId = v || null; reRun(); })));
    } else if (node.type === "notify") {
      const msg = h("input", { class: "wf-input", value: c.message || "", placeholder: "Notification message (optional)" });
      msg.addEventListener("input", () => { c.message = msg.value; });
      msg.addEventListener("change", reRun);
      body.append(wfField("Message", msg));
    }
  } else if (node.kind === "condition") {
    body.append(wfField("Field", wfSelectF([{ id: "status", label: "Status" }, { id: "priority", label: "Priority" }], c.field || "status", (v) => { c.field = v; c.value = v === "priority" ? (PRIORITIES[1] || PRIORITIES[0]).id : (STATUSES[1] || STATUSES[0]).id; reRun(); })));
    const opts = c.field === "priority" ? PRIORITIES.filter(p => p.id !== "none").map(p => ({ id: p.id, label: p.label })) : STATUSES.map(s => ({ id: s.id, label: s.label }));
    body.append(wfField("Is equal to", wfSelectF(opts, c.value, (v) => { c.value = v; reRun(); })));
  } else if (node.kind === "wait") {
    const numIn = h("input", { class: "wf-input", type: "number", min: "1", value: String(c.days || 1) });
    numIn.addEventListener("change", () => { c.days = Math.max(1, Number(numIn.value) || 1); reRun(); });
    body.append(wfField("Wait (days)", numIn));
  }

  return panel;
}

function wfConnector(board, insertAt) {
  const wrap = h("div", { class: "wf-connector-wrap" }, h("div", { class: "wf-connector" }));
  if (insertAt != null) {
    const plus = h("button", { class: "wf-insert", title: "Insert step here" });
    plus.append(ico("plus", 13));
    plus.addEventListener("click", (e) => { e.stopPropagation(); wfNextPicker(plus, board, insertAt); });
    wrap.append(plus);
  }
  return wrap;
}

function wfZoombar(board) {
  const bar = h("div", { class: "wf-zoombar" });
  const mk = (icon, title, fn, active) => {
    const b = h("button", { class: active ? "active" : "", title });
    b.append(ico(icon, 15));
    if (fn) b.addEventListener("click", fn);
    return b;
  };
  bar.append(
    mk("cursor", "Select", null, true),
    mk("target", "Reset zoom", () => { ui.wfZoom = 1; rerenderViewOnly(board); }),
    mk("zoomIn", "Zoom in", () => { ui.wfZoom = Math.min(1.4, Math.round((ui.wfZoom + 0.1) * 10) / 10); rerenderViewOnly(board); }),
    mk("zoomOut", "Zoom out", () => { ui.wfZoom = Math.max(0.5, Math.round((ui.wfZoom - 0.1) * 10) / 10); rerenderViewOnly(board); }),
  );
  return bar;
}

function workflowViewEl(board) {
  ensureFlow(board);
  const flow = board.flow;
  const root = h("div", { class: "view-root wf-view" });
  root.append(wfZoombar(board));

  const canvas = h("div", { class: "wf-canvas" });

  if (!flow.trigger) {
    const trg = h("div", { class: "wf-trigger-card" }, h("span", { class: "wf-trigger-ico" }, ico("bolt", 18)), h("span", {}, "Choose a trigger"));
    trg.addEventListener("click", () => wfTriggerPicker(trg, board));
    canvas.append(trg);
  } else {
    canvas.append(wfStepCard(board, "trigger", flow.trigger, null));
    let n = 2;
    flow.steps.forEach((step, i) => {
      canvas.append(wfConnector(board, i));
      canvas.append(wfStepCard(board, step.id, step, n++));
    });
    canvas.append(wfConnector(board, null));
    const next = h("div", { class: "wf-next" }, ico("plus", 16), h("span", {}, "What happens next?"));
    next.addEventListener("click", () => wfNextPicker(next, board));
    canvas.append(next);
  }

  const scale = h("div", { class: "wf-scale", style: `transform:scale(${ui.wfZoom})` }, canvas);
  root.append(scale);
  if (ui.wfSel) root.append(wfSettingsPanel(board));
  else if (ui.wfPanel === "history") root.append(wfRunsPanel(board));
  return root;
}

/* ---- run history / analytics panel ---- */

function wfRunsPanel(board) {
  const runs = board.flow.runs || [];
  const panel = h("div", { class: "wf-runs" });

  const head = h("div", { class: "wf-runs-head" });
  for (const [id, label] of [["history", "Run history"], ["analytics", "Analytics"]]) {
    head.append(h("button", { class: "wf-rtab" + (ui.wfTab === id ? " active" : ""), onclick: () => { ui.wfTab = id; rerenderViewOnly(board); } }, label));
  }
  head.append(h("div", { style: "flex:1" }));
  const refresh = h("button", { class: "icon-btn", title: "Refresh", onclick: () => { rerenderViewOnly(board); toast("Refreshed"); } });
  refresh.append(ico("refresh", 15));
  const closeB = h("button", { class: "icon-btn", onclick: () => { ui.wfPanel = null; rerenderViewOnly(board); } });
  closeB.append(ico("x", 15));
  head.append(refresh, closeB);
  panel.append(head);

  if (ui.wfTab === "analytics") {
    const ok = runs.filter(r => r.ok).length;
    const today = todayISO();
    const todayRuns = runs.filter(r => tsToIso(r.at) === today).length;
    const stat = (num, label) => h("div", { class: "wf-stat" }, h("div", { class: "wf-stat-num" }, String(num)), h("div", { class: "muted", style: "font-size:12px" }, label));
    panel.append(h("div", { class: "wf-stats" },
      stat(runs.length, "Total runs"),
      stat(ok, "Successful"),
      stat(todayRuns, "Runs today"),
      stat(runs.length ? relTime(runs[0].at) : "—", "Last run")));
    return panel;
  }

  const toolbar = h("div", { class: "wf-runs-toolbar" });
  const filt = h("button", { class: "tb-btn connect", onclick: () => toast("Filters — coming soon in demo") });
  filt.append(ico("filterFunnel", 14), h("span", {}, "Filters"));
  const hub = h("button", { class: "tb-btn", onclick: () => toast("Autopilot hub — coming soon in demo") });
  hub.append(ico("agent", 14), h("span", {}, "Autopilot hub"));
  toolbar.append(filt, h("div", { style: "flex:1" }), hub);
  panel.append(toolbar);

  const body = h("div", { class: "wf-runs-body" });
  if (!runs.length) {
    const empty = h("div", { class: "wf-empty" });
    const art = h("div", {});
    art.innerHTML = `<svg width="190" height="140" viewBox="0 0 190 140" fill="none">
      <text x="128" y="26" font-size="18" font-weight="800" style="fill:var(--text-2)">Z</text>
      <text x="142" y="16" font-size="13" font-weight="800" style="fill:var(--border-2)">z</text>
      <text x="118" y="13" font-size="10" font-weight="800" style="fill:var(--border-2)">z</text>
      <ellipse cx="95" cy="112" rx="62" ry="8" style="fill:var(--surface-2)"/>
      <ellipse cx="95" cy="86" rx="62" ry="22" style="stroke:var(--border-2)" fill="none" stroke-dasharray="5 6"/>
      <line x1="95" y1="32" x2="95" y2="42" stroke="#7b86f4" stroke-width="3"/><circle cx="95" cy="29" r="4.5" fill="#7b86f4"/>
      <rect x="63" y="42" width="64" height="50" rx="11" fill="#7b86f4"/>
      <path d="M78 62q4.5 5 9 0M103 62q4.5 5 9 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <rect x="70" y="92" width="50" height="28" rx="5" style="fill:var(--bg);stroke:var(--border-2)"/>
      <path d="M77 100h36M77 107h28M77 114h32" style="stroke:var(--border-2)" stroke-width="2" stroke-linecap="round"/></svg>`;
    empty.append(art,
      h("div", { style: "font-size:18px;font-weight:800;margin-top:6px" }, "No workflow runs yet"),
      h("div", { class: "muted" }, "Once this workflow starts running, you'll see its history here."));
    body.append(empty);
  } else {
    for (const r of runs) {
      body.append(h("div", { class: "run-card" + (r.ok ? "" : " stopped") },
        h("div", { style: "display:flex;align-items:center;gap:8px" }, ico("bolt", 14), h("b", { style: "flex:1;font-size:13px" }, r.trigger), h("span", { class: "muted", style: "font-size:11px" }, relTime(r.at))),
        r.task ? h("div", { class: "muted", style: "font-size:12px;margin-top:4px" }, "Item: " + r.task) : null,
        h("div", { style: "font-size:12px;margin-top:4px" }, r.detail || "")));
    }
  }
  panel.append(body);
  return panel;
}

function workflowHeadEl(board) {
  ensureFlow(board);
  const title = h("span", { class: "board-title" }, board.name);
  title.addEventListener("click", () => inlineEdit(title, board.name, (v) => { board.name = v; save(); render(); }, { style: "font-size:24px;font-weight:700" }));
  const menuBtn = h("button", { class: "icon-btn", title: "Workflow menu" });
  menuBtn.append(ico("dots", 17));
  menuBtn.addEventListener("click", () => boardMenu(menuBtn, board));

  const canPublish = !!(board.flow.trigger && board.flow.steps.length);
  const toggle = h("div", { class: "toggle-pill" + (board.flow.active ? " on" : ""), title: "Activate workflow" });
  toggle.addEventListener("click", () => {
    if (!canPublish) { toast("Add a trigger and at least one action first"); return; }
    board.flow.active = !board.flow.active; save(); render();
    toast(board.flow.active ? "Workflow activated 🎉" : "Workflow paused");
  });

  const histBtn = h("button", { class: "tb-btn" + (ui.wfPanel === "history" ? " active" : "") });
  histBtn.append(ico("list", 15), h("span", {}, "Run history"));
  if ((board.flow.runs || []).length) histBtn.append(h("span", { class: "count-badge" }, board.flow.runs.length));
  histBtn.addEventListener("click", () => {
    ui.wfPanel = ui.wfPanel === "history" ? null : "history";
    ui.wfSel = null;
    renderMain();
  });

  const editBtn = h("button", { class: "tb-btn" });
  editBtn.append(ico("pencil", 15), h("span", {}, "Edit workflow"));
  editBtn.addEventListener("click", () => { ui.wfPanel = null; ui.wfSel = null; renderMain(); });

  return h("div", { class: "board-head", style: "padding-bottom:12px" },
    h("div", { class: "bh-top" }, h("span", { class: "ws-dd-logo", style: "background:#5559df" }, ico("workflow", 16)), title,
      toggle, h("span", { class: "muted", style: "font-size:13px" }, board.flow.active ? "Active" : "Inactive"),
      h("div", { class: "bh-spacer" }), histBtn, editBtn, menuBtn));
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

/* ---------------- Rich text update editor ---------------- */

function sanitizeHTML(html) {
  return String(html)
    .replace(/<\s*script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\s*style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function scaleImageWide(file, maxW, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * ratio));
      const hh = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = hh;
      canvas.getContext("2d").drawImage(img, 0, 0, w, hh);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function richEditor(onPost) {
  const wrap = h("div", { class: "ip-composer" });
  const card = h("div", { class: "rich-card collapsed" });
  const area = h("div", { class: "rich-area", contenteditable: "true", "data-ph": "Write an update and mention others with @" });
  const cmd = (c, v) => { area.focus(); try { document.execCommand(c, false, v || null); } catch (e) {} };
  const btn = (inner, c, title) => {
    const b = h("button", { class: "rich-btn", title });
    if (typeof inner === "string") b.innerHTML = inner; else b.append(inner);
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => cmd(c));
    return b;
  };
  const actBtn = (icon, title, fn) => {
    const b = h("button", { class: "rich-act", title });
    b.append((typeof icon === "string" && !PATHS[icon]) ? h("span", { style: "font-weight:700;font-size:12px" }, icon) : ico(icon, 16));
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", fn);
    return b;
  };

  // text color
  const colorBtn = h("button", { class: "rich-btn", title: "Text color" }, h("span", { style: "border-bottom:3px solid var(--primary);font-weight:700;line-height:1" }, "A"));
  colorBtn.addEventListener("mousedown", (e) => e.preventDefault());
  colorBtn.addEventListener("click", (e) => openDropdown(e.currentTarget, (dd, close) => {
    const grid = h("div", { style: "display:grid;grid-template-columns:repeat(6,1fr);gap:6px" });
    for (const c of ["#323338", "#0073ea", "#00c875", "#e2445c", "#fdab3d", "#a25ddc", "#ff642e", "#0086c0", "#9d50dd", "#037f4c", "#cab641", "#df2f4a"])
      grid.append(h("button", { class: "swatch", style: `background:${c}`, onclick: () => { cmd("foreColor", c); close(); } }));
    dd.append(grid);
  }, { minWidth: 180 }));

  const linkBtn = actBtn("link", "Add link", () => { const u = prompt("Link URL"); if (u) cmd("createLink", /^https?:/.test(u) ? u : "https://" + u); });

  // image attach (inline into the update)
  const fileIn = h("input", { type: "file", accept: "image/*", style: "display:none" });
  fileIn.addEventListener("change", () => {
    const f = fileIn.files[0]; if (!f) return;
    scaleImageWide(f, 640, (url) => cmd("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block">`));
    fileIn.value = "";
  });

  // formatting toolbar — hidden until the pencil toggle is clicked (keeps composer compact)
  const toolbar = h("div", { class: "rich-toolbar hidden" },
    btn("<b>B</b>", "bold", "Bold"),
    btn("<i>I</i>", "italic", "Italic"),
    btn("<u>U</u>", "underline", "Underline"),
    btn("<s>S</s>", "strikeThrough", "Strikethrough"),
    colorBtn,
    h("span", { class: "rich-sep" }),
    btn(ico("list", 15), "insertUnorderedList", "Bullet list"),
    btn(ico("numbers", 15), "insertOrderedList", "Numbered list"),
    linkBtn);

  const fmtBtn = h("button", { class: "rich-act rich-fmt", title: "Formatting" }, ico("pencil", 16));
  fmtBtn.addEventListener("mousedown", (e) => e.preventDefault());
  fmtBtn.addEventListener("click", () => { const hide = toolbar.classList.toggle("hidden"); fmtBtn.classList.toggle("on", !hide); card.classList.add("active"); });

  const postBtn = h("button", { class: "btn-primary rich-post" }, "Update");
  const post = () => {
    const html = area.innerHTML.trim();
    const plain = (area.textContent || "").trim();
    if (!plain && !/<img/i.test(html)) return;
    onPost(sanitizeHTML(html), plain || "📎 image");
    area.innerHTML = "";
    card.classList.remove("active");
    toolbar.classList.add("hidden"); fmtBtn.classList.remove("on");
  };
  postBtn.addEventListener("click", post);
  area.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); post(); } });

  // expand on focus, collapse again when left empty
  area.addEventListener("focus", () => card.classList.add("active"));
  area.addEventListener("blur", () => { if (!(area.textContent || "").trim() && !/<img/i.test(area.innerHTML)) { card.classList.remove("active"); toolbar.classList.add("hidden"); fmtBtn.classList.remove("on"); } });

  // @ mention — list workspace members; pick inserts "@Name"
  const insertMention = (p, stripAt) => {
    area.focus();
    if (stripAt) { try { document.execCommand("delete", false); } catch (e) {} }
    cmd("insertText", "@" + p.name + " ");
  };
  const mentionPicker = (stripAt) => {
    if (!state.people.length) return;
    openDropdown(area, (el, close) => {
      el.append(h("div", { class: "dd-title" }, "Mention someone"));
      for (const p of state.people) el.append(h("div", { class: "dd-item", onclick: () => { insertMention(p, stripAt); close(); } },
        avatarEl(p, 22), h("span", { style: "flex:1" }, p.name)));
    }, { minWidth: 220 });
  };
  area.addEventListener("input", (e) => { if (e.data === "@") mentionPicker(true); });

  const footer = h("div", { class: "rich-footer" },
    h("div", { class: "rich-actions" },
      actBtn("at", "Mention", () => mentionPicker(false)),
      actBtn("paperclip", "Attach image", () => fileIn.click()),
      actBtn("smile", "Emoji", (ev) => emojiPicker(ev.currentTarget, (em) => cmd("insertText", em))),
      fmtBtn),
    postBtn);

  card.append(area, toolbar, footer);
  wrap.append(card, fileIn);
  return wrap;
}

function emojiPicker(anchor, pick) {
  const EMOJI = ["👍", "🎉", "🔥", "✅", "❤️", "😊", "😂", "🙏", "👀", "🚀", "💡", "⚠️", "📌", "✨", "💪", "👏", "🤔", "😅", "🥳", "📷"];
  openDropdown(anchor, (el, close) => {
    const grid = h("div", { style: "display:grid;grid-template-columns:repeat(5,1fr);gap:4px" });
    for (const e of EMOJI) grid.append(h("button", { class: "emoji-btn", onclick: () => { pick(e); close(); } }, e));
    el.append(grid);
  }, { minWidth: 200 });
}

/* ---------------- Render: item panel ---------------- */

function renderPanel() {
  const root = q("#panel-root");
  root.replaceChildren();
  if (!ui.panel) return;
  const loc = locateTask(ui.panel);
  if (!loc) { ui.panel = null; return; }
  const { task, group, board } = loc;

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

  // Update-focused panel (monday-style): no detail fields here — Status/Priority/
  // Owner/etc are edited in the table cells. This page is just for updates/feedback.

  // ---- tabbed lower area: Updates | Files | Activity Log (monday-style)
  ui.panelTab = ui.panelTab || "updates";
  const tabBar = h("div", { class: "ip-tabbar" });
  for (const [id, label, icon] of [["updates", "Updates", "home"], ["files", "Files", "paperclip"], ["activity", "Activity Log", "clock"]]) {
    const t = h("button", { class: "ip-tab" + (ui.panelTab === id ? " active" : ""), onclick: () => { ui.panelTab = id; renderPanel(); } }, ico(icon, 15), h("span", {}, label));
    tabBar.append(t);
  }
  panel.append(tabBar);
  const body = h("div", { class: "ip-tabbody" });

  if (ui.panelTab === "updates") {
    body.append(h("div", { class: "ip-update-hint" },
      h("span", {}, ico("mail", 14), h("span", {}, "Update via email")),
      h("span", { class: "ip-hint-sep" }),
      h("span", {}, ico("chat", 14), h("span", {}, "Give feedback"))));
    body.append(richEditor((html, plain) => {
      task.updates.unshift({ id: uid(), by: state.user, html, text: plain, at: Date.now() });
      touch(task); save(); render();
    }));
    if (!task.updates.length) {
      body.append(h("div", { class: "ip-empty" }, "No updates yet. Be the first to write one."));
    }
    for (const u of task.updates) {
      const author = personById(u.by);
      const del = h("button", { class: "row-act", title: "Delete update", onclick: () => { task.updates = task.updates.filter(x => x.id !== u.id); save(); render(); } });
      del.append(ico("trash", 13));
      const txt = h("div", { class: "update-text" });
      if (u.html) txt.innerHTML = u.html; else txt.append(u.text || "");
      body.append(h("div", { class: "update-card" },
        h("div", { class: "update-head" }, avatarEl(author, 24), h("b", {}, author ? author.name : "Unknown"), h("time", {}, relTime(u.at)), del),
        txt));
    }
  } else if (ui.panelTab === "files") {
    const filesGrid = h("div", { class: "ip-files" });
    for (const f of task.files) {
      const x = h("button", { class: "ip-file-x", title: "Remove", onclick: () => { task.files = task.files.filter(y => y.id !== f.id); touch(task); save(); render(); } });
      x.append(ico("x", 12));
      filesGrid.append(h("div", { class: "ip-file", title: f.name }, h("img", { src: f.dataURL, alt: f.name }), x));
    }
    const fileIn = h("input", { type: "file", accept: "image/*", multiple: true, style: "display:none" });
    fileIn.addEventListener("change", () => {
      const files = [...fileIn.files];
      let pending = files.length;
      for (const file of files) scaleImage(file, (url) => {
        task.files.push({ id: uid(), name: file.name, dataURL: url });
        if (--pending === 0) { touch(task); save(); render(); toast(`${files.length} file(s) added`); }
      });
    });
    const addFile = h("div", { class: "ip-file-add", onclick: () => fileIn.click() }, ico("plus", 18), h("span", {}, "Upload"));
    filesGrid.append(addFile);
    body.append(filesGrid, fileIn);
  } else {
    // activity log
    const log = h("div", { class: "ip-activity" });
    const entry = (who, action, at) => h("div", { class: "ip-act-row" },
      avatarEl(personById(who), 22), h("span", { class: "ip-act-txt" }, h("b", {}, (personById(who) || {}).name || "Someone"), " " + action), h("time", {}, relTime(at)));
    log.append(entry(task.updatedBy, "updated this item", task.updatedAt));
    for (const u of task.updates) log.append(entry(u.by, "posted an update", u.at));
    log.append(entry(task.creator || task.updatedBy, "created this item", task.createdAt));
    body.append(log);
  }

  panel.append(body);
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

/* ---------------- Profile ---------------- */

function scaleImage(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      cb(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function profileMenu(anchor) {
  openDropdown(anchor, (el, close) => {
    el.classList.add("profile-pop");
    const p = me();

    const avaWrap = h("div", { class: "profile-ava-wrap", title: "Choose character", onclick: () => { close(); characterPicker(anchor, me()); } },
      avatarEl(p, 72), h("span", { class: "profile-ava-edit" }, ico("smile", 14)));
    el.append(h("div", { class: "profile-top" }, avaWrap,
      h("div", { class: "profile-name-big" }, p.name),
      h("div", { class: "profile-mail" }, (p.role || DEFAULT_MEMBER_ROLE) + (teamOn() ? " · " + window.CLOUD.email() : (isAdmin() ? " · admin" : "")))));

    const input = h("input", { type: "text", value: p.name, placeholder: "Your name" });
    const okBtn = h("button", {}, "Save");
    const doSave = () => { const v = input.value.trim(); if (!v) return; me().name = v; save(); close(); render(); toast("Profile updated"); };
    okBtn.addEventListener("click", doSave);
    input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doSave(); ev.stopPropagation(); });
    el.append(h("div", { class: "dd-input-row" }, input, okBtn));

    el.append(h("hr", { class: "dd-sep" }));
    el.append(ddItem("smile", "Choose anime character", () => { close(); characterPicker(anchor, me()); }));
    el.append(ddItem("personPlus", "Manage members", () => { close(); peopleManager(anchor); }));
    el.append(ddItem(state.theme === "light" ? "moon" : "sun", state.theme === "light" ? "Dark mode" : "Light mode", () => {
      state.theme = state.theme === "light" ? "dark" : "light"; save(); close(); render();
    }));

    el.append(h("hr", { class: "dd-sep" }));
    if (cloudOn()) {
      if (window.CLOUD.user()) {
        el.append(h("div", { class: "dd-item disabled" }, ico("cloudCheck", 15), h("span", {}, "Synced: " + (window.CLOUD.email() || "cloud"))));
        el.append(ddItem("x", "Sign out of sync", async () => { close(); await window.CLOUD.signOut(); toast("Signed out — local only now"); render(); }));
      } else {
        el.append(ddItem("cloud", "Sign in to sync (cloud)", () => { close(); cloudAuthModal(); }));
      }
    } else {
      el.append(h("div", { class: "dd-item disabled" }, ico("cloud", 15), h("span", {}, "Cloud sync offline")));
    }

    el.append(ddItem("trash", "Reset demo data", () => {
      close();
      localStorage.removeItem(LS_KEY);
      load();
      resetBoardUi();
      ui.home = false;
      render();
      toast("Demo data reset");
    }, "danger"));
  }, { alignRight: true, minWidth: 280 });
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

  q("#me-btn").addEventListener("click", (e) => profileMenu(e.currentTarget));

  renderGreeting();
}

// time-of-day greeting in the top bar (replaces the old global search)
function greetingText() {
  const hr = new Date().getHours();
  if (hr < 11) return "Selamat pagi";
  if (hr < 15) return "Selamat siang";
  if (hr < 18) return "Selamat sore";
  return "Selamat malam";
}

function renderGreeting() {
  const el = q("#tb-greeting");
  if (!el) return;
  const first = (me() && me().name) ? me().name.split(" ")[0] : "";
  el.replaceChildren(
    h("span", { class: "tb-greet-text" }, greetingText() + (first ? ", " + first : "")),
    h("span", { class: "tb-greet-wave" }, "👋"));
}

/* ---------------- Init ---------------- */

load();
ui.home = true;   // always land on Workspace home on open, not the last/just-created board
wireTopbar();
render();
initCloud();
startWfScheduler();
