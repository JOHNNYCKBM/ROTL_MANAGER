package com.rotl.manager.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationSeconds;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.access-token-minutes:15}") long minutes) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must contain at least 32 UTF-8 bytes.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = minutes * 60;
    }

    public String generate(UUID userId, UUID companyId, String email) {
        Instant now = Instant.now();
        return Jwts.builder().subject(userId.toString()).claim("companyId", companyId.toString())
            .claim("email", email).issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirationSeconds))).signWith(key).compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload().getSubject());
    }

    public long getExpirationSeconds() { return expirationSeconds; }
}
