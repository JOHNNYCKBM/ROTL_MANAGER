package com.rotl.manager.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rotl.manager.auth.AuthDtos.*;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final ObjectMapper mapper;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder, JwtService jwt, ObjectMapper mapper) {
        this.jdbc = jdbc; this.encoder = encoder; this.jwt = jwt; this.mapper = mapper;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (jdbc.queryForObject("SELECT count(*) FROM companies WHERE id=? AND is_active=true",
                Integer.class, request.companyId()) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Entreprise inconnue ou inactive.");
        }
        String hash = encoder.encode(request.password());
        try {
            jdbc.update("""
                INSERT INTO account_requests(company_id, requested_identity, first_name, last_name, email, phone, password_hash)
                VALUES (?, CAST(? AS jsonb), ?, ?, ?, ?, ?)
                """, request.companyId(),
                mapper.writeValueAsString(Map.of("firstName", request.firstName(), "lastName", request.lastName(),
                    "email", request.email(), "phone", request.phone() == null ? "" : request.phone())),
                request.firstName(), request.lastName(), request.email(), request.phone(), hash);
        } catch (DuplicateKeyException ex) {
            // Same response for duplicates to reduce account enumeration.
        } catch (Exception ex) {
            throw new IllegalStateException("Impossible d'enregistrer la demande.", ex);
        }
        return new MessageResponse("Si les informations sont recevables, la demande sera soumise à validation.");
    }

    public TokenResponse login(LoginRequest request) {
        var users = jdbc.query("""
            SELECT id, company_id, email, password_hash, status
            FROM users WHERE company_id=? AND lower(email)=lower(?) LIMIT 1
            """, (rs, row) -> new LoginRow(rs), request.companyId(), request.email());
        if (users.isEmpty() || !"ACTIVE".equals(users.getFirst().status())
                || users.getFirst().passwordHash() == null
                || !encoder.matches(request.password(), users.getFirst().passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides ou compte non activé.");
        }
        LoginRow user = users.getFirst();
        jdbc.update("UPDATE users SET last_login_at=now() WHERE id=?", user.id());
        return new TokenResponse(jwt.generate(user.id(), user.companyId(), user.email()), "Bearer", jwt.getExpirationSeconds());
    }

    public MeResponse me(UUID userId) {
        return jdbc.query("""
            SELECT id, first_name, last_name, email, status FROM users WHERE id=?
            """, rs -> {
                if (!rs.next()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
                return new MeResponse(rs.getObject("id", UUID.class), rs.getString("first_name"),
                    rs.getString("last_name"), rs.getString("email"), rs.getString("status"));
            }, userId);
    }

    private static final class LoginRow {
        private final UUID id, companyId;
        private final String email, passwordHash, status;
        LoginRow(ResultSet rs) throws SQLException {
            id=rs.getObject("id", UUID.class); companyId=rs.getObject("company_id", UUID.class);
            email=rs.getString("email"); passwordHash=rs.getString("password_hash"); status=rs.getString("status");
        }
        UUID id(){return id;} UUID companyId(){return companyId;} String email(){return email;}
        String passwordHash(){return passwordHash;} String status(){return status;}
    }
}
