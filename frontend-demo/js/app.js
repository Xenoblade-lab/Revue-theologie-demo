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
    if (!users.length) {
      container.innerHTML = '<p class="text-muted">Aucun utilisateur.</p>';
      return;
    }
    var html = '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Nom</th><th style="text-align: left; padding: 0.5rem;">Email</th><th style="text-align: left; padding: 0.5rem;">Rôle</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var name = ((u.prenom || '') + ' ' + (u.nom || '')).trim() || u.email;
      html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(name) + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.email || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.role || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(u.statut || '') + '</td><td style="padding: 0.5rem;"><a href="user-detail.html?id=' + encodeURIComponent(u.id) + '">Détail</a> | <a href="user-form.html?id=' + encodeURIComponent(u.id) + '">Modifier</a></td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
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
      if (!nom || !email) return;
      var msg = document.getElementById('user-form-message') || (function () { var m = document.createElement('p'); m.id = 'user-form-message'; form.appendChild(m); return m; })();
      if (id) {
        data.updateUser(id, { nom: nom, prenom: prenom, email: email });
        msg.textContent = 'Enregistré.';
        msg.style.color = 'var(--primary)';
      } else {
        data.addUser(nom, prenom, email, password || 'demo', role);
        msg.textContent = 'Utilisateur créé (démo).';
        msg.style.color = 'var(--primary)';
      }
    });
  }

  function renderAdminArticlesList() {
    var container = document.getElementById('articles-list');
    if (!container || !data) return;
    var articles = data.getArticles();
    if (!articles.length) {
      container.innerHTML = '<p class="text-muted">Aucun article.</p>';
      return;
    }
    var html = '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Titre</th><th style="text-align: left; padding: 0.5rem;">Auteur</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th style="text-align: left; padding: 0.5rem;">Date</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      var authorName = ((a.auteur_prenom || '') + ' ' + (a.auteur_nom || '')).trim() || '—';
      html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(a.titre || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(authorName) + '</td><td style="padding: 0.5rem;">' + escapeHtml(a.statut || '') + '</td><td style="padding: 0.5rem;">' + escapeHtml(a.date_soumission || '') + '</td><td style="padding: 0.5rem;"><a href="article-detail.html?id=' + encodeURIComponent(a.id) + '">Détail</a></td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
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
    var list = data.getPaiements(50, 0);
    if (!list.length) {
      container.innerHTML = '<p class="text-muted">Aucun paiement.</p>';
      return;
    }
    var html = '<table class="card" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left; padding: 0.5rem;">Utilisateur</th><th style="text-align: left; padding: 0.5rem;">Montant</th><th style="text-align: left; padding: 0.5rem;">Statut</th><th></th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var userName = (p.user_prenom || '') + ' ' + (p.user_nom || '');
      html += '<tr><td style="padding: 0.5rem;">' + escapeHtml(userName.trim() || p.user_email || '') + '</td><td style="padding: 0.5rem;">' + (p.montant || 0) + '</td><td style="padding: 0.5rem;">' + escapeHtml(p.statut || '') + '</td><td style="padding: 0.5rem;">';
      if (p.statut === 'en_attente') {
        html += '<button type="button" class="btn btn-sm btn-primary paiement-valider" data-id="' + p.id + '">Valider</button> <button type="button" class="btn btn-outline btn-sm paiement-refuser" data-id="' + p.id + '">Refuser</button>';
      }
      html += '</td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
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
        if (cid && data.deleteComiteMember(cid)) location.reload();
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

  function init() {
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
})();
