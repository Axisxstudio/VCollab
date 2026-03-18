package com.vtechai.vcollab.projectrequest;

import com.vtechai.vcollab.projectrequest.dto.ProjectRequestCreate;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestResponse;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestStatusUpdate;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;

public interface ProjectRequestService {
    ProjectRequestResponse create(ProjectRequestCreate request, UserPrincipal principal);
    List<ProjectRequestResponse> listSent(UserPrincipal principal);
    List<ProjectRequestResponse> listReceived(UserPrincipal principal);
    ProjectRequestResponse updateStatus(Long id, ProjectRequestStatusUpdate request, UserPrincipal principal);
}
