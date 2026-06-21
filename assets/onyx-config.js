/**
 * ONYX MUN — shared runtime config
 */
(function () {
  window.ONYX_CONFIG = {
    SUPABASE_URL: 'https://pmqbfmgjazlbtdtnlvez.supabase.co',
    SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWJmbWdqYXpsYnRkdG5sdmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTQ5MzgsImV4cCI6MjA5MjIzMDkzOH0.XjmK1DhqyJJaTcBXso0IdkFrcK4C2f0MqxexDqzdrwQ',
    SUBMIT_API: '/api/submit',
    GUARD: {
      minFormSeconds: 8,
      cooldownSeconds: 90,
    },
  };
})();
