# ROTL MANAGER — Diagramme logique de la base de données

**Version :** 0.2 — modèle multi-devise

```mermaid
erDiagram
  COMPANIES ||--o{ STORES : owns
  STORES ||--o{ CASH_REGISTERS : contains
  COMPANIES ||--o{ USERS : employs
  COMPANIES ||--o{ PRODUCTS : catalogs
  COMPANIES ||--o{ CATEGORIES : defines
  PRODUCTS ||--o{ PRODUCT_PRICES : priced_in
  CATEGORIES ||--o{ PRODUCTS : classifies
  STORES ||--o{ STOCKS : holds
  PRODUCTS ||--o{ STOCKS : counted_in
  PRODUCTS ||--o{ STOCK_MOVEMENTS : moved
  STORES ||--o{ SALES : records
  SALES ||--|{ SALE_ITEMS : contains
  SALES ||--o{ PAYMENTS : settled_by
  CASH_REGISTERS ||--o{ CASH_SESSIONS : opens
  CASH_SESSIONS ||--o{ CASH_MOVEMENTS : records
  SALES ||--o{ INVOICES : billed_by
  SALES ||--o{ RECEIPTS : receipted_by
  USERS ||--o{ AUDIT_LOGS : performs
  USERS ||--o{ USER_ROLES : receives
  ROLES ||--o{ USER_ROLES : assigned
  ROLES ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : included
  COMPANIES { uuid id PK string default_currency_code }
  PRODUCTS { uuid id PK uuid company_id FK string sku }
  PRODUCT_PRICES { uuid id PK uuid product_id FK string currency_code numeric purchase_price numeric selling_price }
  SALES { uuid id PK string currency_code numeric total }
  PAYMENTS { uuid id PK string currency_code numeric amount numeric sale_currency_amount numeric exchange_rate }
  CASH_MOVEMENTS { uuid id PK string currency_code numeric amount }
```

## Règles monétaires
- Les prix CDF et USD sont indépendants dans PRODUCT_PRICES.
- Une vente est libellée dans une seule devise.
- Un paiement peut utiliser une autre devise ; le taux et le montant converti sont conservés.
- Les soldes de caisse restent séparés par devise.