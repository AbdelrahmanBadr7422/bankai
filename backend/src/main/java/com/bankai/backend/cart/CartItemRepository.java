package com.bankai.backend.cart;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    @Query("select new com.bankai.backend.cart.CartLine(i.product.id, i.quantity) from CartItem i "
            + "where i.cart.id = :cartId order by i.product.id")
    List<CartLine> findLines(@Param("cartId") Long cartId);
}