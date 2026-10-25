package com.bankai.backend.order;

import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = {"payment", "user"})
    Page<CustomerOrder> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"payment", "user"})
    Page<CustomerOrder> findByStatus(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"payment", "user"})
    Page<CustomerOrder> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"payment", "user", "items"})
    Optional<CustomerOrder> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = {"payment", "user", "items"})
    Optional<CustomerOrder> findWithDetailsById(Long id);

    /**
     * Row lock on the order: serialises cancellations / status changes of the same order.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.id = :id")
    Optional<CustomerOrder> findByIdForUpdate(@Param("id") Long id);

    @Query("select o.status, count(o) from CustomerOrder o group by o.status")
    List<Object[]> countGroupedByStatus();

    /**
     * Revenue = sum of totals of DELIVERED orders (their COD payment is marked PAID).
     */
    @Query("select sum(o.total) from CustomerOrder o where o.status = com.bankai.backend.order.OrderStatus.DELIVERED")
    BigDecimal sumDeliveredRevenue();
}