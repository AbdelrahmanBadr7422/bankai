package com.bankai.backend.common;

import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Builds a safe Pageable: whitelisted sort field, page size capped at 50.
 */
public final class Paging {
    private Paging() {
    }

    public static Pageable of(int page, int size, String sortBy, String direction,
                              Set<String> allowedFields, String defaultField) {
        String field = sortBy != null && allowedFields.contains(sortBy) ? sortBy : defaultField;
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(dir, field).and(Sort.by(Sort.Direction.ASC, "id"));
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), sort);
    }
}