# ROTL MANAGER — Plan de développement

**Document de cadrage — Version 1.0**  
**Date : 07 novembre 2026**

Application professionnelle de gestion commerciale, des stocks, des ventes et des caisses.

> Ce document organise le développement de ROTL MANAGER en étapes cohérentes. Il constitue une base de travail à valider et devra être rapproché du backlog Scrum. Les éléments proviennent des besoins communiqués pour le projet ; ils ne sont pas présentés comme un backlog déjà approuvé.

## 1. Objet et périmètre

### Objectifs métier
- Centraliser les informations de l'entreprise.
- Gérer les utilisateurs et leurs autorisations.
- Gérer les produits, catégories et stocks.
- Tracer les entrées, sorties et ajustements de stock.
- Gérer les ventes, paiements et caisses.
- Produire des tickets, factures et rapports.
- Permettre au propriétaire de consulter les activités à distance.
- Préparer plusieurs postes de caisse physiques.

### Hors périmètre explicite
Le module **Fournisseurs** a été exclu du périmètre exprimé. Il ne sera pas ajouté sans décision explicite de changement de périmètre.

## 2. Profils et responsabilités

| Profil | Responsabilités principales | Limites essentielles |
|---|---|---|
| Super-admin | Contrôle du système ; gestion des comptes Admin ; création des autres profils ; permissions ; configuration technique ; mises à jour ; supervision ; journaux d'audit. | Contrôle global du système. |
| Admin | Gestion opérationnelle ; employés ; produits, stocks, ventes, recettes, caisses, factures, rapports et supervision. | Ne crée pas d'Admin ni de Super-admin ; ne modifie pas les paramètres système. |
| Gestionnaire | Produits, catégories, sous-catégories, prix, codes-barres, images, descriptions, mouvements autorisés, inventaires et niveaux de stock. | Pas d'opérations de caisse/vente dans le périmètre décrit. |
| Vendeur | Consultation catalogue/stock ; recherche et scan ; ventes ; paiements ; tickets/factures autorisés ; historique personnel ; opérations et clôture de sa caisse. | Ne modifie pas produits, prix ou catégories ; pas d'ajustement direct du stock ; pas de suppression de vente validée sans autorisation. |

## 3. Parcours prioritaire : authentification et inscription

Le premier incrément fonctionnel couvre le cycle complet d'une demande de compte, pas seulement un formulaire de connexion.

1. **Création de demande :** l'utilisateur saisit ses informations et ses identifiants. Aucun sélecteur de rôle ou de permission n'est affiché.
2. **Mise en attente :** le compte est enregistré avec le statut « En attente ». Aucun accès métier avant approbation.
3. **Notification :** la demande est portée à l'attention du Super-admin et de l'Admin selon le mécanisme retenu.
4. **Décision et attribution :** un administrateur habilité examine la demande, attribue le rôle autorisé, puis approuve ou refuse.
5. **Activation :** après approbation, l'utilisateur accède uniquement aux fonctionnalités autorisées par son rôle.

**Règle :** un Admin peut approuver les comptes des employés relevant de son autorité, mais ne peut pas approuver/créer un autre Admin. La création et l'activation des comptes Admin restent réservées au Super-admin.

Écrans concernés : connexion ; création de compte ; confirmation « demande envoyée / en attente » ; traitement d'une demande par un administrateur. La récupération de mot de passe et la connexion Google restent à confirmer dans le périmètre fonctionnel.

## 4. Plan de réalisation par phases

Le séquencement ci-dessous est une proposition technique à confronter au backlog Scrum et aux priorités métier validées.

### Phase 0 — Cadrage et fondations
- Valider périmètre, rôles, règles d'approbation et cas d'utilisation.
- Valider architecture, conventions de code, environnements et stratégie Git.
- Initialiser frontend et backend, configuration et contrôles qualité.
- Définir le Design System partagé et les composants communs.

**Livrable :** socle technique et conventions d'équipe validés.

### Phase 1 — Authentification et gestion des accès
- Connexion et création de compte sans choix de rôle.
- Statuts en attente, approuvé et refusé.
- Circuit d'approbation Admin/Super-admin selon les limites définies.
- Attribution du rôle après décision et activation du compte.
- Protection des API et des écrans selon les rôles ; gestion des sessions.

**Livrable :** parcours d'accès complet validé avec les quatre profils.

### Phase 2 — Modèle métier et données
- Modèle utilisateurs, rôles, permissions et statuts.
- Modèle catégories, produits, clients, stocks, mouvements, ventes et caisses.
- Contraintes d'intégrité, références, historique et migrations.
- Contrats API et règles transactionnelles validés avant les modules.

**Livrable :** modèle de données et contrats API validés.

### Phase 3 — Référentiel produits
- Gestion des catégories et sous-catégories.
- Création/modification des produits, descriptions, images et prix.
- Références et codes-barres selon les règles à confirmer.
- Recherche, consultation et désactivation selon autorisation.

**Livrable :** catalogue produit exploitable.

