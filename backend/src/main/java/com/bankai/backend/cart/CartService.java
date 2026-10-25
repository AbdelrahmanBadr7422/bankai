package com.bankai.backend.cart;

import com.bankai.backend.cart.CartDtos.AddCartItemRequest;
import com.bankai.backend.cart.CartDtos.CartItemResponse;
import com.bankai.backend.cart.CartDtos.CartResponse;
import com.bankai.backend.cart.CartDtos.UpdateCartItemRequest;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.common.Pricing;
import com.bankai.backend.product.Product;
import com.bankai.backend.product.ProductRepository;
import com.bankai.backend.user.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Prices always come from the database; the client only sends product ids and quantities.
 */
@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository carts;
    private final ProductRepository products;
    private final UserRepository users;

    @Transactional
    public CartResponse get(Long userId) {
        return toResponse(getOrCreate(userId));
    }

    @Transactional
    public CartResponse addItem(Long userId, AddCartItemRequest r) {
        Product product = activeProduct(r.productId());
        Cart cart = getOrCreate(userId);
        CartItem item = findItem(cart, product.getId()).orElse(null);
        int newQuantity = (item == null ? 0 : item.getQuantity()) + r.quantity();
        ensureStock(product, newQuantity);
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            cart.getItems().add(item);
        }
        item.setQuantity(newQuantity);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long productId, UpdateCartItemRequest r) {
        Cart cart = getOrCreate(userId);
        CartItem item = findItem(cart, productId).orElseThrow(() -> ApiException.notFound("Item is not in the cart"));
        ensureStock(item.getProduct(), r.quantity());
        item.setQuantity(r.quantity());
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = getOrCreate(userId);
        boolean removed = cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        if (!removed) throw ApiException.notFound("Item is not in the cart");
        return toResponse(cart);
    }

    @Transactional
    public void clear(Long userId) {
        getOrCreate(userId).getItems().clear();
    }

    private Cart getOrCreate(Long userId) {
        return carts.findWithItemsByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUser(users.getReferenceById(userId));
            carts.save(c);
            return c;
        });
    }

    private Product activeProduct(Long id) {
        return products.findById(id).filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    private Optional<CartItem> findItem(Cart cart, Long productId) {
        return cart.getItems().stream().filter(i -> i.getProduct().getId().equals(productId)).findFirst();
    }

    private void ensureStock(Product p, int quantity) {
        if (quantity > p.getStockQuantity()) {
            throw ApiException.badRequest("Only " + p.getStockQuantity() + " copies of '" + p.getTitle() + "' available");
        }
    }

    private static CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream().map(i -> {
            Product p = i.getProduct();
            return new CartItemResponse(p.getId(), p.getTitle(), p.getCoverImageUrl(), p.getPrice(),
                    i.getQuantity(), p.getStockQuantity(), Pricing.lineTotal(p.getPrice(), i.getQuantity()));
        }).toList();
        BigDecimal subtotal = items.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        int quantity = items.stream().mapToInt(CartItemResponse::quantity).sum();
        BigDecimal shipping = Pricing.shippingFee(subtotal);
        return new CartResponse(items, quantity, subtotal, shipping, subtotal.add(shipping));
    }
}