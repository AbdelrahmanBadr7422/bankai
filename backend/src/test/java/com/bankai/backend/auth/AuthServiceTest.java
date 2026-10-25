package com.bankai.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bankai.backend.auth.AuthDtos.LoginRequest;
import com.bankai.backend.auth.AuthDtos.RegisterRequest;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.security.JwtService;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;
import com.bankai.backend.user.UserRepository;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    UserRepository users;
    @Mock
    JwtService jwt;
    PasswordEncoder encoder = new BCryptPasswordEncoder();
    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(users, encoder, jwt);
    }

    @Test
    void registerHashesPasswordNormalizesEmailAndAssignsCustomerRole() {
        when(users.existsByEmail("ann@test.com")).thenReturn(false);
        when(users.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(jwt.generate(any(User.class))).thenReturn("token");

        var response = service.register(new RegisterRequest("Ann@Test.com", "password123", "Ann", null));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        User u = saved.getValue();
        assertThat(u.getEmail()).isEqualTo("ann@test.com");
        assertThat(u.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(u.getPasswordHash()).isNotEqualTo("password123").startsWith("$2");
        assertThat(encoder.matches("password123", u.getPasswordHash())).isTrue();
        assertThat(response.accessToken()).isEqualTo("token");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(users.existsByEmail("ann@test.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest("ann@test.com", "password123", "Ann", null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("already registered");
        verify(users, never()).save(any());
    }

    @Test
    void loginRejectsWrongPassword() {
        User u = new User();
        u.setEmail("ann@test.com");
        u.setPasswordHash(encoder.encode("password123"));
        when(users.findByEmail("ann@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.login(new LoginRequest("ann@test.com", "wrong-password")))
                .isInstanceOf(ApiException.class).hasMessageContaining("Invalid email or password");
    }
}