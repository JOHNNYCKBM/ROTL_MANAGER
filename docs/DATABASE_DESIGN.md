# ROTL MANAGER — Conception de la base de données

**Version :** 0.1 — proposition de conception  
**Statut :** document de travail à valider avant les migrations SQL  
**SGBD cible :** PostgreSQL

## 1. Décision de périmètre

Pour ne pas bloquer la V1, le modèle retient **un établissement opérationnel au démarrage**, tout en permettant d'en enregistrer plusieurs ultérieurement. Une entreprise (company) possède un ou plusieurs établissements (stores), et chaque établissement possède plusieurs caisses (cash_registers).

Cette décision applique la recommandation proposée dans l'échange précédent. Elle reste à confirmer par l'équipe ROTL.

## 2. Principes

- PostgreSQL est la source centrale de vérité ; les postes ne partagent jamais directement un fichier SQLite.
- Identifiants techniques UUID ; dates en timestamptz et échanges ISO 8601.
- Montants en numeric(19,4), jamais en float/double.
- Quantités en numeric(19,3), sous réserve de confirmer les ventes au poids.
- Éviter la suppression des données métier sensibles : préférer les statuts et is_active.
- Toute opération modifiant stock, vente ou caisse doit être transactionnelle et traçable.
- Les autorisations sont contrôlées côté backend ; masquer un bouton frontend n'est pas une sécurité.

## 3. Domaines et tables

### 3.1 Organisation

| Table | Rôle | Champs principaux |
|---|---|---|
| companies | Entreprise propriétaire des données | id, name, legal_name, currency_code, timezone, is_active |
| stores | Établissement opérationnel | id, company_id, code, name, address, is_active |
| cash_registers | Poste/caisse | id, store_id, code, name, is_active |

Unicité : (company_id, code) pour les établissements ; (store_id, code) pour les caisses.

### 3.2 Utilisateurs et autorisations

| Table | Rôle | Champs principaux |
|---|---|---|
| users | Comptes utilisateurs | id, company_id, first_name, last_name, email, phone, password_hash, status, last_login_at |
| roles | Rôles applicatifs | id, code, name, scope |
| permissions | Actions atomiques | id, code, description |
| role_permissions | Association rôle-permission | role_id, permission_id |
| user_roles | Rôles attribués | user_id, role_id, store_id nullable |
| account_requests | Demandes d'inscription | id, company_id, requested_identity, status, reviewed_by, reviewed_at, decision_note |

Statuts proposés : users = PENDING, ACTIVE, SUSPENDED, REJECTED ; account_requests = PENDING, APPROVED, REJECTED. Rôles : SUPER_ADMIN, ADMIN, MANAGER, SELLER.

Règles :
- Le formulaire public ne permet pas au demandeur de choisir son rôle.
- Une demande approuvée crée/active le compte et attribue le rôle choisi par l'acteur autorisé.
- Seul un Super-admin peut créer ou attribuer le rôle Admin et gérer les Super-admins.
- Un Admin peut traiter les demandes de rôles métier autorisés, sans créer un autre Admin.
- Le mot de passe est stocké uniquement sous forme de hash adaptatif (Argon2id recommandé), jamais en clair.
- Distinguer les rôles globaux et ceux limités à un établissement via roles.scope et user_roles.store_id.

### 3.3 Catalogue

| Table | Rôle | Champs principaux |
|---|---|---|
| categories | Catégories hiérarchiques | id, company_id, parent_id, name, is_active |
| products | Articles commercialisés | id, company_id, category_id, sku, barcode, name, description, purchase_price, selling_price, unit, image_uri, is_active |

SKU unique dans une entreprise ; code-barres unique lorsqu'il est renseigné. Une catégorie peut avoir une catégorie parente ; les cycles doivent être empêchés côté métier. Désactiver un produit déjà utilisé plutôt que le supprimer. Les changements de prix doivent être audités. Un historique dédié des prix pourra être ajouté si le besoin est confirmé.

### 3.4 Stock et inventaire

| Table | Rôle | Champs principaux |
|---|---|---|
| stocks | Quantité courante par produit et établissement | id, store_id, product_id, quantity_on_hand, updated_at |
| stock_movements | Journal des mouvements | id, store_id, product_id, movement_type, quantity_delta, reference_type, reference_id, created_by, created_at |
| stock_adjustments | En-tête d'ajustement/inventaire | id, store_id, status, reason, created_by, validated_by, validated_at |
| stock_adjustment_items | Lignes comptées | id, adjustment_id, product_id, system_quantity, counted_quantity, difference |

Unicité de (store_id, product_id) dans stocks. Les mouvements validés sont append-only : ne pas les modifier/supprimer. Types envisagés : OPENING, SALE, RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT. Les fournisseurs sont hors périmètre actuel : aucune table fournisseur n'est prévue. Les transferts ne seront activés que lorsque le multi-établissements sera livré.

### 3.5 Ventes et paiements

