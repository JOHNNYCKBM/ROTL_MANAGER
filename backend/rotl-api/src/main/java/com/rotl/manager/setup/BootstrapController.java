package com.rotl.manager.setup;

import com.rotl.manager.setup.BootstrapDtos.InitialSetupRequest;
import com.rotl.manager.setup.BootstrapDtos.SetupResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/setup")
public class BootstrapController {
    private final BootstrapService bootstrapService;
    public BootstrapController(BootstrapService bootstrapService) {
        this.bootstrapService = bootstrapService;
    }

    @PostMapping("/initial-super-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public SetupResponse initialize(
            @RequestHeader(name = "X-Setup-Token", required = false) String setupToken,
            @Valid @RequestBody InitialSetupRequest request) {
        return bootstrapService.initialize(setupToken, request);
    }
}
