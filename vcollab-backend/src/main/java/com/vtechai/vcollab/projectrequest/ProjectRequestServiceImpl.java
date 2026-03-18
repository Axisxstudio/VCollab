package com.vtechai.vcollab.projectrequest;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.enums.ProjectRequestStatus;
import com.vtechai.vcollab.exception.DuplicateResourceException;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestCreate;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestResponse;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestStatusUpdate;
import com.vtechai.vcollab.projectrequest.entity.ProjectRequest;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectRequestServiceImpl implements ProjectRequestService {
    private final ProjectRequestRepository projectRequestRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FeedPublisher feedPublisher;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ProjectRequestResponse create(ProjectRequestCreate request, UserPrincipal principal) {
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project not found");
        }
        if (project.getOwner().getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot request your own project");
        }

        projectRequestRepository.findByProjectIdAndRequesterId(project.getId(), principal.getId())
            .ifPresent(existing -> {
                throw new DuplicateResourceException("Project request already exists");
            });

        User requester = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectRequest projectRequest = ProjectRequest.builder()
            .project(project)
            .requester(requester)
            .owner(project.getOwner())
            .message(request.getMessage())
            .status(ProjectRequestStatus.PENDING)
            .build();

        ProjectRequest saved = projectRequestRepository.save(projectRequest);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.PROJECT_REQUEST_CREATED)
            .contentType(ContentType.PROJECT)
            .contentId(project.getId())
            .actorId(principal.getId())
            .actorName(requester.getUsername())
            .createdAt(Instant.now())
            .build());

        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(project.getOwner().getId())
            .actorId(requester.getId())
            .type(NotificationType.PROJECT_REQUEST)
            .contentType(ContentType.PROJECT)
            .contentId(project.getId())
            .message(requester.getUsername() + " requested access to your project: " + project.getTitle())
            .build());

        return toResponse(saved);
    }

    @Override
    public List<ProjectRequestResponse> listSent(UserPrincipal principal) {
        return projectRequestRepository.findByRequesterIdOrderByCreatedAtDesc(principal.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public List<ProjectRequestResponse> listReceived(UserPrincipal principal) {
        return projectRequestRepository.findByOwnerIdOrderByCreatedAtDesc(principal.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public ProjectRequestResponse updateStatus(Long id, ProjectRequestStatusUpdate request, UserPrincipal principal) {
        ProjectRequest projectRequest = projectRequestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project request not found"));
        if (!projectRequest.getOwner().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this request");
        }

        projectRequest.setStatus(request.getStatus());
        projectRequest.setRespondedAt(Instant.now());
        ProjectRequest saved = projectRequestRepository.save(projectRequest);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.PROJECT_REQUEST_UPDATED)
            .contentType(ContentType.PROJECT)
            .contentId(projectRequest.getProject().getId())
            .actorId(principal.getId())
            .actorName(projectRequest.getOwner().getUsername())
            .createdAt(Instant.now())
            .build());

        String statusLabel = request.getStatus().name().toLowerCase();
        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(projectRequest.getRequester().getId())
            .actorId(projectRequest.getOwner().getId())
            .type(NotificationType.PROJECT_REQUEST)
            .contentType(ContentType.PROJECT)
            .contentId(projectRequest.getProject().getId())
            .message("Your request for " + projectRequest.getProject().getTitle() + " was " + statusLabel + ".")
            .build());

        return toResponse(saved);
    }

    private ProjectRequestResponse toResponse(ProjectRequest request) {
        ProjectRequestResponse.ProjectSummary projectSummary = ProjectRequestResponse.ProjectSummary.builder()
            .id(request.getProject().getId())
            .title(request.getProject().getTitle())
            .thumbnail(request.getProject().getThumbnail())
            .slug(request.getProject().getSlug())
            .build();

        ProjectRequestResponse.UserSummary requester = ProjectRequestResponse.UserSummary.builder()
            .id(request.getRequester().getId())
            .username(request.getRequester().getUsername())
            .fullName(request.getRequester().getProfile() != null ? request.getRequester().getProfile().getFullName() : null)
            .profileImage(request.getRequester().getProfile() != null ? request.getRequester().getProfile().getProfileImage() : null)
            .build();

        ProjectRequestResponse.UserSummary owner = ProjectRequestResponse.UserSummary.builder()
            .id(request.getOwner().getId())
            .username(request.getOwner().getUsername())
            .fullName(request.getOwner().getProfile() != null ? request.getOwner().getProfile().getFullName() : null)
            .profileImage(request.getOwner().getProfile() != null ? request.getOwner().getProfile().getProfileImage() : null)
            .build();

        return ProjectRequestResponse.builder()
            .id(request.getId())
            .status(request.getStatus())
            .message(request.getMessage())
            .project(projectSummary)
            .requester(requester)
            .owner(owner)
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .respondedAt(request.getRespondedAt())
            .build();
    }
}
