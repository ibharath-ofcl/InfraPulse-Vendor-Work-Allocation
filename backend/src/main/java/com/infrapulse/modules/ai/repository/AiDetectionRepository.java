package com.infrapulse.modules.ai.repository;

import com.infrapulse.modules.ai.entity.AiDetectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiDetectionRepository extends JpaRepository<AiDetectionResult, String> {
    List<AiDetectionResult> findByInferenceId(String inferenceId);
}
