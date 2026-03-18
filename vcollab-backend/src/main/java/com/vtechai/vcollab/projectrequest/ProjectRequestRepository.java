package com.vtechai.vcollab.projectrequest;

import com.vtechai.vcollab.projectrequest.entity.ProjectRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRequestRepository extends JpaRepository<ProjectRequest, Long> {
    Optional<ProjectRequest> findByProjectIdAndRequesterId(Long projectId, Long requesterId);
    List<ProjectRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    List<ProjectRequest> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
