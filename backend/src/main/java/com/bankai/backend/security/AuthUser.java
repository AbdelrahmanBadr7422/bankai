package com.bankai.backend.security;


import com.bankai.backend.user.Role;

/**
 * Authenticated principal built from the JWT claims.
 */
public record AuthUser(Long id, String email, Role role) {
}