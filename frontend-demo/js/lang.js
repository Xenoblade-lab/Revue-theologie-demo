/**
 * Paramètres de langue — démo (FR, EN, Lingala)
 * Clé localStorage : revue_demo_lang
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'revue_demo_lang';
  var CODES = { fr: 'FR', en: 'EN', ln: 'LN' };

  var t = {
    fr: {
      'nav.home': 'Accueil',
      'nav.about': 'À propos',
      'nav.presentation': 'Présentation',
      'nav.comite': 'Comité éditorial',
      'nav.politique': 'Politique éditoriale',
      'nav.articles': 'Articles',
      'nav.publications': 'Publications',
      'nav.instructions': 'Instructions aux auteurs',
      'nav.archives': 'Archives',
      'nav.volumes': 'Volumes & numéros',
      'nav.actualites': 'Actualités',
      'nav.contact': 'Contact',
      'nav.faq': 'FAQ',
      'nav.login': 'Connexion',
      'nav.register': 'Inscription',
      'nav.submit': 'Soumettre un article',
      'nav.search': 'Rechercher',
      'home.featured': 'Article à la une',
      'home.see_latest_issue': 'Voir le dernier numéro',
      'home.welcome': 'Bienvenue',
      'home.welcome_title': 'Nous accueillons les derniers articles de recherche en théologie',
      'home.welcome_text': 'La Revue Congolaise de Théologie Protestante publie des travaux scientifiques en théologie, études bibliques, éthique chrétienne et histoire de l\'Église, avec un accent sur les contextes africains.',
      'home.read_more': 'Lire la suite →',
      'home.editors_pick': 'Choix de la rédaction',
      'home.search_placeholder': 'Rechercher un article...',
      'home.view_all': 'Voir tout',
      'home.view_articles': 'Voir les articles',
      'footer.nav': 'Navigation',
      'footer.authors': 'Pour les auteurs',
      'footer.follow': 'Suivez-nous',
      'footer.contact': 'Contact',
      'footer.submit': 'Soumettre un article',
      'footer.instructions': 'Instructions aux auteurs',
      'footer.evaluation': 'Processus d\'évaluation',
      'footer.politique': 'Politique éditoriale',
      'footer.mentions': 'Mentions légales',
      'footer.conditions': 'Conditions d\'utilisation',
      'footer.confidentiality': 'Politique de confidentialité',
      'footer.copyright': 'Tous droits réservés.',
      'search.placeholder': 'Mot-clé, auteur, titre...',
      'search.aria': 'Rechercher',
      'comite.title': 'Comité Editorial',
      'comite.intro': 'Les membres du comité de rédaction et du comité scientifique de la revue.',
      'comite.evaluations_by_committee': 'Les évaluations des articles sont réalisées par des membres du comité éditorial (double aveugle).',
      'comite.director': 'Directeur de la Revue',
      'comite.faculty': 'Faculté de Théologie, UPC - Kinshasa',
      'comite.redacteur_chef': 'Rédacteur en Chef',
      'comite.redacteur_chef_name': 'Prof. KALOMBO Kapuku Sébastien',
      'comite.redac_default': 'Le comité de rédaction assure la gestion éditoriale de la revue. Contact :',
      'comite.redaction': 'Comité de Rédaction',
      'comite.redaction_intro': 'Les membres internes de la Faculté de Théologie qui assurent la gestion éditoriale de la revue.',
      'comite.scientific': 'Comité Scientifique',
      'comite.scientific_intro': 'Des experts qui garantissent la qualité scientifique et la rigueur des publications.',
      'comite.scientific_default': 'Le comité scientifique international accompagne la revue dans son processus d\'évaluation.',
      'comite.contact_title': 'Contacter le Comité Editorial',
      'comite.contact_intro': 'Pour toute question concernant la soumission d\'articles ou la politique éditoriale.'
    },
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.presentation': 'Presentation',
      'nav.comite': 'Editorial Committee',
      'nav.politique': 'Editorial Policy',
      'nav.articles': 'Articles',
      'nav.publications': 'Publications',
      'nav.instructions': 'Instructions for Authors',
      'nav.archives': 'Archives',
      'nav.volumes': 'Volumes & Issues',
      'nav.actualites': 'News',
      'nav.contact': 'Contact',
      'nav.faq': 'FAQ',
      'nav.login': 'Log in',
      'nav.register': 'Register',
      'nav.submit': 'Submit an article',
      'nav.search': 'Search',
      'home.featured': 'Featured article',
      'home.see_latest_issue': 'View latest issue',
      'home.welcome': 'Welcome',
      'home.welcome_title': 'We welcome the latest research articles in theology',
      'home.welcome_text': 'The Congolese Journal of Protestant Theology publishes scientific work in theology, biblical studies, Christian ethics and church history, with a focus on African contexts.',
      'home.read_more': 'Read more →',
      'home.editors_pick': "Editors' pick",
      'home.search_placeholder': 'Search for an article...',
      'home.view_all': 'View all',
      'home.view_articles': 'View articles',
      'footer.nav': 'Navigation',
      'footer.authors': 'For authors',
      'footer.follow': 'Follow us',
      'footer.contact': 'Contact',
      'footer.submit': 'Submit an article',
      'footer.instructions': 'Instructions for authors',
      'footer.evaluation': 'Evaluation process',
      'footer.politique': 'Editorial policy',
      'footer.mentions': 'Legal notice',
      'footer.conditions': 'Terms of use',
      'footer.confidentiality': 'Privacy policy',
      'footer.copyright': 'All rights reserved.',
      'search.placeholder': 'Keyword, author, title...',
      'search.aria': 'Search',
      'comite.title': 'Editorial Committee',
      'comite.intro': 'Members of the editorial board and the scientific committee of the journal.',
      'comite.evaluations_by_committee': 'Article evaluations are carried out by members of the editorial committee (double blind).',
      'comite.director': 'Director of the Journal',
      'comite.faculty': 'Faculty of Theology, UPC - Kinshasa',
      'comite.redacteur_chef': 'Editor in Chief',
      'comite.redacteur_chef_name': 'Prof. KALOMBO Kapuku Sébastien',
      'comite.redac_default': 'The editorial board manages the journal. Contact:',
      'comite.redaction': 'Editorial Board',
      'comite.redaction_intro': 'Internal members of the Faculty of Theology who manage the journal.',
      'comite.scientific': 'Scientific Committee',
      'comite.scientific_intro': 'Experts who ensure the scientific quality and rigour of publications.',
      'comite.scientific_default': 'The international scientific committee supports the journal in its evaluation process.',
      'comite.contact_title': 'Contact the Editorial Committee',
      'comite.contact_intro': 'For any questions regarding article submission or editorial policy.'
    },
    ln: {
      'nav.home': 'Liboso',
      'nav.about': 'Mpo na biso',
      'nav.presentation': 'Botalisi',
      'nav.comite': 'Komite ya bokomasi',
      'nav.politique': 'Politiki ya bokomasi',
      'nav.articles': 'Makomi',
      'nav.publications': 'Bimwebi',
      'nav.instructions': 'Malako mpo na bakomi',
      'nav.archives': 'Bibuku',
      'nav.volumes': 'Buku na numéro',
      'nav.actualites': 'Sango',
      'nav.contact': 'Kotuna',
      'nav.faq': 'Mituna',
      'nav.login': 'Kokota',
      'nav.register': 'Kosaina',
      'nav.submit': 'Kotinda likomi',
      'nav.search': 'Koluka',
      'home.featured': 'Likomi ya moninga',
      'home.see_latest_issue': 'Tala numéro ya sika',
      'home.welcome': 'Mwambe',
      'home.welcome_title': 'Tozali kozwa makomi ya sika ya koluka teoloji',
      'home.welcome_text': 'Revue Congolaise de Théologie Protestante ebimisa makomi ya siansi na teoloji, etudi ya Biblia, mokano ya bokristu mpe lisolo ya engelese, na Afrika.',
      'home.read_more': 'Tanga lisusu →',
      'home.editors_pick': 'Bopesi ya bokomi',
      'home.search_placeholder': 'Koluka likomi...',
      'home.view_all': 'Tala nyonso',
      'home.view_articles': 'Tala makomi',
      'footer.nav': 'Kokende',
      'footer.authors': 'Mpo na bakomi',
      'footer.follow': 'Suivez-nous',
      'footer.contact': 'Kotuna',
      'footer.submit': 'Kotinda likomi',
      'footer.instructions': 'Malako mpo na bakomi',
      'footer.evaluation': 'Mokano ya kotungi',
      'footer.politique': 'Politiki ya bokomasi',
      'footer.mentions': 'Mikano',
      'footer.conditions': 'Mikano ya kosalela',
      'footer.confidentiality': 'Politiki ya kobomba biloko ya moto',
      'footer.copyright': 'Droit nyonso ezali.',
      'search.placeholder': 'Mot-clé, mokomi, titre...',
      'search.aria': 'Koluka',
      'comite.title': 'Komite Editorial',
      'comite.intro': 'Bamembres ya komite ya bokomi mpe komite ya siansi ya zulunalo.',
      'comite.evaluations_by_committee': 'Kotungi ya makomi ezali na bamembres ya komite editorial (double aveugle).',
      'comite.director': 'Mokonzi ya Zulunalo',
      'comite.faculty': 'Faculté de Théologie, UPC - Kinshasa',
      'comite.redacteur_chef': 'Mokomi ya monene',
      'comite.redacteur_chef_name': 'Prof. KALOMBO Kapuku Sébastien',
      'comite.redac_default': 'Komite ya bokomi ezali kokontrola zulunalo. Kotuna :',
      'comite.redaction': 'Komite ya Bokomi',
      'comite.redaction_intro': 'Bamembres ya Faculté de Théologie oyo bakontrola zulunalo.',
      'comite.scientific': 'Komite ya Siansi',
      'comite.scientific_intro': 'Bakisi oyo bazali kolengele kalite mpe bosembo ya bimwebi.',
      'comite.scientific_default': 'Komite ya siansi mokili mobali ezali kosalisa zulunalo na kotungi.',
      'comite.contact_title': 'Kotuna Komite Editorial',
      'comite.contact_intro': 'Mpo na mituna mpo na kotinda makomi to politiki ya bokomasi.'
    }
  };

  function getLang() {
    try {
      var stored = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ln' || stored === 'fr') return stored;
    } catch (e) { /* ignore */ }
    return 'fr';
  }

  function setLang(code) {
    if (code !== 'fr' && code !== 'en' && code !== 'ln') return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
    } catch (e) { /* ignore */ }
  }

  function applyLang() {
    var lang = getLang();
    var dict = t[lang] || t.fr;
    if (document.documentElement) document.documentElement.lang = lang === 'ln' ? 'ln' : lang;
    var current = document.querySelectorAll('.lang-current');
    for (var i = 0; i < current.length; i++) current[i].textContent = CODES[lang] || 'FR';
    var langMobile = document.querySelector('.lang-mobile .text-sm');
    if (langMobile) langMobile.textContent = CODES[lang] || 'FR';
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var j = 0; j < nodes.length; j++) {
      var key = nodes[j].getAttribute('data-i18n');
      if (dict[key] != null) nodes[j].textContent = dict[key];
    }
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < placeholders.length; k++) {
      var pk = placeholders[k].getAttribute('data-i18n-placeholder');
      if (dict[pk] != null) placeholders[k].setAttribute('placeholder', dict[pk]);
    }
    var ariaLabels = document.querySelectorAll('[data-i18n-aria]');
    for (var a = 0; a < ariaLabels.length; a++) {
      var ak = ariaLabels[a].getAttribute('data-i18n-aria');
      if (dict[ak] != null) ariaLabels[a].setAttribute('aria-label', dict[ak]);
    }
  }

  window.RevueDemo = window.RevueDemo || {};
  window.RevueDemo.lang = {
    getLang: getLang,
    setLang: setLang,
    applyLang: applyLang,
    t: t,
    CODES: CODES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLang);
  } else {
    applyLang();
  }
})();
