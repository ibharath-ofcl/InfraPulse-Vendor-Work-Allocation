package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerApprovalRepository extends JpaRepository<WorkerApproval, String> {

    List<WorkerApproval> findByWorkerIdOrderByDecidedAtDesc(String workerId);
}

