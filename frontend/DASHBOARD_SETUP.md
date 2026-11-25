# Dashboard administrateur — ROTL MANAGER

Le dashboard est disponible sur la route `/dashboard`.

## Ressources visuelles à placer dans public

Les maquettes partagées définissent deux photographies Hero officielles. Place les fichiers fournis aux chemins exacts :

- `frontend/public/assets/images/hero-dark.jpg` — photographie nocturne pour le thème sombre.
- `frontend/public/assets/images/hero-light.jpg` — photographie de jour pour le thème clair.

Le composant sélectionne automatiquement la photographie selon le thème. Ne pas remplacer ces deux images par un filtre CSS : ce sont deux ressources distinctes.

## API utilisée

Le service frontend appelle :

- `GET /api/v1/auth/me` pour le profil.
- `GET /api/v1/reports/dashboard?period=7d` ou `period=30d` pour les indicateurs.

Le catalogue API du dépôt présente `/reports/dashboard` comme endpoint prévisionnel. Il faut donc confirmer avec le backend le chemin exact, les paramètres et la structure JSON. En attendant, le dashboard affiche des états vides plutôt que d'inventer des statistiques.

Structure de données reconnue par l'interface (à aligner sur le DTO réel) :

- `kpis.todaySales` (valeur et devise), `kpis.productsInStock`, `kpis.activeUsers`, `kpis.revenue` (valeur et devise)
- `sales.series[]` avec `label` ou `date`, et `total` ou `amount` ou `value`
- `stock.available`, `stock.lowStock`, `stock.outOfStock`
- `recentActivities[]` avec `description` ou `message`, et `createdAt` ou `date`

## Configuration

Configurer `VITE_API_BASE_URL` avec l'origine du serveur Spring Boot, sans ajouter `/api/v1` si les services conservent les chemins ci-dessus.

## Contrôles

Après récupération de la branche, lancer `npm install`, configurer le fichier `.env`, puis `npm run build` et `npm run dev`.
