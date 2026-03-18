package com.vtechai.vcollab.auth;

import com.vtechai.vcollab.auth.dto.AuthResponse;
import com.vtechai.vcollab.auth.dto.ForgotPasswordRequest;
import com.vtechai.vcollab.auth.dto.LoginRequest;
import com.vtechai.vcollab.auth.dto.RegisterRequest;
import com.vtechai.vcollab.auth.dto.ResetPasswordRequest;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.exception.UnauthorizedException;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Not authenticated");
        }
        UserResponse response = authService.me(principal);
        return ResponseEntity.ok(ApiResponse.ok("Session user", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(
            "If an account exists, a reset link has been sent.",
            null
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password updated", null));
    }

    @GetMapping("/check-username")
    public ResponseEntity<ApiResponse<Boolean>> checkUsername(String username) {
        boolean available = authService.checkUsernameAvailability(username);
        return ResponseEntity.ok(ApiResponse.ok(
            available ? "Username is available" : "Username is already taken",
            available
        ));
    }
}
