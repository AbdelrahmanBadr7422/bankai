package com.bankai.backend.address;

import com.bankai.backend.address.AddressDtos.AddressRequest;
import com.bankai.backend.address.AddressDtos.AddressResponse;
import com.bankai.backend.security.AuthUser;
import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @GetMapping
    public List<AddressResponse> list(@AuthenticationPrincipal AuthUser user) {
        return addressService.list(user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddressRequest request) {
        return addressService.create(user.id(), request);
    }

    @PutMapping("/{id}")
    public AddressResponse update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        addressService.delete(user.id(), id);
    }
}