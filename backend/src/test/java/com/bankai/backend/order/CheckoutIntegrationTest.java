package com.bankai.backend.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bankai.backend.AbstractIntegrationTest;
import com.bankai.backend.address.Address;
import com.bankai.backend.cart.CartDtos.AddCartItemRequest;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.order.OrderDtos.CheckoutRequest;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.payment.PaymentMethod;
import com.bankai.backend.product.Product;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

class CheckoutIntegrationTest extends AbstractIntegrationTest {

    @Test
    void checkoutComputesTotalsDecrementsStockAndClearsCart() {
        User user = newUser(Role.CUSTOMER);
        Product book = newProduct("10.00", 10);

        OrderResponse order = placeOrder(user, book, 3);

        assertThat(order.subtotal()).isEqualByComparingTo("30.00");
        assertThat(order.shippingFee()).isEqualByComparingTo("5.00");
        assertThat(order.total()).isEqualByComparingTo("35.00");
        assertThat(stockOf(book)).isEqualTo(7);
        assertThat(cartService.get(user.getId()).items()).isEmpty();
    }

    @Test
    void concurrentCheckoutsNeverOversell() throws Exception {
        Product book = newProduct("10.00", 3);
        int buyers = 8;
        List<long[]> buyerIds = new ArrayList<>();
        for (int i = 0; i < buyers; i++) {
            User u = newUser(Role.CUSTOMER);
            Address a = newAddress(u);
            cartService.addItem(u.getId(), new AddCartItemRequest(book.getId(), 1));
            buyerIds.add(new long[]{u.getId(), a.getId()});
        }

        ExecutorService pool = Executors.newFixedThreadPool(buyers);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger succeeded = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (long[] ids : buyerIds) {
            futures.add(pool.submit(() -> {
                start.await();
                try {
                    orderService.checkout(ids[0], new CheckoutRequest(ids[1], PaymentMethod.COD));
                    succeeded.incrementAndGet();
                } catch (ApiException e) {
                    rejected.incrementAndGet();
                }
                return null;
            }));
        }
        start.countDown();
        for (Future<?> f : futures) f.get(60, TimeUnit.SECONDS);
        pool.shutdown();

        assertThat(succeeded.get()).isEqualTo(3);
        assertThat(rejected.get()).isEqualTo(5);
        assertThat(stockOf(book)).isZero();
    }

    @Test
    void failedCheckoutRollsBackStockOrderAndCart() {
        User user = newUser(Role.CUSTOMER);
        Address address = newAddress(user);
        Product first = newProduct("10.00", 10);  // lower id: processed (and decremented) first
        Product second = newProduct("5.00", 5);
        cartService.addItem(user.getId(), new AddCartItemRequest(first.getId(), 2));
        cartService.addItem(user.getId(), new AddCartItemRequest(second.getId(), 2));

        second.setStockQuantity(1); // another buyer took the stock after the item was added to the cart
        products.save(second);

        assertThatThrownBy(() -> orderService.checkout(user.getId(), new CheckoutRequest(address.getId(), PaymentMethod.COD)))
                .isInstanceOf(ApiException.class);

        assertThat(stockOf(first)).isEqualTo(10);
        assertThat(stockOf(second)).isEqualTo(1);
        assertThat(orderService.listForUser(user.getId(), PageRequest.of(0, 10)).totalElements()).isZero();
        assertThat(cartService.get(user.getId()).items()).hasSize(2);
    }

    @Test
    void cancellationRestoresStockAndCannotBeRepeated() {
        User user = newUser(Role.CUSTOMER);
        Product book = newProduct("10.00", 10);
        OrderResponse order = placeOrder(user, book, 4);
        assertThat(stockOf(book)).isEqualTo(6);

        orderService.cancelByCustomer(user.getId(), order.id());
        assertThat(stockOf(book)).isEqualTo(10);

        assertThatThrownBy(() -> orderService.cancelByCustomer(user.getId(), order.id()))
                .isInstanceOf(ApiException.class);
        assertThat(stockOf(book)).isEqualTo(10);
    }

    @Test
    void concurrentCancellationsRestoreStockOnlyOnce() throws Exception {
        User user = newUser(Role.CUSTOMER);
        Product book = newProduct("10.00", 10);
        OrderResponse order = placeOrder(user, book, 4);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger succeeded = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            futures.add(pool.submit(() -> {
                start.await();
                try {
                    orderService.cancelByCustomer(user.getId(), order.id());
                    succeeded.incrementAndGet();
                } catch (ApiException ignored) {
                    // the second cancellation must be rejected
                }
                return null;
            }));
        }
        start.countDown();
        for (Future<?> f : futures) f.get(60, TimeUnit.SECONDS);
        pool.shutdown();

        assertThat(succeeded.get()).isEqualTo(1);
        assertThat(stockOf(book)).isEqualTo(10);
    }
}