package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerNotificationRepository extends JpaRepository<WorkerNotification, String> {

    List<WorkerNotification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    Page<WorkerNotification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);

    long countByRecipientIdAndReadAtIsNull(String recipientId);
}
