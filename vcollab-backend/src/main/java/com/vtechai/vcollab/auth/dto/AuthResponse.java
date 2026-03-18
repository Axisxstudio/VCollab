package com.vtechai.vcollab.auth.dto;

import com.vtechai.vcollab.user.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;
}
