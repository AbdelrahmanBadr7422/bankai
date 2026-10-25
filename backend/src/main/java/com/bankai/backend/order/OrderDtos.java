package com.bankai.backend.order;

import com.bankai.backend.payment.Payment;
import com.bankai.backend.payment.PaymentMethod;
import com.bankai.backend.payment.PaymentStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {
    }

    public record CheckoutRequest(@NotNull Long addressId, PaymentMethod paymentMethod) {
    }

    public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {
    }

    public record OrderItemResponse(Long productId, String productTitle, BigDecimal unitPrice, int quantity,
                                    BigDecimal lineTotal) {
    }

    public record ShippingAddressResponse(String recipientName, String phone, String line1, String line2,
                                          String city, String postalCode, String country) {
    }

    public record OrderSummaryResponse(Long id, String orderNumber, OrderStatus status, PaymentStatus paymentStatus,
                                       BigDecimal total, Instant createdAt, String customerEmail) {
        public static OrderSummaryResponse from(CustomerOrder o) {
            return new OrderSummaryResponse(o.getId(), o.getOrderNumber(), o.getStatus(), o.getPayment().getStatus(),
                    o.getTotal(), o.getCreatedAt(), o.getUser().getEmail());
        }
    }

    public record OrderResponse(Long id, String orderNumber, OrderStatus status, PaymentMethod paymentMethod,
                                PaymentStatus paymentStatus, BigDecimal subtotal, BigDecimal shippingFee,
                                BigDecimal total, ShippingAddressResponse shippingAddress,
                                List<OrderItemResponse> items, Instant createdAt, String customerEmail) {
        public static OrderResponse from(CustomerOrder o) {
            Payment pay = o.getPayment();
            return new OrderResponse(o.getId(), o.getOrderNumber(), o.getStatus(), pay.getMethod(), pay.getStatus(),
                    o.getSubtotal(), o.getShippingFee(), o.getTotal(),
                    new ShippingAddressResponse(o.getShipRecipientName(), o.getShipPhone(), o.getShipLine1(),
                            o.getShipLine2(), o.getShipCity(), o.getShipPostalCode(), o.getShipCountry()),
                    o.getItems().stream().map(i -> new OrderItemResponse(i.getProductId(), i.getProductTitle(),
                            i.getUnitPrice(), i.getQuantity(), i.getLineTotal())).toList(),
                    o.getCreatedAt(), o.getUser().getEmail());
        }
    }
}