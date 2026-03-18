package com.vtechai.vcollab.security;

import com.vtechai.vcollab.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        return userRepository.findByLoginIdentifier(identifier)
            .map(UserPrincipal::fromUser)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public UserDetails loadUserById(Long userId) {
        return userRepository.findById(userId)
            .map(UserPrincipal::fromUser)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
