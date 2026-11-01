package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerConsentRepository extends JpaRepository<WorkerConsent, String> {
    List<WorkerConsent> findByWorkerId(String workerId);
}
