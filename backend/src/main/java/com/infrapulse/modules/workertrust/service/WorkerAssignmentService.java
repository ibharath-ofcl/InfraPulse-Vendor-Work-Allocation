package com.infrapulse.modules.workertrust.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.BadRequestException;
import com.infrapulse.common.exception.ForbiddenException;
import com.infrapulse.common.exception.ResourceNotFoundException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workertrust.dto.AssignWorkerRequest;
import com.infrapulse.modules.workertrust.dto.WorkerAssignmentDto;
import com.infrapulse.modules.workertrust.entity.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class WorkerAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(WorkerAssignmentService.class);

    private final WorkerRepository workerRepository;
    private final WorkerVendorAssociationRepository associationRepository;
    private final WorkerCertificationRepository certificationRepository;
    private final WorkerProjectAssignmentRepository assignmentRepository;
    private final WorkerAccessSuspensionRepository suspensionRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final VendorRepository vendorRepository;
    private final AuditService auditService;

    public WorkerAssignmentService(
        WorkerRepository workerRepository,
        WorkerVendorAssociationRepository associationRepository,
        WorkerCertificationRepository certificationRepository,
        WorkerProjectAssignmentRepository assignmentRepository,
        WorkerAccessSuspensionRepository suspensionRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        VendorRepository vendorRepository,
        AuditService auditService
    ) {
        this.workerRepository = workerRepository;
        this.associationRepository = associationRepository;
        this.certificationRepository = certificationRepository;
        this.assignmentRepository = assignmentRepository;
        this.suspensionRepository = suspensionRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.vendorRepository = vendorRepository;
        this.auditService = auditService;
    }

    @Transactional
    public WorkerAssignmentDto assignWorker(String workerId, AssignWorkerRequest request, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found with ID: " + workerId));

        // 1. Worker status validation
        if (worker.getCurrentStatus() != WorkerStatus.APPROVED && worker.getCurrentStatus() != WorkerStatus.ASSIGNED) {
            throw new BadRequestException("Worker cannot be assigned unless APPROVED. Current status: " + worker.getCurrentStatus());
        }

        // 2. Active suspension check
        if (suspensionRepository.existsByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE)) {
            throw new BadRequestException("Worker is currently SUSPENDED and cannot be assigned to project or site");
        }

        // 3. Vendor association check
        WorkerVendorAssociation assoc = associationRepository.findFirstByWorkerIdAndAssociationStatus(worker.getId(), "ACTIVE")
            .orElseThrow(() -> new BadRequestException("Worker has no active vendor association"));
        Vendor vendor = assoc.getVendor();

        // 4. Project and Work Zone validation
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.projectId()));

        WorkZone workZone = workZoneRepository.findById(request.workZoneId())
            .orElseThrow(() -> new ResourceNotFoundException("Work Zone not found with ID: " + request.workZoneId()));

        if (!workZone.getProject().getId().equals(project.getId())) {
            throw new BadRequestException("Work Zone " + workZone.getZoneCode() + " does not belong to Project " + project.getProjectCode());
        }

        // 5. Date validation
        if (request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("Assignment end date cannot be earlier than start date");
        }

        // 6. Mandatory Certification Compliance Rules
        validateMandatoryCertifications(worker, request.requiredRole(), workZone);

        // 7. Check for conflicting active assignments
        List<WorkerProjectAssignment> existingAssignments = assignmentRepository.findByWorkerId(worker.getId());
        for (WorkerProjectAssignment existing : existingAssignments) {
            if (existing.getAssignmentStatus() == AssignmentStatus.ACTIVE) {
                boolean overlap = !request.startDate().isAfter(existing.getEndDate()) &&
                                  !request.endDate().isBefore(existing.getStartDate());
                if (overlap) {
                    throw new BadRequestException(String.format(
                        "Worker already has an active assignment on Project %s (%s to %s) overlapping with requested dates",
                        existing.getProject().getProjectCode(), existing.getStartDate(), existing.getEndDate()
                    ));
                }
            }
        }

        WorkerProjectAssignment assignment = new WorkerProjectAssignment(
            worker,
            project,
            workZone,
            vendor,
            request.startDate(),
            request.endDate(),
            request.requiredRole() != null ? request.requiredRole() : worker.getJobRole(),
            currentUser
        );
        WorkerProjectAssignment saved = assignmentRepository.save(assignment);

        worker.setCurrentStatus(WorkerStatus.ASSIGNED);
        workerRepository.save(worker);

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_ASSIGNED_TO_ZONE",
            "WORKER_ASSIGNMENT",
            worker.getId(),
            String.format("Assigned worker %s to Project %s / Zone %s (%s to %s)",
                worker.getWorkerCode(), project.getProjectCode(), workZone.getZoneCode(), request.startDate(), request.endDate()),
            "ZONE_ASSIGNMENT"
        );

        return toDto(saved);
    }

    @Transactional
    public WorkerAssignmentDto cancelAssignment(String assignmentId, User currentUser) {
        WorkerProjectAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));

        assignment.setAssignmentStatus(AssignmentStatus.CANCELLED);
        WorkerProjectAssignment updated = assignmentRepository.save(assignment);

        Worker worker = assignment.getWorker();
        boolean hasOtherActive = assignmentRepository.findActiveAssignmentForWorker(worker.getId(), LocalDate.now()).isPresent();
        if (!hasOtherActive && worker.getCurrentStatus() == WorkerStatus.ASSIGNED) {
            worker.setCurrentStatus(WorkerStatus.APPROVED);
            workerRepository.save(worker);
        }

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_ASSIGNMENT_CANCELLED",
            "WORKER_ASSIGNMENT",
            worker.getId(),
            "Cancelled assignment " + assignmentId + " for worker " + worker.getWorkerCode(),
            "ASSIGNMENT_CANCELLED"
        );

        return toDto(updated);
    }

    private void validateMandatoryCertifications(Worker worker, String role, WorkZone zone) {
        List<WorkerCertification> certs = certificationRepository.findByWorkerId(worker.getId());
        String effectiveRole = role != null ? role.toUpperCase() : worker.getJobRole().toUpperCase();

        if (effectiveRole.contains("ELECTRIC") || effectiveRole.contains("POWER")) {
            boolean hasElectrical = certs.stream().anyMatch(c ->
                c.getCertificationType() == CertificationType.ELECTRICAL_SAFETY &&
                c.getVerificationStatus() == CertificationStatus.VERIFIED &&
                !c.isExpired()
            );
            if (!hasElectrical) {
                throw new BadRequestException("Safety rule violation: Worker requires a valid, verified ELECTRICAL_SAFETY certification for electrical roles");
            }
        }

        if (effectiveRole.contains("EXCAVAT") || effectiveRole.contains("TRENCH") || effectiveRole.contains("OPERATOR")) {
            boolean hasExcavation = certs.stream().anyMatch(c ->
                (c.getCertificationType() == CertificationType.EXCAVATION_SAFETY ||
                 c.getCertificationType() == CertificationType.HEAVY_EQUIPMENT_OPERATION) &&
                c.getVerificationStatus() == CertificationStatus.VERIFIED &&
                !c.isExpired()
            );
            if (!hasExcavation) {
                throw new BadRequestException("Safety rule violation: Worker requires a valid, verified EXCAVATION_SAFETY or HEAVY_EQUIPMENT_OPERATION certification for excavation/trenching operations");
            }
        }

        if (effectiveRole.contains("HEIGHT") || effectiveRole.contains("SCAFFOLD") || effectiveRole.contains("ROOF")) {
            boolean hasHeight = certs.stream().anyMatch(c ->
                c.getCertificationType() == CertificationType.WORKING_AT_HEIGHT &&
                c.getVerificationStatus() == CertificationStatus.VERIFIED &&
                !c.isExpired()
            );
            if (!hasHeight) {
                throw new BadRequestException("Safety rule violation: Worker requires a valid, verified WORKING_AT_HEIGHT certification for elevated worksites");
            }
        }
    }

    public WorkerAssignmentDto toDto(WorkerProjectAssignment a) {
        return new WorkerAssignmentDto(
            a.getId(),
            a.getProject().getId(),
            a.getProject().getProjectCode(),
            a.getProject().getProjectName(),
            a.getWorkZone().getId(),
            a.getWorkZone().getZoneCode(),
            a.getWorkZone().getZoneName(),
            a.getVendor().getId(),
            a.getVendor().getCompanyName(),
            a.getStartDate(),
            a.getEndDate(),
            a.getAssignmentStatus(),
            a.getRequiredRole(),
            a.getAssignedBy().getFullName(),
            a.getCreatedAt()
        );
    }
}
