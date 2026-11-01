package com.infrapulse.modules.evidence;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.DuplicateStatus;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.service.DuplicateEvidenceDetectionService;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class DuplicateEvidenceDetectionServiceTest {

    private WorkEvidenceRepository evidenceRepository;
    private DuplicateEvidenceDetectionService duplicateService;

    @BeforeEach
    void setUp() {
        evidenceRepository = Mockito.mock(WorkEvidenceRepository.class);
        duplicateService = new DuplicateEvidenceDetectionService(evidenceRepository);
    }

    @Test
    @DisplayName("Exact SHA-256 match returns DUPLICATE_CONFIRMED")
    void testExactSha256MatchDetected() {
        String sha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        WorkEvidence existing = new WorkEvidence();
        existing.setId("ev-existing-1");
        existing.setEvidenceCode("EVD-0001");
        WorkAssignment assignment = new WorkAssignment();
        assignment.setAssignmentCode("ASN-101");
        existing.setWorkAssignment(assignment);

        when(evidenceRepository.findByChecksumSha256AndIsDeletedFalse(sha))
                .thenReturn(List.of(existing));

        DuplicateEvidenceDetectionService.DuplicateCheckResult result = duplicateService.evaluateDuplicate(
                "proj-1",
                "ev-new-2",
                sha,
                "0123456789abcdef",
                Instant.now(),
                Instant.now()
        );

        assertEquals(DuplicateStatus.DUPLICATE_CONFIRMED, result.status());
        assertEquals("ev-existing-1", result.duplicateOfEvidenceId());
        assertTrue(result.details().contains("Exact cryptographic SHA-256 match"));
    }

    @Test
    @DisplayName("Similar perceptual hash with Hamming distance <= 5 returns DUPLICATE_SUSPECTED")
    void testPerceptualHashMatch() {
        when(evidenceRepository.findByChecksumSha256AndIsDeletedFalse(anyString()))
                .thenReturn(Collections.emptyList());

        WorkEvidence existing = new WorkEvidence();
        existing.setId("ev-p-match");
        existing.setEvidenceCode("EVD-0042");
        // Similar hash with 2 bits flipped
        existing.setPerceptualHash("ffffffffffffff00");
        WorkAssignment assignment = new WorkAssignment();
        assignment.setAssignmentCode("ASN-202");
        existing.setWorkAssignment(assignment);

        when(evidenceRepository.findByProjectIdAndPerceptualHashIsNotNullAndIsDeletedFalse("proj-1"))
                .thenReturn(List.of(existing));

        // Candidate hash differs by only 2 bits (00 vs 03)
        String candidateHash = "ffffffffffffff03";

        DuplicateEvidenceDetectionService.DuplicateCheckResult result = duplicateService.evaluateDuplicate(
                "proj-1",
                "ev-new-3",
                "sha256-different",
                candidateHash,
                Instant.now(),
                Instant.now()
        );

        assertEquals(DuplicateStatus.DUPLICATE_SUSPECTED, result.status());
        assertEquals("ev-p-match", result.duplicateOfEvidenceId());
        assertTrue(result.details().contains("Perceptual hash match"));
    }

    @Test
    @DisplayName("Capture timestamp older than 72 hours returns STALE_CAPTURE_TIMESTAMP")
    void testStaleCaptureTimestamp() {
        when(evidenceRepository.findByChecksumSha256AndIsDeletedFalse(anyString()))
                .thenReturn(Collections.emptyList());
        when(evidenceRepository.findByProjectIdAndPerceptualHashIsNotNullAndIsDeletedFalse(anyString()))
                .thenReturn(Collections.emptyList());

        Instant serverNow = Instant.now();
        Instant staleCapture = serverNow.minus(Duration.ofHours(96)); // 4 days ago

        DuplicateEvidenceDetectionService.DuplicateCheckResult result = duplicateService.evaluateDuplicate(
                "proj-1",
                "ev-new-4",
                "sha-unique",
                "0123456789abcdef",
                staleCapture,
                serverNow
        );

        assertEquals(DuplicateStatus.STALE_CAPTURE_TIMESTAMP, result.status());
        assertTrue(result.details().contains("exceeds 72-hour freshness limit"));
    }

    @Test
    @DisplayName("Unique and fresh evidence passes evaluation with UNIQUE status")
    void testUniqueAndFreshEvidencePassed() {
        when(evidenceRepository.findByChecksumSha256AndIsDeletedFalse(anyString()))
                .thenReturn(Collections.emptyList());
        when(evidenceRepository.findByProjectIdAndPerceptualHashIsNotNullAndIsDeletedFalse(anyString()))
                .thenReturn(Collections.emptyList());

        Instant now = Instant.now();
        DuplicateEvidenceDetectionService.DuplicateCheckResult result = duplicateService.evaluateDuplicate(
                "proj-1",
                "ev-unique",
                "sha-unique-123",
                "1234567890abcdef",
                now.minus(Duration.ofMinutes(15)),
                now
        );

        assertEquals(DuplicateStatus.UNIQUE, result.status());
        assertNull(result.duplicateOfEvidenceId());
    }

    @Test
    @DisplayName("dHash computation produces valid 16-character hexadecimal string")
    void testDHashComputationFromImage() {
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 50, 100);
        g.setColor(Color.BLACK);
        g.fillRect(50, 0, 50, 100);
        g.dispose();

        String hash = duplicateService.computeDHash(image);
        assertNotNull(hash);
        assertEquals(16, hash.length());
        assertTrue(hash.matches("[0-9a-f]{16}"));
    }
}
