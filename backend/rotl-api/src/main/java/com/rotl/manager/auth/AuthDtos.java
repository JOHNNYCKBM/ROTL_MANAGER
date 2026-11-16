package com.rotl.manager.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(
        @jakarta.validation.constraints.NotNull UUID companyId,
        @NotBlank @Size(max=80) String firstName,
        @NotBlank @Size(max=80) String lastName,
        @Email @NotBlank @Size(max=190) String email,
        @Size(max=30) String phone,
        @NotBlank @Size(min=12, max=128) String password
    ) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password, @jakarta.validation.constraints.NotNull UUID companyId) {}
    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {}
    public record MessageResponse(String message) {}
    public record MeResponse(UUID id, String firstName, String lastName, String email, String status) {}
}
