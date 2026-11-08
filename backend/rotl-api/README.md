# ROTL Manager API

Backend REST de ROTL_MANAGER : Java 21, Spring Boot, PostgreSQL et Flyway.

## Prérequis
- JDK 21
- Maven 3.9+
- Docker + Docker Compose (recommandé pour PostgreSQL local)

## Démarrage de PostgreSQL
Depuis `backend/rotl-api` :
```bash
docker compose up -d postgres
```

## Configuration
Les valeurs sensibles sont fournies par variables d’environnement :
- `DB_URL` (défaut local : `jdbc:postgresql://localhost:5432/rotl_manager`)
- `DB_USERNAME` (défaut local : `rotl`)
- `DB_PASSWORD` (défaut local : `rotl_local_only`)

Ne jamais réutiliser les identifiants locaux en production.

## Exécution
```bash
mvn spring-boot:run
```
Flyway applique automatiquement les migrations au démarrage. La migration V1 crée le schéma initial multi-devise.

## Tests
```bash
mvn test
```

## Structure cible
- `src/main/java/com/rotl/manager/` : modules métier (auth, users, catalog, inventory, sales, cash, shared).
- `src/main/resources/db/migration/` : migrations SQL versionnées Flyway.
- `src/test/` : tests unitaires et intégration PostgreSQL/Testcontainers.

Le backend est initialisé ; les endpoints métier et la configuration de sécurité seront implémentés par incréments.