# ROTL MANAGER — Conception de la base de données

**Version :** 0.2 — décision multi-devise intégrée
**SGBD cible :** PostgreSQL

## Décision validée : CDF et USD
ROTL_MANAGER gère simultanément le CDF et l'USD. Les prix d'un produit sont indépendants dans chaque devise : le prix CDF n'est pas calculé automatiquement à partir du prix USD.

- companies.default_currency_code : devise d'affichage/configuration par défaut, sans limiter les devises autorisées.
- product_prices : product_id, currency_code (CDF/USD), purchase_price, selling_price, updated_at ; unicité (product_id, currency_code).
- Chaque vente possède une seule devise (sales.currency_code). Les lignes conservent les prix et libellés appliqués au moment de la vente.
- Chaque paiement conserve sa devise réelle et son montant. Si elle diffère de la devise de vente, enregistrer aussi le montant converti dans la devise de vente et le taux appliqué.
- Les mouvements et soldes de caisse sont séparés par devise. Ne jamais additionner directement CDF et USD.
- Les rapports présentent les totaux séparément par devise. Toute consolidation exige une devise cible et un taux explicites.

## Principes techniques
- PostgreSQL central ; aucun fichier SQLite partagé entre postes.
- UUID, dates TIMESTAMPTZ, montants NUMERIC(19,4), quantités NUMERIC(19,3).
- Calculs financiers côté serveur avec BigDecimal ; jamais FLOAT/DOUBLE.
- Transactions atomiques pour ventes, paiements, stock et caisse.
- Journal des mouvements append-only ; opérations validées non supprimées.
- Autorisations et périmètre entreprise/établissement vérifiés côté backend.

## Domaines et tables

### Organisation
- companies : entreprise, devise par défaut et fuseau horaire.
- stores : établissements rattachés à une entreprise.
- cash_registers : caisses rattachées à un établissement.

### Utilisateurs et autorisations
- users, roles, permissions, role_permissions, user_roles, account_requests.
- Rôles : SUPER_ADMIN, ADMIN, MANAGER, SELLER.
- L'inscription publique ne choisit jamais le rôle. Seul SUPER_ADMIN crée/attribue ADMIN ou SUPER_ADMIN.
- Mot de passe stocké sous forme de hash adaptatif (Argon2id recommandé).

### Catalogue
- categories : catégories hiérarchiques.
- products : SKU, code-barres, nom, unité, description et statut.
- product_prices : prix d'achat et de vente indépendants en CDF et USD.
- SKU unique par entreprise ; code-barres unique lorsqu'il est renseigné.

### Stock
- stocks : quantité courante par produit et établissement.
- stock_movements : journal des mouvements.
- stock_adjustments et stock_adjustment_items : inventaires et ajustements.
- Fournisseurs hors périmètre ; aucune table fournisseur.

### Ventes et paiements
- sales : établissement, caisse/session, numéro, statut, devise, sous-total, remise, taxe et total.
- sale_items : snapshots du produit, quantité, prix unitaire, remise et total de ligne.
- payments : moyen, devise encaissée, montant encaissé, montant équivalent dans la devise de vente, taux appliqué si conversion.
- Validation de vente, paiements et décrémentation du stock dans une même transaction.
- Annulation autorisée uniquement avec motif, permission, audit et mouvements compensatoires.

### Caisse, documents et audit
- cash_sessions : ouverture et clôture ; soldes d'ouverture/clôture distincts par devise.
- cash_movements : montant, devise, motif et auteur.
- invoices, receipts, audit_logs : documents émis et traçabilité.

## Contraintes et sécurité
- Index sur clés étrangères ; unicités SKU, code-barres, (product_id, currency_code) et (store_id, product_id).
- Une seule session ouverte à la fois par caisse.
- Ne jamais faire confiance aux prix, totaux, taux ou identifiants de périmètre fournis par le frontend.
- Utiliser transactions et verrouillage optimiste ou SELECT FOR UPDATE.
- Secrets via variables d'environnement, jamais dans Git ; migrations Flyway.

## Arbitrages métier encore ouverts
- Vente à l'unité ou aussi au poids/volume.
- Paiements partiels et multi-moyens.
- Remises et taxes dès la V1.
- Retours et règles d'annulation.
- Numérotation des ventes, tickets et factures.
- Clients identifiés ou ventes comptoir anonymes.
- Seuils d'alerte stock et gouvernance du taux de change.

Ce document décrit le modèle logique cible. Les migrations exécutables et les tests PostgreSQL restent à produire.