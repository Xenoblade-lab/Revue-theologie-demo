# Démo frontend — Revue Congolaise de Théologie Protestante

Version **HTML + JavaScript** du site, sans backend PHP. Toutes les fonctionnalités (navigation, listes, formulaires, dashboards, authentification) sont simulées en JavaScript avec des **données factices** (mock). Idéal pour une **présentation ou une démo** autonome.

---

## Ouverture de la démo

- **Option 1 :** Ouvrir directement le fichier **`index.html`** dans le navigateur (double-clic ou « Ouvrir avec »).
- **Option 2 :** Lancer un serveur local dans le dossier `frontend-demo/` pour éviter d’éventuels problèmes de chargement de fichiers (CORS, chemins). Exemples :
  - **Node :** `npx serve .` ou `npx http-server .`
  - **PHP :** `php -S localhost:8080`
  - **Python :** `python -m http.server 8080`

Puis accéder à `http://localhost:8080` (ou au port indiqué).

---

## Comptes de démo

| Rôle     | Email              | Mot de passe |
|----------|--------------------|--------------|
| Admin    | admin@revue.cd     | demo         |
| Auteur   | auteur@revue.cd    | demo         |
| Évaluateur | reviewer@revue.cd | demo         |

Après connexion sur **`login.html`**, vous êtes redirigé vers le dashboard correspondant au rôle (admin, auteur ou évaluateur).

---

## Persistance des données

- Les **données de la démo** (articles, utilisateurs, notifications, paiements, évaluations, comité, etc.) sont enregistrées dans le **`localStorage`** du navigateur (clé : `revue_demo_data`).
- Elles **restent après rechargement** de la page et **après fermeture du navigateur**.
- La **session** (utilisateur connecté) est stockée dans le **`sessionStorage`** et est perdue à la fermeture de l’onglet.

---

## Réinitialiser la démo

Pour repartir des **données initiales** (utilisateurs, articles, notifications par défaut) :

1. **Depuis l’interface :** Connectez-vous en **admin**, allez dans **Paramètres revue** (`admin/parametres.html`), puis cliquez sur **« Réinitialiser la démo »**. La page se recharge avec les données par défaut.
2. **Depuis la console :** Ouvrez les outils de développement (F12), onglet Console, puis exécutez :
   ```javascript
   RevueDemo.data.resetDemo();
   location.reload();
   ```
3. **Manuellement :** Dans les outils de développement (F12) → Application (ou Stockage) → Stockage local → supprimez la clé `revue_demo_data`, puis rechargez la page.

---

## Parcours de test suggéré

1. **Accueil** → navigation (Publications, Archives, À propos, Contact, FAQ).
2. **Connexion admin** (`login.html` avec admin@revue.cd / demo) → Tableau de bord admin → Utilisateurs (liste, détail, créer/modifier) → Articles (liste, filtres, pagination) → Paiements → Déconnexion.
3. **Connexion auteur** (auteur@revue.cd / demo) → Tableau de bord auteur → Soumettre un article → Mes articles → Notifications → Profil.
4. **Connexion évaluateur** (reviewer@revue.cd / demo) → Tableau de bord → Évaluation → Terminées → Historique → Notifications.

---

## Structure

- **`index.html`** : Accueil
- **Pages publiques :** `publications.html`, `archives.html`, `article.html?id=…`, `numero.html?id=…`, `presentation.html`, `comite.html`, `contact.html`, `faq.html`, `politique-editoriale.html`, `instructions-auteurs.html`, `actualites.html`, `search.html?q=…`, `mentions-legales.html`, `conditions-utilisation.html`, `confidentialite.html`
- **Auth :** `login.html`, `register.html`, `forgot-password.html`
- **Admin :** `admin/index.html`, `admin/users.html`, `admin/user-detail.html`, `admin/user-form.html`, `admin/articles.html`, `admin/article-detail.html`, `admin/evaluations.html`, `admin/paiements.html`, `admin/volumes.html`, `admin/volume-detail.html`, `admin/numero-detail.html`, `admin/parametres.html`, `admin/comite-editorial.html`, `admin/notifications.html`
- **Auteur :** `author/index.html`, `author/articles.html`, `author/article-detail.html`, `author/article-edit.html`, `author/soumettre.html`, `author/s-abonner.html`, `author/abonnement.html`, `author/profil.html`, `author/notifications.html`, `author/article-revisions.html`
- **Évaluateur :** `reviewer/index.html`, `reviewer/evaluation.html`, `reviewer/terminees.html`, `reviewer/historique.html`, `reviewer/profil.html`, `reviewer/notifications.html`
- **Scripts :** `js/data.js` (données mock + persistance), `js/auth.js` (connexion simulée), `js/app.js` (rendu des pages et listes), `js/main.js` (menu, newsletter, contact), `js/lang.js` (FR/EN/Lingala)
- **Styles :** `css/styles.css` (même rendu que le site PHP, y compris responsive)

---

## Responsive

Les mêmes règles **responsive** que le site PHP sont appliquées (menu mobile, mise en page tablette et mobile). Tester en redimensionnant la fenêtre ou avec les outils de développement (mode appareil).
