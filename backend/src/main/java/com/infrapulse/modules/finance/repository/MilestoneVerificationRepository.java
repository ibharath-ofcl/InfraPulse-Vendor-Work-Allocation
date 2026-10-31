package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.MilestoneVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneVerificationRepository extends JpaRepository<MilestoneVerification, String> {

    List<MilestoneVerification> findByMilestoneIdOrderByVerifiedAtDesc(String milestoneId);

    Optional<MilestoneVerification> findFirstByMilestoneIdOrderByVerifiedAtDesc(String milestoneId);
}
