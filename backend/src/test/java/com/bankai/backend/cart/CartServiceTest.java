package com.bankai.backend.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.bankai.backend.cart.CartDtos.AddCartItemRequest;
import com.bankai.backend.cart.CartDtos.CartResponse;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.product.Product;
import com.bankai.backend.product.ProductRepository;
import com.bankai.backend.user.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {
    @Mock
    CartRepository carts;
    @Mock
    ProductRepository products;
    @Mock
    UserRepository users;
    @InjectMocks
    CartService service;

    @Test
    void calculatesLineTotalsSubtotalShippingAndTotalOnTheServer() {
        when(carts.findWithItemsByUserId(7L)).thenReturn(Optional.of(cart(item(1L, "12.50", 2), item(2L, "19.99", 1))));

        CartResponse r = service.get(7L);

        assertThat(r.items().get(0).lineTotal()).isEqualByComparingTo("25.00");
        assertThat(r.subtotal()).isEqualByComparingTo("44.99");
        assertThat(r.estimatedShippingFee()).isEqualByComparingTo("5.00");
        assertThat(r.total()).isEqualByComparingTo("49.99");
        assertThat(r.totalQuantity()).isEqualTo(3);
    }

    @Test
    void shippingIsFreeAtOrAboveTheThreshold() {
        when(carts.findWithItemsByUserId(7L)).thenReturn(Optional.of(cart(item(1L, "25.00", 2))));

        CartResponse r = service.get(7L);

        assertThat(r.subtotal()).isEqualByComparingTo("50.00");
        assertThat(r.estimatedShippingFee()).isEqualByComparingTo("0.00");
        assertThat(r.total()).isEqualByComparingTo("50.00");
    }

    @Test
    void addingMoreThanAvailableStockIsRejected() {
        Product p = product(1L, "10.00", 2);
        when(products.findById(1L)).thenReturn(Optional.of(p));
        when(carts.findWithItemsByUserId(7L)).thenReturn(Optional.of(cart()));

        assertThatThrownBy(() -> service.addItem(7L, new AddCartItemRequest(1L, 3)))
                .isInstanceOf(ApiException.class).hasMessageContaining("Only 2");
    }

    private static Cart cart(CartItem... items) {
        Cart c = new Cart();
        c.setId(1L);
        c.getItems().addAll(List.of(items));
        return c;
    }

    private static CartItem item(long productId, String price, int qty) {
        CartItem i = new CartItem();
        i.setProduct(product(productId, price, 100));
        i.setQuantity(qty);
        return i;
    }

    private static Product product(long id, String price, int stock) {
        Product p = new Product();
        p.setId(id);
        p.setTitle("Book " + id);
        p.setPrice(new BigDecimal(price));
        p.setStockQuantity(stock);
        p.setActive(true);
        return p;
    }
}