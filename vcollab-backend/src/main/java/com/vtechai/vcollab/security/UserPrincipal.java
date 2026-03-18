package com.vtechai.vcollab.security;

import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.user.entity.User;
import java.util.Collection;
import java.util.List;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class UserPrincipal implements UserDetails {
    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final Role role;
    private final boolean active;
    private final boolean suspended;

    private UserPrincipal(Long id, String username, String email, String password, Role role, boolean active, boolean suspended) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.active = active;
        this.suspended = suspended;
    }

    public static UserPrincipal fromUser(User user) {
        return new UserPrincipal(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPasswordHash(),
            user.getRole(),
            user.isActive(),
            user.isSuspended()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !suspended;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
