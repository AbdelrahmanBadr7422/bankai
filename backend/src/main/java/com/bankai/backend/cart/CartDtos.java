package com.bankai.backend.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {
    private CartDtos() {
    }

    public record AddCartItemRequest(@NotNull Long productId, @NotNull @Min(1) @Max(100) Integer quantity) {
    }

    public record UpdateCartItemRequest(@NotNull @Min(1) @Max(100) Integer quantity) {
    }

    public record CartItemResponse(Long productId, String title, String coverImageUrl, BigDecimal unitPrice,
                                   int quantity, int availableStock, BigDecimal lineTotal) {
    }

    public record CartResponse(List<CartItemResponse> items, int totalQuantity, BigDecimal subtotal,
                               BigDecimal estimatedShippingFee, BigDecimal total) {
    }
}