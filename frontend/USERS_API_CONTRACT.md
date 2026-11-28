# Contrat API — Gestion des utilisateurs (à valider)

Ce document accompagne le module frontend ROTL MANAGER. Les routes ci-dessous reprennent les propositions du cahier des charges : elles ne prouvent pas que les contrôleurs Spring Boot existent déjà.

## Authentification

Toutes les routes protégées utilisent le jeton JWT :

`Authorization: Bearer <accessToken>`

Le client HTTP central est `src/services/api.js`. Le frontend ne stocke pas et n'affiche pas le matricule avant qu'il soit renvoyé par le Backend.

## Routes proposées

| Fonction | Méthode | Route proposée |
|---|---|---|
| Statistiques | GET | `/api/v1/users/statistics` |
| Demandes en attente | GET | `/api/v1/users/requests` |
| Liste des employés | GET | `/api/v1/users` |
| Détail d'un employé | GET | `/api/v1/users/{id}` |
| Création manuelle | POST | `/api/v1/users` |
| Validation d'une demande | POST | `/api/v1/users/requests/{id}/approve` |
| Rejet d'une demande | POST | `/api/v1/users/requests/{id}/reject` |
| Modification | PUT | `/api/v1/users/{id}` |
| Suspension | PATCH | `/api/v1/users/{id}/suspend` |
| Réactivation | PATCH | `/api/v1/users/{id}/activate` |
| Suppression | DELETE | `/api/v1/users/{id}` |

## Champs attendus côté frontend

### Demande en attente
- `id` ou `requestId`
- `firstName`, `lastName`
- `email`, `phone`
- `requestedAt` ou `createdAt`

### Employé
- `id` ou `userId`
- `firstName`, `lastName`
- `email`, `phone`
- `role` : `MANAGER` ou `SELLER`
- `matricule` (exactement 10 chiffres, généré côté Java)
- `status` : `ACTIVE` ou `SUSPENDED`
- `assignedAt` ou `createdAt`
- `lastLoginAt` si disponible

### Création manuelle
Payload frontend proposé :
```json
{
  "firstName": "Prénom",
  "lastName": "Nom",
  "email": "employe@example.com",
  "phone": "+243...",
  "role": "SELLER"
}
```

### Validation d'une demande
Payload frontend proposé :
```json
{
  "role": "MANAGER"
}
```

Le Backend doit vérifier les permissions, valider les données, attribuer le matricule unique de 10 chiffres dans la transaction et renvoyer ce matricule dans sa réponse. Le frontend ne doit jamais générer ni modifier un matricule.

## Statistiques attendues

Réponse suggérée :
```json
{
  "pendingRequests": 5,
  "activeEmployees": 24,
  "activeAccounts": 26,
  "generatedMatricules": 1250
}
```

Les noms de champs peuvent être adaptés dans le service frontend après accord entre les deux développeurs.

## Permissions à confirmer

Conformément à la matrice des rôles du cahier des charges, l'accès au module est prévu pour `SUPER_ADMIN` et `ADMIN`. Le Backend doit appliquer la même règle et contrôler chaque opération séparément. Un bouton masqué dans React ne constitue pas une protection de sécurité.

## Points à décider avec le développeur Backend

1. Confirmer les routes, méthodes HTTP, payloads et formats de réponse.
2. Déterminer si la suppression est physique ou logique et les règles de conservation liées aux ventes.
3. Confirmer comment les sessions JWT sont révoquées lors d'une suspension.
4. Confirmer les noms exacts des statuts et des rôles.
5. Définir la pagination côté serveur et les paramètres de recherche si les listes deviennent volumineuses.
6. Confirmer le contenu de la réponse de création et de validation, notamment le matricule attribué.

## Actualisation

Le frontend interroge les statistiques, les demandes et les employés toutes les 5 secondes. Les appels sont protégés contre le chevauchement. Les boutons d'actualisation déclenchent la même récupération manuellement.
