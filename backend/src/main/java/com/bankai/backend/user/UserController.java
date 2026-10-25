package com.bankai.backend.user;


import com.bankai.backend.security.AuthUser;
import com.bankai.backend.user.UserDtos.UpdateProfileRequest;
import com.bankai.backend.user.UserDtos.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public UserResponse profile(@AuthenticationPrincipal AuthUser user) {
        return userService.me(user.id());
    }

    @PutMapping("/me")
    public UserResponse updateProfile(@AuthenticationPrincipal AuthUser user,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(user.id(), request);
    }
}