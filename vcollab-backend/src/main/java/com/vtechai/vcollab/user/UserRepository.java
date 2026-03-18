package com.vtechai.vcollab.user;

import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.user.entity.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("""
        select u from User u
        left join u.profile profile
        where u.deletedAt is null
          and u.active = true
          and u.suspended = false
          and (
            :query is null
            or lower(u.username) like lower(concat('%', :query, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :query, '%'))
            or lower(coalesce(profile.bio, '')) like lower(concat('%', :query, '%'))
          )
          and (:role is null or u.role = :role)
        order by coalesce(profile.followerCount, 0) desc, u.createdAt desc
        """)
    Page<User> searchPublicUsers(
        @Param("query") String query,
        @Param("role") Role role,
        Pageable pageable
    );

    @Query("""
        select u from User u
        left join u.profile profile
        where u.deletedAt is null
          and (
            :search is null
            or lower(u.username) like lower(concat('%', :search, '%'))
            or lower(u.email) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
          and (:role is null or u.role = :role)
          and (:active is null or u.active = :active)
          and (:suspended is null or u.suspended = :suspended)
        """)
    Page<User> searchAdminUsers(
        @Param("search") String search,
        @Param("role") Role role,
        @Param("active") Boolean active,
        @Param("suspended") Boolean suspended,
        Pageable pageable
    );

    Page<User> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);

    @Query("""
        select u from User u
        where u.deletedAt is null
          and (
            lower(u.email) = lower(:identifier)
            or lower(u.username) = lower(:identifier)
          )
        """)
    Optional<User> findByLoginIdentifier(@Param("identifier") String identifier);

    long countByDeletedAtIsNull();
    long countByDeletedAtIsNullAndActiveTrueAndSuspendedFalse();
    long countByDeletedAtIsNullAndSuspendedTrue();

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByRoleAndDeletedAtIsNull(Role role);
}
