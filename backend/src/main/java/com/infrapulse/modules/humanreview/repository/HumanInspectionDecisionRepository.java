package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HumanInspectionDecisionRepository extends JpaRepository<HumanInspectionDecision, String> {

    List<HumanInspectionDecision> findByReviewIdOrderByDecidedAtDesc(String reviewId);

    List<HumanInspectionDecision> findByAssessmentIdOrderByDecidedAtDesc(String assessmentId);

    List<HumanInspectionDecision> findByAssignmentIdOrderByDecidedAtDesc(String assignmentId);

    Optional<HumanInspectionDecision> findFirstByReviewIdOrderByDecidedAtDesc(String reviewId);

    Optional<HumanInspectionDecision> findFirstByAssignmentIdOrderByDecidedAtDesc(String assignmentId);
}
