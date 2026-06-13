/* ============================================================
   Cloud sync layer (Supabase). Optional + additive:
   if the SDK or network is unavailable, the app keeps running
   on localStorage only. Whole-state-as-JSON, per-user, RLS-guarded.
   ============================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://hwugotdnfufnuycgmqaw.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dWdvdGRuZnVmbnV5Y2dtcWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODA1NjQsImV4cCI6MjA5Njg1NjU2NH0.i4L2J8DdCMigNeC9VtBjEHadbGqTEiWQUlSAMjyWNyQ";
  const TABLE = "app_state";
  const TEAM = "team_state";       // single shared workspace blob (id = 'main')
  const MEMBERS = "team_members";  // access allow-list + roles
  const ADMIN_EMAIL = "portfoliog1eee@gmail.com";

  let client = null;
  let user = null;
  let onChange = null;

  try {
    if (window.supabase && window.supabase.createClient) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    }
  } catch (e) { console.warn("Supabase init failed:", e); }

  const friendly = (err) => (err && err.message) ? err.message : String(err || "Unknown error");

  const CLOUD = {
    available: () => !!client,
    user: () => user,
    email: () => (user && user.email) || "",

    async init(cb) {
      onChange = cb;
      if (!client) return;
      try {
        const { data } = await client.auth.getSession();
        user = (data && data.session && data.session.user) || null;
        client.auth.onAuthStateChange((_evt, session) => {
          user = (session && session.user) || null;
          if (onChange) onChange(user);
        });
        if (onChange) onChange(user);
      } catch (e) { console.warn("auth init", e); }
    },

    async signIn(email, password) {
      if (!client) return { error: "Cloud not available" };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error ? friendly(error) : null };
    },

    async signUp(email, password) {
      if (!client) return { error: "Cloud not available" };
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return { error: friendly(error) };
      // If email confirmation is on, session is null until confirmed.
      const needsConfirm = !(data && data.session);
      return { error: null, needsConfirm };
    },

    async signOut() {
      if (!client) return;
      try { await client.auth.signOut(); } catch (e) { console.warn(e); }
    },

    async load() {
      if (!client || !user) return null;
      try {
        const { data, error } = await client.from(TABLE).select("data").eq("user_id", user.id).maybeSingle();
        if (error) { console.warn("cloud load", error); return null; }
        return data ? data.data : null;
      } catch (e) { console.warn("cloud load", e); return null; }
    },

    async save(state) {
      if (!client || !user) return;
      try {
        const { error } = await client.from(TABLE).upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() });
        if (error) console.warn("cloud save", error);
      } catch (e) { console.warn("cloud save", e); }
    },

    /* ---------- Shared TEAM workspace (team_state) ---------- */
    isAdminEmail: () => ((user && user.email) || "").toLowerCase() === ADMIN_EMAIL,

    async loadTeam() {
      if (!client || !user) return null;
      try {
        const { data, error } = await client.from(TEAM).select("data").eq("id", "main").maybeSingle();
        if (error) { console.warn("team load", error); return null; }
        return data ? data.data : null;
      } catch (e) { console.warn("team load", e); return null; }
    },

    async saveTeam(state) {
      if (!client || !user) return;
      try {
        const { error } = await client.from(TEAM).upsert({ id: "main", data: state, updated_at: new Date().toISOString() });
        if (error) console.warn("team save", error);
      } catch (e) { console.warn("team save", e); }
    },

    /* ---------- Team membership / roles (team_members) ---------- */
    async listMembers() {
      if (!client || !user) return [];
      try {
        const { data, error } = await client.from(MEMBERS).select("*").order("added_at", { ascending: true });
        if (error) { console.warn("members list", error); return []; }
        return data || [];
      } catch (e) { console.warn("members list", e); return []; }
    },

    async addMember(email, role, name) {
      if (!client || !user) return { error: "Cloud not available" };
      try {
        const { error } = await client.from(MEMBERS).upsert({ email: (email || "").toLowerCase(), role: role || "Member", name: name || null });
        return { error: error ? friendly(error) : null };
      } catch (e) { return { error: friendly(e) }; }
    },

    async removeMember(email) {
      if (!client || !user) return { error: "Cloud not available" };
      try {
        const { error } = await client.from(MEMBERS).delete().eq("email", (email || "").toLowerCase());
        return { error: error ? friendly(error) : null };
      } catch (e) { return { error: friendly(e) }; }
    },
  };

  window.CLOUD = CLOUD;
})();
