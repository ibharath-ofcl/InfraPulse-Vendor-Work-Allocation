package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.InspectionEscalation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionEscalationRepository extends JpaRepository<InspectionEscalation, String> {

    List<InspectionEscalation> findByAssessmentIdOrderByCreatedAtDesc(String assessmentId);

    List<InspectionEscalation> findByReviewIdOrderByCreatedAtDesc(String reviewId);

    List<InspectionEscalation> findByStatus(String status);
}
