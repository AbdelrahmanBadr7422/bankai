package com.bankai.backend.admin;

import com.bankai.backend.common.PageResponse;
import com.bankai.backend.common.Paging;
import com.bankai.backend.product.ProductDtos.ProductRequest;
import com.bankai.backend.product.ProductDtos.ProductResponse;
import com.bankai.backend.product.ProductService;
import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {
    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> list(@RequestParam(required = false) String search,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              @RequestParam(defaultValue = "createdAt") String sort,
                                              @RequestParam(defaultValue = "desc") String direction) {
        return productService.list(search, categoryId, true,
                Paging.of(page, size, sort, direction, ProductService.SORT_FIELDS, "createdAt"));
    }

    @GetMapping("/low-stock")
    public List<ProductResponse> lowStock(@RequestParam(defaultValue = "5") int threshold) {
        return productService.lowStock(threshold);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.get(id, true);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}