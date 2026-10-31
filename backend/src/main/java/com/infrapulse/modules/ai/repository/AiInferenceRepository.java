package com.infrapulse.modules.ai.repository;

import com.infrapulse.modules.ai.entity.AiInferenceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiInferenceRepository extends JpaRepository<AiInferenceResult, String> {

    List<AiInferenceResult> findByEvidenceIdOrderByCreatedAtDesc(String evidenceId);

    List<AiInferenceResult> findByAssignmentIdOrderByCreatedAtDesc(String assignmentId);

    Optional<AiInferenceResult> findByInferenceCode(String inferenceCode);

    @Query(value = "SELECT nextval('ai_inference_seq')", nativeQuery = true)
    Long getNextInferenceSequence();
}
