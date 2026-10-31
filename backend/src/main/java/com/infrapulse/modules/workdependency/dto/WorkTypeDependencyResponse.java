package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workdependency.entity.WorkTypeDependency;

import java.time.Instant;

public record WorkTypeDependencyResponse(
    String id,
    String projectId,
    String projectName,
    WorkType predecessorWorkType,
    String predecessorWorkTypeDisplayName,
    WorkType successorWorkType,
    String successorWorkTypeDisplayName,
    AssignmentStatus requiredPredecessorStatus,
    boolean requiresReleaseApproval,
    boolean isActive,
    int priority,
    String description,
    Instant createdAt,
    Instant updatedAt
) {
    public static WorkTypeDependencyResponse fromEntity(WorkTypeDependency entity) {
        return new WorkTypeDependencyResponse(
            entity.getId(),
            entity.getProject() != null ? entity.getProject().getId() : null,
            entity.getProject() != null ? entity.getProject().getProjectName() : "Global (All Projects)",
            entity.getPredecessorWorkType(),
            entity.getPredecessorWorkType().getDisplayName(),
            entity.getSuccessorWorkType(),
            entity.getSuccessorWorkType().getDisplayName(),
            entity.getRequiredPredecessorStatus(),
            entity.isRequiresReleaseApproval(),
            entity.isActive(),
            entity.getPriority(),
            entity.getDescription(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
