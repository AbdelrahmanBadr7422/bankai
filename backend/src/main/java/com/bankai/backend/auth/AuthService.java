package com.bankai.backend.auth;

import com.bankai.backend.auth.AuthDtos.AuthResponse;
import com.bankai.backend.auth.AuthDtos.LoginRequest;
import com.bankai.backend.auth.AuthDtos.RegisterRequest;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.security.JwtService;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;
import com.bankai.backend.user.UserDtos.UserResponse;
import com.bankai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    /**
     * Public registration always creates a CUSTOMER; a role can never be supplied by the client.
     */
    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("Email is already registered");
        }
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone());
        u.setRole(Role.CUSTOMER);
        users.save(u);
        return response(u);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        return response(u);
    }

    private AuthResponse response(User u) {
        return new AuthResponse(jwt.generate(u), "Bearer", jwt.getExpirationMs() / 1000, UserResponse.from(u));
    }
}