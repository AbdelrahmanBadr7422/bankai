package com.bankai.backend.product;

import com.bankai.backend.category.Category;
import com.bankai.backend.category.CategoryRepository;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.common.PageResponse;
import com.bankai.backend.order.OrderItemRepository;
import com.bankai.backend.product.ProductDtos.ProductRequest;
import com.bankai.backend.product.ProductDtos.ProductResponse;

import java.math.RoundingMode;
import java.util.List;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {
    public static final Set<String> SORT_FIELDS = Set.of("title", "price", "createdAt");

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final OrderItemRepository orderItems;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(String search, Long categoryId, boolean includeInactive, Pageable pageable) {
        Specification<Product> spec = (root, q, cb) ->
                includeInactive ? cb.conjunction() : cb.isTrue(root.<Boolean>get("active"));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.<String>get("title")), like));
        }
        if (categoryId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        return PageResponse.of(products.findAll(spec, pageable).map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id, boolean includeInactive) {
        return products.findById(id)
                .filter(p -> includeInactive || p.isActive())
                .map(ProductResponse::from)
                .orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    @Transactional
    public ProductResponse create(ProductRequest r) {
        Category category = categories.findById(r.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category not found"));
        String isbn = r.isbn().trim().toUpperCase();
        if (products.existsByIsbn(isbn)) throw ApiException.conflict("A product with this ISBN already exists");
        Product p = new Product();
        apply(p, r, category);
        p.setActive(r.active() == null || r.active());
        return ProductResponse.from(products.save(p));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest r) {
        Product p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product not found"));
        Category category = categories.findById(r.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category not found"));
        String isbn = r.isbn().trim().toUpperCase();
        if (products.existsByIsbnAndIdNot(isbn, id))
            throw ApiException.conflict("A product with this ISBN already exists");
        apply(p, r, category);
        if (r.active() != null) p.setActive(r.active());
        return ProductResponse.from(p);
    }

    @Transactional
    public void delete(Long id) {
        Product p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product not found"));
        if (orderItems.existsByProductId(id)) {
            throw ApiException.conflict("Product appears in existing orders; deactivate it instead (active=false)");
        }
        products.delete(p);
        products.flush();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> lowStock(int threshold) {
        return products.findByActiveTrueAndStockQuantityLessThanEqual(threshold,
                        PageRequest.of(0, 50, Sort.by("stockQuantity").and(Sort.by("id"))))
                .stream().map(ProductResponse::from).toList();
    }

    private void apply(Product p, ProductRequest r, Category c) {
        p.setTitle(r.title().trim());
        p.setDescription(r.description());
        p.setAuthor(r.author().trim());
        p.setIsbn(r.isbn().trim().toUpperCase());
        p.setPrice(r.price().setScale(2, RoundingMode.HALF_UP));
        p.setStockQuantity(r.stockQuantity());
        p.setCoverImageUrl(r.coverImageUrl());
        p.setCategory(c);
    }
}