### Phase 4 — Gestion du stock
- Consultation des niveaux de stock et alertes de rupture.
- Enregistrement des entrées et sorties autorisées.
- Inventaires et ajustements selon autorisation.
- Historique traçable des mouvements.

**Livrable :** stock cohérent et mouvements traçables.

### Phase 5 — Clients
- Enregistrement et gestion des clients.
- Fiche client et historique des achats.

**Livrable :** référentiel client relié aux ventes.

### Phase 6 — Ventes et caisses
- Recherche, scan code-barres et panier.
- Calcul des montants, paiement et validation.
- Décrémentation du stock liée à la validation de vente.
- Tickets/factures autorisés, historique personnel et clôture de caisse.
- Plusieurs postes de caisse et prévention des doubles validations.

**Livrable :** cycle de vente et de caisse opérationnel.

### Phase 7 — Rapports et supervision
- Rapports ventes, recettes, stock et activité selon les autorisations.
- Rapports personnels vendeur et vues globales des profils autorisés.
- Consultation à distance par le propriétaire selon le rôle qui lui sera attribué.

**Livrable :** rapports accessibles selon les responsabilités.

### Phase 8 — Audit, déploiement et maintenance
- Journaux d'audit des actions sensibles.
- Tests sécurité, permissions, concurrence et restauration.
- Packaging Windows et stratégie de mise à jour.
- Documentation utilisateur, installation et support.

**Livrable :** version déployable et maintenable.

## 5. Architecture technique cible

### Stack communiquée
- Frontend : React, TypeScript et Vite.
- UI : Tailwind CSS v4.
- Desktop : Tauri, avec génération d'un installateur Windows.
- Backend : Java (Spring Boot proposé comme framework).
- Graphiques : Recharts uniquement lorsqu'ils apportent une valeur métier.
- Animations : Framer Motion, avec option de réduction/désactivation.
- Icônes : Lucide React.

### Décision d'architecture à prendre avant le schéma définitif
Le besoin prévoit plusieurs machines, un accès Internet, une consultation à distance et plusieurs postes de caisse. Une base SQLite locale partagée directement entre postes n'est pas adaptée à ce scénario. L'option à étudier est une API Java centrale avec une base serveur transactionnelle (par exemple PostgreSQL). SQLite peut éventuellement servir de stockage local/cache ou de file d'attente hors ligne. Cette proposition doit être validée avant de figer la base.

### Décisions techniques à formaliser
- Fonctionnement lorsque Internet est indisponible.
- Synchronisation et résolution des conflits.
- Prévention des doubles soumissions de ventes (idempotence).
- Authentification, expiration et révocation des sessions.
- Hébergement, sauvegardes et restauration de la base centrale.
- Distribution et contrôle des mises à jour Tauri.

## 6. Organisation du travail à deux développeurs

- Design System et composants communs partagés ; toute modification est concertée.
- Chaque développeur prend en charge des modules distincts, avec contrats convenus.
- Schéma de données et API validés ensemble avant les modules dépendants.
- Branches dédiées, commits explicites et revue de code avant intégration.
- Tâches, responsables et critères d'acceptation suivis dans le backlog Scrum.

| Zone | Responsabilité proposée |
|---|---|
| Socle commun | Architecture, conventions, Design System, contrats API et modèle de données : décisions conjointes. |
| Développeur A | Prend en charge un ensemble de modules défini dans le sprint, sans modifier seul les composants communs. |
| Développeur B | Prend en charge un autre ensemble de modules défini dans le sprint, avec intégration via contrats convenus. |

## 7. Critères de qualité et de validation

Un module est considéré terminé lorsque :
- les règles métier et permissions sont appliquées côté backend ;
- les cas nominaux, erreurs et limites sont testés ;
- les données restent cohérentes après chaque opération ;
- l'interface est compréhensible pour un utilisateur non technique ;
- les états chargement, succès, erreur et absence de données sont traités ;
- les actions sensibles sont traçables ;
- la documentation et les critères d'acceptation sont mis à jour.

## 8. Points à valider avant de figer le planning

1. Ajouter ou retrouver le backlog Scrum détaillé dans le repository.
2. Confirmer le rôle du propriétaire : Super-admin ou Admin.
3. Confirmer le canal de notification des demandes de compte.
4. Confirmer si Google Sign-In est une fonctionnalité requise.
5. Valider l'architecture multi-postes, le mode hors ligne et la synchronisation.
6. Confirmer les règles de numérotation des références, tickets et factures.
7. Estimer les tâches, fixer les durées de sprint et affecter les responsables.

## 9. Statut du document

Plan de cadrage version 1.0 construit à partir des exigences communiquées dans les échanges. Le repository ROTL_MANAGER consulté pendant la préparation ne contenait qu'un README minimal ; ce plan n'a donc pas été extrait d'un backlog existant. Les phases, l'ordre et les choix techniques proposés doivent être validés par l'équipe avant de devenir le planning officiel.

---

**Document source :** Plan_de_developpement_ROTL_MANAGER.pdf (version 1.0).
