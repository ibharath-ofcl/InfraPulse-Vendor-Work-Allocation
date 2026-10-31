package com.infrapulse.common.audit;

import com.infrapulse.modules.auth.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final AtomicLong IN_MEMORY_SEQ = new AtomicLong(1000);

    private final AuditEventRepository auditEventRepository;
    private final AuditChainHeadRepository chainHeadRepository;
    private final AuditIntegrityService integrityService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public AuditService(
            AuditEventRepository auditEventRepository,
            AuditChainHeadRepository chainHeadRepository,
            AuditIntegrityService integrityService
    ) {
        this.auditEventRepository = auditEventRepository;
        this.chainHeadRepository = chainHeadRepository;
        this.integrityService = integrityService;
    }

    /**
     * Backward-compatible event recording used across Stages 1–12.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(String actorId, String eventType, String entityType, String entityId, String summary, String reason) {
        try {
            AuditEvent event = new AuditEvent(actorId, eventType, entityType, entityId, summary, reason);
            event.setEventCategory(deduceCategory(eventType, entityType));
            event.setAction(eventType);
            event.setOutcome(AuditOutcome.SUCCESS);
            
            enrichAndSaveWithHashChain(event);
            log.info("Audit logged: event={}, entity={}:{}, actor={}", eventType, entityType, entityId, actorId);
        } catch (Exception e) {
            log.error("Failed to record audit event: {}", e.getMessage(), e);
        }
    }

    /**
     * Backward-compatible event recording accepting User entity.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(User actor, String eventType, String entityType, String entityId, String summary, String reason) {
        try {
            String actorId = actor != null ? actor.getId() : null;
            AuditEvent event = new AuditEvent(actorId, eventType, entityType, entityId, summary, reason);
            if (actor != null) {
                event.setActorName(actor.getFullName());
                event.setActorRole(actor.getRole() != null ? actor.getRole().name() : null);
            }
            event.setEventCategory(deduceCategory(eventType, entityType));
            event.setAction(eventType);
            event.setOutcome(AuditOutcome.SUCCESS);

            enrichAndSaveWithHashChain(event);
            log.info("Audit logged: event={}, entity={}:{}, actor={}", eventType, entityType, entityId, actorId);
        } catch (Exception e) {
            log.error("Failed to log audit event: {}", e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditEvent recordEvent(
            String eventType,
            AuditCategory category,
            String entityType,
            String entityId,
            String entityReference,
            String projectId,
            String vendorId,
            String action,
            AuditOutcome outcome,
            String summary,
            String actorId,
            String actorName,
            String actorRole,
            Object payload,
            String chainScope
    ) {
        AuditEvent event = new AuditEvent();
        event.setId(UUID.randomUUID().toString());
        event.setActorId(actorId);
        event.setActorName(actorName != null ? actorName : "System");
        event.setActorRole(actorRole != null ? actorRole : "SYSTEM");
        event.setEventCategory(category != null ? category : AuditCategory.SYSTEM);
        event.setEventType(eventType);
        event.setAction(action != null ? action : eventType);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setEntityReference(entityReference);
        event.setProjectId(projectId);
        event.setVendorId(vendorId);
        event.setOutcome(outcome != null ? outcome : AuditOutcome.SUCCESS);
        event.setSummary(summary != null ? summary : action + " on " + entityType);
        if (payload instanceof String s) {
            event.setEventPayload(s);
        } else if (payload != null) {
            try {
                event.setEventPayload(objectMapper.writeValueAsString(payload));
            } catch (Exception ignored) {
                event.setEventPayload(payload.toString());
            }
        }
        if (chainScope != null && !chainScope.isBlank()) {
            event.setChainScope(chainScope);
        }

        enrichAndSaveWithHashChain(event);
        return event;
    }

    /**
     * Stage 13 rich audit event recording with full enterprise metadata and contextual snapshots.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditEvent recordRichEvent(
            User actor,
            AuditCategory category,
            String eventType,
            String action,
            String entityType,
            String entityId,
            String entityReference,
            String projectId,
            String vendorId,
            AuditOutcome outcome,
            String summary,
            String reason,
            String correlationId,
            String sourceModule,
            String beforeState,
            String afterState,
            String payload
    ) {
        AuditEvent event = new AuditEvent();
        event.setId(UUID.randomUUID().toString());
        if (actor != null) {
            event.setActorId(actor.getId());
            event.setActorName(actor.getFullName());
            event.setActorRole(actor.getRole() != null ? actor.getRole().name() : null);
        } else {
            event.setActorName("System");
            event.setActorRole("SYSTEM");
        }
        event.setEventCategory(category != null ? category : AuditCategory.SYSTEM);
        event.setEventType(eventType);
        event.setAction(action != null ? action : eventType);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setEntityReference(entityReference);
        event.setProjectId(projectId);
        event.setVendorId(vendorId);
        event.setOutcome(outcome != null ? outcome : AuditOutcome.SUCCESS);
        event.setSummary(summary != null ? summary : action + " on " + entityType + ":" + (entityReference != null ? entityReference : entityId));
        event.setReason(reason);
        event.setCorrelationId(correlationId);
        event.setSourceModule(sourceModule);
        event.setBeforeState(beforeState);
        event.setAfterState(afterState);
        event.setEventPayload(payload);

        return enrichAndSaveWithHashChain(event);
    }

    /**
     * Atomically sequence and hash-chain the audit event into the partition scope.
     */
    private synchronized AuditEvent enrichAndSaveWithHashChain(AuditEvent event) {
        String scope = (event.getChainScope() != null && !event.getChainScope().isBlank()) ? event.getChainScope() : "GLOBAL";
        event.setChainScope(scope);

        if (event.getEventCode() == null) {
            event.setEventCode("AUD-" + IN_MEMORY_SEQ.incrementAndGet());
        }

        AuditChainHead head = chainHeadRepository.findByChainScopeWithLock(scope)
                .orElseGet(() -> {
                    AuditChainHead newHead = new AuditChainHead(scope, 0L, AuditIntegrityService.GENESIS_HASH);
                    return chainHeadRepository.save(newHead);
                });

        long nextSequence = head.getLastSequence() + 1;
        String previousHash = head.getLastEventHash();

        event.setSequenceNumber(nextSequence);
        event.setPreviousHash(previousHash);
        
        String computedHash = integrityService.computeEventHash(event, previousHash);
        event.setEventHash(computedHash);

        AuditEvent saved = auditEventRepository.save(event);

        head.setLastSequence(nextSequence);
        head.setLastEventHash(computedHash);
        chainHeadRepository.save(head);

        return saved;
    }

    private AuditCategory deduceCategory(String eventType, String entityType) {
        if (eventType == null) return AuditCategory.SYSTEM;
        String upper = eventType.toUpperCase();
        if (upper.contains("LOGIN") || upper.contains("AUTH") || upper.contains("USER")) return AuditCategory.AUTHENTICATION;
        if (upper.contains("PROJECT")) return AuditCategory.PROJECT_MANAGEMENT;
        if (upper.contains("VENDOR") || upper.contains("AGREEMENT")) return AuditCategory.VENDOR_MANAGEMENT;
        if (upper.contains("ASSIGNMENT") || upper.contains("ZONE") || upper.contains("ALLOCATION")) return AuditCategory.WORK_ALLOCATION;
        if (upper.contains("EVIDENCE") || upper.contains("AI_")) return AuditCategory.EVIDENCE_AI;
        if (upper.contains("INSPECTION") || upper.contains("REVIEW") || upper.contains("CORRECTIVE") || upper.contains("MEASUREMENT")) return AuditCategory.HUMAN_REVIEW;
        if (upper.contains("PAYMENT") || upper.contains("MILESTONE") || upper.contains("INVOICE") || upper.contains("FINANCIAL")) return AuditCategory.FINANCIAL_WORKFLOW;
        return AuditCategory.SYSTEM;
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> getEntityAuditTrail(String entityType, String entityId) {
        return auditEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> getProjectActivity(String projectId, Pageable pageable) {
        return auditEventRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> getVendorActivity(String vendorId, Pageable pageable) {
        return auditEventRepository.findByVendorIdOrderByCreatedAtDesc(vendorId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> getUserActivity(String userId, Pageable pageable) {
        return auditEventRepository.findByActorIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> searchAuditEvents(
            String query,
            AuditCategory category,
            String eventType,
            String actorId,
            String projectId,
            String vendorId,
            String entityType,
            AuditOutcome outcome,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    ) {
        Specification<AuditEvent> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (category != null) {
                predicates.add(cb.equal(root.get("eventCategory"), category));
            }
            if (eventType != null && !eventType.isBlank()) {
                predicates.add(cb.equal(root.get("eventType"), eventType));
            }
            if (actorId != null && !actorId.isBlank()) {
                predicates.add(cb.equal(root.get("actorId"), actorId));
            }
            if (projectId != null && !projectId.isBlank()) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (vendorId != null && !vendorId.isBlank()) {
                predicates.add(cb.equal(root.get("vendorId"), vendorId));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (outcome != null) {
                predicates.add(cb.equal(root.get("outcome"), outcome));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (query != null && !query.isBlank()) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("eventCode")), searchPattern);
                Predicate summaryMatch = cb.like(cb.lower(root.get("summary")), searchPattern);
                Predicate actorMatch = cb.like(cb.lower(root.get("actorName")), searchPattern);
                Predicate entityRefMatch = cb.like(cb.lower(root.get("entityReference")), searchPattern);
                predicates.add(cb.or(codeMatch, summaryMatch, actorMatch, entityRefMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditEventRepository.findAll(spec, pageable);
    }
}
