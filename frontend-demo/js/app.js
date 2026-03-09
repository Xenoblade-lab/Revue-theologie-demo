/**
 * App principal — navigation, lecture des paramètres URL, remplissage des pages (Phase 4+)
 */
(function () {
  'use strict';

  var data = window.RevueDemo && window.RevueDemo.data;

  /** Récupère un paramètre de la query string (?id=1&q=foo) */
  function getQueryParam(name) {
    var search = typeof location !== 'undefined' && location.search ? location.search.slice(1) : '';
    if (!search) return null;
    var params = search.split('&');
    for (var i = 0; i < params.length; i++) {
      var part = params[i].split('=');
      if (part[0] === name) {
        return decodeURIComponent(part[1] || '').replace(/\+/g, ' ');
      }
    }
    return null;
  }

  /** Préfixe pour les liens selon la profondeur (racine vs admin/author/reviewer) */
  function getBasePath() {
    var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
    if (path.indexOf('/admin/') !== -1 || path.indexOf('/author/') !== -1 || path.indexOf('/reviewer/') !== -1) {
      return '../';
    }
    return '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /** --- Phase 11 : Formulaires et validation --- */
  var LIST_PAGE_SIZE = 10;
  var _adminUsersPage = 1;
  var _adminUsersQuery = '';
  var _adminUsersRole = '';
  var _adminArticlesPage = 1;
  var _adminArticlesQuery = '';
  var _adminArticlesStatut = '';
  var _adminPaiementsPage = 1;
  var _adminPaiementsStatut = '';
  function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  function validateRequired(value) {
    return value != null && String(value).trim() !== '';
  }

  /** --- Phase 10 : Composants partagés et UX --- */
  /** 10.2 Sidebar : classe active sur le lien correspondant à la page courante */
  function setDashboardSidebarActive() {
    var sidebar = document.querySelector('.dashboard-sidebar nav');
    if (!sidebar) return;
    var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
    var segments = path.split('/').filter(Boolean);
    var page = segments.length ? segments[segments.length - 1] : 'index.html';
    if (!page || page === 'admin' || page === 'author' || page === 'reviewer') page = 'index.html';
    var links = sidebar.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href') || '';
      var linkPage = href.split('/').pop();
      if (linkPage === page || (page === '' && linkPage === 'index.html')) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    }
  }

  /** 10.5 Badge notifications dans la sidebar */
  function updateSidebarNotificationBadge() {
    var sidebar = document.querySelector('.dashboard-sidebar nav');
    if (!sidebar || !data) return;
    var auth = window.RevueDemo && window.RevueDemo.auth;
    var user = auth && auth.getSessionUser ? auth.getSessionUser() : null;
    var userId = user && user.id ? user.id : 0;
    var count = data.getUnreadNotificationCount ? data.getUnreadNotificationCount(userId) : 0;
    var notifLink = sidebar.querySelector('a[href*="notifications"]');
    if (!notifLink) return;
    var badge = notifLink.querySelector('.sidebar-notif-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'sidebar-notif-badge badge';
        badge.style.marginLeft = '0.25rem';
        notifLink.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = 'inline';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  /** 10.3 Modal de confirmation */
  var confirmModalEl = null;
  function showConfirmModal(message, onConfirm) {
    if (!confirmModalEl) {
      confirmModalEl = document.createElement('div');
      confirmModalEl.id = 'revue-demo-confirm-modal';
      confirmModalEl.setAttribute('role', 'dialog');
      confirmModalEl.setAttribute('aria-modal', 'true');
      confirmModalEl.setAttribute('aria-labelledby', 'revue-demo-confirm-title');
      confirmModalEl.innerHTML = '<div class="revue-modal-backdrop"><div class="revue-modal-box card"><h2 id="revue-demo-confirm-title" class="mb-3">Confirmer</h2><p id="revue-demo-confirm-msg" class="mb-4"></p><div class="flex gap-2"><button type="button" id="revue-demo-confirm-cancel" class="btn btn-outline">Annuler</button><button type="button" id="revue-demo-confirm-ok" class="btn btn-primary">Confirmer</button></div></div></div>';
      confirmModalEl.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;';
      var style = document.createElement('style');
      style.textContent = '.revue-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:1rem}.revue-modal-box{max-width:400px;width:100%;padding:1.5rem}';
      document.head.appendChild(style);
      document.body.appendChild(confirmModalEl);
      document.getElementById('revue-demo-confirm-cancel').addEventListener('click', function () { confirmModalEl.style.display = 'none'; });
    }
    var msgEl = document.getElementById('revue-demo-confirm-msg');
    if (msgEl) msgEl.textContent = message || 'Confirmer cette action ?';
    confirmModalEl.style.display = 'flex';
    var okBtn = document.getElementById('revue-demo-confirm-ok');
    okBtn.onclick = function () {
      confirmModalEl.style.display = 'none';
      if (typeof onConfirm === 'function') onConfirm();
    };
  }

  /** 10.4 Message flash / toast */
  function showFlash(message, type) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'revue-flash revue-flash-' + type;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;padding:0.75rem 1.25rem;border-radius:0.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;max-width:320px;animation:revue-fadein 0.3s ease;';
    if (type === 'success') { toast.style.background = 'var(--primary)'; toast.style.color = 'var(--primary-foreground)'; }
    if (type === 'error') { toast.style.background = 'var(--destructive)'; toast.style.color = 'var(--destructive-foreground)'; }
    if (type === 'info') { toast.style.background = 'var(--muted)'; toast.style.color = 'var(--muted-foreground)'; }
    var anim = document.createElement('style');
    anim.textContent = '@keyframes revue-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(anim);
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4000);
  }

  /** Page article public (article.html?id=1) */
  function renderArticlePage() {
    var content = document.getElementById('article-content');
    var h1 = content && content.closest('.container') && content.closest('.container').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    var base = getBasePath();
    if (!id) {
      if (h1) h1.textContent = 'Détail de l\'article';
      content.innerHTML = '<p>Identifiant manquant. <a href="' + base + 'publications.html">Retour aux publications</a>.</p>';
      return;
    }
    var article = data.getArticleById(id);
    if (!article) {
      if (h1) h1.textContent = 'Article non trouvé';
      content.innerHTML = '<p>Cet article n\'existe pas. <a href="' + base + 'publications.html">Retour aux publications</a>.</p>';
      return;
    }
    if (h1) h1.textContent = article.titre;
    var authorName = (article.auteur_prenom || '') + ' ' + (article.auteur_nom || '');
    content.innerHTML =
      '<p class="text-sm text-muted">' + escapeHtml(authorName.trim() || 'Auteur') + ' — ' + escapeHtml(article.date_soumission || '') + '</p>' +
      '<div class="prose">' + escapeHtml(article.contenu || '') + '</div>' +
      '<p><a href="#" id="article-download-demo" class="btn btn-outline btn-sm">Télécharger (démo)</a> <span id="article-download-msg" class="text-muted text-sm ml-2" aria-live="polite"></span></p>' +
      '<p><a href="' + base + 'publications.html">← Retour aux publications</a></p>';
    var downloadBtn = content.querySelector('#article-download-demo');
    var downloadMsg = content.querySelector('#article-download-msg');
    if (downloadBtn && downloadMsg) {
      downloadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        downloadMsg.textContent = 'Démo : téléchargement désactivé.';
      });
    }
  }

  /** Page numéro public (numero.html?id=1) */
  function renderNumeroPage() {
    var content = document.getElementById('numero-content');
    var h1 = content && content.closest('.container') && content.closest('.container').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    var base = getBasePath();
    if (!id) {
      if (h1) h1.textContent = 'Détail du numéro';
      content.innerHTML = '<p>Identifiant manquant. <a href="' + base + 'archives.html">Retour aux archives</a>.</p>';
      return;
    }
    var numero = data.getNumeroById(id);
    if (!numero) {
      if (h1) h1.textContent = 'Numéro non trouvé';
      content.innerHTML = '<p>Ce numéro n\'existe pas. <a href="' + base + 'archives.html">Retour aux archives</a>.</p>';
      return;
    }
    if (h1) h1.textContent = numero.titre || ('Numéro ' + numero.numero);
    var articles = data.getArticlesByIssueId(id);
    var listHtml = '';
    if (articles.length) {
      listHtml = '<ul class="list-unstyled">';
      for (var i = 0; i < articles.length; i++) {
        var a = articles[i];
        var authorName = (a.auteur_prenom || '') + ' ' + (a.auteur_nom || '');
        listHtml += '<li><a href="' + base + 'article.html?id=' + encodeURIComponent(a.id) + '">' + escapeHtml(a.titre) + '</a>' +
          (authorName.trim() ? ' — ' + escapeHtml(authorName.trim()) : '') + '</li>';
      }
      listHtml += '</ul>';
    } else {
      listHtml = '<p>Aucun article dans ce numéro.</p>';
    }
    content.innerHTML =
      '<p class="text-muted">' + escapeHtml(numero.description || '') + (numero.date_publication ? ' — ' + numero.date_publication : '') + '</p>' +
      '<h2>Articles</h2>' + listHtml +
      '<p><a href="' + base + 'archives.html">← Retour aux archives</a></p>';
  }

  /** Page recherche (search.html?q=...) */
  function renderSearchPage() {
    var container = document.getElementById('search-results');
    var h1 = container && container.closest('.container') && container.closest('.container').querySelector('h1');
    if (!container || !data) return;
    var q = getQueryParam('q');
    var base = getBasePath();
    if (!q || !q.trim()) {
      if (h1) h1.textContent = 'Recherche';
      container.innerHTML = '<p>Saisissez un mot-clé dans la barre de recherche.</p>';
      return;
    }
    var all = data.getPublishedArticles(50, 0);
    var term = q.trim().toLowerCase();
    var results = all.filter(function (a) {
      var titre = (a.titre || '').toLowerCase();
      var contenu = (a.contenu || '').toLowerCase();
      var author = ((a.auteur_prenom || '') + ' ' + (a.auteur_nom || '')).toLowerCase();
      return titre.indexOf(term) !== -1 || contenu.indexOf(term) !== -1 || author.indexOf(term) !== -1;
    });
    if (h1) h1.textContent = 'Recherche : « ' + escapeHtml(q.trim()) + ' »';
    if (!results.length) {
      container.innerHTML = '<p>Aucun résultat pour « ' + escapeHtml(q.trim()) + ' ».</p>';
      return;
    }
    var html = '<p>' + results.length + ' résultat(s).</p><ul class="list-unstyled">';
    for (var j = 0; j < results.length; j++) {
      var art = results[j];
      var authName = (art.auteur_prenom || '') + ' ' + (art.auteur_nom || '');
      html += '<li><a href="' + base + 'article.html?id=' + encodeURIComponent(art.id) + '">' + escapeHtml(art.titre) + '</a>';
      if (authName.trim()) html += ' — ' + escapeHtml(authName.trim());
      html += '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  /** Page détail utilisateur admin (admin/user-detail.html?id=2) */
  function renderUserDetailPage() {
    var content = document.getElementById('user-detail-content');
    var h1 = content && content.closest('main') && content.closest('main').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    if (!id) {
      if (h1) h1.textContent = 'Détail utilisateur';
      content.textContent = 'Identifiant manquant.';
      return;
    }
    var user = data.getUserById(id);
    if (!user) {
      if (h1) h1.textContent = 'Utilisateur non trouvé';
      content.textContent = 'Cet utilisateur n\'existe pas.';
      return;
    }
    if (h1) h1.textContent = (user.prenom || '') + ' ' + (user.nom || '');
    content.innerHTML =
      '<p><strong>Email :</strong> ' + escapeHtml(user.email || '') + '</p>' +
      '<p><strong>Rôle :</strong> ' + escapeHtml(user.role || '') + '</p>' +
      '<p><strong>Statut :</strong> ' + escapeHtml(user.statut || '') + '</p>' +
      '<p><a href="user-form.html?id=' + encodeURIComponent(id) + '" class="btn btn-outline btn-sm">Modifier</a></p>';
  }


  /** Génère le HTML d'une carte article (structure article-card du site) */
  function articleCardHtml(a, base) {
    var authorName = (a.auteur_prenom || '') + ' ' + (a.auteur_nom || '').trim();
    var excerpt = (a.contenu || '').length > 180 ? (a.contenu || '').slice(0, 180) + '…' : (a.contenu || '');
    var link = base + 'article.html?id=' + encodeURIComponent(a.id);
    return '<article class="article-card"><div class="bar"></div><div style="padding: 1.5rem;">' +
      '<span class="badge badge-primary mb-4"><svg class="icon-svg icon-16" aria-hidden="true"><use href="' + base + 'images/icons.svg#tag"/></svg> Article</span>' +
      '<h3 class="font-serif text-lg font-bold leading-snug mb-3"><a href="' + link + '">' + escapeHtml(a.titre || '') + '</a></h3>' +
      '<p class="text-muted text-sm leading-relaxed line-clamp-3 mb-4">' + escapeHtml(excerpt) + '</p>' +
      '<div class="meta">' +
      (authorName ? '<span><svg class="icon-svg icon-16" aria-hidden="true"><use href="' + base + 'images/icons.svg#user"/></svg> ' + escapeHtml(authorName) + '</span>' : '') +
      (a.date_soumission ? '<span style="margin-left: auto;"><svg class="icon-svg icon-16" aria-hidden="true"><use href="' + base + 'images/icons.svg#clock"/></svg> ' + escapeHtml(a.date_soumission) + '</span>' : '') +
      '</div></div></article>';
  }

  /** Accueil : hero, featured, carousel, derniers articles, stats, newsletter (identique au site) */
  function renderHomePage() {
    if (!data) return;
    var base = getBasePath();
    var articles = data.getPublishedArticles(50, 0);
    var numeros = data.getNumeros(data.getVolumes()[0] ? data.getVolumes()[0].id : 0);
    var volumes = data.getVolumes();
    var firstArticle = data.getPublishedArticles(1, 0)[0] || null;
    var firstNumero = numeros[0] || (volumes[0] ? data.getNumeros(volumes[0].id)[0] : null) || null;

    // Hero : premier numéro
    var heroNumero = document.getElementById('hero-numero-text');
    var heroRibbon = document.getElementById('hero-ribbon-link');
    if (heroNumero) heroNumero.textContent = firstNumero ? (firstNumero.numero || '') + ' - ' + (firstNumero.date_publication || '') : 'Volume 28 - Numéro 1, 2025';
    if (heroRibbon) heroRibbon.href = firstNumero ? base + 'numero.html?id=' + encodeURIComponent(firstNumero.id) : base + 'archives.html';

    // Featured article card
    var featuredCard = document.getElementById('featured-article-card');
    if (featuredCard && firstArticle) {
      var authorName = (firstArticle.auteur_prenom || '') + ' ' + (firstArticle.auteur_nom || '').trim();
      var excerpt = (firstArticle.contenu || '').length > 220 ? (firstArticle.contenu || '').slice(0, 220) + '…' : (firstArticle.contenu || '');
      featuredCard.innerHTML =
        '<div class="featured-article-img"><img src="' + base + 'images/revue-cover-upc.jpg" alt=""></div>' +
        '<div class="featured-article-body">' +
        '<p class="featured-article-author"><svg class="icon-svg icon-16" aria-hidden="true"><use href="' + base + 'images/icons.svg#user"/></svg> ' + escapeHtml(authorName || 'Revue') + '</p>' +
        '<h3 class="font-serif featured-article-title"><a href="' + base + 'article.html?id=' + encodeURIComponent(firstArticle.id) + '">' + escapeHtml(firstArticle.titre || '') + '</a></h3>' +
        '<p class="featured-article-excerpt">' + escapeHtml(excerpt) + '</p>' +
        '<a href="' + base + 'article.html?id=' + encodeURIComponent(firstArticle.id) + '" class="btn btn-outline btn-view-article">Voir l\'article complet</a></div>';
    }

    // Issues carousel : 5 premiers articles
    var carousel = document.getElementById('issues-carousel');
    if (carousel) {
      var slice = data.getPublishedArticles(5, 0);
      var carouselHtml = '';
      for (var i = 0; i < slice.length; i++) {
        var a = slice[i];
        var auth = (a.auteur_prenom || '') + ' ' + (a.auteur_nom || '').trim();
        carouselHtml += '<article class="issue-card"><div class="issue-card-img"><img src="' + base + 'images/revue-cover-upc.jpg" alt=""></div>' +
          '<p class="issue-card-author"><svg class="icon-svg icon-16" aria-hidden="true"><use href="' + base + 'images/icons.svg#user"/></svg> ' + escapeHtml(auth || 'Revue') + '</p>' +
          '<h4 class="font-serif issue-card-title"><a href="' + base + 'article.html?id=' + encodeURIComponent(a.id) + '">' + escapeHtml(a.titre || '') + '</a></h4></article>';
      }
      if (carouselHtml) carousel.innerHTML = carouselHtml;
    }

    // Covers grid
    var coversGrid = document.getElementById('covers-grid');
    if (coversGrid && numeros.length) {
      var coversHtml = '';
      for (var n = 0; n < Math.min(numeros.length, 4); n++) {
        var num = numeros[n];
        coversHtml += '<a href="' + base + 'numero.html?id=' + encodeURIComponent(num.id) + '" class="cover-card">' +
          '<div class="cover-card-img"><img src="' + base + 'images/revue-cover-upc.jpg" alt="' + escapeHtml(num.numero || '') + '"></div>' +
          '<p class="cover-card-title">' + escapeHtml(num.titre || 'Numéro ' + (num.numero || '')) + '</p></a>';
      }
      coversHtml += '<a href="' + base + 'archives.html" class="cover-card"><div class="cover-card-img cover-placeholder"><span>+</span></div><p class="cover-card-title">Toutes les archives</p></a>';
      coversGrid.innerHTML = coversHtml;
    }

    // Stats sidebar
    var statArticles = document.getElementById('stats-articles');
    var statVolumes = document.getElementById('stats-volumes');
    if (statArticles) statArticles.textContent = articles.length + (articles.length >= 100 ? '+' : '');
    if (statVolumes) statVolumes.textContent = volumes.length;

    // Derniers articles (grid-3, structure article-card)
    var container = document.getElementById('home-latest');
    if (container) {
      var latest = data.getPublishedArticles(6, 0);
      if (!latest.length) {
        container.innerHTML = '<p class="text-muted">Aucun article publié pour le moment.</p>';
      } else {
        var html = '';
        for (var j = 0; j < latest.length; j++) {
          html += articleCardHtml(latest[j], base);
        }
        container.innerHTML = html;
      }
    }

    // Volumes section (home-volumes) : 6 premiers numéros (comme le site PHP)
    var homeVolumes = document.getElementById('home-volumes');
    if (homeVolumes) {
      var allNumeros = [];
      for (var v = 0; v < volumes.length; v++) {
        var nlist = data.getNumeros(volumes[v].id);
        for (var ni = 0; ni < nlist.length; ni++) allNumeros.push(nlist[ni]);
      }
      var sliceNum = allNumeros.slice(0, 6);
      if (!sliceNum.length) {
        homeVolumes.innerHTML = '<p class="text-muted">Aucun numéro pour le moment.</p>';
      } else {
        var volHtml = '';
        for (var k = 0; k < sliceNum.length; k++) {
          var nr = sliceNum[k];
          volHtml += '<div class="volume-card"><div class="head"><h3>Numéro ' + escapeHtml(nr.numero || '') + '</h3>';
          volHtml += '<p><svg class="icon-svg icon-16" style="vertical-align: middle;" aria-hidden="true"><use href="' + base + 'images/icons.svg#calendar"/></svg> ' + escapeHtml(nr.date_publication || '—') + '</p></div>';
          volHtml += '<div class="body"><ul><li><a href="' + base + 'numero.html?id=' + encodeURIComponent(nr.id) + '"><svg class="icon-svg icon-16" style="vertical-align: middle;" aria-hidden="true"><use href="' + base + 'images/icons.svg#file-text"/></svg> ' + escapeHtml(nr.titre || 'Numéro ' + (nr.numero || '')) + '</a></li></ul></div></div>';
        }
        homeVolumes.innerHTML = volHtml;
      }
    }

    // Newsletter (démo : pas d'envoi)
    var form = document.getElementById('newsletter-form');
    var messageEl = document.getElementById('newsletter-message');
    if (form && messageEl) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        messageEl.textContent = '';
        messageEl.style.color = '';
        var email = (form.querySelector('input[name="email"]') || {}).value;
        if (!email) return;
        messageEl.textContent = 'Merci ! Vous recevrez nos actualités à cette adresse.';
        messageEl.style.color = 'var(--upc-gold)';
        form.reset();
      });
    }
  }

  /** Publications : liste des articles publiés (Phase 5.2) */
  function renderPublicationsPage() {
    var container = document.getElementById('publications-list');
    var countEl = document.getElementById('publications-count');
    if (!container || !data) return;
    var articles = data.getPublishedArticles(50, 0);
    var base = getBasePath();
    if (countEl) countEl.textContent = articles.length + ' article(s) trouvé(s).';
    if (!articles.length) {
      container.innerHTML = '<p class="text-muted">Aucune publication pour le moment.</p>';
    } else {
      var html = '';
      for (var i = 0; i < articles.length; i++) {
        var a = articles[i];
        var authorName = (a.auteur_prenom || '') + ' ' + (a.auteur_nom || '');
        var excerpt = (a.contenu || '').length > 120 ? (a.contenu || '').slice(0, 120) + '…' : (a.contenu || '');
        html += '<article class="card card-compact"><div class="flex flex-col lg:flex-row gap-1"><div class="flex-1 min-w-0">';
        html += '<div class="flex flex-wrap items-center gap-1 mb-0"><span class="badge badge-primary">Article</span>';
        html += '<h2 class="font-serif text-sm font-bold mb-0"><a href="' + base + 'article.html?id=' + encodeURIComponent(a.id) + '">' + escapeHtml(a.titre) + '</a></h2></div>';
        html += '<p class="text-muted text-xs mb-0 mt-0">' + escapeHtml(excerpt) + '</p>';
        html += '<div class="flex flex-wrap gap-2 text-xs text-muted mt-1">';
        if (authorName.trim()) html += '<span>' + escapeHtml(authorName.trim()) + '</span>';
        if (a.date_soumission) html += '<span>' + escapeHtml(a.date_soumission) + '</span>';
        html += '</div></div><div class="flex gap-2 flex-shrink-0"><a href="' + base + 'article.html?id=' + encodeURIComponent(a.id) + '" class="btn btn-outline btn-sm">Lire</a></div></div></article>';
      }
      container.innerHTML = html;
    }
  }

  /** Archives : volumes et numéros (Phase 5.2) */
  function renderArchivesPage() {
    var container = document.getElementById('archives-list');
    if (!container || !data) return;
    var volumes = data.getVolumes();
    var base = getBasePath();
    if (!volumes.length) {
      container.innerHTML = '<p class="text-muted">Aucun volume pour le moment.</p>';
    } else {
      var html = '';
      for (var v = 0; v < volumes.length; v++) {
        var vol = volumes[v];
        var numeros = data.getNumeros(vol.id);
        html += '<div class="volume-card volume-card-compact card p-3"><div class="head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">';
        html += '<div><h2 class="font-serif text-base font-bold mb-0">Volume ' + escapeHtml(vol.numero_volume || vol.annee || vol.id) + '</h2>';
        html += '<p class="text-xs mt-0 mb-0 text-muted">Année ' + escapeHtml(vol.annee || '') + '</p></div></div><div class="body mt-3">';
        if (vol.description) html += '<p class="text-muted text-xs mb-3">' + escapeHtml(vol.description) + '</p>';
        html += '<div class="flex flex-col gap-2">';
        for (var n = 0; n < numeros.length; n++) {
          var num = numeros[n];
          html += '<a href="' + base + 'numero.html?id=' + encodeURIComponent(num.id) + '" class="card p-3 flex items-center gap-3" style="background: var(--secondary); text-decoration: none; color: inherit;">';
          html += '<div class="flex-1 min-w-0"><p class="text-xs font-medium mb-0">Numéro ' + escapeHtml(num.numero || '') + ' — ' + escapeHtml(num.titre || '') + '</p>';
          html += '<p class="text-xs text-muted mt-0">' + escapeHtml(num.date_publication || '') + '</p></div><span class="text-muted">→</span></a>';
        }
        html += '</div></div></div>';
      }
      container.innerHTML = html;
    }
  }

  // ---------- Phase 7 : Admin dashboard ----------

  function renderAdminDashboard() {
    var container = document.getElementById('dashboard-summary');
    if (!container || !data) return;
    var users = data.getUsers();
    var articles = data.getArticles();
    var paiements = data.getPaiements(50, 0);
    var enAttente = paiements.filter(function (p) { return p.statut === 'en_attente'; }).length;
    var evaluations = data.getEvaluations(null, null);
    var volumes = data.getVolumes();
    var auth = window.RevueDemo && window.RevueDemo.auth;
    var user = auth && auth.getSessionUser ? auth.getSessionUser() : null;
    var adminId = user && user.id ? user.id : 1;
    var notifs = data.getNotifications(adminId);
    var notifsNonLues = notifs.filter(function (n) { return !n.lu; }).length;
    var cards = [
      { label: 'Articles', value: articles.length, link: 'articles.html' },
      { label: 'Utilisateurs', value: users.length, link: 'users.html' },
      { label: 'Paiements en attente', value: enAttente, link: 'paiements.html' },
      { label: 'Évaluations', value: evaluations.length, link: 'evaluations.html' },
      { label: 'Volumes', value: volumes.length, link: 'volumes.html' },
      { label: 'Notifications non lues', value: notifsNonLues, link: 'notifications.html' }
    ];
    var html = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<a href="' + c.link + '" class="card p-4 flex flex-col gap-1" style="text-decoration: none; color: inherit;">';
      html += '<span class="text-sm text-muted">' + escapeHtml(c.label) + '</span>';
      html += '<span class="text-2xl font-bold">' + c.value + '</span></a>';
    }
    container.innerHTML = html;
  }

  function renderAdminUsersList() {
    var container = document.getElementById('users-list');
    if (!container || !data) return;
    var users = data.getUsers();
    var q = (_adminUsersQuery || '').toLowerCase().trim();
    var roleFilter = _adminUsersRole || '';
    var filtered = users.filter(function (u) {
      if (roleFilter && u.role !== roleFilter) return false;
      if (q) {
        var name = ((u.prenom || '') + ' ' + (u.nom || '')).trim() || '';
        return (name.toLowerCase().indexOf(q) !== -1) || (u.email || '').toLowerCase().indexOf(q) !== -1;
      }
      return true;
    });
    var totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    if (_adminUsersPage > totalPages) _adminUsersPage = totalPages;
    var start = (_adminUsersPage - 1) * LIST_PAGE_SIZE;
    var slice = filtered.slice(start, start + LIST_PAGE_SIZE);
    var html = '<div class="list-filters mb-3 flex flex-wrap gap-2 items-center"><label>Recherche</label><input type="text" id="users-search" class="input" placeholder="Nom, email..." value="' + escapeHtml(_adminUsersQuery) + '" style="max-width:200px"><label>Rôle</label><select id="users-role" class="input" style="max-width:150px"><option value="">Tous</option><option value="admin"' + (_adminUsersRole === 'admin' ? ' selected' : '') + '>Admin</option><option value="auteur"' + (_adminUsersRole === 'auteur' ? ' selected' : '') + '>Auteur</option><option value="redacteur"' + (_adminUsersRole === 'redacteur' ? ' selected' : '') + '>Rédacteur</option><option value="redacteur en chef"' + (_adminUsersRole === 'redacteur en chef' ? ' selected' : '') + '>Rédacteur en chef</option></select></div>';
    if (!slice.length) {
      html += '<p class="text-muted">Aucun utilisateur.</p>';
    } else {
      html += '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Nom</th><th style="text-align: left; padding: 0.5rem;">Email</th><th style="text-align: left; padding: 0.5rem;">Rôle</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < slice.length; i++) {
        var u = slice[i];
        var name = ((u.prenom || '') + ' ' + (u.nom || '')).trim() || u.email;
        html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(name) + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.email || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.role || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.statut || '') + '</td><td style="padding: 0.5rem;"><a href="user-detail.html?id=' + encodeURIComponent(u.id) + '">Détail</a> | <a href="user-form.html?id=' + encodeURIComponent(u.id) + '">Modifier</a></td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '<div class="list-pagination mt-2 flex items-center gap-2"><button type="button" class="btn btn-outline btn-sm" id="users-prev" ' + (_adminUsersPage <= 1 ? 'disabled' : '') + '>Précédent</button><span>Page ' + _adminUsersPage + ' / ' + totalPages + '</span><button type="button" class="btn btn-outline btn-sm" id="users-next" ' + (_adminUsersPage >= totalPages ? 'disabled' : '') + '>Suivant</button></div>';
    container.innerHTML = html;
    var searchEl = document.getElementById('users-search');
    var roleEl = document.getElementById('users-role');
    if (searchEl) searchEl.addEventListener('input', function () { _adminUsersQuery = this.value; _adminUsersPage = 1; renderAdminUsersList(); });
    if (roleEl) roleEl.addEventListener('change', function () { _adminUsersRole = this.value; _adminUsersPage = 1; renderAdminUsersList(); });
    var prevBtn = document.getElementById('users-prev');
    var nextBtn = document.getElementById('users-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (_adminUsersPage > 1) { _adminUsersPage--; renderAdminUsersList(); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (_adminUsersPage < totalPages) { _adminUsersPage++; renderAdminUsersList(); } });
  }

  function renderAdminUserForm() {
    var form = document.getElementById('user-form');
    var titleEl = document.getElementById('user-form-title');
    if (!form || !data) return;
    var id = getQueryParam('id');
    if (id) {
      var user = data.getUserById(id);
      if (user) {
        if (titleEl) titleEl.textContent = 'Modifier l\'utilisateur';
        (form.querySelector('input[name="nom"]') || {}).value = user.nom || '';
        (form.querySelector('input[name="prenom"]') || {}).value = user.prenom || '';
        (form.querySelector('input[name="email"]') || {}).value = user.email || '';
        var roleSel = form.querySelector('select[name="role"]');
        if (roleSel) roleSel.value = user.role || 'auteur';
      }
    } else {
      if (titleEl) titleEl.textContent = 'Créer un utilisateur';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = (form.querySelector('input[name="nom"]') || {}).value;
      var prenom = (form.querySelector('input[name="prenom"]') || {}).value;
      var email = (form.querySelector('input[name="email"]') || {}).value;
      var password = (form.querySelector('input[name="password"]') || {}).value;
      var roleSel = form.querySelector('select[name="role"]');
      var role = roleSel ? roleSel.value : 'auteur';
      if (role === 'evaluateur') role = 'redacteur';
      var msg = document.getElementById('user-form-message') || (function () { var m = document.createElement('p'); m.id = 'user-form-message'; form.appendChild(m); return m; })();
      if (!validateRequired(nom)) { msg.textContent = 'Le nom est requis.'; msg.style.color = 'var(--destructive)'; return; }
      if (!validateRequired(email)) { msg.textContent = 'L\'email est requis.'; msg.style.color = 'var(--destructive)'; return; }
      if (!validateEmail(email)) { msg.textContent = 'Format d\'email invalide.'; msg.style.color = 'var(--destructive)'; return; }
      if (id) {
        data.updateUser(id, { nom: nom, prenom: prenom, email: email });
        msg.textContent = 'Enregistré.';
        msg.style.color = 'var(--primary)';
        if (window.RevueDemo && window.RevueDemo.showFlash) window.RevueDemo.showFlash('Utilisateur enregistré.', 'success');
      } else {
        data.addUser(nom, prenom, email, password || 'demo', role);
        msg.textContent = 'Utilisateur créé (démo).';
        msg.style.color = 'var(--primary)';
        if (window.RevueDemo && window.RevueDemo.showFlash) window.RevueDemo.showFlash('Utilisateur créé (démo).', 'success');
      }
    });
  }

  function renderAdminArticlesList() {
    var container = document.getElementById('articles-list');
    if (!container || !data) return;
    var articles = data.getArticles();
    var q = (_adminArticlesQuery || '').toLowerCase().trim();
    var statutFilter = _adminArticlesStatut || '';
    var filtered = articles.filter(function (a) {
      if (statutFilter && a.statut !== statutFilter) return false;
      if (q && (a.titre || '').toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    var totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    if (_adminArticlesPage > totalPages) _adminArticlesPage = totalPages;
    var start = (_adminArticlesPage - 1) * LIST_PAGE_SIZE;
    var slice = filtered.slice(start, start + LIST_PAGE_SIZE);
    var html = '<div class="list-filters mb-3 flex flex-wrap gap-2 items-center"><label>Recherche</label><input type="text" id="articles-search" class="input" placeholder="Titre..." value="' + escapeHtml(_adminArticlesQuery) + '" style="max-width:200px"><label>Statut</label><select id="articles-statut" class="input" style="max-width:150px"><option value="">Tous</option><option value="brouillon"' + (_adminArticlesStatut === 'brouillon' ? ' selected' : '') + '>Brouillon</option><option value="soumis"' + (_adminArticlesStatut === 'soumis' ? ' selected' : '') + '>Soumis</option><option value="en_revision"' + (_adminArticlesStatut === 'en_revision' ? ' selected' : '') + '>En révision</option><option value="valide"' + (_adminArticlesStatut === 'valide' ? ' selected' : '') + '>Valide</option><option value="refuse"' + (_adminArticlesStatut === 'refuse' ? ' selected' : '') + '>Refusé</option></select></div>';
    if (!slice.length) {
      html += '<p class="text-muted">Aucun article.</p>';
    } else {
      html += '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Titre</th><th style="text-align: left; padding: 0.5rem;">Auteur</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th style="text-align: left; padding: 0.5rem;">Date</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < slice.length; i++) {
        var a = slice[i];
        var author = data.getUserById(a.auteur_id);
        var authorName = author ? ((author.prenom || '') + ' ' + (author.nom || '')).trim() : '—';
        html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(a.titre || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(authorName) + '</td><td style="padding: 0.5rem;">' + escapeHtml(a.statut || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(a.date_soumission || '') + '</td><td style="padding: 0.5rem;"><a href="article-detail.html?id=' + encodeURIComponent(a.id) + '">Détail</a></td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '<div class="list-pagination mt-2 flex items-center gap-2"><button type="button" class="btn btn-outline btn-sm" id="articles-prev" ' + (_adminArticlesPage <= 1 ? 'disabled' : '') + '>Précédent</button><span>Page ' + _adminArticlesPage + ' / ' + totalPages + '</span><button type="button" class="btn btn-outline btn-sm" id="articles-next" ' + (_adminArticlesPage >= totalPages ? 'disabled' : '') + '>Suivant</button></div>';
    container.innerHTML = html;
    var searchEl = document.getElementById('articles-search');
    var statutEl = document.getElementById('articles-statut');
    if (searchEl) searchEl.addEventListener('input', function () { _adminArticlesQuery = this.value; _adminArticlesPage = 1; renderAdminArticlesList(); });
    if (statutEl) statutEl.addEventListener('change', function () { _adminArticlesStatut = this.value; _adminArticlesPage = 1; renderAdminArticlesList(); });
    var prevBtn = document.getElementById('articles-prev');
    var nextBtn = document.getElementById('articles-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (_adminArticlesPage > 1) { _adminArticlesPage--; renderAdminArticlesList(); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (_adminArticlesPage < totalPages) { _adminArticlesPage++; renderAdminArticlesList(); } });
  }

  function renderAdminArticleDetailPage() {
    var content = document.getElementById('article-detail-content');
    var h1 = content && content.closest('main') && content.closest('main').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    if (!id) {
      if (h1) h1.textContent = 'Détail article';
      content.textContent = 'Identifiant manquant.';
      return;
    }
    var article = data.getArticleById(id);
    if (!article) {
      if (h1) h1.textContent = 'Article non trouvé';
      content.textContent = 'Cet article n\'existe pas.';
      return;
    }
    if (h1) h1.textContent = article.titre;
    var authorName = (article.auteur_prenom || '') + ' ' + (article.auteur_nom || '');
    var evals = data.getEvaluationsByArticleId ? data.getEvaluationsByArticleId(id) : [];
    var numeros = data.getNumeros(null);
    var reviewers = data.getUsers().filter(function (u) { return u.role === 'redacteur' || u.role === 'redacteur en chef'; });
    var statuts = ['brouillon', 'soumis', 'en_revision', 'accepte', 'refuse', 'valide'];
    var statutSelect = '<select id="article-statut-select"><option value="">—</option>';
    for (var s = 0; s < statuts.length; s++) {
      statutSelect += '<option value="' + statuts[s] + '"' + (article.statut === statuts[s] ? ' selected' : '') + '>' + statuts[s] + '</option>';
    }
    statutSelect += '</select>';
    var issueSelect = '<select id="article-issue-select"><option value="">— Aucun numéro —</option>';
    for (var n = 0; n < numeros.length; n++) {
      issueSelect += '<option value="' + numeros[n].id + '"' + (article.issue_id === numeros[n].id ? ' selected' : '') + '>' + escapeHtml(numeros[n].titre || 'Numéro ' + numeros[n].numero) + '</option>';
    }
    issueSelect += '</select>';
    var reviewerSelect = '<select id="article-reviewer-select"><option value="">— Choisir —</option>';
    for (var r = 0; r < reviewers.length; r++) {
      reviewerSelect += '<option value="' + reviewers[r].id + '">' + escapeHtml((reviewers[r].prenom || '') + ' ' + (reviewers[r].nom || '')) + '</option>';
    }
    reviewerSelect += '</select>';
    var evalsHtml = '';
    for (var e = 0; e < evals.length; e++) {
      var ev = evals[e];
      var revUser = data.getUserById(ev.evaluateur_id);
      var revName = revUser ? (revUser.prenom || '') + ' ' + (revUser.nom || '') : ev.evaluateur_id;
      evalsHtml += '<li>Évaluateur : ' + escapeHtml(revName) + ' — ' + escapeHtml(ev.statut || '') + ' <button type="button" class="btn btn-outline btn-sm desassign-eval" data-eval-id="' + ev.id + '">Désassigner</button></li>';
    }
    content.innerHTML =
      '<p><strong>Auteur :</strong> ' + escapeHtml(authorName.trim() || '—') + '</p>' +
      '<p><strong>Statut :</strong> ' + statutSelect + ' <button type="button" id="btn-apply-statut" class="btn btn-sm btn-primary">Appliquer</button></p>' +
      '<p><strong>Numéro :</strong> ' + issueSelect + ' <button type="button" id="btn-apply-issue" class="btn btn-sm btn-primary">Associer</button></p>' +
      '<p><strong>Assigner évaluateur :</strong> ' + reviewerSelect + ' <button type="button" id="btn-assign-reviewer" class="btn btn-sm btn-primary">Assigner</button></p>' +
      (evalsHtml ? '<p><strong>Évaluations :</strong></p><ul>' + evalsHtml + '</ul>' : '') +
      '<p><strong>Date soumission :</strong> ' + escapeHtml(article.date_soumission || '') + '</p>' +
      '<p><strong>Résumé :</strong> ' + escapeHtml((article.contenu || '').slice(0, 300)) + (article.contenu && article.contenu.length > 300 ? '…' : '') + '</p>';
    var btnStatut = content.querySelector('#btn-apply-statut');
    var selStatut = content.querySelector('#article-statut-select');
    if (btnStatut && selStatut) {
      btnStatut.addEventListener('click', function () {
        var v = selStatut.value;
        if (v && data.updateArticle(id, { statut: v })) location.reload();
      });
    }
    var btnIssue = content.querySelector('#btn-apply-issue');
    var selIssue = content.querySelector('#article-issue-select');
    if (btnIssue && selIssue) {
      btnIssue.addEventListener('click', function () {
        var v = selIssue.value;
        if (data.updateArticle(id, { issue_id: v ? parseInt(v, 10) : null })) location.reload();
      });
    }
    var btnReviewer = content.querySelector('#btn-assign-reviewer');
    var selReviewer = content.querySelector('#article-reviewer-select');
    if (btnReviewer && selReviewer && data.addEvaluation) {
      btnReviewer.addEventListener('click', function () {
        var v = selReviewer.value;
        if (v) { data.addEvaluation(id, v); location.reload(); }
      });
    }
    content.querySelectorAll('.desassign-eval').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var eid = this.getAttribute('data-eval-id');
        if (eid && data.deleteEvaluation) { data.deleteEvaluation(eid); location.reload(); }
      });
    });
  }

  function renderAdminEvaluationsList() {
    var container = document.getElementById('evaluations-list');
    if (!container || !data) return;
    var list = data.getEvaluations(null, null);
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucune évaluation.</p>';
      return;
    }
    var html = '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Article</th><th style="text-align: left; padding: 0.5rem;">Évaluateur</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var rev = data.getUserById(e.evaluateur_id);
      var revName = rev ? (rev.prenom || '') + ' ' + (rev.nom || '') : e.evaluateur_id;
      html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(e.article_titre || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(revName) + '</td><td style="padding: 0.5rem;">' + escapeHtml(e.statut || '') + '</td><td style="padding: 0.5rem;"><a href="article-detail.html?id=' + encodeURIComponent(e.article_id) + '">Voir article</a> | <button type="button" class="btn btn-outline btn-sm desassign-eval-list" data-eval-id="' + e.id + '">Désassigner</button></td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    container.querySelectorAll('.desassign-eval-list').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var eid = this.getAttribute('data-eval-id');
        if (eid && data.deleteEvaluation) { data.deleteEvaluation(eid); location.reload(); }
      });
    });
  }

  function renderAdminPaiementsList() {
    var container = document.getElementById('paiements-list');
    if (!container || !data) return;
    var list = data.getPaiements(100, 0);
    var statutFilter = _adminPaiementsStatut || '';
    var filtered = statutFilter ? list.filter(function (p) { return p.statut === statutFilter; }) : list;
    var totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    if (_adminPaiementsPage > totalPages) _adminPaiementsPage = totalPages;
    var start = (_adminPaiementsPage - 1) * LIST_PAGE_SIZE;
    var slice = filtered.slice(start, start + LIST_PAGE_SIZE);
    var html = '<div class="list-filters mb-3 flex flex-wrap gap-2 items-center"><label>Statut</label><select id="paiements-statut" class="input" style="max-width:150px"><option value="">Tous</option><option value="en_attente"' + (_adminPaiementsStatut === 'en_attente' ? ' selected' : '') + '>En attente</option><option value="valide"' + (_adminPaiementsStatut === 'valide' ? ' selected' : '') + '>Valide</option><option value="refuse"' + (_adminPaiementsStatut === 'refuse' ? ' selected' : '') + '>Refusé</option></select></div>';
    if (!slice.length) {
      html += '<p class="text-muted">Aucun paiement.</p>';
    } else {
      html += '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Utilisateur</th><th style="text-align: left; padding: 0.5rem;">Montant</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < slice.length; i++) {
        var p = slice[i];
        var userName = (p.user_prenom || '') + ' ' + (p.user_nom || '');
        html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(userName.trim() || p.user_email || '') + '</td><td style="padding: 0.5rem;">' + (p.montant || 0) + '</td><td style="padding: 0.5rem;">' + escapeHtml(p.statut || '') + '</td><td style="padding: 0.5rem;">';
        if (p.statut === 'en_attente') {
          html += '<button type="button" class="btn btn-sm btn-primary paiement-valider" data-id="' + p.id + '">Valider</button> <button type="button" class="btn btn-outline btn-sm paiement-refuser" data-id="' + p.id + '">Refuser</button>';
        }
        html += '</td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '<div class="list-pagination mt-2 flex items-center gap-2"><button type="button" class="btn btn-outline btn-sm" id="paiements-prev" ' + (_adminPaiementsPage <= 1 ? 'disabled' : '') + '>Précédent</button><span>Page ' + _adminPaiementsPage + ' / ' + totalPages + '</span><button type="button" class="btn btn-outline btn-sm" id="paiements-next" ' + (_adminPaiementsPage >= totalPages ? 'disabled' : '') + '>Suivant</button></div>';
    container.innerHTML = html;
    var statutEl = document.getElementById('paiements-statut');
    if (statutEl) statutEl.addEventListener('change', function () { _adminPaiementsStatut = this.value; _adminPaiementsPage = 1; renderAdminPaiementsList(); });
    var prevBtn = document.getElementById('paiements-prev');
    var nextBtn = document.getElementById('paiements-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (_adminPaiementsPage > 1) { _adminPaiementsPage--; renderAdminPaiementsList(); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (_adminPaiementsPage < totalPages) { _adminPaiementsPage++; renderAdminPaiementsList(); } });
    container.querySelectorAll('.paiement-valider').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = this.getAttribute('data-id');
        if (pid && data.updatePaiementStatut(pid, 'valide')) location.reload();
      });
    });
    container.querySelectorAll('.paiement-refuser').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = this.getAttribute('data-id');
        if (pid && data.updatePaiementStatut(pid, 'refuse')) location.reload();
      });
    });
  }

  function renderAdminVolumesList() {
    var container = document.getElementById('volumes-list');
    if (!container || !data) return;
    var volumes = data.getVolumes();
    if (!volumes.length) {
      container.innerHTML = '<p class="text-muted">Aucun volume.</p>';
      return;
    }
    var html = '';
    for (var v = 0; v < volumes.length; v++) {
      var vol = volumes[v];
      var numeros = data.getNumeros(vol.id);
      html += '<div class="card p-4 mb-3"><h2 class="font-serif text-lg font-bold mb-2">Volume ' + escapeHtml(vol.numero_volume || vol.annee || vol.id) + ' (' + escapeHtml(vol.annee || '') + ')</h2>';
      html += '<p class="text-muted text-sm mb-2">' + escapeHtml(vol.description || '') + '</p>';
      html += '<ul class="list-unstyled">';
      for (var n = 0; n < numeros.length; n++) {
        html += '<li><a href="numero-detail.html?id=' + encodeURIComponent(numeros[n].id) + '">' + escapeHtml(numeros[n].titre || 'Numéro ' + numeros[n].numero) + '</a></li>';
      }
      html += '</ul><a href="volume-detail.html?id=' + encodeURIComponent(vol.id) + '">Détail volume</a></div>';
    }
    container.innerHTML = html;
  }

  function renderAdminVolumeDetail() {
    var content = document.getElementById('volume-detail-content');
    var h1 = content && content.closest('main').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    if (!id) { content.textContent = 'Identifiant manquant.'; return; }
    var vol = data.getVolumeById(id);
    if (!vol) { content.textContent = 'Volume non trouvé.'; return; }
    if (h1) h1.textContent = 'Volume ' + (vol.numero_volume || vol.annee || vol.id);
    var numeros = data.getNumeros(vol.id);
    var listHtml = '';
    for (var i = 0; i < numeros.length; i++) {
      listHtml += '<li><a href="numero-detail.html?id=' + encodeURIComponent(numeros[i].id) + '">' + escapeHtml(numeros[i].titre || 'Numéro ' + numeros[i].numero) + '</a></li>';
    }
    content.innerHTML = '<p><strong>Année :</strong> ' + escapeHtml(vol.annee || '') + '</p><p><strong>Description :</strong> ' + escapeHtml(vol.description || '') + '</p><h3>Numéros</h3><ul class="list-unstyled">' + listHtml + '</ul>';
  }

  function renderAdminNumeroDetail() {
    var content = document.getElementById('numero-detail-content');
    var h1 = content && content.closest('main').querySelector('h1');
    if (!content || !data) return;
    var id = getQueryParam('id');
    if (!id) { content.textContent = 'Identifiant manquant.'; return; }
    var num = data.getNumeroById(id);
    if (!num) { content.textContent = 'Numéro non trouvé.'; return; }
    if (h1) h1.textContent = num.titre || 'Numéro ' + (num.numero || '');
    var articles = data.getArticlesByIssueId(id);
    var listHtml = '';
    for (var i = 0; i < articles.length; i++) {
      listHtml += '<li><a href="article-detail.html?id=' + encodeURIComponent(articles[i].id) + '">' + escapeHtml(articles[i].titre) + '</a></li>';
    }
    content.innerHTML = '<p><strong>Volume :</strong> ' + (num.volume_id || '') + '</p><p><strong>Date publication :</strong> ' + escapeHtml(num.date_publication || '') + '</p><h3>Articles</h3><ul class="list-unstyled">' + listHtml + '</ul>';
  }

  function renderAdminParametresForm() {
    var form = document.getElementById('parametres-form');
    if (!form || !data) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('parametres-message') || (function () { var m = document.createElement('p'); m.id = 'parametres-message'; form.appendChild(m); return m; })();
      msg.textContent = 'Paramètres enregistrés (démo).';
      msg.style.color = 'var(--primary)';
    });
    var resetBtn = document.getElementById('reset-demo-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var confirmMsg = 'Toutes les données de la démo (articles, utilisateurs, notifications, etc.) seront remises à l\'état initial. La page sera rechargée. Continuer ?';
        if (window.RevueDemo && window.RevueDemo.showConfirmModal) {
          window.RevueDemo.showConfirmModal(confirmMsg, function () {
            if (data.resetDemo) data.resetDemo();
            location.reload();
          });
        } else if (typeof data.resetDemo === 'function' && confirm(confirmMsg)) {
          data.resetDemo();
          location.reload();
        }
      });
    }
  }

  function renderAdminComiteList() {
    var container = document.getElementById('comite-list');
    if (!container || !data) return;
    var list = data.getComiteEditorial();
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucun membre.</p>';
      return;
    }
    var html = '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Nom</th><th style="text-align: left; padding: 0.5rem;">Titre</th><th style="text-align: left; padding: 0.5rem;">Actif</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var name = (c.prenom || '') + ' ' + (c.nom || '');
      html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(name) + '</td><td style="padding: 0.5rem;">' + escapeHtml(c.titre_affiche || '') + '</td><td style="padding: 0.5rem;">' + (c.actif ? 'Oui' : 'Non') + '</td><td style="padding: 0.5rem;"><button type="button" class="btn btn-outline btn-sm comite-delete" data-id="' + c.id + '">Supprimer</button></td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    container.querySelectorAll('.comite-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cid = this.getAttribute('data-id');
        if (!cid) return;
        showConfirmModal('Supprimer ce membre du comité ?', function () {
          if (data.deleteComiteMember(cid)) {
            showFlash('Membre supprimé (démo).', 'success');
            location.reload();
          }
        });
      });
    });
  }

  function renderAdminNotificationsList() {
    var container = document.getElementById('notifications-list');
    if (!container || !data) return;
    var auth = window.RevueDemo && window.RevueDemo.auth;
    var user = auth && auth.getSessionUser ? auth.getSessionUser() : null;
    var adminId = user && user.id ? user.id : 1;
    var list = data.getNotifications(adminId);
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucune notification.</p>';
      return;
    }
    var html = '<p><button type="button" id="notif-mark-all-read" class="btn btn-outline btn-sm mb-3">Marquer tout comme lu</button></p><ul class="list-unstyled">';
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var link = n.lien ? '<a href="../' + n.lien + '">Lire et aller vers →</a>' : '';
      html += '<li class="card p-3 mb-2' + (n.lu ? ' text-muted' : '') + '"><strong>' + escapeHtml(n.titre || '') + '</strong><p class="mb-0 text-sm">' + escapeHtml(n.message || '') + '</p>' + (n.lien ? ' <a href="../' + n.lien + '">Lire et aller vers →</a>' : '') + '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
    var markAll = document.getElementById('notif-mark-all-read');
    if (markAll && data.markAllNotificationsRead) {
      markAll.addEventListener('click', function () {
        data.markAllNotificationsRead(adminId);
        location.reload();
      });
    }
  }

  /** --- Phase 8 : Dashboard Auteur --- */
  function getAuthorUser() {
    var auth = window.RevueDemo && window.RevueDemo.auth;
    return auth && auth.getSessionUser ? auth.getSessionUser() : null;
  }

  function renderAuthorDashboard() {
    var container = document.getElementById('author-dashboard-summary');
    if (!container || !data) return;
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    var articles = data.getArticlesByAuthorId ? data.getArticlesByAuthorId(authorId) : [];
    var byStatut = {};
    for (var i = 0; i < articles.length; i++) {
      var s = articles[i].statut || 'brouillon';
      byStatut[s] = (byStatut[s] || 0) + 1;
    }
    var paiements = data.getPaiementsByUserId ? data.getPaiementsByUserId(authorId, 5) : [];
    var notifs = data.getNotifications ? data.getNotifications(authorId) : [];
    var unread = (notifs || []).filter(function (n) { return !n.lu; }).length;
    var html = '';
    html += '<a href="articles.html" class="card p-4 block"><strong>Mes articles</strong><p class="text-2xl mb-0">' + articles.length + '</p><span class="text-sm text-muted">brouillons: ' + (byStatut.brouillon || 0) + ', en révision: ' + (byStatut.en_revision || 0) + '</span></a>';
    html += '<a href="soumettre.html" class="card p-4 block"><strong>Soumettre un article</strong><p class="text-sm text-muted mb-0">Déposer un nouveau manuscrit</p></a>';
    html += '<a href="abonnement.html" class="card p-4 block"><strong>Abonnement</strong><p class="text-2xl mb-0">' + paiements.length + '</p><span class="text-sm text-muted">paiements</span></a>';
    html += '<a href="notifications.html" class="card p-4 block"><strong>Notifications</strong><p class="text-2xl mb-0">' + unread + '</p><span class="text-sm text-muted">non lues</span></a>';
    container.innerHTML = html;
  }

  function renderAuthorArticlesList() {
    var container = document.getElementById('author-articles-list');
    if (!container || !data) return;
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    var articles = data.getArticlesByAuthorId ? data.getArticlesByAuthorId(authorId) : [];
    if (!articles.length) {
      container.innerHTML = '<p class="text-muted">Aucun article. <a href="soumettre.html">Soumettre un article</a>.</p>';
      return;
    }
    var html = '<table class="card" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:0.5rem">Titre</th><th style="text-align:left;padding:0.5rem">Statut</th><th style="text-align:left;padding:0.5rem">Date</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      html += '<tr><td style="padding:0.5rem">' + escapeHtml(a.titre || '') + '</td><td style="padding:0.5rem"><span class="badge">' + escapeHtml(a.statut || '') + '</span></td><td style="padding:0.5rem">' + escapeHtml(a.date_soumission || '') + '</td><td style="padding:0.5rem"><a href="article-detail.html?id=' + a.id + '">Détail</a> | <a href="article-edit.html?id=' + a.id + '">Modifier</a> | <a href="article-revisions.html?id=' + a.id + '">Révisions</a></td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function renderAuthorArticleDetail() {
    var container = document.getElementById('author-article-detail');
    if (!container || !data) return;
    var id = getQueryParam('id');
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    if (!id) {
      container.innerHTML = '<p>Identifiant manquant. <a href="articles.html">← Retour à mes articles</a></p>';
      return;
    }
    var article = data.getArticleById(id);
    if (!article || article.auteur_id !== authorId) {
      container.innerHTML = '<p>Article non trouvé ou accès refusé. <a href="articles.html">← Retour à mes articles</a></p>';
      return;
    }
    var canSubmit = article.statut === 'brouillon';
    var canEdit = article.statut === 'brouillon' || article.statut === 'refuse';
    var html = '<p><strong>Titre :</strong> ' + escapeHtml(article.titre || '') + '</p>';
    html += '<p><strong>Statut :</strong> <span class="badge">' + escapeHtml(article.statut || '') + '</span></p>';
    html += '<p><strong>Date de soumission :</strong> ' + escapeHtml(article.date_soumission || '') + '</p>';
    html += '<p><strong>Résumé :</strong></p><div class="prose">' + escapeHtml(article.contenu || '') + '</div>';
    html += '<p class="mt-3">';
    if (canSubmit) html += '<a href="article-edit.html?id=' + article.id + '" class="btn btn-primary btn-sm">Modifier</a> ';
    if (canSubmit) html += '<button type="button" id="btn-submit-article" class="btn btn-primary btn-sm" data-id="' + article.id + '">Soumettre</button> ';
    if (canEdit) html += '<a href="article-edit.html?id=' + article.id + '" class="btn btn-outline btn-sm">Modifier</a> ';
    html += '<a href="article-revisions.html?id=' + article.id + '" class="btn btn-outline btn-sm">Voir les révisions</a>';
    html += '</p>';
    container.innerHTML = html;
    var btnSubmit = document.getElementById('btn-submit-article');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function () {
        var aid = this.getAttribute('data-id');
        if (aid && data.updateArticle(aid, { statut: 'soumis' })) {
          container.insertAdjacentHTML('afterbegin', '<p class="text-primary">Article soumis (démo).</p>');
          btnSubmit.disabled = true;
        }
      });
    }
  }

  function renderAuthorArticleEdit() {
    var form = document.getElementById('article-edit-form');
    if (!form || !data) return;
    var id = getQueryParam('id');
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    var msgEl = document.getElementById('article-edit-message');
    if (!id) {
      if (msgEl) msgEl.textContent = 'Identifiant manquant.';
      return;
    }
    var article = data.getArticleById(id);
    if (!article || article.auteur_id !== authorId) {
      if (msgEl) msgEl.textContent = 'Article non trouvé ou accès refusé.';
      return;
    }
    var titreInput = form.querySelector('input[name="titre"]');
    var resumeInput = form.querySelector('textarea[name="resume"]');
    if (titreInput) titreInput.value = article.titre || '';
    if (resumeInput) resumeInput.value = article.contenu || '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var titre = titreInput ? titreInput.value : '';
      var contenu = resumeInput ? resumeInput.value : '';
      if (data.updateArticle(id, { titre: titre, contenu: contenu })) {
        if (msgEl) { msgEl.textContent = 'Enregistré (démo).'; msgEl.style.color = 'var(--primary)'; }
      }
    });
  }

  function bindSoumettreForm() {
    var form = document.getElementById('soumettre-form');
    if (!form || !data) return;
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    if (!authorId) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var titre = (form.querySelector('input[name="titre"]') || {}).value;
      var resume = (form.querySelector('textarea[name="resume"]') || {}).value;
      var id = data.addArticle(titre || 'Sans titre', resume || '', authorId);
      data.saveState && data.saveState();
      location.href = 'articles.html';
    });
  }

  function renderAuthorAbonnement() {
    var container = document.getElementById('abonnement-content');
    if (!container || !data) return;
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    var paiements = data.getPaiementsByUserId ? data.getPaiementsByUserId(authorId, 50) : [];
    if (!paiements.length) {
      container.innerHTML = '<p class="text-muted">Aucun paiement. <a href="s-abonner.html">S\'abonner</a>.</p>';
      return;
    }
    var html = '<table class="card" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:0.5rem">Date</th><th style="text-align:left;padding:0.5rem">Montant</th><th style="text-align:left;padding:0.5rem">Statut</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < paiements.length; i++) {
      var p = paiements[i];
      var dateStr = p.date_paiement || '—';
      html += '<tr><td style="padding:0.5rem">' + escapeHtml(dateStr) + '</td><td style="padding:0.5rem">' + (p.montant || 0) + '</td><td style="padding:0.5rem"><span class="badge">' + escapeHtml(p.statut || '') + '</span></td><td style="padding:0.5rem"><button type="button" class="btn btn-outline btn-sm voir-recu" data-id="' + p.id + '">Voir reçu (démo)</button></td></tr>';
    }
    html += '</tbody></table><p class="mt-2"><a href="s-abonner.html">S\'abonner</a></p>';
    container.innerHTML = html;
    container.querySelectorAll('.voir-recu').forEach(function (btn) {
      btn.addEventListener('click', function () { alert('Démo : reçu non disponible.'); });
    });
  }

  function bindSAbonnerForm() {
    var form = document.getElementById('s-abonner-form');
    if (!form || !data) return;
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    var msgEl = document.getElementById('s-abonner-message');
    if (!authorId) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var montant = parseInt((form.querySelector('input[name="montant"]') || {}).value, 10) || 25000;
      var moyen = (form.querySelector('select[name="moyen"]') || {}).value || 'orange_money';
      data.addPaiement(authorId, montant, moyen);
      data.saveState && data.saveState();
      if (msgEl) { msgEl.textContent = 'Abonnement enregistré (démo). En attente de validation. <a href="abonnement.html">Voir mon abonnement</a>'; msgEl.style.color = 'var(--primary)'; }
    });
  }

  function renderAuthorProfil() {
    var form = document.getElementById('author-profil-form');
    if (!form || !data) return;
    var user = getAuthorUser();
    if (!user || !user.id) return;
    var u = data.getUserById(user.id);
    if (!u) return;
    var nomInput = form.querySelector('input[name="nom"]');
    var prenomInput = form.querySelector('input[name="prenom"]');
    var emailInput = form.querySelector('input[name="email"]');
    if (nomInput) nomInput.value = u.nom || '';
    if (prenomInput) prenomInput.value = u.prenom || '';
    if (emailInput) emailInput.value = u.email || '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = nomInput ? nomInput.value : '';
      var prenom = prenomInput ? prenomInput.value : '';
      var email = emailInput ? emailInput.value : '';
      if (data.updateUser(user.id, { nom: nom, prenom: prenom, email: email })) {
        data.saveState && data.saveState();
        if (window.RevueDemo && window.RevueDemo.auth && window.RevueDemo.auth.setSessionUser) {
          window.RevueDemo.auth.setSessionUser({ id: user.id, email: email, name: (prenom + ' ' + nom).trim() || email, role: user.role });
        }
        var msg = document.createElement('p');
        msg.textContent = 'Profil enregistré (démo).';
        msg.style.color = 'var(--primary)';
        form.appendChild(msg);
      }
    });
  }

  function renderAuthorNotifications() {
    var container = document.getElementById('author-notifications-list');
    if (!container || !data) return;
    var user = getAuthorUser();
    var userId = user && user.id ? user.id : 0;
    var list = data.getNotifications ? data.getNotifications(userId) : [];
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucune notification.</p>';
      return;
    }
    var html = '<p><button type="button" id="author-notif-mark-all" class="btn btn-outline btn-sm mb-3">Marquer tout comme lu</button></p><ul class="list-unstyled">';
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var link = n.lien ? ' <a href="' + n.lien + '">Lire et aller vers →</a>' : '';
      html += '<li class="card p-3 mb-2' + (n.lu ? ' text-muted' : '') + '"><strong>' + escapeHtml(n.titre || '') + '</strong><p class="mb-0 text-sm">' + escapeHtml(n.message || '') + '</p>' + link + '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
    var markAll = document.getElementById('author-notif-mark-all');
    if (markAll && data.markAllNotificationsRead) {
      markAll.addEventListener('click', function () {
        data.markAllNotificationsRead(userId);
        location.reload();
      });
    }
  }

  function renderAuthorRevisions() {
    var container = document.getElementById('revisions-list');
    if (!container || !data) return;
    var id = getQueryParam('id');
    var user = getAuthorUser();
    var authorId = user && user.id ? user.id : 0;
    if (!id) {
      container.innerHTML = '<p>Identifiant manquant. <a href="articles.html">← Retour à mes articles</a></p>';
      return;
    }
    var article = data.getArticleById(id);
    if (!article || article.auteur_id !== authorId) {
      container.innerHTML = '<p>Article non trouvé ou accès refusé. <a href="articles.html">← Retour à mes articles</a></p>';
      return;
    }
    var revisions = data.getRevisionsByArticleId ? data.getRevisionsByArticleId(id) : [];
    if (!revisions.length) {
      container.innerHTML = '<p class="text-muted">Aucune révision pour cet article.</p><a href="articles.html">← Retour à mes articles</a>';
      return;
    }
    var html = '<p><strong>Article :</strong> ' + escapeHtml(article.titre || '') + '</p><table class="card" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:0.5rem">Version</th><th style="text-align:left;padding:0.5rem">Date</th><th style="text-align:left;padding:0.5rem">Commentaire</th><th style="text-align:left;padding:0.5rem">Statut</th></tr></thead><tbody>';
    for (var i = 0; i < revisions.length; i++) {
      var r = revisions[i];
      var statut = (r.statut_avant ? r.statut_avant + ' → ' : '') + (r.statut_apres || '');
      html += '<tr><td style="padding:0.5rem">' + (r.version || '') + '</td><td style="padding:0.5rem">' + escapeHtml(r.date || '') + '</td><td style="padding:0.5rem">' + escapeHtml(r.comment || '') + '</td><td style="padding:0.5rem">' + escapeHtml(statut) + '</td></tr>';
    }
    html += '</tbody></table><p><a href="articles.html">← Retour à mes articles</a></p>';
    container.innerHTML = html;
  }

  /** --- Phase 9 : Dashboard Évaluateur --- */
  function getReviewerUser() {
    var auth = window.RevueDemo && window.RevueDemo.auth;
    return auth && auth.getSessionUser ? auth.getSessionUser() : null;
  }

  function renderReviewerDashboard() {
    var container = document.getElementById('reviewer-dashboard-summary');
    if (!container || !data) return;
    var user = getReviewerUser();
    var reviewerId = user && user.id ? user.id : 0;
    var enAttente = data.getEvaluations ? data.getEvaluations(reviewerId, 'en_attente') : [];
    var terminees = data.getEvaluations ? data.getEvaluations(reviewerId, 'soumis') : [];
    var notifs = data.getNotifications ? data.getNotifications(reviewerId) : [];
    var unread = (notifs || []).filter(function (n) { return !n.lu; }).length;
    var html = '';
    var evalHref = enAttente.length > 0 ? 'evaluation.html?id=' + enAttente[0].id : 'evaluation.html';
    html += '<a href="' + evalHref + '" class="card p-4 block"><strong>Évaluations à faire</strong><p class="text-2xl mb-0">' + enAttente.length + '</p><span class="text-sm text-muted">en attente</span></a>';
    html += '<a href="terminees.html" class="card p-4 block"><strong>Évaluations terminées</strong><p class="text-2xl mb-0">' + terminees.length + '</p></a>';
    html += '<a href="notifications.html" class="card p-4 block"><strong>Notifications</strong><p class="text-2xl mb-0">' + unread + '</p><span class="text-sm text-muted">non lues</span></a>';
    html += '<a href="historique.html" class="card p-4 block"><strong>Historique</strong><p class="text-sm text-muted mb-0">Voir l’historique des actions</p></a>';
    container.innerHTML = html;
  }

  function renderReviewerEvaluationPage() {
    var content = document.getElementById('reviewer-evaluation-content');
    var form = document.getElementById('reviewer-evaluation-form');
    var msgEl = document.getElementById('reviewer-evaluation-message');
    if (!content || !data) return;
    var id = getQueryParam('id');
    var user = getReviewerUser();
    var reviewerId = user && user.id ? user.id : 0;
    if (!id) {
      var enAttente = data.getEvaluations ? data.getEvaluations(reviewerId, 'en_attente') : [];
      if (enAttente.length === 0) {
        content.innerHTML = '<p class="text-muted">Aucune évaluation en attente. <a href="index.html">Retour au tableau de bord</a>.</p>';
        return;
      }
      content.innerHTML = '<p>Choisir une évaluation :</p><ul class="list-unstyled">';
      for (var i = 0; i < enAttente.length; i++) {
        var e = enAttente[i];
        content.innerHTML += '<li><a href="evaluation.html?id=' + e.id + '">' + escapeHtml(e.article_titre || 'Article #' + e.article_id) + '</a> (assignée le ' + escapeHtml(e.date_assignation || '') + ')</li>';
      }
      content.innerHTML += '</ul>';
      return;
    }
    var evalObj = data.getEvaluationById ? data.getEvaluationById(id) : null;
    if (!evalObj || evalObj.evaluateur_id !== reviewerId) {
      content.innerHTML = '<p>Évaluation non trouvée ou accès refusé. <a href="index.html">Retour au tableau de bord</a>.</p>';
      return;
    }
    var article = data.getArticleById ? data.getArticleById(evalObj.article_id) : null;
    content.innerHTML = '<p><strong>Article :</strong> ' + escapeHtml(evalObj.article_titre || '') + '</p><p class="text-sm text-muted">Résumé : ' + escapeHtml((article && article.contenu) ? article.contenu.slice(0, 200) + '…' : '') + '</p>';
    if (evalObj.statut === 'soumis') {
      content.innerHTML += '<p class="text-primary">Cette évaluation a déjà été soumise (recommandation : ' + escapeHtml(evalObj.recommendation || '—') + ', note : ' + (evalObj.note_finale != null ? evalObj.note_finale : '—') + ').</p>';
      if (form) form.style.display = 'none';
      return;
    }
    if (form) {
      form.style.display = 'block';
      var recSel = form.querySelector('select[name="recommendation"]');
      var commTa = form.querySelector('textarea[name="commentaires_public"]');
      var noteIn = form.querySelector('input[name="note_finale"]');
      if (recSel && evalObj.recommendation) recSel.value = evalObj.recommendation;
      if (commTa && evalObj.commentaires_public) commTa.value = evalObj.commentaires_public;
      if (noteIn && evalObj.note_finale != null) noteIn.value = evalObj.note_finale;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var recommendation = recSel ? recSel.value : '';
        var commentaires_public = commTa ? commTa.value : '';
        var note_finale = noteIn && noteIn.value !== '' ? parseFloat(noteIn.value, 10) : null;
        if (data.updateEvaluation(id, { recommendation: recommendation || null, commentaires_public: commentaires_public || null, note_finale: note_finale, statut: 'soumis' })) {
          data.saveState && data.saveState();
          if (msgEl) { msgEl.textContent = 'Évaluation enregistrée (démo).'; msgEl.style.color = 'var(--primary)'; }
          if (form) form.style.display = 'none';
          content.insertAdjacentHTML('beforeend', '<p class="text-primary">Évaluation enregistrée.</p>');
        }
      });
    }
  }

  function renderReviewerTerminees() {
    var container = document.getElementById('reviewer-terminees-list');
    if (!container || !data) return;
    var user = getReviewerUser();
    var reviewerId = user && user.id ? user.id : 0;
    var list = data.getEvaluations ? data.getEvaluations(reviewerId, 'soumis') : [];
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucune évaluation terminée.</p>';
      return;
    }
    var html = '<table class="card" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:0.5rem">Article</th><th style="text-align:left;padding:0.5rem">Recommandation</th><th style="text-align:left;padding:0.5rem">Note</th><th style="text-align:left;padding:0.5rem">Date</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      html += '<tr><td style="padding:0.5rem">' + escapeHtml(e.article_titre || '') + '</td><td style="padding:0.5rem">' + escapeHtml(e.recommendation || '—') + '</td><td style="padding:0.5rem">' + (e.note_finale != null ? e.note_finale : '—') + '</td><td style="padding:0.5rem">' + escapeHtml(e.date_soumission || '') + '</td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function renderReviewerHistorique() {
    var container = document.getElementById('reviewer-historique-list');
    if (!container || !data) return;
    var user = getReviewerUser();
    var userId = user && user.id ? user.id : 0;
    var list = data.getReviewerHistorique ? data.getReviewerHistorique(userId) : [];
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucun historique.</p>';
      return;
    }
    var html = '<ul class="list-unstyled">';
    for (var i = 0; i < list.length; i++) {
      var h = list[i];
      html += '<li class="card p-3 mb-2"><span class="text-sm text-muted">' + escapeHtml(h.date || '') + '</span> — ' + escapeHtml(h.libelle || '') + '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  function renderReviewerProfil() {
    var form = document.getElementById('reviewer-profil-form');
    if (!form || !data) return;
    var user = getReviewerUser();
    if (!user || !user.id) return;
    var u = data.getUserById(user.id);
    if (!u) return;
    var nomInput = form.querySelector('input[name="nom"]');
    var prenomInput = form.querySelector('input[name="prenom"]');
    var emailInput = form.querySelector('input[name="email"]');
    if (nomInput) nomInput.value = u.nom || '';
    if (prenomInput) prenomInput.value = u.prenom || '';
    if (emailInput) emailInput.value = u.email || '';
    var msgEl = document.getElementById('reviewer-profil-message');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = nomInput ? nomInput.value : '';
      var prenom = prenomInput ? prenomInput.value : '';
      var email = emailInput ? emailInput.value : '';
      if (data.updateUser(user.id, { nom: nom, prenom: prenom, email: email })) {
        data.saveState && data.saveState();
        if (window.RevueDemo && window.RevueDemo.auth && window.RevueDemo.auth.setSessionUser) {
          window.RevueDemo.auth.setSessionUser({ id: user.id, email: email, name: (prenom + ' ' + nom).trim() || email, role: user.role });
        }
        if (msgEl) { msgEl.textContent = 'Profil enregistré (démo).'; msgEl.style.color = 'var(--primary)'; }
      }
    });
  }

  function renderReviewerNotifications() {
    var container = document.getElementById('reviewer-notifications-list');
    if (!container || !data) return;
    var user = getReviewerUser();
    var userId = user && user.id ? user.id : 0;
    var list = data.getNotifications ? data.getNotifications(userId) : [];
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucune notification.</p>';
      return;
    }
    var html = '<p><button type="button" id="reviewer-notif-mark-all" class="btn btn-outline btn-sm mb-3">Marquer tout comme lu</button></p><ul class="list-unstyled">';
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var href = (n.lien || '').indexOf('reviewer/') === 0 ? (n.lien || '').replace('reviewer/', '') : (n.lien || '');
      var link = href ? ' <a href="' + href + '">Lire et aller vers →</a>' : '';
      html += '<li class="card p-3 mb-2' + (n.lu ? ' text-muted' : '') + '"><strong>' + escapeHtml(n.titre || '') + '</strong><p class="mb-0 text-sm">' + escapeHtml(n.message || '') + '</p>' + link + '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
    var markAll = document.getElementById('reviewer-notif-mark-all');
    if (markAll && data.markAllNotificationsRead) {
      markAll.addEventListener('click', function () {
        data.markAllNotificationsRead(userId);
        location.reload();
      });
    }
  }

  function init() {
    setDashboardSidebarActive();
    if (data) updateSidebarNotificationBadge();
    if (!data) return;
    if (document.getElementById('article-content')) {
      renderArticlePage();
      return;
    }
    if (document.getElementById('numero-content')) {
      renderNumeroPage();
      return;
    }
    if (document.getElementById('search-results')) {
      renderSearchPage();
      return;
    }
    if (document.getElementById('user-detail-content')) {
      renderUserDetailPage();
      return;
    }
    if (document.getElementById('article-detail-content')) {
      renderAdminArticleDetailPage();
      return;
    }
    if (document.getElementById('dashboard-summary')) {
      renderAdminDashboard();
      return;
    }
    if (document.getElementById('users-list')) {
      renderAdminUsersList();
      return;
    }
    if (document.getElementById('user-form')) {
      renderAdminUserForm();
      return;
    }
    if (document.getElementById('articles-list')) {
      renderAdminArticlesList();
      return;
    }
    if (document.getElementById('evaluations-list')) {
      renderAdminEvaluationsList();
      return;
    }
    if (document.getElementById('paiements-list')) {
      renderAdminPaiementsList();
      return;
    }
    if (document.getElementById('volumes-list')) {
      renderAdminVolumesList();
      return;
    }
    if (document.getElementById('volume-detail-content')) {
      renderAdminVolumeDetail();
      return;
    }
    if (document.getElementById('numero-detail-content')) {
      renderAdminNumeroDetail();
      return;
    }
    if (document.getElementById('parametres-form')) {
      renderAdminParametresForm();
      return;
    }
    if (document.getElementById('comite-list')) {
      renderAdminComiteList();
      return;
    }
    if (document.getElementById('notifications-list')) {
      renderAdminNotificationsList();
      return;
    }
    if (document.getElementById('author-dashboard-summary')) {
      renderAuthorDashboard();
      return;
    }
    if (document.getElementById('author-articles-list')) {
      renderAuthorArticlesList();
      return;
    }
    if (document.getElementById('author-article-detail')) {
      renderAuthorArticleDetail();
      return;
    }
    if (document.getElementById('article-edit-form')) {
      renderAuthorArticleEdit();
      return;
    }
    if (document.getElementById('soumettre-form')) {
      bindSoumettreForm();
      return;
    }
    if (document.getElementById('abonnement-content')) {
      renderAuthorAbonnement();
      return;
    }
    if (document.getElementById('s-abonner-form')) {
      bindSAbonnerForm();
      return;
    }
    if (document.getElementById('author-profil-form')) {
      renderAuthorProfil();
      return;
    }
    if (document.getElementById('author-notifications-list')) {
      renderAuthorNotifications();
      return;
    }
    if (document.getElementById('revisions-list')) {
      renderAuthorRevisions();
      return;
    }
    if (document.getElementById('reviewer-dashboard-summary')) {
      renderReviewerDashboard();
      return;
    }
    if (document.getElementById('reviewer-evaluation-content')) {
      renderReviewerEvaluationPage();
      return;
    }
    if (document.getElementById('reviewer-terminees-list')) {
      renderReviewerTerminees();
      return;
    }
    if (document.getElementById('reviewer-historique-list')) {
      renderReviewerHistorique();
      return;
    }
    if (document.getElementById('reviewer-profil-form')) {
      renderReviewerProfil();
      return;
    }
    if (document.getElementById('reviewer-notifications-list')) {
      renderReviewerNotifications();
      return;
    }
    if (document.getElementById('home-latest')) {
      renderHomePage();
      return;
    }
    if (document.getElementById('publications-list')) {
      renderPublicationsPage();
      return;
    }
    if (document.getElementById('archives-list')) {
      renderArchivesPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RevueDemo = window.RevueDemo || {};
  window.RevueDemo.getQueryParam = getQueryParam;
  window.RevueDemo.getBasePath = getBasePath;
  window.RevueDemo.showFlash = showFlash;
  window.RevueDemo.showConfirmModal = showConfirmModal;
})();
