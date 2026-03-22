/* ── Theme Toggle — Light/Dark Mode ── */
(function() {
  var STORAGE_KEY = 'mrzocchi-theme';

  function getPreferred() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Update toggle icon
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  function toggle() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  // Apply immediately (before DOM ready) to prevent flash
  apply(getPreferred());

  // Inject toggle button into header when DOM is ready
  function init() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML = '<span class="theme-icon"></span>';
    btn.addEventListener('click', toggle);

    // Insert inside nav (stays on first row on mobile)
    var nav = header.querySelector('.header-nav');
    if (nav) nav.appendChild(btn);
    else header.appendChild(btn);

    // Set correct icon
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      apply(e.matches ? 'dark' : 'light');
    }
  });
})();
