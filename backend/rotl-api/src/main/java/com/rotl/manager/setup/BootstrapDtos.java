package com.rotl.manager.setup;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class BootstrapDtos {
    private BootstrapDtos() {}
    public record InitialSetupRequest(
        @NotBlank @Size(max=160) String companyName,
        @NotBlank @Size(max=80) String firstName,
        @NotBlank @Size(max=80) String lastName,
        @Email @NotBlank @Size(max=190) String email,
        @NotBlank @Size(min=12, max=128) String password
    ) {}
    public record SetupResponse(String message) {}
}
