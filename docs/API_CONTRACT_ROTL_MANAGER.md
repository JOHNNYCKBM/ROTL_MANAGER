# ROTL MANAGER — Contrat d’API Backend / Frontend

**Version :** 1.0 — brouillon de travail à valider en équipe  
**Backend :** Java / Spring Boot  
**Base de données :** PostgreSQL  
**Communication :** API REST / JSON  
**Préfixe :** `/api/v1`  
**Documentation :** OpenAPI / Swagger

> Ce document constitue une proposition initiale. Les endpoints, DTO, règles de validation et permissions doivent être confirmés avec le modèle de données et les besoins fonctionnels avant implémentation définitive.

## 1. Objectif et responsabilités

Le contrat définit les conventions de communication afin que les développements backend et frontend restent compatibles.

### Backend
- Validation des données et application des règles métier.
- Authentification, autorisations et contrôle d’accès côté serveur.
- Gestion des transactions et persistance PostgreSQL.
- Production de réponses et erreurs structurées.
- Documentation OpenAPI et tests automatisés.

### Frontend
- Affichage, navigation et saisie des données.
- Validations ergonomiques des formulaires.
- Appels aux API et gestion des états de chargement.
- Présentation des erreurs et adaptation de l’interface aux permissions.

**Règle de sécurité :** masquer un bouton dans le frontend ne constitue pas une protection. Toute permission doit être vérifiée par le backend.

## 2. Conventions techniques

| Élément | Convention |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON, UTF-8 |
| Méthodes HTTP | GET, POST, PUT, PATCH, DELETE selon l’opération |
| Identifiants | UUID recommandé |
| Dates | ISO 8601 avec fuseau horaire explicite |
| Authentification | `Authorization: Bearer <token>` sur les routes protégées |
| Documentation | OpenAPI / Swagger |
| Versionnement | Nouvelle version en cas de changement incompatible |

La stratégie JWT (durée de vie, refresh token, stockage et révocation) doit être précisée avant implémentation.

## 3. Format des réponses

### Succès — exemple indicatif
```json
{
  "success": true,
  "message": "Produit récupéré avec succès",
  "data": { "id": "uuid", "name": "Ordinateur portable" }
}
```

### Erreur — exemple indicatif
```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    { "field": "name", "message": "Le nom est obligatoire" }
  ]
}
```

La structure exacte doit être uniforme. Les erreurs internes ne doivent pas exposer de stack trace, secret ou information sensible.

## 4. Catalogue prévisionnel des API

Les routes ci-dessous sont une première proposition. Les DTO, paramètres, permissions, validations et codes de réponse seront détaillés dans OpenAPI.

### AUTH — Authentification

| Méthode | Endpoint | Fonction |
|---|---|---|
| POST | `/auth/register` | Soumettre une demande de création de compte |
| POST | `/auth/login` | Se connecter |
| POST | `/auth/refresh` | Renouveler un token |
| POST | `/auth/logout` | Terminer la session |
| GET | `/auth/me` | Obtenir le profil connecté |

### ACCOUNT REQUESTS — Demandes de comptes

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/account-requests` | Lister les demandes selon permission |
| GET | `/account-requests/{id}` | Consulter une demande |
| POST | `/account-requests/{id}/approve` | Approuver et attribuer un rôle autorisé |
| POST | `/account-requests/{id}/reject` | Rejeter une demande |

### USERS — Utilisateurs

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/users` | Lister les utilisateurs |
| GET | `/users/{id}` | Consulter un utilisateur |
| PATCH | `/users/{id}` | Modifier les champs autorisés |
| PATCH | `/users/{id}/status` | Activer ou désactiver un compte |

### PRODUCTS — Produits

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/products` | Lister les produits |
| GET | `/products/{id}` | Consulter un produit |
| POST | `/products` | Créer un produit |
| PUT | `/products/{id}` | Modifier un produit |
| PATCH | `/products/{id}/status` | Modifier son statut |
| GET | `/products/search` | Rechercher un produit |
| GET | `/products/barcode/{code}` | Rechercher par code-barres |

### CATEGORIES — Catégories

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/categories` | Lister les catégories |
| GET | `/categories/{id}` | Consulter une catégorie |
| POST | `/categories` | Créer une catégorie |
| PUT | `/categories/{id}` | Modifier une catégorie |
| DELETE | `/categories/{id}` | Supprimer si autorisé et sans dépendance bloquante |

