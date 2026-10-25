package com.bankai.backend.address;

import com.bankai.backend.address.AddressDtos.AddressRequest;
import com.bankai.backend.address.AddressDtos.AddressResponse;
import com.bankai.backend.common.ApiException;
import com.bankai.backend.user.UserRepository;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Every lookup is by (id, userId), so another customer's address behaves like a missing one (404).
 */
@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addresses;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<AddressResponse> list(Long userId) {
        return addresses.findByUserIdOrderByIdDesc(userId).stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest r) {
        Address a = new Address();
        a.setUser(users.getReferenceById(userId));
        apply(a, r);
        return AddressResponse.from(addresses.save(a));
    }

    @Transactional
    public AddressResponse update(Long userId, Long id, AddressRequest r) {
        Address a = owned(userId, id);
        apply(a, r);
        return AddressResponse.from(a);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        addresses.delete(owned(userId, id));
    }

    private Address owned(Long userId, Long id) {
        return addresses.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Address not found"));
    }

    private void apply(Address a, AddressRequest r) {
        a.setRecipientName(r.recipientName().trim());
        a.setPhone(r.phone().trim());
        a.setLine1(r.line1().trim());
        a.setLine2(r.line2());
        a.setCity(r.city().trim());
        a.setPostalCode(r.postalCode().trim());
        a.setCountry(r.country().trim());
    }
}