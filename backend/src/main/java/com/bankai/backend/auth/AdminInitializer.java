package com.bankai.backend.auth;

import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;
import com.bankai.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first ADMIN from ADMIN_EMAIL / ADMIN_PASSWORD (environment only, never hard-coded).
 */
@Component
public class AdminInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public AdminInitializer(UserRepository users, PasswordEncoder encoder,
                            @Value("${app.admin.email:}") String email,
                            @Value("${app.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            log.info("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin bootstrap");
            return;
        }
        if (password.length() < 12) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least 12 characters");
        }
        String normalized = email.trim().toLowerCase();
        if (users.existsByEmail(normalized)) {
            return;
        }
        User admin = new User();
        admin.setEmail(normalized);
        admin.setPasswordHash(encoder.encode(password));
        admin.setFullName("Administrator");
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.info("Initial administrator created: {}", normalized);
    }
}