### INVENTORY — Stocks

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/inventory` | Consulter les niveaux de stock |
| GET | `/inventory/movements` | Historique des mouvements |
| POST | `/inventory/entries` | Enregistrer une entrée |
| POST | `/inventory/exits` | Enregistrer une sortie |
| POST | `/inventory/adjustments` | Effectuer un ajustement autorisé |
| GET | `/inventory/alerts` | Consulter les alertes de stock |

### SALES — Ventes

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/sales` | Lister les ventes accessibles |
| GET | `/sales/{id}` | Consulter une vente |
| POST | `/sales` | Enregistrer une vente |
| POST | `/sales/{id}/cancel` | Annuler selon autorisation et règles métier |
| GET | `/sales/{id}/receipt` | Consulter ou générer le ticket |

### CASH — Caisses

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/cash/registers` | Lister les caisses |
| POST | `/cash/sessions/open` | Ouvrir une session de caisse |
| POST | `/cash/sessions/{id}/close` | Clôturer une session |
| GET | `/cash/sessions/{id}` | Consulter une session |
| GET | `/cash/sessions/{id}/report` | Consulter le rapport de session |

### REPORTS — Rapports

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/reports/sales` | Rapport des ventes |
| GET | `/reports/inventory` | Rapport des stocks |
| GET | `/reports/cash` | Rapport des caisses |
| GET | `/reports/dashboard` | Indicateurs autorisés du tableau de bord |

## 5. Rôles et sécurité

| Rôle | Principe d’accès |
|---|---|
| SUPER_ADMIN | Contrôle total, gestion des administrateurs et paramètres réservés |
| ADMIN | Gestion opérationnelle globale, sans création d’un autre Admin ou Super-admin |
| MANAGER | Gestion des produits, catégories et opérations de stock autorisées |
| SELLER | Ventes, paiements et opérations de caisse autorisées ; catalogue en lecture seule |

Règles impératives :
- Le rôle ne peut pas être choisi librement dans le formulaire d’inscription.
- Une inscription crée une demande en attente de validation.
- L’approbation attribue un rôle selon les droits de l’approbateur.
- Seul le Super-admin peut créer ou autoriser un compte Admin.
- Les opérations sensibles doivent être contrôlées et journalisées côté serveur.

## 6. Pagination, tri et filtres

Exemple :

```http
GET /api/v1/products?page=0&size=20&sort=name,asc
```

Toutes les listes doivent suivre une convention homogène. Les filtres métier (catégorie, statut, code-barres, période, caisse, etc.) seront définis par ressource.

## 7. Codes HTTP

| Code | Signification |
|---|---|
| 200 | Requête réussie |
| 201 | Ressource créée |
| 204 | Succès sans contenu |
| 400 | Requête mal formée |
| 401 | Authentification absente ou invalide |
| 403 | Permission insuffisante |
| 404 | Ressource introuvable |
| 409 | Conflit avec l’état actuel |
| 422 | Validation métier refusée, si cette convention est retenue |
| 500 | Erreur serveur inattendue |

## 8. Règles d’intégration entre développeurs

- Toute API consommée par le frontend doit être documentée avant intégration.
- Les noms de champs JSON et leurs types doivent être convenus.
- Toute modification incompatible doit être discutée avant intégration.
- Les nouveaux endpoints doivent être accompagnés d’exemples de requête et de réponse.
- Les tests backend doivent couvrir les validations et les permissions.
- Le frontend doit gérer chargement, succès, erreur, session expirée et accès interdit.

## 9. Points à valider avant implémentation

1. Technologie frontend réellement utilisée.
2. Stratégie JWT : durée, refresh token, stockage et révocation.
3. Structure définitive des réponses et pagination.
4. Modèle PostgreSQL, archivage et suppression.
5. Multi-caisses, sessions simultanées et concurrence de stock.
6. Annulation des ventes et correction des mouvements.
7. Permissions fines et journal d’audit.

**Statut :** proposition initiale. Ce document ne remplace ni le backlog validé, ni le modèle de données, ni la spécification OpenAPI détaillée.
