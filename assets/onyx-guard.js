/**
 * ONYX MUN — client-side submission guards (honeypot, timing, cooldown)
 */
(function () {
  const cfg = window.ONYX_CONFIG?.GUARD || { minFormSeconds: 8, cooldownSeconds: 90 };
  const START_PREFIX = 'onyx_form_started:';
  const COOLDOWN_PREFIX = 'onyx_submit_cooldown:';

  function now() {
    return Date.now();
  }

  window.ONYX_GUARD = {
    markFormStart(formType) {
      sessionStorage.setItem(`${START_PREFIX}${formType}`, String(now()));
    },

    getElapsedSeconds(formType) {
      const started = Number(sessionStorage.getItem(`${START_PREFIX}${formType}`) || now());
      return (now() - started) / 1000;
    },

    validateBeforeSubmit(formType, honeypot) {
      if (honeypot && String(honeypot).trim()) {
        return { ok: false, silent: true };
      }

      const elapsed = this.getElapsedSeconds(formType);
      if (elapsed < cfg.minFormSeconds) {
        return {
          ok: false,
          message: 'Please take a moment to review your application before submitting.',
          minElapsed: elapsed,
        };
      }

      const last = Number(localStorage.getItem(`${COOLDOWN_PREFIX}${formType}`) || 0);
      if (now() - last < cfg.cooldownSeconds * 1000) {
        return {
          ok: false,
          message: 'Please wait a minute before submitting again.',
        };
      }

      return { ok: true, minElapsed: elapsed };
    },

    markSubmitted(formType) {
      localStorage.setItem(`${COOLDOWN_PREFIX}${formType}`, String(now()));
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form[id]');
    if (!form) return;
    const formType = form.id.replace(/Form$/, '') || form.id;
    window.ONYX_GUARD.markFormStart(formType);
  });
})();
