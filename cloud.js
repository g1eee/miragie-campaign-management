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
  };

  window.CLOUD = CLOUD;
})();
