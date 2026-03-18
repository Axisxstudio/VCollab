package com.vtechai.vcollab.project;

import com.vtechai.vcollab.project.entity.ProjectMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMediaRepository extends JpaRepository<ProjectMedia, Long> {
    List<ProjectMedia> findByProjectIdOrderBySortOrderAscIdAsc(Long projectId);
    void deleteByProjectId(Long projectId);
}
