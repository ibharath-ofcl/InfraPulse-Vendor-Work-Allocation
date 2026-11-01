package com.infrapulse.modules.evidence.service;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.DuplicateStatus;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class DuplicateEvidenceDetectionService {

    private static final Logger log = LoggerFactory.getLogger(DuplicateEvidenceDetectionService.class);
    private static final int PERCEPTUAL_HASH_HAMMING_THRESHOLD = 5;
    private static final long MAX_PERMITTED_STALE_HOURS = 72;

    private final WorkEvidenceRepository evidenceRepository;

    public DuplicateEvidenceDetectionService(WorkEvidenceRepository evidenceRepository) {
        this.evidenceRepository = evidenceRepository;
    }

    public record DuplicateCheckResult(
            DuplicateStatus status,
            String duplicateOfEvidenceId,
            String details
    ) {}

    public DuplicateCheckResult evaluateDuplicate(
            String projectId,
            String currentEvidenceId,
            String sha256Checksum,
            String perceptualHash,
            Instant captureTimestamp,
            Instant serverReceiptTimestamp
    ) {
        // 1. Exact SHA-256 Cryptographic Match Check
        if (sha256Checksum != null && !sha256Checksum.isBlank()) {
            List<WorkEvidence> exactMatches = evidenceRepository.findByChecksumSha256AndIsDeletedFalse(sha256Checksum);
            for (WorkEvidence match : exactMatches) {
                if (currentEvidenceId == null || !match.getId().equals(currentEvidenceId)) {
                    String reason = String.format("Exact cryptographic SHA-256 match found with previously uploaded evidence (%s in assignment %s).",
                            match.getEvidenceCode(), match.getWorkAssignment().getAssignmentCode());
                    log.warn("Duplicate evidence detected: {}", reason);
                    return new DuplicateCheckResult(DuplicateStatus.DUPLICATE_CONFIRMED, match.getId(), reason);
                }
            }
        }

        // 2. Perceptual Image Hash Match Check across Project
        if (perceptualHash != null && !perceptualHash.isBlank() && projectId != null) {
            List<WorkEvidence> projectEvidences = evidenceRepository.findByProjectIdAndPerceptualHashIsNotNullAndIsDeletedFalse(projectId);
            for (WorkEvidence existing : projectEvidences) {
                if (currentEvidenceId != null && existing.getId().equals(currentEvidenceId)) {
                    continue;
                }
                if (existing.getPerceptualHash() != null) {
                    int hammingDistance = calculateHammingDistance(perceptualHash, existing.getPerceptualHash());
                    if (hammingDistance <= PERCEPTUAL_HASH_HAMMING_THRESHOLD) {
                        String reason = String.format("Perceptual hash match detected (Hamming distance %d <= %d) with evidence %s in assignment %s.",
                                hammingDistance, PERCEPTUAL_HASH_HAMMING_THRESHOLD, existing.getEvidenceCode(), existing.getWorkAssignment().getAssignmentCode());
                        log.warn("Perceptual duplicate detected: {}", reason);
                        return new DuplicateCheckResult(DuplicateStatus.DUPLICATE_SUSPECTED, existing.getId(), reason);
                    }
                }
            }
        }

        // 3. Stale Evidence / Future Timestamp Anomaly Check
        if (captureTimestamp != null && serverReceiptTimestamp != null) {
            if (captureTimestamp.isAfter(serverReceiptTimestamp.plusSeconds(300))) {
                String reason = "Capture timestamp is in the future relative to server receipt time. Flagged for suspicious device clock manipulation.";
                log.warn("Suspicious capture timestamp: {}", reason);
                return new DuplicateCheckResult(DuplicateStatus.STALE_CAPTURE_TIMESTAMP, null, reason);
            }

            long elapsedHours = Duration.between(captureTimestamp, serverReceiptTimestamp).toHours();
            if (elapsedHours > MAX_PERMITTED_STALE_HOURS) {
                String reason = String.format("Capture timestamp is %d hours older than upload timestamp (exceeds %d-hour freshness limit). Flagged as stale evidence.",
                        elapsedHours, MAX_PERMITTED_STALE_HOURS);
                log.warn("Stale evidence: {}", reason);
                return new DuplicateCheckResult(DuplicateStatus.STALE_CAPTURE_TIMESTAMP, null, reason);
            }
        }

        return new DuplicateCheckResult(DuplicateStatus.UNIQUE, null, "Evidence verified as unique and fresh.");
    }

    /**
     * Computes a 64-bit difference hash (dHash) from a BufferedImage.
     * Resizes to 9x8 grayscale and evaluates gradient between adjacent pixels.
     */
    public String computeDHash(BufferedImage image) {
        if (image == null) return null;
        try {
            BufferedImage resized = new BufferedImage(9, 8, BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D g = resized.createGraphics();
            g.drawImage(image.getScaledInstance(9, 8, Image.SCALE_SMOOTH), 0, 0, null);
            g.dispose();

            long hash = 0;
            for (int y = 0; y < 8; y++) {
                for (int x = 0; x < 8; x++) {
                    int left = resized.getRaster().getSample(x, y, 0);
                    int right = resized.getRaster().getSample(x + 1, y, 0);
                    if (left > right) {
                        hash |= (1L << (y * 8 + x));
                    }
                }
            }
            return String.format("%016x", hash);
        } catch (Exception e) {
            log.warn("Failed to compute dHash: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Calculates the Hamming distance between two hexadecimal hash strings.
     */
    public int calculateHammingDistance(String hex1, String hex2) {
        if (hex1 == null || hex2 == null || hex1.length() != hex2.length()) {
            return Integer.MAX_VALUE;
        }
        try {
            long val1 = Long.parseUnsignedLong(hex1, 16);
            long val2 = Long.parseUnsignedLong(hex2, 16);
            return Long.bitCount(val1 ^ val2);
        } catch (Exception e) {
            return Integer.MAX_VALUE;
        }
    }
}