| Table | Rôle | Champs principaux |
|---|---|---|
| sales | En-tête de vente | id, company_id, store_id, cash_register_id, cash_session_id, sale_number, status, subtotal, discount_total, tax_total, total, created_by, validated_at |
| sale_items | Lignes de vente | id, sale_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price, discount_amount, line_total |
| payments | Règlements | id, sale_id, payment_method, amount, reference, paid_at |

Une vente validée conserve les prix et libellés au moment de la vente (snapshots). Validation de vente, paiements et décrémentation du stock doivent appartenir à une même transaction. Une vente validée n'est pas supprimée ; une annulation autorisée doit être motivée, auditée et produire les mouvements compensatoires nécessaires. Modes de paiement proposés : CASH, CARD, MOBILE_MONEY, BANK_TRANSFER, OTHER — à confirmer. La portée de numérotation des ventes reste à décider.

### 3.6 Caisse

| Table | Rôle | Champs principaux |
|---|---|---|
| cash_sessions | Ouverture/clôture d'une session | id, cash_register_id, opened_by, opened_at, opening_amount, closed_by, closed_at, closing_amount_declared, closing_amount_expected, status |
| cash_movements | Entrées/sorties | id, cash_session_id, movement_type, amount, reason, reference_type, reference_id, created_by, created_at |

Une seule session ouverte à la fois par caisse, garantie par contrainte/transaction. Une session clôturée n'est plus modifiable ; les corrections sont tracées. Le solde attendu est calculé côté serveur à partir du montant initial, des paiements en espèces et des mouvements.

### 3.7 Documents et audit

| Table | Rôle | Champs principaux |
|---|---|---|
| invoices | Factures liées à une vente | id, sale_id, invoice_number, issued_at, status |
| receipts | Tickets/reçus | id, sale_id, receipt_number, issued_at, document_uri |
| audit_logs | Journal des actions sensibles | id, company_id, store_id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at |

Les documents émis conservent leur numéro et leur date. Le format légal des factures et les obligations fiscales doivent être validés avec la comptabilité locale avant production.

## 4. Relations principales

- companies 1—N stores ; stores 1—N cash_registers.
- stores 1—N stocks ; products 1—N stocks.
- products 1—N stock_movements.
- sales 1—N sale_items et sales 1—N payments.
- cash_registers 1—N cash_sessions ; cash_sessions 1—N sales et cash_movements.
- roles N—N permissions via role_permissions.
- users N—N roles via user_roles.

Voir DATABASE_DIAGRAM.md pour le diagramme.

## 5. Index et contraintes

- Index sur les clés étrangères.
- Index uniques sur les codes dans leur portée organisationnelle.
- Index unique sur products(company_id, sku) et index unique partiel sur le code-barres non nul.
- Index unique sur stocks(store_id, product_id).
- Index sur sales(store_id, created_at), sales(status), stock_movements(store_id, product_id, created_at), audit_logs(company_id, created_at).
- Contraintes CHECK sur les quantités et montants non négatifs lorsque le domaine le permet.
- Contrainte empêchant deux sessions ouvertes simultanément sur la même caisse.

## 6. Sécurité et intégrité

1. Spring Boot est responsable des autorisations métier.
2. Chaque requête vérifie l'entreprise et l'établissement accessibles à l'utilisateur.
3. Ne jamais faire confiance aux company_id, store_id, prix ou totaux fournis par le client sans validation serveur.
4. Les opérations de vente, stock et caisse utilisent des transactions et un contrôle de concurrence (verrouillage optimiste ou SELECT FOR UPDATE).
5. Les journaux ne stockent aucun mot de passe, token, secret ou donnée de paiement sensible.
6. Secrets JWT et identifiants DB via variables d'environnement/gestionnaire de secrets, jamais dans Git.
7. Migrations versionnées avec Flyway.

## 7. Décisions métier à valider avant les migrations

- Devise : CDF, USD ou les deux ? Si deux devises, définir devise de référence et conversion.
- Articles vendus à l'unité seulement ou aussi au poids/volume ?
- Paiements partiels ou multi-moyens autorisés ?
- Remises et taxes dès la V1 ?
- Retours et annulations autorisés ? Par quels rôles ?
- Numérotation des ventes, tickets et factures : globale ou par établissement ?
- Clients identifiés ou ventes comptoir anonymes ?
- Seuil d'alerte stock défini par produit et établissement ?

## 8. Étapes suivantes

1. Valider les décisions métier ci-dessus et le périmètre multi-établissements.
2. Valider le diagramme et les portées d'accès.
3. Écrire les migrations Flyway par domaine.
4. Créer les entités JPA et contraintes.
5. Ajouter des tests PostgreSQL avec Testcontainers.
6. Implémenter auth/demandes de compte/permissions, puis catalogue, stock, ventes et caisse.

**Important :** ceci est un modèle logique cible, pas encore des migrations SQL exécutables ni une spécification exhaustive des règles comptables.
