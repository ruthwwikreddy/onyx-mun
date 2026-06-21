/**
 * ONYX MUN — rate-limited submission helper (API proxy + local fallback)
 */
(function () {
  function getSupabaseClient() {
    if (!window.supabase || !window.ONYX_CONFIG) return null;
    return window.supabase.createClient(
      window.ONYX_CONFIG.SUPABASE_URL,
      window.ONYX_CONFIG.SUPABASE_ANON_KEY
    );
  }

  function isLocalDev() {
    const host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  async function directInsert(table, data) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Submission unavailable. Please refresh and try again.');
    const { error } = await client.from(table).insert([data]);
    if (error) throw error;
    return { ok: true };
  }

  window.ONYX_SUBMIT = {
    async insert(table, data, options = {}) {
      const formType = options.formType || table;
      const honeypot = options.honeypot || '';
      const check = window.ONYX_GUARD.validateBeforeSubmit(formType, honeypot);

      if (!check.ok) {
        if (check.silent) return { ok: true, bot: true };
        throw new Error(check.message);
      }

      const payload = {
        table,
        data,
        hp: honeypot || null,
        minElapsed: check.minElapsed,
      };

      try {
        const res = await fetch(window.ONYX_CONFIG.SUBMIT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (isLocalDev() && (res.status === 404 || res.status === 502)) {
            await directInsert(table, data);
            window.ONYX_GUARD.markSubmitted(formType);
            return { ok: true, fallback: true };
          }
          throw new Error(json.error || 'Submission failed. Please try again.');
        }

        window.ONYX_GUARD.markSubmitted(formType);
        return json;
      } catch (err) {
        if (isLocalDev()) {
          await directInsert(table, data);
          window.ONYX_GUARD.markSubmitted(formType);
          return { ok: true, fallback: true };
        }
        throw err;
      }
    },
  };
})();
