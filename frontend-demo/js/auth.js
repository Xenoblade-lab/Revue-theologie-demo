/**
 * Auth simulée — sessionStorage, garde des pages dashboard (Phase 4.3 + Phase 6)
 */
(function () {
  'use strict';

  var SESSION_KEY = 'revue_demo_user';

  function getSessionUser() {
    try {
      var raw = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSessionUser(user) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }
    } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) { /* ignore */ }
  }

  /** Vérifie que l'utilisateur connecté a le droit d'accéder à la zone actuelle ; sinon redirige vers login. */
  function requireDashboardAuth() {
    var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
    if (path.indexOf('/admin/') === -1 && path.indexOf('/author/') === -1 && path.indexOf('/reviewer/') === -1) {
      return;
    }
    var user = getSessionUser();
    var role = user && user.role ? user.role : '';
    var allowed = false;
    if (path.indexOf('/admin/') !== -1) {
      allowed = role === 'admin';
    } else if (path.indexOf('/author/') !== -1) {
      allowed = role === 'auteur';
    } else if (path.indexOf('/reviewer/') !== -1) {
      allowed = role === 'redacteur' || role === 'redacteur en chef';
    }
    if (!allowed || !user) {
      var loginPath = path.indexOf('/admin/') !== -1 || path.indexOf('/author/') !== -1 || path.indexOf('/reviewer/') !== -1
        ? '../login.html'
        : 'login.html';
      if (typeof location !== 'undefined') {
        location.replace(loginPath);
      }
    }
  }

  requireDashboardAuth();

  /** Redirection selon le rôle après login */
  function getDashboardPathForRole(role) {
    if (role === 'admin') return 'admin/index.html';
    if (role === 'auteur') return 'author/index.html';
    if (role === 'redacteur' || role === 'redacteur en chef') return 'reviewer/index.html';
    return 'author/index.html';
  }

  /** Phase 6.1 — Login : vérification mock, sessionStorage, redirection */
  function bindLoginForm() {
    var form = document.getElementById('login-form');
    var messageEl = document.getElementById('login-message');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageEl) messageEl.textContent = '';
      var email = (form.querySelector('input[name="email"]') || {}).value;
      var password = (form.querySelector('input[name="password"]') || {}).value;
      if (!email || !password) {
        if (messageEl) { messageEl.textContent = 'Veuillez remplir email et mot de passe.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        if (messageEl) { messageEl.textContent = 'Format d\'email invalide.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      var data = window.RevueDemo && window.RevueDemo.data;
      if (!data || !data.getUserByEmail) {
        if (messageEl) { messageEl.textContent = 'Erreur démo : données non chargées.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      var user = data.getUserByEmail(email);
      if (!user || user.password !== password) {
        if (messageEl) { messageEl.textContent = 'Email ou mot de passe incorrect.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      var name = ((user.prenom || '') + ' ' + (user.nom || '')).trim() || user.email;
      setSessionUser({ id: user.id, email: user.email, name: name, role: user.role });
      var path = getDashboardPathForRole(user.role);
      location.href = path;
    });
  }

  /** Phase 6.2 — Register : ajout user mock, sauvegarde, redirection auteur */
  function bindRegisterForm() {
    var form = document.getElementById('register-form');
    var messageEl = document.getElementById('register-message');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageEl) messageEl.textContent = '';
      var nom = (form.querySelector('input[name="nom"]') || form.querySelector('input#reg-name') || {}).value;
      var prenom = (form.querySelector('input[name="prenom"]') || form.querySelector('input#reg-prenom') || {}).value;
      var email = (form.querySelector('input[name="email"]') || form.querySelector('input#reg-email') || {}).value;
      var password = (form.querySelector('input[name="password"]') || form.querySelector('input#reg-password') || {}).value;
      if (!nom) nom = (form.querySelector('input#reg-name') || {}).value;
      if (!nom || !email || !password) {
        if (messageEl) { messageEl.textContent = 'Veuillez remplir tous les champs obligatoires.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        if (messageEl) { messageEl.textContent = 'Format d\'email invalide.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      var data = window.RevueDemo && window.RevueDemo.data;
      if (!data || !data.getUserByEmail || !data.addUser || !data.saveState) {
        if (messageEl) { messageEl.textContent = 'Erreur démo : données non chargées.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      if (data.getUserByEmail(email)) {
        if (messageEl) { messageEl.textContent = 'Cet email est déjà utilisé.'; messageEl.style.color = 'var(--danger, #c00)'; }
        return;
      }
      var id = data.addUser(nom || 'Utilisateur', prenom || '', email, password, 'auteur');
      data.saveState();
      var name = (prenom + ' ' + nom).trim() || email;
      setSessionUser({ id: id, email: email, name: name, role: 'auteur' });
      if (messageEl) { messageEl.textContent = 'Inscription en démo : compte créé. Redirection…'; messageEl.style.color = 'var(--primary)'; }
      setTimeout(function () { location.href = 'author/index.html'; }, 800);
    });
  }

  /** Phase 6.3 — Forgot password : message démo */
  function bindForgotForm() {
    var form = document.getElementById('forgot-form');
    var messageEl = document.getElementById('forgot-message');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageEl) {
        messageEl.textContent = 'Un email de réinitialisation a été envoyé (démo).';
        messageEl.style.color = 'var(--primary)';
      }
    });
  }

  /** Phase 6.5 — Déconnexion : clear sessionStorage puis redirection (toutes les pages, y compris header public) */
  function bindLogoutLinks() {
    var links = document.querySelectorAll('a.logout-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        clearSession();
        var href = this.getAttribute('href');
        var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
        var isDashboard = path.indexOf('/admin/') !== -1 || path.indexOf('/author/') !== -1 || path.indexOf('/reviewer/') !== -1;
        location.href = (href && href !== '#') ? href : (isDashboard ? '../index.html' : 'index.html');
      });
    }
  }

  bindLoginForm();
  bindRegisterForm();
  bindForgotForm();
  bindLogoutLinks();

  window.RevueDemo = window.RevueDemo || {};
  window.RevueDemo.auth = {
    getSessionUser: getSessionUser,
    setSessionUser: setSessionUser,
    clearSession: clearSession,
    requireDashboardAuth: requireDashboardAuth,
    getDashboardPathForRole: getDashboardPathForRole
  };
})();
