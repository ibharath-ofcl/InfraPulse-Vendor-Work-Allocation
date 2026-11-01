package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerQrCredential;
import com.infrapulse.modules.workertrust.enums.CredentialStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerQrCredentialRepository extends JpaRepository<WorkerQrCredential, String> {

    Optional<WorkerQrCredential> findByTokenHash(String tokenHash);

    Optional<WorkerQrCredential> findFirstByWorkerIdAndCredentialStatusOrderByIssuedAtDesc(
        String workerId, CredentialStatus credentialStatus
    );

    List<WorkerQrCredential> findByWorkerId(String workerId);
}
