/**
 * Données mock et getters — Phase 3 : état initial + chargement/sauvegarde localStorage
 * Clé localStorage : revue_demo_data
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'revue_demo_data';

  /** Données par défaut (réinitialisation démo) */
  function getDefaultState() {
    return {
      nextId: { user: 10, article: 20, paiement: 10, evaluation: 10, notification: 100, volume: 5, numero: 15, comite: 10 },
      users: [
        { id: 1, nom: 'Admin', prenom: 'Revue', email: 'admin@revue.cd', password: 'demo', role: 'admin', statut: 'actif' },
        { id: 2, nom: 'Mukendi', prenom: 'Jean', email: 'auteur@revue.cd', password: 'demo', role: 'auteur', statut: 'actif' },
        { id: 3, nom: 'Ngoma', prenom: 'Marie', email: 'reviewer@revue.cd', password: 'demo', role: 'redacteur', statut: 'actif' },
        { id: 4, nom: 'Kabasele', prenom: 'Paul', email: 'auteur2@revue.cd', password: 'demo', role: 'auteur', statut: 'actif' },
        { id: 5, nom: 'Tshimanga', prenom: 'Anne', email: 'redacteur@revue.cd', password: 'demo', role: 'redacteur en chef', statut: 'actif' }
      ],
      articles: [
        { id: 1, titre: 'Théologie contextuelle en Afrique', contenu: 'Résumé de l\'article sur la théologie contextuelle...', statut: 'valide', auteur_id: 2, date_soumission: '2024-01-15', issue_id: 1, fichier_path: null },
        { id: 2, titre: 'Herméneutique biblique et tradition orale', contenu: 'Étude des liens entre herméneutique et traditions orales africaines.', statut: 'valide', auteur_id: 2, date_soumission: '2024-03-10', issue_id: 1, fichier_path: null },
        { id: 3, titre: 'Éthique chrétienne et justice sociale', contenu: 'Contribution à une éthique chrétienne en contexte congolais.', statut: 'en_revision', auteur_id: 4, date_soumission: '2024-05-01', issue_id: null, fichier_path: null },
        { id: 4, titre: 'Histoire de l\'Église au Congo', contenu: 'Résumé sur l\'histoire de l\'Église...', statut: 'brouillon', auteur_id: 2, date_soumission: '2024-06-12', issue_id: null, fichier_path: null }
      ],
      volumes: [
        { id: 1, annee: 2024, numero_volume: '12', description: 'Volume 2024', redacteur_chef: 'Dr. Paul Kabasele' },
        { id: 2, annee: 2023, numero_volume: '11', description: 'Volume 2023', redacteur_chef: null }
      ],
      numeros: [
        { id: 1, volume_id: 1, numero: '1', titre: 'Revue 2024 — n°1', description: 'Théologie et société', date_publication: '2024-06-01' },
        { id: 2, volume_id: 1, numero: '2', titre: 'Revue 2024 — n°2', description: 'Études bibliques', date_publication: null },
        { id: 3, volume_id: 2, numero: '1', titre: 'Revue 2023 — n°1', description: 'Numéro 2023', date_publication: '2023-12-01' }
      ],
      notifications: [
        { id: 'n1', user_id: 1, type: 'article_soumis', titre: 'Nouvel article soumis', message: 'Un article a été soumis pour évaluation.', lu: false, date: '2024-06-10T10:00:00', lien: 'admin/articles.html' },
        { id: 'n2', user_id: 1, type: 'paiement', titre: 'Paiement en attente', message: 'Un paiement est en attente de validation.', lu: false, date: '2024-06-09T14:30:00', lien: 'admin/paiements.html' },
        { id: 'n3', user_id: 2, type: 'evaluation', titre: 'Article en révision', message: 'Votre article est en cours d\'évaluation.', lu: true, date: '2024-06-08T09:00:00', lien: 'author/articles.html' },
        { id: 'n4', user_id: 3, type: 'evaluation_assignee', titre: 'Évaluation assignée', message: 'Un article vous a été assigné pour évaluation.', lu: false, date: '2024-06-07T11:00:00', lien: 'reviewer/evaluation.html?id=1' }
      ],
      paiements: [
        { id: 1, utilisateur_id: 2, montant: 25000, moyen: 'orange_money', statut: 'valide', date_paiement: '2024-01-20', user_nom: 'Mukendi', user_prenom: 'Jean', user_email: 'auteur@revue.cd' },
        { id: 2, utilisateur_id: 4, montant: 25000, moyen: 'mpesa', statut: 'en_attente', date_paiement: null, user_nom: 'Kabasele', user_prenom: 'Paul', user_email: 'auteur2@revue.cd' }
      ],
      evaluations: [
        { id: 1, article_id: 3, evaluateur_id: 3, statut: 'en_attente', recommendation: null, commentaires_public: null, note_finale: null, date_assignation: '2024-05-15', date_soumission: null, article_titre: 'Éthique chrétienne et justice sociale' },
        { id: 2, article_id: 1, evaluateur_id: 3, statut: 'soumis', recommendation: 'accepte', commentaires_public: 'Article solide.', note_finale: 8, date_assignation: '2024-01-20', date_soumission: '2024-02-01', article_titre: 'Théologie contextuelle en Afrique' }
      ],
      comite_editorial: [
        { id: 1, user_id: 3, ordre: 1, titre_affiche: 'Rédacteur', actif: true, nom: 'Ngoma', prenom: 'Marie', email: 'reviewer@revue.cd', role: 'redacteur' },
        { id: 2, user_id: 5, ordre: 2, titre_affiche: 'Rédacteur en chef', actif: true, nom: 'Tshimanga', prenom: 'Anne', email: 'redacteur@revue.cd', role: 'redacteur en chef' }
      ]
    };
  }

  /** État en mémoire (chargé depuis localStorage ou défaut) */
  var state = null;

  function loadState() {
    try {
      var raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        return;
      }
    } catch (e) { /* ignore */ }
    state = getDefaultState();
  }

  function saveState() {
    try {
      if (typeof localStorage !== 'undefined' && state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) { /* ignore */ }
  }

  function nextId(key) {
    var n = state.nextId[key] || 1;
    state.nextId[key] = n + 1;
    return n;
  }

  // --- Getters ---

  function getUsers() {
    if (!state) loadState();
    return state.users.slice();
  }

  function getUserById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    return state.users.find(function (u) { return u.id === id; }) || null;
  }

  function getUserByEmail(email) {
    if (!state) loadState();
    return state.users.find(function (u) { return (u.email || '').toLowerCase() === (email || '').toLowerCase(); }) || null;
  }

  function getArticles() {
    if (!state) loadState();
    return state.articles.slice();
  }

  function getArticleById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var art = state.articles.find(function (a) { return a.id === id; });
    if (!art) return null;
    var auteur = getUserById(art.auteur_id);
    return Object.assign({}, art, {
      auteur_nom: auteur ? auteur.nom : '',
      auteur_prenom: auteur ? auteur.prenom : '',
      auteur_email: auteur ? auteur.email : ''
    });
  }

  /** Articles publiés (statut valide) */
  function getPublishedArticles(limit, offset) {
    if (!state) loadState();
    var list = state.articles.filter(function (a) { return a.statut === 'valide'; });
    list.sort(function (a, b) { return (b.date_soumission || '').localeCompare(a.date_soumission || ''); });
    offset = offset || 0;
    limit = limit || 50;
    return list.slice(offset, offset + limit).map(function (a) {
      var author = getUserById(a.auteur_id);
      return {
        id: a.id,
        titre: a.titre,
        contenu: a.contenu,
        statut: a.statut,
        date_soumission: a.date_soumission,
        issue_id: a.issue_id,
        auteur_nom: author ? author.nom : '',
        auteur_prenom: author ? author.prenom : ''
      };
    });
  }

  function getArticlesByAuthorId(authorId, limit, offset) {
    if (!state) loadState();
    authorId = parseInt(authorId, 10);
    var list = state.articles.filter(function (a) { return a.auteur_id === authorId; });
    list.sort(function (a, b) { return (b.date_soumission || '').localeCompare(a.date_soumission || ''); });
    offset = offset || 0;
    limit = limit || 50;
    return list.slice(offset, offset + limit);
  }

  function getArticlesByIssueId(issueId) {
    if (!state) loadState();
    issueId = parseInt(issueId, 10);
    return state.articles.filter(function (a) { return a.statut === 'valide' && a.issue_id === issueId; }).map(function (a) {
      var author = getUserById(a.auteur_id);
      return Object.assign({}, a, { auteur_nom: author ? author.nom : '', auteur_prenom: author ? author.prenom : '' });
    });
  }

  function getVolumes() {
    if (!state) loadState();
    return state.volumes.slice();
  }

  function getVolumeById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    return state.volumes.find(function (v) { return v.id === id; }) || null;
  }

  function getNumeros(volumeId) {
    if (!state) loadState();
    var list = state.numeros.slice();
    if (volumeId != null) {
      volumeId = parseInt(volumeId, 10);
      list = list.filter(function (n) { return n.volume_id === volumeId; });
    }
    list.sort(function (a, b) { return (b.date_publication || '').localeCompare(a.date_publication || ''); });
    return list;
  }

  function getNumeroById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    return state.numeros.find(function (n) { return n.id === id; }) || null;
  }

  function getNotifications(userId) {
    if (!state) loadState();
    userId = parseInt(userId, 10);
    return state.notifications.filter(function (n) { return n.user_id === userId; }).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }

  function getUnreadNotificationCount(userId) {
    if (!state) loadState();
    userId = parseInt(userId, 10);
    return state.notifications.filter(function (n) { return n.user_id === userId && !n.lu; }).length;
  }

  function getPaiements(limit, offset) {
    if (!state) loadState();
    var list = state.paiements.slice();
    list.sort(function (a, b) { return (b.date_paiement || b.id) - (a.date_paiement || a.id); });
    offset = offset || 0;
    limit = limit || 50;
    return list.slice(offset, offset + limit);
  }

  function getPaiementsByUserId(userId, limit) {
    if (!state) loadState();
    userId = parseInt(userId, 10);
    var list = state.paiements.filter(function (p) { return p.utilisateur_id === userId; }).slice();
    list.sort(function (a, b) { return (b.date_paiement || b.id) - (a.date_paiement || a.id); });
    return list.slice(0, limit || 20);
  }

  function getPaiementById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var p = state.paiements.find(function (x) { return x.id === id; });
    if (!p) return null;
    var u = getUserById(p.utilisateur_id);
    return Object.assign({}, p, {
      user_nom: u ? u.nom : p.user_nom,
      user_prenom: u ? u.prenom : p.user_prenom,
      user_email: u ? u.email : p.user_email
    });
  }

  function getEvaluations(evaluateurId, statut) {
    if (!state) loadState();
    var list = state.evaluations.slice();
    if (evaluateurId != null) {
      evaluateurId = parseInt(evaluateurId, 10);
      list = list.filter(function (e) { return e.evaluateur_id === evaluateurId; });
    }
    if (statut != null) list = list.filter(function (e) { return e.statut === statut; });
    list.sort(function (a, b) { return (b.date_assignation || '').localeCompare(a.date_assignation || ''); });
    return list;
  }

  function getEvaluationById(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var e = state.evaluations.find(function (x) { return x.id === id; });
    if (!e) return null;
    var art = getArticleById(e.article_id);
    return Object.assign({}, e, { article_titre: art ? art.titre : e.article_titre, article_contenu: art ? art.contenu : null });
  }

  function getEvaluationsByArticleId(articleId) {
    if (!state) loadState();
    articleId = parseInt(articleId, 10);
    return state.evaluations.filter(function (e) { return e.article_id === articleId; }).slice();
  }

  function getComiteEditorial() {
    if (!state) loadState();
    return state.comite_editorial.slice().sort(function (a, b) { return (a.ordre || 0) - (b.ordre || 0); });
  }

  // --- Mutators (modifient state puis saveState) ---

  function markNotificationRead(notificationId, userId) {
    if (!state) loadState();
    userId = parseInt(userId, 10);
    var n = state.notifications.find(function (x) { return x.id === notificationId && x.user_id === userId; });
    if (n) { n.lu = true; saveState(); return true; }
    return false;
  }

  function markAllNotificationsRead(userId) {
    if (!state) loadState();
    userId = parseInt(userId, 10);
    state.notifications.forEach(function (n) { if (n.user_id === userId) n.lu = true; });
    saveState();
    return true;
  }

  function addArticle(titre, contenu, auteurId) {
    if (!state) loadState();
    var id = nextId('article');
    state.articles.push({
      id: id,
      titre: titre || 'Sans titre',
      contenu: contenu || '',
      statut: 'brouillon',
      auteur_id: parseInt(auteurId, 10),
      date_soumission: new Date().toISOString().slice(0, 10),
      issue_id: null,
      fichier_path: null
    });
    saveState();
    return id;
  }

  function updateArticle(id, data) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var a = state.articles.find(function (x) { return x.id === id; });
    if (!a) return false;
    if (data.titre !== undefined) a.titre = data.titre;
    if (data.contenu !== undefined) a.contenu = data.contenu;
    if (data.statut !== undefined) a.statut = data.statut;
    if (data.issue_id !== undefined) a.issue_id = data.issue_id === '' ? null : parseInt(data.issue_id, 10);
    saveState();
    return true;
  }

  function addUser(nom, prenom, email, password, role) {
    if (!state) loadState();
    var id = nextId('user');
    state.users.push({
      id: id,
      nom: nom || '',
      prenom: prenom || '',
      email: email || '',
      password: password || 'demo',
      role: role || 'auteur',
      statut: 'actif'
    });
    saveState();
    return id;
  }

  function updateUser(id, data) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var u = state.users.find(function (x) { return x.id === id; });
    if (!u) return false;
    if (data.nom !== undefined) u.nom = data.nom;
    if (data.prenom !== undefined) u.prenom = data.prenom;
    if (data.email !== undefined) u.email = data.email;
    saveState();
    return true;
  }

  function deleteUser(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var i = state.users.findIndex(function (x) { return x.id === id; });
    if (i === -1) return false;
    state.users.splice(i, 1);
    saveState();
    return true;
  }

  function updatePaiementStatut(id, statut) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var p = state.paiements.find(function (x) { return x.id === id; });
    if (!p) return false;
    p.statut = statut;
    if (statut === 'valide') p.date_paiement = new Date().toISOString().slice(0, 10);
    saveState();
    return true;
  }

  function addPaiement(utilisateurId, montant, moyen) {
    if (!state) loadState();
    var id = nextId('paiement');
    var u = getUserById(utilisateurId);
    state.paiements.push({
      id: id,
      utilisateur_id: parseInt(utilisateurId, 10),
      montant: montant || 25000,
      moyen: moyen || 'orange_money',
      statut: 'en_attente',
      date_paiement: null,
      user_nom: u ? u.nom : '',
      user_prenom: u ? u.prenom : '',
      user_email: u ? u.email : ''
    });
    saveState();
    return id;
  }

  function updateEvaluation(id, data) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var e = state.evaluations.find(function (x) { return x.id === id; });
    if (!e) return false;
    if (data.recommendation !== undefined) e.recommendation = data.recommendation;
    if (data.commentaires_public !== undefined) e.commentaires_public = data.commentaires_public;
    if (data.note_finale !== undefined) e.note_finale = data.note_finale;
    if (data.statut !== undefined) e.statut = data.statut;
    if (data.statut === 'soumis') e.date_soumission = new Date().toISOString().slice(0, 10);
    saveState();
    return true;
  }

  function addEvaluation(articleId, evaluateurId) {
    if (!state) loadState();
    var art = state.articles.find(function (x) { return x.id === parseInt(articleId, 10); });
    var id = nextId('evaluation');
    state.evaluations.push({
      id: id,
      article_id: parseInt(articleId, 10),
      evaluateur_id: parseInt(evaluateurId, 10),
      statut: 'en_attente',
      recommendation: null,
      commentaires_public: null,
      note_finale: null,
      date_assignation: new Date().toISOString().slice(0, 10),
      date_soumission: null,
      article_titre: art ? art.titre : ''
    });
    saveState();
    return id;
  }

  function deleteEvaluation(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var i = state.evaluations.findIndex(function (x) { return x.id === id; });
    if (i === -1) return false;
    state.evaluations.splice(i, 1);
    saveState();
    return true;
  }

  function addNotification(userId, type, titre, message, lien) {
    if (!state) loadState();
    var id = 'n' + nextId('notification');
    state.notifications.unshift({
      id: id,
      user_id: parseInt(userId, 10),
      type: type || 'info',
      titre: titre || '',
      message: message || '',
      lu: false,
      date: new Date().toISOString(),
      lien: lien || null
    });
    saveState();
    return id;
  }

  function addComiteMember(userId, ordre, titreAffiche, actif) {
    if (!state) loadState();
    var u = getUserById(userId);
    if (!u) return null;
    var id = nextId('comite');
    state.comite_editorial.push({
      id: id,
      user_id: u.id,
      ordre: ordre != null ? ordre : 0,
      titre_affiche: titreAffiche || '',
      actif: actif !== false,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role
    });
    saveState();
    return id;
  }

  function updateComiteMember(id, data) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var c = state.comite_editorial.find(function (x) { return x.id === id; });
    if (!c) return false;
    if (data.ordre !== undefined) c.ordre = data.ordre;
    if (data.titre_affiche !== undefined) c.titre_affiche = data.titre_affiche;
    if (data.actif !== undefined) c.actif = data.actif;
    saveState();
    return true;
  }

  function deleteComiteMember(id) {
    if (!state) loadState();
    id = parseInt(id, 10);
    var i = state.comite_editorial.findIndex(function (x) { return x.id === id; });
    if (i === -1) return false;
    state.comite_editorial.splice(i, 1);
    saveState();
    return true;
  }

  /** Réinitialiser la démo (efface localStorage et recharge l'état par défaut) */
  function resetDemo() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    state = getDefaultState();
    saveState();
  }

  // Initialisation au premier accès
  loadState();

  // Export public
  window.RevueDemo = window.RevueDemo || {};
  window.RevueDemo.data = {
    loadState: loadState,
    saveState: saveState,
    resetDemo: resetDemo,
    getUsers: getUsers,
    getUserById: getUserById,
    getUserByEmail: getUserByEmail,
    getArticles: getArticles,
    getArticleById: getArticleById,
    getPublishedArticles: getPublishedArticles,
    getArticlesByAuthorId: getArticlesByAuthorId,
    getArticlesByIssueId: getArticlesByIssueId,
    getVolumes: getVolumes,
    getVolumeById: getVolumeById,
    getNumeros: getNumeros,
    getNumeroById: getNumeroById,
    getNotifications: getNotifications,
    getUnreadNotificationCount: getUnreadNotificationCount,
    getPaiements: getPaiements,
    getPaiementsByUserId: getPaiementsByUserId,
    getPaiementById: getPaiementById,
    getEvaluations: getEvaluations,
    getEvaluationById: getEvaluationById,
    getEvaluationsByArticleId: getEvaluationsByArticleId,
    getComiteEditorial: getComiteEditorial,
    markNotificationRead: markNotificationRead,
    markAllNotificationsRead: markAllNotificationsRead,
    addArticle: addArticle,
    updateArticle: updateArticle,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    updatePaiementStatut: updatePaiementStatut,
    addPaiement: addPaiement,
    updateEvaluation: updateEvaluation,
    addEvaluation: addEvaluation,
    deleteEvaluation: deleteEvaluation,
    addNotification: addNotification,
    addComiteMember: addComiteMember,
    updateComiteMember: updateComiteMember,
    deleteComiteMember: deleteComiteMember
  };
})();
