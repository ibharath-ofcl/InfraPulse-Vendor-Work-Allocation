package com.infrapulse.common.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, String>, JpaSpecificationExecutor<AuditEvent> {

    Optional<AuditEvent> findByEventCode(String eventCode);

    List<AuditEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);

    Page<AuditEvent> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    Page<AuditEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT e FROM AuditEvent e WHERE e.entityId IN :entityIds ORDER BY e.createdAt DESC")
    Page<AuditEvent> findByEntityIdInOrderByCreatedAtDesc(@Param("entityIds") Collection<String> entityIds, Pageable pageable);

    Page<AuditEvent> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);

    Page<AuditEvent> findByVendorIdOrderByCreatedAtDesc(String vendorId, Pageable pageable);

    Page<AuditEvent> findByActorIdOrderByCreatedAtDesc(String actorId, Pageable pageable);

    List<AuditEvent> findByChainScopeOrderBySequenceNumberAsc(String chainScope);

    Optional<AuditEvent> findTopByChainScopeOrderBySequenceNumberDesc(String chainScope);

    @Query("SELECT COUNT(e) FROM AuditEvent e WHERE e.createdAt >= :since")
    long countEventsSince(@Param("since") Instant since);
}
