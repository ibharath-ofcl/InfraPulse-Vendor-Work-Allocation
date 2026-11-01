package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerIdentityVerification;
import com.infrapulse.modules.workertrust.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerIdentityVerificationRepository extends JpaRepository<WorkerIdentityVerification, String> {

    List<WorkerIdentityVerification> findByWorkerId(String workerId);

    long countByVerificationStatus(VerificationStatus status);
}
