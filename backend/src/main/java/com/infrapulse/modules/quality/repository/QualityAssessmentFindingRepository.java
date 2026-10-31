package com.infrapulse.modules.quality.repository;

import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.model.FindingOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualityAssessmentFindingRepository extends JpaRepository<QualityAssessmentFinding, String> {
    List<QualityAssessmentFinding> findByAssessmentIdOrderByCreatedAtAsc(String assessmentId);
    List<QualityAssessmentFinding> findByAssessmentIdAndOutcome(String assessmentId, FindingOutcome outcome);
}
