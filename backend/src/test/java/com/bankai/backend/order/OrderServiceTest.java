package com.bankai.backend.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bankai.backend.address.Address;
import com.bankai.backend.address.AddressRepository;
import com.bankai.backend.cart.Cart;
import com.bankai.backend.cart.CartItem;
import com.bankai.backend.cart.CartItemRepository;
import com.bankai.backend.cart.CartLine;
import com.bankai.backend.cart.CartRepository;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.order.OrderDtos.CheckoutRequest;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.payment.Payment;
import com.bankai.backend.payment.PaymentMethod;
import com.bankai.backend.payment.PaymentStatus;
import com.bankai.backend.product.Product;
import com.bankai.backend.product.ProductRepository;
import com.bankai.backend.user.User;
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
class OrderServiceTest {
    @Mock
    OrderRepository orders;
    @Mock
    ProductRepository products;
    @Mock
    CartRepository carts;
    @Mock
    CartItemRepository cartItems;
    @Mock
    AddressRepository addresses;
    @Mock
    UserRepository users;
    @InjectMocks
    OrderService service;

    @Test
    void checkoutUsesDatabasePricesRecalculatesTotalsAndDecrementsStock() {
        Product p1 = product(1L, "20.00", 5);
        Product p2 = product(2L, "7.50", 3);
        Cart cart = new Cart();
        cart.setId(10L);
        cart.getItems().add(new CartItem());
        when(addresses.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(address()));
        when(carts.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItems.findLines(10L)).thenReturn(List.of(new CartLine(1L, 2), new CartLine(2L, 1)));
        when(products.findAllByIdForUpdate(List.of(1L, 2L))).thenReturn(List.of(p1, p2));
        when(users.getReferenceById(1L)).thenReturn(user(1L));
        when(orders.save(any(CustomerOrder.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse r = service.checkout(1L, new CheckoutRequest(5L, null));

        assertThat(r.subtotal()).isEqualByComparingTo("47.50");
        assertThat(r.shippingFee()).isEqualByComparingTo("5.00");
        assertThat(r.total()).isEqualByComparingTo("52.50");
        assertThat(r.status()).isEqualTo(OrderStatus.PENDING);
        assertThat(r.paymentMethod()).isEqualTo(PaymentMethod.COD);
        assertThat(r.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(r.items()).hasSize(2);
        assertThat(r.items().get(0).unitPrice()).isEqualByComparingTo("20.00");
        assertThat(p1.getStockQuantity()).isEqualTo(3);
        assertThat(p2.getStockQuantity()).isEqualTo(2);
        assertThat(cart.getItems()).isEmpty();
    }

    @Test
    void checkoutWithInsufficientStockCreatesNoOrder() {
        Product p = product(1L, "20.00", 1);
        Cart cart = new Cart();
        cart.setId(10L);
        when(addresses.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(address()));
        when(carts.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItems.findLines(10L)).thenReturn(List.of(new CartLine(1L, 2)));
        when(products.findAllByIdForUpdate(List.of(1L))).thenReturn(List.of(p));

        assertThatThrownBy(() -> service.checkout(1L, new CheckoutRequest(5L, PaymentMethod.COD)))
                .isInstanceOf(ApiException.class).hasMessageContaining("Insufficient stock");
        verify(orders, never()).save(any());
    }

    @Test
    void checkoutRejectsAnotherCustomersAddress() {
        when(addresses.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.checkout(1L, new CheckoutRequest(5L, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("Address not found");
    }

    @Test
    void cancellationRestoresStockExactlyOnce() {
        Product p = product(1L, "10.00", 3);
        CustomerOrder order = order(1L, OrderStatus.PENDING, 1L, 2);
        when(orders.findByIdForUpdate(99L)).thenReturn(Optional.of(order));
        when(products.findAllByIdForUpdate(List.of(1L))).thenReturn(List.of(p));

        service.cancelByCustomer(1L, 99L);

        assertThat(p.getStockQuantity()).isEqualTo(5);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getPayment().getStatus()).isEqualTo(PaymentStatus.CANCELLED);

        assertThatThrownBy(() -> service.cancelByCustomer(1L, 99L)).isInstanceOf(ApiException.class);
        assertThat(p.getStockQuantity()).isEqualTo(5);
    }

    @Test
    void customerCannotCancelAnotherCustomersOrder() {
        when(orders.findByIdForUpdate(99L)).thenReturn(Optional.of(order(1L, OrderStatus.PENDING, 1L, 1)));

        assertThatThrownBy(() -> service.cancelByCustomer(2L, 99L))
                .isInstanceOf(ApiException.class).hasMessageContaining("Order not found");
    }

    @Test
    void customerCannotCancelOnceOrderIsConfirmed() {
        when(orders.findByIdForUpdate(99L)).thenReturn(Optional.of(order(1L, OrderStatus.CONFIRMED, 1L, 1)));

        assertThatThrownBy(() -> service.cancelByCustomer(1L, 99L)).isInstanceOf(ApiException.class);
        verify(products, never()).findAllByIdForUpdate(any());
    }

    @Test
    void adminStatusTransitionsAreValidated() {
        when(orders.findByIdForUpdate(99L)).thenReturn(Optional.of(order(1L, OrderStatus.PENDING, 1L, 1)));
        assertThatThrownBy(() -> service.updateStatus(99L, OrderStatus.DELIVERED)).isInstanceOf(ApiException.class);

        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.PENDING)).isFalse();
        assertThat(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.CONFIRMED)).isFalse();
        assertThat(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.SHIPPED)).isTrue();
    }

    @Test
    void deliveringAnOrderMarksCashPaymentAsPaid() {
        CustomerOrder order = order(1L, OrderStatus.SHIPPED, 1L, 1);
        when(orders.findByIdForUpdate(99L)).thenReturn(Optional.of(order));

        service.updateStatus(99L, OrderStatus.DELIVERED);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(order.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getPayment().getPaidAt()).isNotNull();
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@test.local");
        return u;
    }

    private static Address address() {
        Address a = new Address();
        a.setRecipientName("Ann");
        a.setPhone("123");
        a.setLine1("1 Main St");
        a.setCity("Cairo");
        a.setPostalCode("11511");
        a.setCountry("Egypt");
        return a;
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

    private static CustomerOrder order(long userId, OrderStatus status, long productId, int qty) {
        CustomerOrder o = new CustomerOrder();
        o.setId(99L);
        o.setOrderNumber("BK-TEST");
        o.setUser(user(userId));
        o.setStatus(status);
        o.setSubtotal(BigDecimal.TEN);
        o.setShippingFee(BigDecimal.ZERO);
        o.setTotal(BigDecimal.TEN);
        OrderItem i = new OrderItem();
        i.setOrder(o);
        i.setProductId(productId);
        i.setProductTitle("Book");
        i.setUnitPrice(BigDecimal.TEN);
        i.setQuantity(qty);
        i.setLineTotal(BigDecimal.TEN);
        o.getItems().add(i);
        Payment pay = new Payment();
        pay.setOrder(o);
        pay.setMethod(PaymentMethod.COD);
        pay.setStatus(PaymentStatus.PENDING);
        pay.setAmount(BigDecimal.TEN);
        o.setPayment(pay);
        return o;
    }
}