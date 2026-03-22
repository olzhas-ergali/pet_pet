/**
 * Ранняя инициализация темы (до React). Без inline-скриптов — совместимо со строгим CSP (script-src 'self').
 */
(function () {
  try {
    var raw = localStorage.getItem('optbirja-ui-theme');
    if (!raw) return;
    var o = JSON.parse(raw);
    if (o && o.state && o.state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    /* ignore */
  }
})();
