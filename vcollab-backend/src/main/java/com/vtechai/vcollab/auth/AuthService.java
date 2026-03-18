package com.vtechai.vcollab.auth;

import com.vtechai.vcollab.auth.dto.AuthResponse;
import com.vtechai.vcollab.auth.dto.ForgotPasswordRequest;
import com.vtechai.vcollab.auth.dto.LoginRequest;
import com.vtechai.vcollab.auth.dto.RegisterRequest;
import com.vtechai.vcollab.auth.dto.ResetPasswordRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.dto.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse me(UserPrincipal principal);
    void requestPasswordReset(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    boolean checkUsernameAvailability(String username);
}
