package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerDocument;
import com.infrapulse.modules.workertrust.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerDocumentRepository extends JpaRepository<WorkerDocument, String> {

    List<WorkerDocument> findByWorkerId(String workerId);

    long countByDocumentStatus(DocumentStatus status);
}
