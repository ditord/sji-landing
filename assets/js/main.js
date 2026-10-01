/* ==========================================================================
   SJI — page behaviour (vanilla JS, no dependencies)
   1. Language switch (EN / HY) using window.SJI_I18N from i18n.js
   2. Mobile navigation
   3. Header state + active section highlighting
   4. Scroll-reveal (skipped when prefers-reduced-motion is set)
   5. Contact form (progressive enhancement over a plain POST to contact.php)
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var DICT = window.SJI_I18N || {};
  var LANGS = ['en', 'hy'];
  var STORAGE_KEY = 'sji-lang';
  var currentLang = 'en';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. i18n ---------- */

  function t(key) {
    var d = DICT[currentLang] || {};
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    var en = DICT.en || {};
    return Object.prototype.hasOwnProperty.call(en, key) ? en[key] : null;
  }

  function readStoredLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode etc. */ }
  }

  function initialLang() {
    var stored = readStoredLang();
    if (LANGS.indexOf(stored) !== -1) return stored;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^hy\b/i.test(nav) ? 'hy' : 'en';
  }

  function applyLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = 'en';
    currentLang = lang;
    root.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n'));
      if (value !== null) el.textContent = value;
    });

    // data-i18n-attr="aria-label:key; alt:other.key"
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        if (parts.length !== 2) return;
        var value = t(parts[1].trim());
        if (value !== null) el.setAttribute(parts[0].trim(), value);
      });
    });

    var title = t('meta.title');
    if (title) document.title = title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && t('meta.description')) desc.setAttribute('content', t('meta.description'));

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      storeLang(lang);
      applyLang(lang);
    });
  });

  /* ---------- 2. Mobile navigation ---------- */

  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var desktopMQ = window.matchMedia('(min-width: 60em)');

  function setNav(open) {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
        setNav(false);
      }
    });

    var onMQ = function () { if (desktopMQ.matches) setNav(false); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ);
    else if (desktopMQ.addListener) desktopMQ.addListener(onMQ);
  }

  /* ---------- 3. Header state + active section ---------- */

  var header = document.querySelector('.site-header');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.remove('is-active');
          links[id].removeAttribute('aria-current');
        });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- 4. Scroll reveal ---------- */

  if (!reducedMotion && 'IntersectionObserver' in window) {
    root.classList.add('reveal-ready');

    // Small stagger for siblings in the same grid
    document.querySelectorAll('.cards, .steps, .pillars, .work-grid').forEach(function (group) {
      group.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.setProperty('--reveal-delay', (i * 0.08) + 's');
      });
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 5. Contact form ---------- */

  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('form-status');

  // Messages are set via data-i18n so they re-translate on language switch.
  function setI18nText(el, key) {
    if (!el) return;
    if (key) {
      el.setAttribute('data-i18n', key);
      el.textContent = t(key) || '';
    } else {
      el.removeAttribute('data-i18n');
      el.textContent = '';
    }
  }

  function setStatus(key, kind) {
    if (!statusEl) return;
    statusEl.classList.remove('is-success', 'is-error');
    if (kind) statusEl.classList.add('is-' + kind);
    setI18nText(statusEl, key);
  }

  var FIELDS = {
    name: { input: 'f-name', error: 'f-name-err', key: 'form.err.name' },
    email: { input: 'f-email', error: 'f-email-err', key: 'form.err.email' },
    message: { input: 'f-message', error: 'f-message-err', key: 'form.err.message' }
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function fieldValid(name, value) {
    value = value.trim();
    if (name === 'name') return value.length > 0 && value.length <= 100;
    if (name === 'email') return EMAIL_RE.test(value) && value.length <= 254;
    if (name === 'message') return value.length >= 10 && value.length <= 5000;
    return true;
  }

  function showFieldError(name, show) {
    var f = FIELDS[name];
    var input = document.getElementById(f.input);
    if (input) input.setAttribute('aria-invalid', String(show));
    setI18nText(document.getElementById(f.error), show ? f.key : null);
  }

  function validate() {
    var firstInvalid = null;
    Object.keys(FIELDS).forEach(function (name) {
      var input = document.getElementById(FIELDS[name].input);
      var ok = fieldValid(name, input ? input.value : '');
      showFieldError(name, !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  if (form) {
    form.noValidate = true; // we show our own (translated) messages

    // Clear a field's error as soon as it becomes valid
    Object.keys(FIELDS).forEach(function (name) {
      var input = document.getElementById(FIELDS[name].input);
      if (!input) return;
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true' && fieldValid(name, input.value)) {
          showFieldError(name, false);
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submit = form.querySelector('[type="submit"]');
      if (submit && submit.getAttribute('aria-disabled') === 'true') return; // already sending
      setStatus(null);

      var firstInvalid = validate();
      if (firstInvalid) { firstInvalid.focus(); return; }

      var submitLabel = submit && submit.querySelector('[data-i18n]');
      if (submit) submit.setAttribute('aria-disabled', 'true');
      if (submitLabel) setI18nText(submitLabel, 'form.sending');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: false }; });
        })
        .then(function (data) {
          if (data && data.ok) {
            form.reset();
            setStatus('form.success', 'success');
          } else if (data && Array.isArray(data.errors) && data.errors.length) {
            data.errors.forEach(function (name) { if (FIELDS[name]) showFieldError(name, true); });
            var first = FIELDS[data.errors[0]] && document.getElementById(FIELDS[data.errors[0]].input);
            if (first) first.focus();
          } else {
            setStatus('form.error', 'error');
          }
        })
        .catch(function () { setStatus('form.error', 'error'); })
        .then(function () {
          if (submit) submit.removeAttribute('aria-disabled');
          if (submitLabel) setI18nText(submitLabel, 'form.submit');
        });
    });

    // Without JS, contact.php redirects back with ?contact=sent|error
    var params = new URLSearchParams(window.location.search);
    var result = params.get('contact');
    if (result === 'sent') setStatus('form.success', 'success');
    else if (result === 'error') setStatus('form.error', 'error');
    if (result && window.history.replaceState) {
      params.delete('contact');
      var qs = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    }
  }

  /* ---------- Misc ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  applyLang(initialLang());
})();
