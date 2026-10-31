package com.infrapulse.common.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

@Service
public class AuditIntegrityService {

    private static final Logger log = LoggerFactory.getLogger(AuditIntegrityService.class);
    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditEventRepository auditEventRepository;
    private final AuditChainHeadRepository chainHeadRepository;

    public AuditIntegrityService(AuditEventRepository auditEventRepository, AuditChainHeadRepository chainHeadRepository) {
        this.auditEventRepository = auditEventRepository;
        this.chainHeadRepository = chainHeadRepository;
    }

    /**
     * Build deterministic canonical payload for cryptographic hash computation.
     */
    public String buildCanonicalPayload(AuditEvent event, String previousHash) {
        String prev = (previousHash != null && !previousHash.isBlank()) ? previousHash : GENESIS_HASH;
        String code = event.getEventCode() != null ? event.getEventCode() : "";
        String type = event.getEventType() != null ? event.getEventType() : "";
        String entType = event.getEntityType() != null ? event.getEntityType() : "";
        String entId = event.getEntityId() != null ? event.getEntityId() : "";
        String actId = event.getActorId() != null ? event.getActorId() : "SYSTEM";
        String out = event.getOutcome() != null ? event.getOutcome().name() : "SUCCESS";
        long epochMs = event.getCreatedAt() != null ? event.getCreatedAt().toEpochMilli() : 0L;
        String payload = event.getEventPayload() != null ? event.getEventPayload() : "";

        return prev + "|" + code + "|" + type + "|" + entType + "|" + entId + "|" + actId + "|" + out + "|" + epochMs + "|" + payload;
    }

    /**
     * Compute SHA-256 hash of the canonical event representation.
     */
    public String computeEventHash(AuditEvent event, String previousHash) {
        String canonical = buildCanonicalPayload(event, previousHash);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Verify the integrity of a single audit event record against its recorded previous hash.
     */
    @Transactional(readOnly = true)
    public boolean verifySingleEvent(AuditEvent event) {
        if (event == null || event.getEventHash() == null) {
            return false;
        }
        String calculated = computeEventHash(event, event.getPreviousHash());
        return event.getEventHash().equalsIgnoreCase(calculated);
    }

    /**
     * Verify the complete cryptographic hash chain for a given partition scope.
     */
    @Transactional(readOnly = true)
    public AuditIntegrityReport verifyChain(String chainScope) {
        String scope = (chainScope != null && !chainScope.isBlank()) ? chainScope : "GLOBAL";
        List<AuditEvent> chain = auditEventRepository.findByChainScopeOrderBySequenceNumberAsc(scope);

        AuditIntegrityReport report = new AuditIntegrityReport();
        report.setChainScope(scope);
        report.setTotalEventsChecked(chain.size());

        if (chain.isEmpty()) {
            report.setStatus(AuditIntegrityStatus.VALID);
            report.setValidEventsCount(0);
            report.setInvalidEventsCount(0);
            return report;
        }

        String expectedPreviousHash = GENESIS_HASH;
        long validCount = 0;
        long invalidCount = 0;
        boolean brokenChain = false;

        for (int i = 0; i < chain.size(); i++) {
            AuditEvent current = chain.get(i);

            // 1. Verify sequence continuity and chain linkage for subsequent events
            if (i > 0) {
                AuditEvent previous = chain.get(i - 1);
                if (current.getSequenceNumber() == null || previous.getSequenceNumber() == null 
                        || current.getSequenceNumber() != previous.getSequenceNumber() + 1) {
                    brokenChain = true;
                    report.getViolations().add(String.format("Sequence discontinuity between event %s (seq %s) and event %s (seq %s)",
                            previous.getEventCode(), previous.getSequenceNumber(), current.getEventCode(), current.getSequenceNumber()));
                }

                if (!previous.getEventHash().equalsIgnoreCase(current.getPreviousHash())) {
                    brokenChain = true;
                    report.getViolations().add(String.format("Broken chain link at index %d: expected previousHash=%s from event %s, found=%s (event=%s)",
                            i, previous.getEventHash(), previous.getEventCode(), current.getPreviousHash(), current.getEventCode()));
                }
            } else {
                // First event in chain: if sequence is 1, it must link to GENESIS_HASH
                if (current.getSequenceNumber() != null && current.getSequenceNumber() == 1L) {
                    if (!GENESIS_HASH.equalsIgnoreCase(current.getPreviousHash())) {
                        brokenChain = true;
                        report.getViolations().add(String.format("Broken genesis link at event %s: expected %s, found %s",
                                current.getEventCode(), GENESIS_HASH, current.getPreviousHash()));
                    }
                }
            }

            // 2. Verify event payload hash
            String calculatedHash = computeEventHash(current, current.getPreviousHash());
            if (!calculatedHash.equalsIgnoreCase(current.getEventHash())) {
                invalidCount++;
                report.getViolations().add(String.format("Tampered event content detected at event=%s (code=%s): calculated hash=%s, recorded hash=%s",
                        current.getId(), current.getEventCode(), calculatedHash, current.getEventHash()));
            } else {
                validCount++;
            }

            report.setLastVerifiedEventCode(current.getEventCode());
            report.setLastVerifiedEventHash(current.getEventHash());
        }

        report.setValidEventsCount(validCount);
        report.setInvalidEventsCount(invalidCount);

        if (invalidCount > 0) {
            report.setStatus(AuditIntegrityStatus.INVALID);
        } else if (brokenChain) {
            report.setStatus(AuditIntegrityStatus.BROKEN_CHAIN);
        } else {
            report.setStatus(AuditIntegrityStatus.VALID);
        }

        log.info("Audit chain verification completed for scope '{}': status={}, valid={}, invalid={}, violations={}",
                scope, report.getStatus(), validCount, invalidCount, report.getViolations().size());

        return report;
    }
}
