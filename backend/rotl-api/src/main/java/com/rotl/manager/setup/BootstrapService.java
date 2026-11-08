package com.rotl.manager.setup;

import com.rotl.manager.setup.BootstrapDtos.InitialSetupRequest;
import com.rotl.manager.setup.BootstrapDtos.SetupResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BootstrapService {
    private static final long BOOTSTRAP_LOCK_ID = 7_204_202_611L;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapToken;

    public BootstrapService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder,
                            @Value("${security.bootstrap.token:}") String bootstrapToken) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapToken = bootstrapToken;
    }

    @Transactional
    public SetupResponse initialize(String suppliedToken, InitialSetupRequest request) {
        if (bootstrapToken == null || bootstrapToken.isBlank()
                || suppliedToken == null
                || !MessageDigest.isEqual(bootstrapToken.getBytes(StandardCharsets.UTF_8),
                                          suppliedToken.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Initialisation non autorisée.");
        }

        // Serialize concurrent setup attempts so only one can create the first privileged account.
        jdbc.execute("SELECT pg_advisory_xact_lock(" + BOOTSTRAP_LOCK_ID + ")");
        Integer existing = jdbc.queryForObject("""
            SELECT count(*) FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.code = 'SUPER_ADMIN'
            """, Integer.class);
        if (existing != null && existing > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "L'initialisation a déjà été effectuée.");
        }

        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        jdbc.update("INSERT INTO companies(id, name) VALUES (?, ?)", companyId, request.companyName().trim());
        jdbc.update("""
            INSERT INTO company_currencies(company_id, currency_code, is_enabled, is_default)
            VALUES (?, 'CDF', true, true), (?, 'USD', true, false)
            """, companyId, companyId);
        jdbc.update("""
            INSERT INTO users(id, company_id, first_name, last_name, email, password_hash, status)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            """, userId, companyId, request.firstName().trim(), request.lastName().trim(),
            request.email().trim(), passwordEncoder.encode(request.password()));

        UUID roleId = jdbc.queryForObject("SELECT id FROM roles WHERE code='SUPER_ADMIN'", UUID.class);
        jdbc.update("INSERT INTO user_roles(user_id, role_id, store_id) VALUES (?, ?, NULL)", userId, roleId);

        return new SetupResponse("Entreprise et premier Super-administrateur initialisés. Conservez les identifiants en lieu sûr.");
    }
}
