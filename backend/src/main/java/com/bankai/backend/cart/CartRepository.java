package com.bankai.backend.cart;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Cart> findWithItemsByUserId(Long userId);
}