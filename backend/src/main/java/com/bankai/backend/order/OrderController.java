package com.bankai.backend.order;

import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Paging;
import com.bankai.backend.order.OrderDtos.CheckoutRequest;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.order.OrderDtos.OrderSummaryResponse;
import com.bankai.backend.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody CheckoutRequest request) {
        return orderService.checkout(user.id(), request);
    }

    @GetMapping
    public PageResponse<OrderSummaryResponse> list(@AuthenticationPrincipal AuthUser user,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(defaultValue = "createdAt") String sort,
                                                   @RequestParam(defaultValue = "desc") String direction) {
        return orderService.listForUser(user.id(),
                Paging.of(page, size, sort, direction, OrderService.SORT_FIELDS, "createdAt"));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return orderService.getForUser(user.id(), id);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return orderService.cancelByCustomer(user.id(), id);
    }
}