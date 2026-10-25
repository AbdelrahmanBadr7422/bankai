package com.bankai.backend.admin;

import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Paging;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.order.OrderDtos.OrderSummaryResponse;
import com.bankai.backend.order.OrderDtos.UpdateOrderStatusRequest;
import com.bankai.backend.order.OrderService;
import com.bankai.backend.order.OrderStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService orderService;

    @GetMapping
    public PageResponse<OrderSummaryResponse> list(@RequestParam(required = false) OrderStatus status,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size,
                                                   @RequestParam(defaultValue = "createdAt") String sort,
                                                   @RequestParam(defaultValue = "desc") String direction) {
        return orderService.listAll(status,
                Paging.of(page, size, sort, direction, OrderService.SORT_FIELDS, "createdAt"));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.getAny(id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.status());
    }
}