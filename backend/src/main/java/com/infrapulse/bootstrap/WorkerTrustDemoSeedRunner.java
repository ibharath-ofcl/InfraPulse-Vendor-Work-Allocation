package com.infrapulse.bootstrap;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workertrust.entity.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import com.infrapulse.security.HashUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Component
@Order(3)
@Profile("!test")
public class WorkerTrustDemoSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(WorkerTrustDemoSeedRunner.class);

    private final WorkerRepository workerRepository;
    private final WorkerVendorAssociationRepository associationRepository;
    private final WorkerConsentRepository consentRepository;
    private final WorkerDocumentRepository documentRepository;
    private final WorkerIdentityVerificationRepository verificationRepository;
    private final WorkerCertificationRepository certificationRepository;
    private final WorkerApprovalRepository approvalRepository;
    private final WorkerProjectAssignmentRepository assignmentRepository;
    private final WorkerQrCredentialRepository qrCredentialRepository;
    private final WorkerSiteAccessRepository siteAccessRepository;
    private final WorkerIncidentRepository incidentRepository;
    private final WorkerAccessSuspensionRepository suspensionRepository;
    private final VendorRepository vendorRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final UserRepository userRepository;

    @Value("${app.seed-demo-data:true}")
    private boolean seedDemoData;

    public WorkerTrustDemoSeedRunner(
        WorkerRepository workerRepository,
        WorkerVendorAssociationRepository associationRepository,
        WorkerConsentRepository consentRepository,
        WorkerDocumentRepository documentRepository,
        WorkerIdentityVerificationRepository verificationRepository,
        WorkerCertificationRepository certificationRepository,
        WorkerApprovalRepository approvalRepository,
        WorkerProjectAssignmentRepository assignmentRepository,
        WorkerQrCredentialRepository qrCredentialRepository,
        WorkerSiteAccessRepository siteAccessRepository,
        WorkerIncidentRepository incidentRepository,
        WorkerAccessSuspensionRepository suspensionRepository,
        VendorRepository vendorRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        UserRepository userRepository
    ) {
        this.workerRepository = workerRepository;
        this.associationRepository = associationRepository;
        this.consentRepository = consentRepository;
        this.documentRepository = documentRepository;
        this.verificationRepository = verificationRepository;
        this.certificationRepository = certificationRepository;
        this.approvalRepository = approvalRepository;
        this.assignmentRepository = assignmentRepository;
        this.qrCredentialRepository = qrCredentialRepository;
        this.siteAccessRepository = siteAccessRepository;
        this.incidentRepository = incidentRepository;
        this.suspensionRepository = suspensionRepository;
        this.vendorRepository = vendorRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedDemoData) {
            log.info("Demo data seeding is disabled by configuration");
            return;
        }

        if (workerRepository.count() > 0) {
            log.info("WorkerTrust demonstration records already seeded. Skipping initialization.");
            return;
        }

        log.info("Seeding realistic WorkerTrust identity, verification, and safety lifecycle records...");

        List<Vendor> vendors = vendorRepository.findAll();
        List<Project> projects = projectRepository.findAll();
        List<WorkZone> zones = workZoneRepository.findAll();

        if (vendors.isEmpty() || projects.isEmpty()) {
            log.warn("Required vendor or project entities not found. Skipping WorkerTrust seed.");
            return;
        }

        Vendor apexVendor = vendors.get(0);
        Project metroProject = projects.get(0);
        WorkZone activeZone = zones.isEmpty() ? null : zones.get(0);
        User adminUser = userRepository.findAll().stream().findFirst().orElse(null);

        // --- Worker 1: Ramesh Kumar (Active on site, Excavator Operator) ---
        Worker w1 = new Worker();
        w1.setWorkerCode("INF-WRK-2026-000001");
        w1.setFullName("Ramesh Kumar");
        w1.setMobileNumber("+91 98451 22334");
        w1.setEmail("ramesh.kumar@contractor-workforce.in");
        w1.setDateOfBirth(LocalDate.of(1988, 5, 14));
        w1.setJobRole("EXCAVATOR_OPERATOR");
        w1.setSkillsExperience("10+ years operating heavy crawler excavators, micro-trenchers, and horizontal directional drilling rigs in dense urban utility corridors.");
        w1.setEmergencyContactName("Lakshmi Kumar");
        w1.setEmergencyContactPhone("+91 98451 99887");
        w1.setCurrentStatus(WorkerStatus.ACTIVE_ON_SITE);
        w1.setCreatedBy(adminUser);
        workerRepository.save(w1);

        associationRepository.save(new WorkerVendorAssociation(w1, apexVendor, LocalDate.now().minusMonths(6)));
        consentRepository.save(new WorkerConsent(w1, "IDENTITY_AND_SAFETY_VERIFICATION", "Explicit consent for infrastructure worksite safety compliance", adminUser));

        WorkerIdentityVerification v1 = new WorkerIdentityVerification(w1, VerificationMethod.OFFLINE_UIDAI_XML_CONSENT, "XXXX-XXXX-4819");
        v1.setVerificationStatus(VerificationStatus.VERIFIED);
        v1.setVerifiedBy(adminUser);
        v1.setVerifiedAt(Instant.now().minus(30, ChronoUnit.DAYS));
        v1.setReviewNotes("Offline Aadhaar XML verification confirmed. Match confidence: 100%.");
        verificationRepository.save(v1);

        WorkerCertification c1 = new WorkerCertification(w1, CertificationType.EXCAVATION_SAFETY, "National Safety Council of India", LocalDate.now().minusMonths(3), LocalDate.now().plusMonths(9));
        c1.setVerificationStatus(CertificationStatus.VERIFIED);
        c1.setCertificateNumber("NSC-EXC-2025-8842");
        c1.setVerifiedBy(adminUser);
        c1.setVerifiedAt(Instant.now().minus(28, ChronoUnit.DAYS));
        certificationRepository.save(c1);

        WorkerCertification c1b = new WorkerCertification(w1, CertificationType.GENERAL_CONSTRUCTION_SAFETY, "Infrastructure Skill Council", LocalDate.now().minusMonths(5), LocalDate.now().plusMonths(7));
        c1b.setVerificationStatus(CertificationStatus.VERIFIED);
        c1b.setCertificateNumber("ISC-GEN-2025-1102");
        c1b.setVerifiedBy(adminUser);
        c1b.setVerifiedAt(Instant.now().minus(28, ChronoUnit.DAYS));
        certificationRepository.save(c1b);

        approvalRepository.save(new WorkerApproval(w1, adminUser, ApprovalDecision.APPROVED, "Verified all identity documents, NSC excavation safety certification, and active vendor contract. Approved for worksite access."));

        if (activeZone != null) {
            WorkerProjectAssignment a1 = new WorkerProjectAssignment(
                w1, metroProject, activeZone, apexVendor, LocalDate.now().minusDays(10), LocalDate.now().plusDays(20), "EXCAVATOR_OPERATOR", adminUser
            );
            assignmentRepository.save(a1);
        }

        String opaqueToken1 = "WRK-SEC-" + UUID.randomUUID().toString().replace("-", "") + "-" + HashUtil.generateSecureRandomToken(16);
        WorkerQrCredential cred1 = new WorkerQrCredential(
            w1,
            HashUtil.sha256(opaqueToken1),
            "INFRAPULSE:WRK:" + opaqueToken1 + ":" + w1.getWorkerCode(),
            Instant.now().plus(180, ChronoUnit.DAYS),
            adminUser
        );
        qrCredentialRepository.save(cred1);

        WorkerSiteAccess sa1 = new WorkerSiteAccess(
            w1, metroProject, activeZone, Instant.now().minus(3, ChronoUnit.HOURS), SiteAccessStatus.ALLOW_ENTRY, adminUser, null
        );
        sa1.setDeviceReference("GATE-TERMINAL-01");
        siteAccessRepository.save(sa1);

        // --- Worker 2: Sunil Verma (Approved, Assigned, Certified Electrician) ---
        Worker w2 = new Worker();
        w2.setWorkerCode("INF-WRK-2026-000002");
        w2.setFullName("Sunil Verma");
        w2.setMobileNumber("+91 97110 55443");
        w2.setEmail("sunil.verma@contractor-workforce.in");
        w2.setDateOfBirth(LocalDate.of(1992, 8, 20));
        w2.setJobRole("ELECTRICIAN");
        w2.setSkillsExperience("Certified high-voltage cable jointer and underground electrical utility conduit specialist.");
        w2.setEmergencyContactName("Geeta Verma");
        w2.setEmergencyContactPhone("+91 97110 99881");
        w2.setCurrentStatus(WorkerStatus.ASSIGNED);
        w2.setCreatedBy(adminUser);
        workerRepository.save(w2);

        associationRepository.save(new WorkerVendorAssociation(w2, apexVendor, LocalDate.now().minusMonths(4)));
        consentRepository.save(new WorkerConsent(w2, "IDENTITY_AND_SAFETY_VERIFICATION", "DPDP consent for electrical utility worksite", adminUser));

        WorkerIdentityVerification v2 = new WorkerIdentityVerification(w2, VerificationMethod.MANUAL_REVIEW, "XXXX-XXXX-6612");
        v2.setVerificationStatus(VerificationStatus.VERIFIED);
        v2.setVerifiedBy(adminUser);
        v2.setVerifiedAt(Instant.now().minus(20, ChronoUnit.DAYS));
        v2.setReviewNotes("Government Driving License manual verification completed and verified against physical card copy.");
        verificationRepository.save(v2);

        WorkerCertification c2 = new WorkerCertification(w2, CertificationType.ELECTRICAL_SAFETY, "Central Power Research Institute (CPRI)", LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(10));
        c2.setVerificationStatus(CertificationStatus.VERIFIED);
        c2.setCertificateNumber("CPRI-ELEC-2025-4421");
        c2.setVerifiedBy(adminUser);
        c2.setVerifiedAt(Instant.now().minus(19, ChronoUnit.DAYS));
        certificationRepository.save(c2);

        approvalRepository.save(new WorkerApproval(w2, adminUser, ApprovalDecision.APPROVED, "Verified CPRI electrical safety accreditation. Cleared for electrical worksites."));

        if (activeZone != null) {
            WorkerProjectAssignment a2 = new WorkerProjectAssignment(
                w2, metroProject, activeZone, apexVendor, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ELECTRICIAN", adminUser
            );
            assignmentRepository.save(a2);
        }

        String opaqueToken2 = "WRK-SEC-" + UUID.randomUUID().toString().replace("-", "") + "-" + HashUtil.generateSecureRandomToken(16);
        WorkerQrCredential cred2 = new WorkerQrCredential(
            w2,
            HashUtil.sha256(opaqueToken2),
            "INFRAPULSE:WRK:" + opaqueToken2 + ":" + w2.getWorkerCode(),
            Instant.now().plus(180, ChronoUnit.DAYS),
            adminUser
        );
        qrCredentialRepository.save(cred2);

        // Previous historical site access
        WorkerSiteAccess sa2 = new WorkerSiteAccess(
            w2, metroProject, activeZone, Instant.now().minus(28, ChronoUnit.HOURS), SiteAccessStatus.ALLOW_ENTRY, adminUser, null
        );
        sa2.setExitTime(Instant.now().minus(20, ChronoUnit.HOURS));
        sa2.setDeviceReference("GATE-TERMINAL-01");
        siteAccessRepository.save(sa2);

        // --- Worker 3: Anil Deshmukh (Pending Review in PM Queue) ---
        Worker w3 = new Worker();
        w3.setWorkerCode("INF-WRK-2026-000003");
        w3.setFullName("Anil Deshmukh");
        w3.setMobileNumber("+91 96550 33221");
        w3.setEmail("anil.deshmukh@apexinfra.com");
        w3.setDateOfBirth(LocalDate.of(1995, 11, 3));
        w3.setJobRole("GENERAL_WORKER");
        w3.setSkillsExperience("Civil construction, trench bed preparation, and backfill compaction experience.");
        w3.setEmergencyContactName("Kishore Deshmukh");
        w3.setEmergencyContactPhone("+91 96550 11990");
        w3.setCurrentStatus(WorkerStatus.PENDING_REVIEW);
        w3.setCreatedBy(adminUser);
        workerRepository.save(w3);

        associationRepository.save(new WorkerVendorAssociation(w3, apexVendor, LocalDate.now()));
        consentRepository.save(new WorkerConsent(w3, "IDENTITY_AND_SAFETY_VERIFICATION", "Consent recorded by submitting vendor", adminUser));

        WorkerIdentityVerification v3 = new WorkerIdentityVerification(w3, VerificationMethod.OFFLINE_UIDAI_XML_CONSENT, "XXXX-XXXX-9942");
        v3.setVerificationStatus(VerificationStatus.PENDING);
        v3.setReviewNotes("Submission queued for Project Manager verification");
        verificationRepository.save(v3);

        WorkerCertification c3 = new WorkerCertification(w3, CertificationType.GENERAL_CONSTRUCTION_SAFETY, "State Skill Development Mission", LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(11));
        c3.setVerificationStatus(CertificationStatus.PENDING);
        c3.setCertificateNumber("SSDM-GEN-2026-0091");
        certificationRepository.save(c3);

        documentRepository.save(new WorkerDocument(
            w3, DocumentType.PHOTO_ID, "vault://workers/INF-WRK-2026-000003/photo_id.pdf", "national_id_card.pdf", "application/pdf", 145020L, adminUser
        ));
        documentRepository.save(new WorkerDocument(
            w3, DocumentType.SKILL_CERTIFICATE, "vault://workers/INF-WRK-2026-000003/skill_cert.pdf", "construction_skills_certificate.pdf", "application/pdf", 310500L, adminUser
        ));

        // --- Worker 4: Deepak Naik (Requires Correction) ---
        Worker w4 = new Worker();
        w4.setWorkerCode("INF-WRK-2026-000004");
        w4.setFullName("Deepak Naik");
        w4.setMobileNumber("+91 95440 88776");
        w4.setDateOfBirth(LocalDate.of(1990, 3, 12));
        w4.setJobRole("MASON");
        w4.setSkillsExperience("Precast chamber construction and asphalt paving support.");
        w4.setCurrentStatus(WorkerStatus.REQUIRES_CORRECTION);
        w4.setCreatedBy(adminUser);
        workerRepository.save(w4);

        associationRepository.save(new WorkerVendorAssociation(w4, apexVendor, LocalDate.now().minusWeeks(2)));
        WorkerIdentityVerification v4 = new WorkerIdentityVerification(w4, VerificationMethod.MANUAL_REVIEW, "XXXX-XXXX-7721");
        v4.setVerificationStatus(VerificationStatus.REQUIRES_CORRECTION);
        v4.setReviewNotes("Uploaded photo identity card is blurry and does not show clear issuing authority stamp. Re-upload high-resolution color scan.");
        verificationRepository.save(v4);

        approvalRepository.save(new WorkerApproval(w4, adminUser, ApprovalDecision.CORRECTION_REQUESTED, "Government photo ID unreadable. Please upload clearer scan."));

        // --- Worker 5: Vikram Singh (Suspended due to Safety Violation) ---
        Worker w5 = new Worker();
        w5.setWorkerCode("INF-WRK-2026-000005");
        w5.setFullName("Vikram Singh");
        w5.setMobileNumber("+91 94330 11442");
        w5.setDateOfBirth(LocalDate.of(1987, 9, 25));
        w5.setJobRole("WELDER");
        w5.setSkillsExperience("Structural welding and utility pipe joining.");
        w5.setCurrentStatus(WorkerStatus.SUSPENDED);
        w5.setCreatedBy(adminUser);
        workerRepository.save(w5);

        associationRepository.save(new WorkerVendorAssociation(w5, apexVendor, LocalDate.now().minusMonths(3)));

        WorkerAccessSuspension susp = new WorkerAccessSuspension(
            w5,
            "Mandatory PPE non-compliance: Worker was observed conducting oxy-acetylene pipe cutting without flame-retardant face shield and protective leather apron inside Zone 1.",
            adminUser,
            LocalDate.now().plusDays(7)
        );
        suspensionRepository.save(susp);

        WorkerIncident inc = new WorkerIncident(
            "INC-2026-0001",
            metroProject,
            activeZone,
            w5,
            IncidentType.SAFETY_VIOLATION,
            IncidentSeverity.HIGH,
            "Worker operated thermal welding equipment inside active trench without mandated safety visor. Temporary site access suspended pending safety re-briefing.",
            adminUser
        );
        inc.setImmediateActionTaken("Work halted immediately. Worker escorted off site and safety suspension issued.");
        inc.setIncidentStatus(IncidentStatus.UNDER_INVESTIGATION);
        incidentRepository.save(inc);

        log.info("Successfully seeded 5 realistic WorkerTrust demonstration records across various lifecycles!");
    }
}
