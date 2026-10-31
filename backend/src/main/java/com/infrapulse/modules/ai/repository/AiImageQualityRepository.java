package com.infrapulse.modules.ai.repository;

import com.infrapulse.modules.ai.entity.AiImageQualityResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiImageQualityRepository extends JpaRepository<AiImageQualityResult, String> {
    Optional<AiImageQualityResult> findByInferenceId(String inferenceId);
}
