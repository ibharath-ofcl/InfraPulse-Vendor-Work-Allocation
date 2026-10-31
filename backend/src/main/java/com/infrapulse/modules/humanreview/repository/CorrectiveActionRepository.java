package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CorrectiveActionRepository extends JpaRepository<CorrectiveAction, String> {

    Optional<CorrectiveAction> findByActionCode(String actionCode);

    List<CorrectiveAction> findByAssessmentIdOrderByCreatedAtDesc(String assessmentId);

    List<CorrectiveAction> findByAssignmentIdOrderByCreatedAtDesc(String assignmentId);

    List<CorrectiveAction> findByFindingId(String findingId);

    List<CorrectiveAction> findByVendorIdOrderByCreatedAtDesc(String vendorId);

    List<CorrectiveAction> findByVendorIdAndStatus(String vendorId, CorrectiveActionStatus status);

    @Query("SELECT ca FROM CorrectiveAction ca WHERE " +
           "(:vendorId IS NULL OR ca.vendor.id = :vendorId) AND " +
           "(:status IS NULL OR ca.status = :status) AND " +
           "(:priority IS NULL OR ca.priority = :priority) AND " +
           "(:projectId IS NULL OR ca.assignment.project.id = :projectId) " +
           "ORDER BY ca.createdAt DESC")
    Page<CorrectiveAction> findFiltered(
        @Param("vendorId") String vendorId,
        @Param("status") CorrectiveActionStatus status,
        @Param("priority") ReviewPriority priority,
        @Param("projectId") String projectId,
        Pageable pageable
    );

    @Query(value = "SELECT nextval('corrective_action_seq')", nativeQuery = true)
    Long getNextActionSequence();
}
