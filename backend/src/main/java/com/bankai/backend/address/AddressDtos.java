package com.bankai.backend.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AddressDtos {
    private AddressDtos() {
    }

    public record AddressRequest(
            @NotBlank @Size(max = 120) String recipientName,
            @NotBlank @Size(max = 30) String phone,
            @NotBlank @Size(max = 255) String line1,
            @Size(max = 255) String line2,
            @NotBlank @Size(max = 100) String city,
            @NotBlank @Size(max = 20) String postalCode,
            @NotBlank @Size(max = 100) String country) {
    }

    public record AddressResponse(Long id, String recipientName, String phone, String line1, String line2,
                                  String city, String postalCode, String country) {
        public static AddressResponse from(Address a) {
            return new AddressResponse(a.getId(), a.getRecipientName(), a.getPhone(), a.getLine1(), a.getLine2(),
                    a.getCity(), a.getPostalCode(), a.getCountry());
        }
    }
}