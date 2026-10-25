package com.bankai.backend.user;

import com.bankai.backend.common.ApiException;
import com.bankai.backend.common.PageResponse;
import com.bankai.backend.user.UserDtos.UpdateProfileRequest;
import com.bankai.backend.user.UserDtos.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository users;

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return UserResponse.from(find(userId));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest r) {
        User u = find(userId);
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone());
        return UserResponse.from(u);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listCustomers(Pageable pageable) {
        return PageResponse.of(users.findByRole(Role.CUSTOMER, pageable).map(UserResponse::from));
    }

    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}