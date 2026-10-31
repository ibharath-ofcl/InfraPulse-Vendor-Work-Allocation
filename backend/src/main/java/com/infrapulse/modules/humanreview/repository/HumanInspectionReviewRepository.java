package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HumanInspectionReviewRepository extends JpaRepository<HumanInspectionReview, String> {

    Optional<HumanInspectionReview> findByReviewCode(String reviewCode);

    Optional<HumanInspectionReview> findByAssessmentId(String assessmentId);

    List<HumanInspectionReview> findByAssignmentIdOrderByCreatedAtDesc(String assignmentId);

    List<HumanInspectionReview> findByReviewStatus(ReviewStatus status);

    List<HumanInspectionReview> findByReviewerIdOrderByCreatedAtDesc(String reviewerId);

    @Query("SELECT r FROM HumanInspectionReview r WHERE " +
           "(:status IS NULL OR r.reviewStatus = :status) AND " +
           "(:priority IS NULL OR r.priority = :priority) AND " +
           "(:reviewerId IS NULL OR r.reviewer.id = :reviewerId) AND " +
           "(:projectId IS NULL OR r.assignment.project.id = :projectId) AND " +
           "(:vendorId IS NULL OR r.assignment.vendor.id = :vendorId) " +
           "ORDER BY r.createdAt DESC")
    Page<HumanInspectionReview> findFiltered(
        @Param("status") ReviewStatus status,
        @Param("priority") ReviewPriority priority,
        @Param("reviewerId") String reviewerId,
        @Param("projectId") String projectId,
        @Param("vendorId") String vendorId,
        Pageable pageable
    );

    @Query(value = "SELECT nextval('human_review_seq')", nativeQuery = true)
    Long getNextReviewSequence();
}
