# BricoVoisins

Application de prêt d’outils entre voisins réalisée en B2 CDA à l’ECE pour le module Architecture logicielle.

## Équipe

- **Amine ABOUTITE** (@aghosta46)
- Maxime Noel (@noelmaxou-debug)
- Valentin Parade (@valent1parade-cell)

## Lancer le projet

Avec Node.js 24, ouvrir un terminal dans le dossier du projet.

```powershell
npm ci
npm run dev
```

Ouvrir l’adresse indiquée par Vite, généralement http://localhost:5173. Dans l’archive de rendu, `node lancer-demo.mjs` sert aussi la version précompilée à l’adresse http://127.0.0.1:4173.

Le mode démonstration est actif par défaut. Utiliser uniquement des identifiants fictifs. Les comptes, réservations, messages et avis de la démo restent dans le stockage du navigateur. Une fenêtre privée permet de repartir de zéro.

| Rôle | Adresse de démonstration | Mot de passe |
| --- | --- | --- |
| Emprunteur | `emprunteur@example.test` | `demo1234` |
| Prêteur | `preteur@example.test` | `demo1234` |
| Administration | `admin@example.test` | `demo1234` |

### Parcours conseillé

1. Se connecter comme emprunteur, rechercher « Marteau » et ouvrir la première fiche.
2. Saisir deux dates. Une date de fin antérieure au début est refusée. Avec une période valide, la demande apparaît dans **Mes emprunts**.
3. Dans le même navigateur, changer de compte et accepter la demande dans **Demandes reçues**.
4. Cliquer sur le nom du compte dans l’en-tête pour accéder à son espace, au profil, aux annonces et à la messagerie. L’avis devient publiable après un prêt confirmé et terminé.
5. Se connecter à l’administration pour traiter les signalements ou gérer les comptes et les annonces.

## Architecture

- React organise les écrans et leurs formulaires. React Router relie les liens aux pages. Vite fournit le serveur de développement et la compilation.
- `src/pages/` contient les écrans et `src/components/` le menu commun.
- `src/services/demoApi.js` simule les opérations métier. Les avis, messages et décisions ne sont visibles que sur les réservations du compte actif dans le scénario simulé.
- `src/services/api.js` sélectionne le mode de démo ou le client Axios du projet d’origine. Pour tester les routes d’origine avec PHP, copier `.env.example` vers `.env.local`, renseigner `VITE_API_URL` et relancer Vite. Les extensions d’administration, de profil et de messagerie sont livrées dans le mode simulé.

Vérifications locales avec `npm run lint` et `npm run build`.
