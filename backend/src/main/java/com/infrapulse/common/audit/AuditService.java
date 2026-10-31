package com.infrapulse.common.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(String actorId, String eventType, String entityType, String entityId, String summary, String reason) {
        try {
            AuditEvent event = new AuditEvent(actorId, eventType, entityType, entityId, summary, reason);
            auditEventRepository.save(event);
            log.info("Audit logged: event={}, entity={}:{}, actor={}", eventType, entityType, entityId, actorId);
        } catch (Exception e) {
            log.error("Failed to record audit event: {}", e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(com.infrapulse.modules.auth.model.User actor, String eventType, String entityType, String entityId, String summary, String reason) {
        String actorId = actor != null ? actor.getId() : null;
        recordEvent(actorId, eventType, entityType, entityId, summary, reason);
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> getEntityAuditTrail(String entityType, String entityId) {
        return auditEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }
}
