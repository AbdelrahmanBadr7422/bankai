package com.bankai.backend.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class UserDtos {
    private UserDtos() {
    }

    public record UserResponse(Long id, String email, String fullName, String phone, Role role, Instant createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(), u.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(@NotBlank @Size(max = 120) String fullName, @Size(max = 30) String phone) {
    }
}