package com.bankai.backend.admin;

import com.bankai.backend.order.AdminDtos;
import com.bankai.backend.order.OrderDtos.OrderSummaryResponse;
import com.bankai.backend.order.OrderRepository;
import com.bankai.backend.order.OrderStatus;
import com.bankai.backend.product.ProductService;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.UserRepository;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final OrderRepository orders;
    private final UserRepository users;
    private final ProductService productService;

    @Value("${app.low-stock-threshold:5}")
    private int lowStockThreshold;

    @Transactional(readOnly = true)
    public AdminDtos.DashboardResponse summary() {
        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus s : OrderStatus.values()) byStatus.put(s, 0L);
        for (Object[] row : orders.countGroupedByStatus()) byStatus.put((OrderStatus) row[0], (Long) row[1]);

        BigDecimal revenue = orders.sumDeliveredRevenue();
        var recent = orders.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(OrderSummaryResponse::from).getContent();

        return new AdminDtos.DashboardResponse(orders.count(), revenue == null ? BigDecimal.ZERO : revenue, byStatus,
                users.findByRole(Role.CUSTOMER, PageRequest.of(0, 1)).getTotalElements(), lowStockThreshold,
                recent, productService.lowStock(lowStockThreshold));
    }
}