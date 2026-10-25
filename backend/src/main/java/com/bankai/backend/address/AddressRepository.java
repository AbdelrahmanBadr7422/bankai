package com.bankai.backend.address;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIdDesc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);
}