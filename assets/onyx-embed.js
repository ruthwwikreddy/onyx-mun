/**
 * ONYX MUN promo embed — scene API for Remotion / Gathrly marketing.
 * Query: ?scene=landing|checkout|checkout-processing|success|dashboard
 * postMessage: { type: 'gathrly-promo', scene: '...' }
 */
(function () {
  'use strict';

  var VALID_SCENES = [
    'landing',
    'checkout',
    'checkout-processing',
    'success',
    'dashboard'
  ];

  var EMBED_HEIGHT = 780;
  var PROMO_TYPE = 'gathrly-promo';
  var ALLOWED_PARENTS = [
    'https://onyxmunhyd.in',
    'https://www.onyxmunhyd.in',
    'https://www.gathrly.in',
    'https://gathrly.in'
  ];

  var params = new URLSearchParams(window.location.search);
  var root = document.getElementById('promo-root');
  var amountRaw = params.get('amount') || '2840';
  var amountNum = parseInt(amountRaw, 10) || 2840;
  var currency = (params.get('currency') || 'INR').toUpperCase();
  var theme = params.get('theme') || 'dark';
  var chrome = params.get('chrome') === '1';
  var currentScene = normalizeScene(params.get('scene') || 'landing');

  function normalizeScene(scene) {
    if (!scene || VALID_SCENES.indexOf(scene) === -1) return 'landing';
    return scene;
  }

  function formatInr(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(n);
  }

  function applyAmount() {
    var formatted = formatInr(amountNum);
    document.querySelectorAll('[data-promo-amount]').forEach(function (el) {
      el.textContent = formatted;
    });
    document.querySelectorAll('[data-amount-pay]').forEach(function (el) {
      el.textContent = 'Pay ' + formatted;
    });
  }

  function setChrome(show) {
    var bar = document.getElementById('promo-chrome');
    if (bar) bar.hidden = !show;
    document.body.dataset.chrome = show ? '1' : '0';
  }

  function setTheme(t) {
    document.body.dataset.theme = t === 'light' ? 'light' : 'dark';
  }

  function updatePanels(scene) {
    VALID_SCENES.forEach(function (s) {
      var panel = document.getElementById('scene-' + s);
      if (panel) panel.classList.toggle('is-active', s === scene);
    });
  }

  function setScene(scene, options) {
    options = options || {};
    scene = normalizeScene(scene);
    if (scene === currentScene && !options.force) return currentScene;

    currentScene = scene;
    document.body.dataset.scene = scene;
    updatePanels(scene);
    applyAmount();

    if (!options.silent) {
      notifyParent('gathrly-promo-ready', { scene: scene, height: EMBED_HEIGHT });
    }

    if (options.replaceUrl !== false && window.history && window.history.replaceState) {
      var next = new URL(window.location.href);
      next.searchParams.set('scene', scene);
      next.searchParams.set('amount', String(amountNum));
      next.searchParams.set('currency', currency);
      window.history.replaceState(null, '', next.pathname + next.search);
    }

    return scene;
  }

  function parentOrigin() {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch (e) { /* ignore */ }
    return '*';
  }

  function notifyParent(type, payload) {
    if (!window.parent || window.parent === window) return;
    var msg = Object.assign({ type: type }, payload || {});
    var target = parentOrigin();
    if (target === '*' || ALLOWED_PARENTS.indexOf(target) !== -1) {
      window.parent.postMessage(msg, target === '*' ? '*' : target);
    } else if (
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(target) ||
      target.indexOf('vercel.app') !== -1
    ) {
      window.parent.postMessage(msg, target);
    } else {
      window.parent.postMessage(msg, '*');
    }
  }

  function onMessage(event) {
    var data = event.data;
    if (!data || data.type !== PROMO_TYPE) return;

    if (data.amount != null) {
      amountNum = parseInt(data.amount, 10) || amountNum;
    }
    if (data.currency) currency = String(data.currency).toUpperCase();
    if (data.theme) setTheme(data.theme);
    if (data.chrome != null) setChrome(data.chrome === '1' || data.chrome === true);

    if (data.scene) {
      setScene(data.scene, { replaceUrl: false });
    }
  }

  function initHeroBackground() {
    var heroBg = document.getElementById('heroBg');
    if (!heroBg) return;
    var imgs = [
      '../assets/hero/image.png',
      '../assets/hero/image copy.png',
      '../assets/hero/image copy 2.png',
      '../assets/hero/image copy 3.png'
    ];
    var chosen = params.get('hero') || imgs[0];
    if (imgs.indexOf(chosen) === -1 && !/^\.{0,2}\//.test(chosen)) {
      chosen = imgs[0];
    }
    heroBg.style.backgroundImage = 'url("' + encodeURI(chosen) + '")';
  }

  function init() {
    if (!root) {
      notifyParent('gathrly-promo-error', { message: 'promo-root missing' });
      return;
    }

    initHeroBackground();
    setChrome(chrome);
    setTheme(theme);
    applyAmount();
    document.body.classList.add('promo-fade');
    setScene(currentScene, { force: true, silent: true });

    window.addEventListener('message', onMessage);

    requestAnimationFrame(function () {
      notifyParent('gathrly-promo-ready', { scene: currentScene, height: EMBED_HEIGHT });
    });
  }

  window.GathrlyPromoEmbed = {
    setScene: setScene,
    getScene: function () { return currentScene; },
    formatInr: formatInr,
    VALID_SCENES: VALID_SCENES.slice()
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
