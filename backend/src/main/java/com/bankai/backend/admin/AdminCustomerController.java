package com.bankai.backend.admin;

import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Paging;
import com.bankai.backend.user.UserDtos.UserResponse;
import com.bankai.backend.user.UserService;

import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {
    private final UserService userService;

    @GetMapping
    public PageResponse<UserResponse> list(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @RequestParam(defaultValue = "createdAt") String sort,
                                           @RequestParam(defaultValue = "desc") String direction) {
        return userService.listCustomers(Paging.of(page, size, sort, direction, Set.of("createdAt", "email"), "createdAt"));
    }
}