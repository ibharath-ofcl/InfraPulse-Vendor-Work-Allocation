package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerAccessSuspension;
import com.infrapulse.modules.workertrust.enums.SuspensionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerAccessSuspensionRepository extends JpaRepository<WorkerAccessSuspension, String> {

    List<WorkerAccessSuspension> findByWorkerIdOrderByStartTimeDesc(String workerId);

    Optional<WorkerAccessSuspension> findFirstByWorkerIdAndSuspensionStatus(String workerId, SuspensionStatus suspensionStatus);

    boolean existsByWorkerIdAndSuspensionStatus(String workerId, SuspensionStatus suspensionStatus);

    long countBySuspensionStatus(SuspensionStatus suspensionStatus);
}

