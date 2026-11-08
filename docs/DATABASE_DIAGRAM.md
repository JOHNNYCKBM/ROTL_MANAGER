# ROTL MANAGER — Diagramme logique de la base de données

**Version :** 0.1 — alignée sur DATABASE_DESIGN.md

Le diagramme présente les principales relations. Il s'agit d'un modèle logique ; les types SQL, clés composites et contraintes détaillées seront définis dans les migrations Flyway.

```mermaid
erDiagram
    COMPANIES ||--o{ STORES : owns
    STORES ||--o{ CASH_REGISTERS : contains
    COMPANIES ||--o{ USERS : employs
    COMPANIES ||--o{ CATEGORIES : defines
    COMPANIES ||--o{ PRODUCTS : catalogs
    CATEGORIES ||--o{ CATEGORIES : parent_of
    CATEGORIES ||--o{ PRODUCTS : classifies
    USERS ||--o{ ACCOUNT_REQUESTS : submits_or_reviews
    USERS ||--o{ USER_ROLES : receives
    ROLES ||--o{ USER_ROLES : assigned
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included
    STORES ||--o{ STOCKS : holds
    PRODUCTS ||--o{ STOCKS : counted_in
    STORES ||--o{ STOCK_MOVEMENTS : records
    PRODUCTS ||--o{ STOCK_MOVEMENTS : moved
    STORES ||--o{ STOCK_ADJUSTMENTS : performs
    STOCK_ADJUSTMENTS ||--|{ STOCK_ADJUSTMENT_ITEMS : contains
    PRODUCTS ||--o{ STOCK_ADJUSTMENT_ITEMS : counted
    STORES ||--o{ SALES : records
    CASH_REGISTERS ||--o{ SALES : processes
    CASH_SESSIONS ||--o{ SALES : groups
    SALES ||--|{ SALE_ITEMS : contains
    PRODUCTS ||--o{ SALE_ITEMS : sold_as
    SALES ||--o{ PAYMENTS : settled_by
    CASH_REGISTERS ||--o{ CASH_SESSIONS : opens
    CASH_SESSIONS ||--o{ CASH_MOVEMENTS : records
    SALES ||--o{ INVOICES : billed_by
    SALES ||--o{ RECEIPTS : receipted_by
    USERS ||--o{ AUDIT_LOGS : performs

    COMPANIES {
      uuid id PK
      string name
      string currency_code
      string timezone
    }
    STORES {
      uuid id PK
      uuid company_id FK
      string code
      string name
    }
    CASH_REGISTERS {
      uuid id PK
      uuid store_id FK
      string code
      string name
    }
    USERS {
      uuid id PK
      uuid company_id FK
      string email
      string password_hash
      string status
    }
    ROLES {
      uuid id PK
      string code
      string scope
    }
    PERMISSIONS {
      uuid id PK
      string code
    }
    PRODUCTS {
      uuid id PK
      uuid company_id FK
      uuid category_id FK
      string sku
      string barcode
      numeric selling_price
    }
    CATEGORIES {
      uuid id PK
      uuid company_id FK
      uuid parent_id FK
      string name
    }
    STOCKS {
      uuid id PK
      uuid store_id FK
      uuid product_id FK
      numeric quantity_on_hand
    }
    STOCK_MOVEMENTS {
      uuid id PK
      uuid store_id FK
      uuid product_id FK
      numeric quantity_delta
      string movement_type
    }
    SALES {
      uuid id PK
      uuid store_id FK
      uuid cash_register_id FK
      uuid cash_session_id FK
      string sale_number
      numeric total
      string status
    }
    SALE_ITEMS {
      uuid id PK
      uuid sale_id FK
      uuid product_id FK
      numeric quantity
      numeric unit_price
    }
    PAYMENTS {
      uuid id PK
      uuid sale_id FK
      string payment_method
      numeric amount
    }
    CASH_SESSIONS {
      uuid id PK
      uuid cash_register_id FK
      uuid opened_by FK
      numeric opening_amount
      string status
    }
    CASH_MOVEMENTS {
      uuid id PK
      uuid cash_session_id FK
      numeric amount
      string movement_type
    }
    ACCOUNT_REQUESTS {
      uuid id PK
      uuid company_id FK
      uuid reviewed_by FK
      string status
    }
    STOCK_ADJUSTMENTS {
      uuid id PK
      uuid store_id FK
      string status
    }
    STOCK_ADJUSTMENT_ITEMS {
      uuid id PK
      uuid adjustment_id FK
      uuid product_id FK
      numeric counted_quantity
    }
    INVOICES {
      uuid id PK
      uuid sale_id FK
      string invoice_number
    }
    RECEIPTS {
      uuid id PK
      uuid sale_id FK
      string receipt_number
    }
    AUDIT_LOGS {
      uuid id PK
      uuid actor_user_id FK
      string action
      string entity_type
    }
    USER_ROLES {
      uuid user_id FK
      uuid role_id FK
      uuid store_id FK
    }
    ROLE_PERMISSIONS {
      uuid role_id FK
      uuid permission_id FK
    }
```

## Points d'attention

- La quantité courante de stocks est une projection opérationnelle ; stock_movements reste le journal de traçabilité.
- Les lignes de vente conservent des snapshots du nom, SKU et prix pour préserver l'historique.
- Les ventes et sessions de caisse référencent explicitement établissement et caisse afin de filtrer les rapports.
- Les associations user_roles et role_permissions ont des clés primaires composites.
- Le diagramme ne représente pas toutes les colonnes ni toutes les contraintes. DATABASE_DESIGN.md reste la référence descriptive.
