# Authentification — état de l'implémentation

Cette branche introduit la fondation technique du module d'authentification.

## Implémenté

- Demande d'inscription publique : `POST /api/v1/auth/register-requests`.
- Le demandeur ne choisit aucun rôle.
- Le mot de passe est haché avec Argon2id avant persistance ; aucun mot de passe brut n'est écrit en base.
- Connexion : `POST /api/v1/auth/login`.
- JWT signé HMAC avec une clé fournie par variable d'environnement.
- Jetons d'accès courts (15 minutes par défaut).
- API stateless, HTTP Basic et formulaire Spring désactivés.
- `GET /api/v1/auth/me` protégé par Bearer token.
- Les comptes non ACTIVE ne peuvent pas se connecter ; le filtre vérifie aussi le statut du compte à chaque requête authentifiée.
- Migration V2 pour les champs de demandes et le stockage futur des refresh tokens.

## Configuration locale

PowerShell (générer une clé aléatoire de 32 octets minimum pour le terminal courant) :

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:JWT_ACCESS_TOKEN_MINUTES = "15"
mvn spring-boot:run
```

La variable `JWT_SECRET` est obligatoire. Ne jamais la placer dans Git, dans le frontend ou dans les logs. En production, utiliser un gestionnaire de secrets et HTTPS.

## Exemple de demande d'inscription

```http
POST /api/v1/auth/register-requests
Content-Type: application/json

{
  "companyId": "UUID-DE-L-ENTREPRISE",
  "firstName": "Jean",
  "lastName": "Mbuyi",
  "email": "jean@example.com",
  "phone": "+243...",
  "password": "UnePhraseDePasseLongue!"
}
```

Réponse volontairement générique pour limiter l'énumération de comptes.

## Exemple de connexion

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "companyId": "UUID-DE-L-ENTREPRISE",
  "email": "jean@example.com",
  "password": "UnePhraseDePasseLongue!"
}
```

Utiliser le jeton retourné dans l'en-tête `Authorization: Bearer <accessToken>`.

## Routes

| Méthode | Route | Accès |
|---|---|---|
| POST | /api/v1/auth/register-requests | Public |
| POST | /api/v1/auth/login | Public |
| GET | /api/v1/auth/me | JWT requis |

## Reste à développer avant une utilisation métier

- Bootstrap contrôlé du premier Super-admin et création initiale de l'entreprise.
- Approbation/refus transactionnels des demandes, avec verrouillage concurrent.
- Contrôle de rôle et de périmètre entreprise/établissement.
- Chargement et application des permissions atomiques.
- Refresh token rotatif, stockage hashé, révocation et logout.
- Audit des décisions et journalisation de sécurité.
- Tests unitaires, tests d'intégration PostgreSQL et tests de sécurité.
- Limitation de débit sur inscription et connexion, politique de verrouillage et réponses d'erreur normalisées.

La migration V2 ajoute les colonnes nécessaires aux demandes et une table de refresh tokens préparatoire ; les routes de refresh/logout ne sont pas encore exposées.
