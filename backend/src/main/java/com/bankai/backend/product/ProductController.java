package com.bankai.backend.product;

import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Paging;
import com.bankai.backend.product.ProductDtos.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> list(@RequestParam(required = false) String search,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "12") int size,
                                              @RequestParam(defaultValue = "createdAt") String sort,
                                              @RequestParam(defaultValue = "desc") String direction) {
        return productService.list(search, categoryId, false,
                Paging.of(page, size, sort, direction, ProductService.SORT_FIELDS, "createdAt"));
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.get(id, false);
    }
}