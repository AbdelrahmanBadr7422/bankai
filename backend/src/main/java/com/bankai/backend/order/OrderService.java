package com.bankai.backend.order;

import com.bankai.backend.address.Address;
import com.bankai.backend.address.AddressRepository;
import com.bankai.backend.cart.Cart;
import com.bankai.backend.cart.CartItemRepository;
import com.bankai.backend.cart.CartLine;
import com.bankai.backend.cart.CartRepository;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Pricing;
import com.bankai.backend.order.OrderDtos.CheckoutRequest;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.order.OrderDtos.OrderSummaryResponse;
import com.bankai.backend.payment.Payment;
import com.bankai.backend.payment.PaymentMethod;
import com.bankai.backend.payment.PaymentStatus;
import com.bankai.backend.product.Product;
import com.bankai.backend.product.ProductRepository;
import com.bankai.backend.user.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {
    public static final Set<String> SORT_FIELDS = Set.of("createdAt", "total");

    private final OrderRepository orders;
    private final ProductRepository products;
    private final CartRepository carts;
    private final CartItemRepository cartItems;
    private final AddressRepository addresses;
    private final UserRepository users;

    /**
     * One transaction: lock products (id order) -> validate -> decrement stock -> create order,
     * items and payment -> clear cart. Any exception rolls everything back.
     * Products are loaded only AFTER the lock query, so stock is always read fresh under the lock.
     */
    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest req) {
        PaymentMethod method = req.paymentMethod() == null ? PaymentMethod.COD : req.paymentMethod();
        Address address = addresses.findByIdAndUserId(req.addressId(), userId)
                .orElseThrow(() -> ApiException.notFound("Address not found"));
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> ApiException.badRequest("Cart is empty"));
        List<CartLine> lines = cartItems.findLines(cart.getId());
        if (lines.isEmpty()) throw ApiException.badRequest("Cart is empty");

        Map<Long, Product> locked = lockProducts(lines.stream().map(CartLine::productId).toList());

        CustomerOrder order = new CustomerOrder();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartLine line : lines) {
            Product p = locked.get(line.productId());
            int qty = line.quantity();
            if (p == null || !p.isActive()) {
                throw ApiException.conflict("A product in your cart is no longer available");
            }
            if (p.getStockQuantity() < qty) {
                throw ApiException.conflict("Insufficient stock for '" + p.getTitle() + "': requested " + qty
                        + ", available " + p.getStockQuantity());
            }
            p.setStockQuantity(p.getStockQuantity() - qty);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(p.getId());
            item.setProductTitle(p.getTitle());
            item.setUnitPrice(p.getPrice());
            item.setQuantity(qty);
            item.setLineTotal(Pricing.lineTotal(p.getPrice(), qty));
            order.getItems().add(item);
            subtotal = subtotal.add(item.getLineTotal());
        }

        BigDecimal shipping = Pricing.shippingFee(subtotal);
        order.setOrderNumber(newOrderNumber());
        order.setUser(users.getReferenceById(userId));
        order.setStatus(OrderStatus.PENDING);
        order.setSubtotal(subtotal);
        order.setShippingFee(shipping);
        order.setTotal(subtotal.add(shipping));
        order.setShipRecipientName(address.getRecipientName());
        order.setShipPhone(address.getPhone());
        order.setShipLine1(address.getLine1());
        order.setShipLine2(address.getLine2());
        order.setShipCity(address.getCity());
        order.setShipPostalCode(address.getPostalCode());
        order.setShipCountry(address.getCountry());

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(order.getTotal());
        order.setPayment(payment);

        orders.save(order);
        cart.getItems().clear(); // only reached when everything above succeeded
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listForUser(Long userId, Pageable pageable) {
        return PageResponse.of(orders.findByUserId(userId, pageable).map(OrderSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse getForUser(Long userId, Long orderId) {
        return orders.findByIdAndUserId(orderId, userId).map(OrderResponse::from)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
    }

    /**
     * Customers may cancel only their own PENDING orders.
     */
    @Transactional
    public OrderResponse cancelByCustomer(Long userId, Long orderId) {
        CustomerOrder order = orders.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw ApiException.conflict("Only PENDING orders can be cancelled (current status: " + order.getStatus() + ")");
        }
        cancelAndRestock(order);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listAll(OrderStatus status, Pageable pageable) {
        var page = status == null ? orders.findAll(pageable) : orders.findByStatus(status, pageable);
        return PageResponse.of(page.map(OrderSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse getAny(Long orderId) {
        return orders.findWithDetailsById(orderId).map(OrderResponse::from)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
    }

    /**
     * Admin only. The order row is locked, so concurrent cancel/status requests are serialised.
     */
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus target) {
        CustomerOrder order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!order.getStatus().canTransitionTo(target)) {
            throw ApiException.conflict("Cannot change order status from " + order.getStatus() + " to " + target);
        }
        if (target == OrderStatus.CANCELLED) {
            cancelAndRestock(order);
        } else {
            order.setStatus(target);
            if (target == OrderStatus.DELIVERED) { // cash collected on delivery
                order.getPayment().setStatus(PaymentStatus.PAID);
                order.getPayment().setPaidAt(Instant.now());
            }
        }
        return OrderResponse.from(order);
    }

    /**
     * Callers hold the order row lock and have verified the status is PENDING/CONFIRMED.
     * After this the status is CANCELLED, so a second cancellation is rejected: stock is restored once.
     */
    private void cancelAndRestock(CustomerOrder order) {
        Map<Long, Product> locked = lockProducts(order.getItems().stream().map(OrderItem::getProductId).toList());
        for (OrderItem item : order.getItems()) {
            Product p = locked.get(item.getProductId());
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.getPayment().setStatus(PaymentStatus.CANCELLED);
    }

    private Map<Long, Product> lockProducts(Collection<Long> ids) {
        List<Long> sorted = ids.stream().distinct().sorted().toList();
        return products.findAllByIdForUpdate(sorted).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private static String newOrderNumber() {
        return "BK-" + LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}