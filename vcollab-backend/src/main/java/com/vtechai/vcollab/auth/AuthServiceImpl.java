package com.vtechai.vcollab.auth;

import com.vtechai.vcollab.auth.dto.AuthResponse;
import com.vtechai.vcollab.auth.dto.ForgotPasswordRequest;
import com.vtechai.vcollab.auth.dto.LoginRequest;
import com.vtechai.vcollab.auth.dto.RegisterRequest;
import com.vtechai.vcollab.auth.dto.ResetPasswordRequest;
import com.vtechai.vcollab.auth.entity.PasswordResetToken;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.exception.DuplicateResourceException;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.exception.UnauthorizedException;
import com.vtechai.vcollab.security.JwtTokenProvider;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserProfileRepository;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.dto.UserResponse;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("Super admin registration is not allowed");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already taken");
        }

        User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole())
            .active(true)
            .suspended(false)
            .emailVerified(false)
            .build();

        UserProfile profile = UserProfile.builder()
            .fullName(request.getFullName())
            .user(user)
            .build();

        user.setProfile(profile);
        userRepository.save(user);
        userProfileRepository.save(profile);

        UserResponse userResponse = UserResponse.fromUser(user);
        String token = tokenProvider.generateToken(UserPrincipal.fromUser(user));
        return new AuthResponse(token, userResponse);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid username/email or password");
        }

        User user = userRepository.findByLoginIdentifier(identifier)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        UserResponse userResponse = UserResponse.fromUser(user);
        String token = tokenProvider.generateToken(UserPrincipal.fromUser(user));
        return new AuthResponse(token, userResponse);
    }

    @Override
    public UserResponse me(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.fromUser(user);
    }

    @Override
    public void requestPasswordReset(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(request.getEmail()).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString().replace("-", "");
            PasswordResetToken token = PasswordResetToken.builder()
                .token(rawToken)
                .user(user)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
            passwordResetTokenRepository.save(token);
            log.info("Password reset token for {}: {}", user.getEmail(), rawToken);
        });
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
            .findByTokenAndUsedAtIsNull(request.getToken())
            .orElseThrow(() -> new UnauthorizedException("Invalid or expired reset token"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Reset token expired");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);
    }

    @Override
    public boolean checkUsernameAvailability(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }
        return !userRepository.existsByUsername(username.trim());
    }
}
