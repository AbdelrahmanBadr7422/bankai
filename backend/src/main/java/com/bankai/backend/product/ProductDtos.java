package com.bankai.backend.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public final class ProductDtos {
    private ProductDtos() {
    }

    public record ProductRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 4000) String description,
            @NotBlank @Size(max = 255) String author,
            @NotBlank @Pattern(regexp = "^[0-9Xx-]{10,17}$", message = "ISBN must be 10-17 characters: digits, X or hyphens") String isbn,
            @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal price,
            @NotNull @Min(0) Integer stockQuantity,
            @Size(max = 500) String coverImageUrl,
            @NotNull Long categoryId,
            Boolean active) {
    }

    public record ProductResponse(Long id, String title, String description, String author, String isbn,
                                  BigDecimal price, int stockQuantity, String coverImageUrl, Long categoryId,
                                  String categoryName, boolean active, Instant createdAt) {
        public static ProductResponse from(Product p) {
            return new ProductResponse(p.getId(), p.getTitle(), p.getDescription(), p.getAuthor(), p.getIsbn(),
                    p.getPrice(), p.getStockQuantity(), p.getCoverImageUrl(), p.getCategory().getId(),
                    p.getCategory().getName(), p.isActive(), p.getCreatedAt());
        }
    }
}