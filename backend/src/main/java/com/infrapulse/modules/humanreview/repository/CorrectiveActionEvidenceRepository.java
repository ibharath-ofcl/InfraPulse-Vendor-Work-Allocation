package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.CorrectiveActionEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorrectiveActionEvidenceRepository extends JpaRepository<CorrectiveActionEvidence, String> {

    List<CorrectiveActionEvidence> findByCorrectiveActionIdOrderBySubmittedAtAsc(String correctiveActionId);

    List<CorrectiveActionEvidence> findByEvidenceId(String evidenceId);
}
