package com.infrapulse.common.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {
    List<AuditEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
    Page<AuditEvent> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);
    Page<AuditEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT e FROM AuditEvent e WHERE e.entityId IN :entityIds ORDER BY e.createdAt DESC")
    Page<AuditEvent> findByEntityIdInOrderByCreatedAtDesc(@Param("entityIds") Collection<String> entityIds, Pageable pageable);
}
