# ROTL MANAGER — Matrice des rôles et permissions

**Version :** 0.1 — proposition à valider

## 1. Principes

- Refus par défaut : toute permission non accordée explicitement est refusée.
- Les contrôles sont appliqués dans Spring Security et les services métier.
- Le périmètre d'entreprise/établissement est vérifié indépendamment du rôle.
- Les opérations sensibles sont inscrites dans audit_logs.
- Les permissions sont atomiques et attribuées aux rôles ; les exceptions individuelles, si nécessaires, devront être explicites et auditées.

## 2. Matrice fonctionnelle initiale

| Domaine / action | Super-admin | Admin | Gestionnaire | Vendeur |
|---|---:|---:|---:|---:|
| Paramètres techniques globaux | Oui | Non | Non | Non |
| Créer/administrer Super-admin | Oui | Non | Non | Non |
| Créer/attribuer Admin | Oui | Non | Non | Non |
| Créer/administrer comptes métier | Oui | Oui | Non | Non |
| Valider demandes de compte métier | Oui | Oui, selon périmètre | Non | Non |
| Consulter catalogue | Oui | Oui | Oui | Oui |
| Créer/modifier produits | Oui | Oui | Oui | Non |
| Modifier prix | Oui | Oui | Selon permission | Non |
| Gérer catégories | Oui | Oui | Oui | Non |
| Consulter stock | Oui | Oui | Oui | Selon besoin de vente |
| Enregistrer mouvements de stock | Oui | Oui | Oui, selon permission | Non |
| Réaliser/valider inventaire | Oui | Oui | Oui, selon permission | Non |
| Enregistrer ventes | Oui | Oui | Selon attribution | Oui |
| Encaisser et gérer session de caisse | Oui | Oui | Selon attribution | Oui |
| Annuler vente validée | Selon permission | Selon permission | Non par défaut | Non |
| Consulter rapports globaux | Oui | Oui | Selon périmètre | Rapport personnel |
| Consulter audit | Oui | Oui, selon périmètre | Non | Non |

Cette matrice synthétise les rôles validés dans les échanges de conception. Les cellules « selon permission » doivent être arbitrées avant la configuration finale.

## 3. Codes de permissions proposés

### Administration
- users.read, users.create, users.update, users.suspend
- account_requests.read, account_requests.approve, account_requests.reject
- roles.read, roles.assign
- system.settings.manage

### Catalogue
- products.read, products.create, products.update, products.deactivate
- products.price.update
- categories.read, categories.create, categories.update, categories.deactivate

### Stock
- stock.read
- stock.movement.create
- stock.adjustment.create, stock.adjustment.validate
- stock.inventory.read

### Ventes et caisse
- sales.create, sales.read.own, sales.read.all
- sales.cancel
- payments.record
- cash_session.open, cash_session.close, cash_session.read
- cash_movement.create

### Rapports et audit
- reports.read.own, reports.read.store, reports.read.company
- audit.read

## 4. Restrictions non négociables

- SELLER ne crée/modifie ni produits, ni prix, ni catégories.
- SELLER ne réalise pas d'ajustement de stock.
- SELLER ne supprime pas une vente validée.
- ADMIN ne crée pas ADMIN ou SUPER_ADMIN et ne modifie pas les paramètres système réservés.
- MANAGER ne reçoit pas implicitement des permissions d'administration des comptes.
- Les permissions de lecture des ventes et rapports sont limitées au périmètre autorisé.

## 5. Périmètre des rôles

- SUPER_ADMIN : portée globale de l'application.
- ADMIN : portée de l'entreprise ; accès aux établissements autorisés de cette entreprise.
- MANAGER : portée d'un ou plusieurs établissements selon affectation.
- SELLER : portée de l'établissement et des caisses qui lui sont affectés.

Le rôle seul ne suffit pas : chaque requête doit vérifier user_roles.store_id, l'entreprise et la ressource ciblée.

## 6. À valider

1. Le Gestionnaire peut-il modifier les prix ou seulement les proposer ?
2. Qui peut valider un inventaire et un ajustement de stock ?
3. Qui peut annuler une vente, et dans quel délai ?
4. Le Vendeur peut-il consulter toutes les ventes de sa caisse ou uniquement ses propres ventes ?
5. Un Gestionnaire peut-il être affecté à plusieurs établissements ?
