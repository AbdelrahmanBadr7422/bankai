package com.bankai.backend.category;

import com.bankai.backend.category.CategoryDtos.CategoryRequest;
import com.bankai.backend.category.CategoryDtos.CategoryResponse;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.product.ProductRepository;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categories.findAll(Sort.by("name")).stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest r) {
        String name = r.name().trim();
        if (categories.existsByNameIgnoreCase(name)) throw ApiException.conflict("Category name already exists");
        Category c = new Category();
        c.setName(name);
        c.setDescription(r.description());
        return CategoryResponse.from(categories.save(c));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest r) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
        String name = r.name().trim();
        if (categories.existsByNameIgnoreCaseAndIdNot(name, id))
            throw ApiException.conflict("Category name already exists");
        c.setName(name);
        c.setDescription(r.description());
        return CategoryResponse.from(c);
    }

    @Transactional
    public void delete(Long id) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
        if (products.existsByCategoryId(id)) throw ApiException.conflict("Category still contains products");
        categories.delete(c);
    }
}