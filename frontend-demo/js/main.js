/**
 * Revue de la Faculte de Theologie - UPC - Script page test (index_2.html)
 * Menu mobile, carousels, formulaire newsletter, sondage.
 * Phase 10.1 : Header — Connexion / Nom + Déconnexion selon sessionStorage.
 */
(function () {
  'use strict';

  /** Phase 10.1 — Sur les pages publiques (sans dashboard), afficher « Bonjour, Nom » + lien dashboard + Déconnexion si connecté */
  function updateHeaderAuth() {
    if (document.querySelector('.dashboard-sidebar')) return;
    var auth = window.RevueDemo && window.RevueDemo.auth;
    var user = auth && auth.getSessionUser ? auth.getSessionUser() : null;
    var dashboardPath = auth && auth.getDashboardPathForRole && user ? auth.getDashboardPathForRole(user.role) : '';
    var name = user && user.name ? user.name : (user && user.email ? user.email : '');
    function escapeHtml(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    if (user && name && dashboardPath) {
      var authLinks = document.getElementById('header-auth-links');
      var authMobile = document.getElementById('header-auth-mobile');
      var html = 'Bonjour, <a href="' + dashboardPath + '">' + escapeHtml(name) + '</a> | <a href="index.html" class="logout-link">Déconnexion</a>';
      if (authLinks) authLinks.innerHTML = html;
      if (authMobile) authMobile.innerHTML = '<a href="' + dashboardPath + '" class="btn btn-outline-primary">' + escapeHtml(name) + '</a> <a href="index.html" class="btn btn-accent logout-link">Déconnexion</a>';
      if (!authLinks) {
        var topbar = document.querySelector('.topbar-links');
        var loginLink = topbar && topbar.querySelector('a[href="login.html"]');
        var registerLink = topbar && topbar.querySelector('a[href="register.html"]');
        if (loginLink && registerLink) {
          var span = document.createElement('span');
          span.id = 'header-auth-links';
          span.className = 'flex items-center gap-2';
          span.innerHTML = html;
          loginLink.parentNode.insertBefore(span, loginLink);
          loginLink.remove();
          registerLink.remove();
        }
      }
      var mobileActions = document.querySelector('#nav-mobile .actions');
      if (mobileActions && !authMobile) {
        mobileActions.innerHTML = '<a href="' + dashboardPath + '" class="btn btn-outline-primary">' + escapeHtml(name) + '</a> <a href="index.html" class="btn btn-accent logout-link">Déconnexion</a>';
      }
    }
  }
  updateHeaderAuth();

  // Dropdown langue : ouvrir au clic ou au survol ; clic sur FR/EN/Lingala = changer langue
  var langToggle = document.getElementById('lang-toggle');
  var langDropdown = langToggle ? langToggle.closest('.lang-dropdown') : null;
  var langMenu = langDropdown ? langDropdown.querySelector('.dropdown-menu') : null;
  if (langToggle) {
    langToggle.addEventListener('click', function (e) {
      e.preventDefault();
      if (langDropdown) langDropdown.classList.toggle('open');
      var expanded = langDropdown && langDropdown.classList.contains('open');
      langToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }
  if (langDropdown && langMenu) {
    var langCloseTimer = null;
    function openLang() {
      if (langCloseTimer) { clearTimeout(langCloseTimer); langCloseTimer = null; }
      langDropdown.classList.add('open');
      if (langToggle) langToggle.setAttribute('aria-expanded', 'true');
    }
    function scheduleCloseLang() {
      langCloseTimer = setTimeout(function () {
        langDropdown.classList.remove('open');
        if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
        langCloseTimer = null;
      }, 180);
    }
    langDropdown.addEventListener('mouseenter', openLang);
    langDropdown.addEventListener('mouseleave', scheduleCloseLang);
    langMenu.addEventListener('mouseenter', openLang);
    langMenu.addEventListener('mouseleave', scheduleCloseLang);
    var langLinks = langMenu.querySelectorAll('a[data-lang]');
    for (var i = 0; i < langLinks.length; i++) {
      langLinks[i].addEventListener('click', function (e) {
        e.preventDefault();
        var code = this.getAttribute('data-lang');
        if (code && window.RevueDemo && window.RevueDemo.lang) {
          window.RevueDemo.lang.setLang(code);
          window.RevueDemo.lang.applyLang();
          if (langDropdown) langDropdown.classList.remove('open');
          if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
  var langMobileLinks = document.querySelectorAll('.lang-mobile a[data-lang]');
  for (var j = 0; j < langMobileLinks.length; j++) {
    langMobileLinks[j].addEventListener('click', function (e) {
      e.preventDefault();
      var code = this.getAttribute('data-lang');
      if (code && window.RevueDemo && window.RevueDemo.lang) {
        window.RevueDemo.lang.setLang(code);
        window.RevueDemo.lang.applyLang();
      }
    });
  }

  // Menu mobile
  var menuToggle = document.getElementById('menu-toggle');
  var navMobile = document.getElementById('nav-mobile');
  if (menuToggle && navMobile) {
    menuToggle.addEventListener('click', function () {
      var isOpen = navMobile.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navMobile.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
  }

  var mobileLinks = document.querySelectorAll('#nav-mobile a');
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navMobile) {
        navMobile.classList.remove('open');
        navMobile.setAttribute('aria-hidden', 'true');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Dashboard (admin / auteur / évaluateur) : sidebar mobile – Phase 2.3
  // Bouton .dashboard-mobile-menu / #dashboard-menu-toggle, sidebar #dashboard-sidebar, overlay #dashboard-sidebar-backdrop
  // État ouvert : classe dashboard-sidebar-open sur body (aria-expanded sur le bouton)
  var dashboardToggle = document.getElementById('dashboard-menu-toggle') || document.querySelector('.dashboard-mobile-menu');
  var dashboardSidebar = document.getElementById('dashboard-sidebar');
  var dashboardBackdrop = document.getElementById('dashboard-sidebar-backdrop');
  if (dashboardToggle && dashboardSidebar) {
    function closeDashboardSidebar() {
      document.body.classList.remove('dashboard-sidebar-open');
      dashboardToggle.setAttribute('aria-expanded', 'false');
      dashboardToggle.focus();
    }
    function openDashboardSidebar() {
      document.body.classList.add('dashboard-sidebar-open');
      dashboardToggle.setAttribute('aria-expanded', 'true');
    }
    dashboardToggle.addEventListener('click', function () {
      if (document.body.classList.contains('dashboard-sidebar-open')) {
        closeDashboardSidebar();
      } else {
        openDashboardSidebar();
      }
    });
    if (dashboardBackdrop) {
      dashboardBackdrop.addEventListener('click', closeDashboardSidebar);
    }
    var sidebarLinks = dashboardSidebar.querySelectorAll('nav a');
    sidebarLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeDashboardSidebar();
      });
    });
  }

  // Carousels : boutons prev/next pour .issues-carousel et .coming-blocks
  function scrollCarousel(container, direction) {
    if (!container) return;
    var step = 240;
    if (direction === 'next') container.scrollBy({ left: step, behavior: 'smooth' });
    else container.scrollBy({ left: -step, behavior: 'smooth' });
  }

  document.querySelectorAll('.section-previous-issues .btn-prev').forEach(function (btn) {
    btn.addEventListener('click', function () {
      scrollCarousel(document.getElementById('issues-carousel'), 'prev');
    });
  });
  document.querySelectorAll('.section-previous-issues .btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      scrollCarousel(document.getElementById('issues-carousel'), 'next');
    });
  });

  // Newsletter : soumission POST vers /newsletter (pas de preventDefault)

  // Sondage "Question de la semaine"
  var pollForm = document.getElementById('widget-poll');
  if (pollForm) {
    pollForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var checked = pollForm.querySelector('input[name="question_week"]:checked');
      if (checked) {
        alert('Merci d\'avoir participe au sondage.');
        pollForm.reset();
      } else {
        alert('Veuillez choisir une option.');
      }
    });
  }

  // Recherche accueil (redirection simple vers publications avec query)
  var homeSearch = document.getElementById('home-search');
  var btnSearchSubmit = document.querySelector('.btn-search-submit');
  if (homeSearch && btnSearchSubmit) {
    function doSearch() {
      var q = homeSearch.value.trim();
      if (q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
    }
    btnSearchSubmit.addEventListener('click', doSearch);
    homeSearch.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
    });
  }

  // Filtres publications (si présents sur la page)
  var filterBtn = document.getElementById('filter-toggle');
  var filterPanel = document.getElementById('filter-panel');
  if (filterBtn && filterPanel) {
    filterBtn.addEventListener('click', function () { filterPanel.classList.toggle('open'); });
  }

  var categoryChips = document.querySelectorAll('[data-filter="category"]');
  var yearChips = document.querySelectorAll('[data-filter="year"]');
  var articlesContainer = document.getElementById('articles-list');
  var searchInput = document.getElementById('search-input');

  function getSelectedCategory() {
    var c = document.querySelector('[data-filter="category"].active');
    return c ? c.getAttribute('data-value') : 'Toutes';
  }
  function getSelectedYear() {
    var y = document.querySelector('[data-filter="year"].active');
    return y ? y.getAttribute('data-value') : 'Toutes';
  }
  function getSearchQuery() {
    return searchInput ? searchInput.value.trim().toLowerCase() : '';
  }
  function filterArticles() {
    if (!articlesContainer) return;
    var cat = getSelectedCategory();
    var year = getSelectedYear();
    var q = getSearchQuery();
    var items = articlesContainer.querySelectorAll('[data-article]');
    var count = 0;
    items.forEach(function (el) {
      var articleCat = el.getAttribute('data-category') || '';
      var articleYear = el.getAttribute('data-year') || '';
      var title = (el.getAttribute('data-title') || '').toLowerCase();
      var author = (el.getAttribute('data-author') || '').toLowerCase();
      var abstract = (el.getAttribute('data-abstract') || '').toLowerCase();
      var matchCat = cat === 'Toutes' || articleCat === cat;
      var matchYear = year === 'Toutes' || articleYear === year;
      var matchSearch = !q || title.indexOf(q) >= 0 || author.indexOf(q) >= 0 || abstract.indexOf(q) >= 0;
      var show = matchCat && matchYear && matchSearch;
      el.style.display = show ? '' : 'none';
      if (show) count++;
    });
    var countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = count + ' article' + (count !== 1 ? 's' : '') + ' trouvé' + (count !== 1 ? 's' : '');
  }

  categoryChips.forEach(function (btn) {
    btn.addEventListener('click', function () {
      categoryChips.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filterArticles();
    });
  });
  yearChips.forEach(function (btn) {
    btn.addEventListener('click', function () {
      yearChips.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filterArticles();
    });
  });
  if (searchInput) {
    searchInput.addEventListener('input', filterArticles);
    searchInput.addEventListener('keyup', filterArticles);
  }

  // Formulaire contact
  var contactForm = document.getElementById('contact-form');
  var contactSuccess = document.getElementById('contact-success');
  var contactFormWrap = document.getElementById('contact-form-wrap');
  if (contactForm && contactSuccess && contactFormWrap) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactFormWrap.style.display = 'none';
      contactSuccess.style.display = 'block';
    });
  }
  var sendAnotherBtn = document.getElementById('send-another');
  if (sendAnotherBtn && contactSuccess && contactFormWrap) {
    sendAnotherBtn.addEventListener('click', function () {
      contactSuccess.style.display = 'none';
      contactFormWrap.style.display = 'block';
    });
  }

  // Toggle mot de passe (login/register)
  var iconPath = document.querySelector('.password-toggle use');
  var iconBase = iconPath ? (iconPath.getAttribute('href') || '').split('#')[0] : '';
  document.querySelectorAll('.password-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.password-wrap');
      if (!wrap) return;
      var input = wrap.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      var use = btn.querySelector('use');
      if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Masquer le mot de passe');
        if (use) use.setAttribute('href', (iconBase || 'images/icons.svg') + '#eye-off');
      } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Afficher le mot de passe');
        if (use) use.setAttribute('href', (iconBase || 'images/icons.svg') + '#eye');
      }
    });
  });

  // Modal de confirmation (remplace alert/confirm)
  var confirmModal = document.getElementById('confirm-modal');
  var confirmModalMessage = document.getElementById('confirm-modal-message');
  var confirmModalOverlay = confirmModal ? confirmModal.querySelector('.confirm-modal-overlay') : null;
  var confirmModalCancel = confirmModal ? confirmModal.querySelector('.confirm-modal-cancel') : null;
  var confirmModalConfirm = confirmModal ? confirmModal.querySelector('.confirm-modal-confirm') : null;
  var pendingConfirmForm = null;

  function openConfirmModal(message) {
    if (!confirmModal || !confirmModalMessage) return;
    confirmModalMessage.textContent = message || '';
    confirmModal.removeAttribute('hidden');
    confirmModal.classList.add('is-open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }

  function closeConfirmModal() {
    if (!confirmModal) return;
    confirmModal.classList.remove('is-open');
    confirmModal.setAttribute('hidden', '');
    confirmModal.setAttribute('aria-hidden', 'true');
    pendingConfirmForm = null;
  }

  if (confirmModal) {
    if (confirmModalOverlay) confirmModalOverlay.addEventListener('click', closeConfirmModal);
    if (confirmModalCancel) confirmModalCancel.addEventListener('click', closeConfirmModal);
    if (confirmModalConfirm) {
      confirmModalConfirm.addEventListener('click', function () {
        if (pendingConfirmForm) {
          pendingConfirmForm.removeAttribute('data-confirm-message');
          pendingConfirmForm.submit();
        }
        closeConfirmModal();
      });
    }
  }

  document.querySelectorAll('form.js-confirm-submit').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var msg = this.getAttribute('data-confirm-message');
      if (!msg) return;
      e.preventDefault();
      pendingConfirmForm = this;
      openConfirmModal(msg);
    });
  });

})();
