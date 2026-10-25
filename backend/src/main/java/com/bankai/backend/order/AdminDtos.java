package com.bankai.backend.order;

import com.bankai.backend.order.OrderDtos.OrderSummaryResponse;
import com.bankai.backend.product.ProductDtos.ProductResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record DashboardResponse(long totalOrders, BigDecimal totalRevenue, Map<OrderStatus, Long> ordersByStatus,
                                    long totalCustomers, int lowStockThreshold,
                                    List<OrderSummaryResponse> recentOrders, List<ProductResponse> lowStockProducts) {
    }
}