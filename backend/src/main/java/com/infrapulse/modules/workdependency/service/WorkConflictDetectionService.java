package com.infrapulse.modules.workdependency.service;

import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.dto.SchedulingConflictDetail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkConflictDetectionService {

    private static final Logger log = LoggerFactory.getLogger(WorkConflictDetectionService.class);

    private static final List<AssignmentStatus> ACTIVE_STATUSES = List.of(
        AssignmentStatus.ASSIGNED,
        AssignmentStatus.ACCEPTED,
        AssignmentStatus.IN_PROGRESS,
        AssignmentStatus.SUBMITTED_FOR_REVIEW
    );

    private final WorkAssignmentRepository workAssignmentRepository;

    public WorkConflictDetectionService(WorkAssignmentRepository workAssignmentRepository) {
        this.workAssignmentRepository = workAssignmentRepository;
    }

    /**
     * Checks for duplicate and scheduling conflicts within the same project and work zone.
     * Unrelated zones or projects are NOT evaluated or blocked.
     * Cancelled or rejected assignments are not treated as active conflicts.
     */
    public List<SchedulingConflictDetail> detectConflicts(
        String projectId,
        String workZoneId,
        WorkType workType,
        LocalDate plannedStartDate,
        LocalDate targetEndDate,
        String excludeAssignmentId
    ) {
        List<SchedulingConflictDetail> conflicts = new ArrayList<>();

        List<WorkAssignment> activeAssignments = workAssignmentRepository.findActiveInZone(
            projectId,
            workZoneId,
            ACTIVE_STATUSES
        );

        for (WorkAssignment active : activeAssignments) {
            if (excludeAssignmentId != null && active.getId().equals(excludeAssignmentId)) {
                continue;
            }

            // 1. Check for Duplicate Activity (same work type already active in this work zone)
            if (active.getWorkType() == workType) {
                conflicts.add(new SchedulingConflictDetail(
                    "DUPLICATE_ACTIVITY",
                    active.getAssignmentCode(),
                    active.getWorkType(),
                    active.getWorkType().getDisplayName(),
                    active.getStatus(),
                    active.getVendor() != null ? active.getVendor().getCompanyName() : null,
                    active.getPlannedStartDate(),
                    active.getTargetEndDate(),
                    "Duplicate activity: An active assignment for " + workType.getDisplayName() +
                    " (" + active.getAssignmentCode() + ") is already in progress in this work zone (Status: " +
                    active.getStatus() + ")."
                ));
                continue;
            }

            // 2. Check for Overlapping Incompatible Work in the same physical work zone
            if (plannedStartDate != null && targetEndDate != null &&
                active.getPlannedStartDate() != null && active.getTargetEndDate() != null) {

                boolean datesOverlap = !(targetEndDate.isBefore(active.getPlannedStartDate()) ||
                                         plannedStartDate.isAfter(active.getTargetEndDate()));

                if (datesOverlap) {
                    conflicts.add(new SchedulingConflictDetail(
                        "OVERLAPPING_INCOMPATIBLE_WORK",
                        active.getAssignmentCode(),
                        active.getWorkType(),
                        active.getWorkType().getDisplayName(),
                        active.getStatus(),
                        active.getVendor() != null ? active.getVendor().getCompanyName() : null,
                        active.getPlannedStartDate(),
                        active.getTargetEndDate(),
                        "Scheduling conflict: Active assignment " + active.getAssignmentCode() + " (" +
                        active.getWorkType().getDisplayName() + ") occupies this work zone from " +
                        active.getPlannedStartDate() + " to " + active.getTargetEndDate() +
                        ", overlapping with the requested schedule."
                    ));
                }
            }
        }

        // Also check if the work type is already COMPLETED in this zone
        List<WorkAssignment> existingSameType = workAssignmentRepository.findByProjectIdAndWorkZoneIdAndWorkType(
            projectId,
            workZoneId,
            workType
        );
        for (WorkAssignment completed : existingSameType) {
            if (excludeAssignmentId != null && completed.getId().equals(excludeAssignmentId)) {
                continue;
            }
            if (completed.getStatus() == AssignmentStatus.COMPLETED) {
                conflicts.add(new SchedulingConflictDetail(
                    "DUPLICATE_ACTIVITY",
                    completed.getAssignmentCode(),
                    completed.getWorkType(),
                    completed.getWorkType().getDisplayName(),
                    completed.getStatus(),
                    completed.getVendor() != null ? completed.getVendor().getCompanyName() : null,
                    completed.getPlannedStartDate(),
                    completed.getTargetEndDate(),
                    "Duplicate activity: " + workType.getDisplayName() +
                    " has already been completed in this work zone under assignment " +
                    completed.getAssignmentCode() + "."
                ));
            }
        }


        return conflicts;
    }
}
