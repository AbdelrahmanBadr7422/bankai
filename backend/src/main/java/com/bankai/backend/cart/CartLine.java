package com.bankai.backend.cart;


/**
 * Read-only projection used by checkout so no Product entity is loaded before it is locked.
 */
public record CartLine(Long productId, Integer quantity) {
}