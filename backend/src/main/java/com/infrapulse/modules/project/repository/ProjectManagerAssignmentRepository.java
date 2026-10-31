package com.infrapulse.modules.project.repository;

import com.infrapulse.modules.project.entity.ProjectManagerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectManagerAssignmentRepository extends JpaRepository<ProjectManagerAssignment, String> {

    List<ProjectManagerAssignment> findByProjectIdOrderByAssignedAtDesc(String projectId);

    Optional<ProjectManagerAssignment> findFirstByProjectIdAndActiveTrue(String projectId);

    List<ProjectManagerAssignment> findByManagerIdAndActiveTrue(String managerId);
}
