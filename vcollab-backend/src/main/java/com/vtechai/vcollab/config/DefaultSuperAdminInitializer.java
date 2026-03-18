package com.vtechai.vcollab.config;

import com.vtechai.vcollab.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DefaultSuperAdminInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DefaultSuperAdminInitializer.class);
    private static final String DEFAULT_BIO = "Default super admin account for VCollab platform operations.";
    private static final String LEGACY_USERNAME = "superadmin";
    private static final String LEGACY_EMAIL = "admin@vcollab.com";

    private final com.vtechai.vcollab.user.UserRepository userRepository;
    private final com.vtechai.vcollab.user.UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.username:VTNV}")
    private String username;

    @Value("${app.super-admin.email:vtnv@vcollab.local}")
    private String email;

    @Value("${app.super-admin.password:admin123}")
    private String password;

    @Value("${app.super-admin.full-name:VTech Super Admin}")
    private String fullName;

    public DefaultSuperAdminInitializer(
        com.vtechai.vcollab.user.UserRepository userRepository,
        com.vtechai.vcollab.user.UserProfileRepository userProfileRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        com.vtechai.vcollab.user.entity.User configuredSuperAdmin = findConfiguredSuperAdmin();
        if (configuredSuperAdmin != null) {
            configuredSuperAdmin.setPasswordHash(passwordEncoder.encode(password));
            userRepository.save(configuredSuperAdmin);
            ensureProfile(configuredSuperAdmin);
            return;
        }

        com.vtechai.vcollab.user.entity.User legacySuperAdmin = findLegacySuperAdmin();
        if (legacySuperAdmin != null) {
            upgradeLegacySuperAdmin(legacySuperAdmin);
            return;
        }

        if (userRepository.existsByRoleAndDeletedAtIsNull(Role.SUPER_ADMIN)) {
            log.info("Skipped default super admin bootstrap because a customized super admin already exists.");
            return;
        }

        if (userRepository.findByUsernameIgnoreCase(username).isPresent()
            || userRepository.findByEmailIgnoreCase(email).isPresent()) {
            log.warn("Skipped default super admin creation because the username or email is already in use.");
            return;
        }

        com.vtechai.vcollab.user.entity.User user = com.vtechai.vcollab.user.entity.User.builder()
            .email(email)
            .username(username)
            .passwordHash(passwordEncoder.encode(password))
            .role(Role.SUPER_ADMIN)
            .active(true)
            .suspended(false)
            .emailVerified(true)
            .build();

        userRepository.save(user);
        ensureProfile(user);

        log.info("Created default super admin account with username '{}'", username);
    }

    private com.vtechai.vcollab.user.entity.User findConfiguredSuperAdmin() {
        return userRepository.findByUsernameIgnoreCase(username)
            .filter(this::isActiveSuperAdmin)
            .or(() -> userRepository.findByEmailIgnoreCase(email).filter(this::isActiveSuperAdmin))
            .orElse(null);
    }

    private com.vtechai.vcollab.user.entity.User findLegacySuperAdmin() {
        return userRepository.findByUsernameIgnoreCase(LEGACY_USERNAME)
            .filter(this::isActiveSuperAdmin)
            .or(() -> userRepository.findByEmailIgnoreCase(LEGACY_EMAIL).filter(this::isActiveSuperAdmin))
            .orElse(null);
    }

    private boolean isActiveSuperAdmin(com.vtechai.vcollab.user.entity.User user) {
        return user.getRole() == Role.SUPER_ADMIN && user.getDeletedAt() == null;
    }

    private void upgradeLegacySuperAdmin(com.vtechai.vcollab.user.entity.User user) {
        boolean usernameTaken = userRepository.findByUsernameIgnoreCase(username)
            .filter(existing -> !existing.getId().equals(user.getId()))
            .isPresent();
        boolean emailTaken = userRepository.findByEmailIgnoreCase(email)
            .filter(existing -> !existing.getId().equals(user.getId()))
            .isPresent();

        if (usernameTaken || emailTaken) {
            log.warn("Skipped legacy super admin upgrade because the requested username or email is already in use.");
            return;
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.setSuspended(false);
        user.setEmailVerified(true);
        userRepository.save(user);
        ensureProfile(user);

        log.info("Upgraded legacy super admin account to username '{}'", username);
    }

    private void ensureProfile(com.vtechai.vcollab.user.entity.User user) {
        com.vtechai.vcollab.user.entity.UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> com.vtechai.vcollab.user.entity.UserProfile.builder().user(user).build());

        profile.setUser(user);
        profile.setFullName(fullName);
        if (profile.getBio() == null || profile.getBio().isBlank()) {
            profile.setBio(DEFAULT_BIO);
        }

        userProfileRepository.save(profile);
        user.setProfile(profile);
    }
}
