package com.bankai.backend.cart;

import com.bankai.backend.cart.CartDtos.AddCartItemRequest;
import com.bankai.backend.cart.CartDtos.CartResponse;
import com.bankai.backend.cart.CartDtos.UpdateCartItemRequest;
import com.bankai.backend.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal AuthUser user) {
        return cartService.get(user.id());
    }

    @PostMapping("/items")
    public CartResponse add(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddCartItemRequest request) {
        return cartService.addItem(user.id(), request);
    }

    @PutMapping("/items/{productId}")
    public CartResponse update(@AuthenticationPrincipal AuthUser user, @PathVariable Long productId,
                               @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateItem(user.id(), productId, request);
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse remove(@AuthenticationPrincipal AuthUser user, @PathVariable Long productId) {
        return cartService.removeItem(user.id(), productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal AuthUser user) {
        cartService.clear(user.id());
    }
}