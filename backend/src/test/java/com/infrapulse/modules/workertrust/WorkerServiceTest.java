package com.infrapulse.modules.workertrust;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.BadRequestException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workertrust.dto.RegisterWorkerRequest;
import com.infrapulse.modules.workertrust.dto.WorkerApprovalRequest;
import com.infrapulse.modules.workertrust.dto.WorkerDetailResponse;
import com.infrapulse.modules.workertrust.dto.WorkerSummaryResponse;
import com.infrapulse.modules.workertrust.entity.Worker;
import com.infrapulse.modules.workertrust.entity.WorkerVendorAssociation;
import com.infrapulse.modules.workertrust.enums.ApprovalDecision;
import com.infrapulse.modules.workertrust.enums.VerificationMethod;
import com.infrapulse.modules.workertrust.enums.WorkerStatus;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.modules.workertrust.service.WorkerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkerServiceTest {

    @Mock private WorkerRepository workerRepository;
    @Mock private WorkerVendorAssociationRepository associationRepository;
    @Mock private WorkerConsentRepository consentRepository;
    @Mock private WorkerDocumentRepository documentRepository;
    @Mock private WorkerIdentityVerificationRepository verificationRepository;
    @Mock private WorkerCertificationRepository certificationRepository;
    @Mock private WorkerApprovalRepository approvalRepository;
    @Mock private WorkerProjectAssignmentRepository assignmentRepository;
    @Mock private WorkerQrCredentialRepository qrCredentialRepository;
    @Mock private WorkerSiteAccessRepository siteAccessRepository;
    @Mock private WorkerIncidentRepository incidentRepository;
    @Mock private WorkerAccessSuspensionRepository suspensionRepository;
    @Mock private WorkerNotificationRepository notificationRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private WorkerService workerService;

    private User adminUser;
    private Vendor demoVendor;

    @BeforeEach
    void setUp() {
        adminUser = new User("admin-1", "Admin User", "admin@infrapulse.gov.in", "hash", "+919999900000", UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE);
        demoVendor = new Vendor();
        demoVendor.setId("vendor-1");
        demoVendor.setCompanyName("Apex Infrastructure Ltd");
        demoVendor.setVendorCode("VND-APEX-01");
    }

    @Test
    @DisplayName("Should successfully register a worker and generate a unique internal worker code")
    void testRegisterWorker_Success() {
        RegisterWorkerRequest request = new RegisterWorkerRequest(
            "Anil Sharma",
            "+91 98450 12345",
            "anil.sharma@example.com",
            LocalDate.of(1990, 1, 1),
            "MASON",
            "5 years paving",
            "Sunita Sharma",
            "+91 98450 99999",
            "vendor-1",
            true,
            VerificationMethod.MANUAL_REVIEW,
            "REF-DL-8832"
        );

        when(vendorRepository.findById("vendor-1")).thenReturn(Optional.of(demoVendor));
        when(workerRepository.getNextWorkerSequence()).thenReturn(1001L);
        when(workerRepository.save(any(Worker.class))).thenAnswer(invocation -> {
            Worker w = invocation.getArgument(0);
            w.setId("worker-123");
            return w;
        });

        WorkerSummaryResponse response = workerService.registerWorker(request, adminUser);

        assertNotNull(response);
        assertEquals("Anil Sharma", response.fullName());
        assertTrue(response.workerCode().startsWith("INF-WRK-"));
        assertEquals(WorkerStatus.PENDING_REVIEW, response.currentStatus());

        verify(workerRepository, times(1)).save(any(Worker.class));
        verify(associationRepository, times(1)).save(any());
        verify(consentRepository, times(1)).save(any());
        verify(verificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should reject worker registration if explicit DPDP consent is missing")
    void testRegisterWorker_ConsentMissing_ThrowsBadRequest() {
        RegisterWorkerRequest request = new RegisterWorkerRequest(
            "Anil Sharma",
            "+91 98450 12345",
            null,
            null,
            "GENERAL_WORKER",
            null,
            null,
            null,
            "vendor-1",
            false,
            null,
            null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
            workerService.registerWorker(request, adminUser)
        );

        assertTrue(ex.getMessage().contains("consent"));
        verifyNoInteractions(workerRepository);
    }

    @Test
    @DisplayName("Should approve worker and transition status to APPROVED")
    void testApproveWorker_Success() {
        Worker worker = new Worker();
        worker.setId("worker-1");
        worker.setWorkerCode("INF-WRK-2026-000001");
        worker.setFullName("Ramesh Kumar");
        worker.setCurrentStatus(WorkerStatus.PENDING_REVIEW);

        when(workerRepository.findById("worker-1")).thenReturn(Optional.of(worker));
        when(suspensionRepository.existsByWorkerIdAndSuspensionStatus("worker-1", com.infrapulse.modules.workertrust.enums.SuspensionStatus.ACTIVE))
            .thenReturn(false);
        when(workerRepository.save(any(Worker.class))).thenReturn(worker);

        WorkerApprovalRequest request = new WorkerApprovalRequest(ApprovalDecision.APPROVED, "All identity documents verified.");
        WorkerDetailResponse response = workerService.approveOrRejectWorker("worker-1", request, adminUser);

        assertNotNull(response);
        assertEquals(WorkerStatus.APPROVED, worker.getCurrentStatus());
        verify(approvalRepository, times(1)).save(any());
        verify(qrCredentialRepository, times(1)).save(any());
    }
}
