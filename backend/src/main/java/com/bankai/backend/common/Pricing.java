package com.bankai.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Shipping rule: flat 5.00, free when subtotal >= 50.00.
 */
public final class Pricing {
    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50.00");
    public static final BigDecimal FLAT_SHIPPING_FEE = new BigDecimal("5.00");

    private Pricing() {
    }

    public static BigDecimal shippingFee(BigDecimal subtotal) {
        if (subtotal.signum() == 0 || subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return FLAT_SHIPPING_FEE;
    }

    public static BigDecimal lineTotal(BigDecimal unitPrice, int quantity) {
        return unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }
}