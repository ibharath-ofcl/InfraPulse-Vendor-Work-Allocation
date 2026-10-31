package com.infrapulse.modules.finance.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.entity.MilestoneWorkAssignment;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.repository.MilestoneWorkAssignmentRepository;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectMilestoneService {

    private static final Logger log = LoggerFactory.getLogger(ProjectMilestoneService.class);

    private final ProjectMilestoneRepository milestoneRepository;
    private final MilestoneWorkAssignmentRepository mwaRepository;
    private final VendorAgreementRepository agreementRepository;
    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final PaymentAuthorizationRepository paymentAuthorizationRepository;
    private final AuditService auditService;
    private final EntityManager entityManager;

    public ProjectMilestoneService(
            ProjectMilestoneRepository milestoneRepository,
            MilestoneWorkAssignmentRepository mwaRepository,
            VendorAgreementRepository agreementRepository,
            ProjectRepository projectRepository,
            VendorRepository vendorRepository,
            WorkAssignmentRepository workAssignmentRepository,
            ProjectVendorRepository projectVendorRepository,
            PaymentAuthorizationRepository paymentAuthorizationRepository,
            AuditService auditService,
            EntityManager entityManager) {
        this.milestoneRepository = milestoneRepository;
        this.mwaRepository = mwaRepository;
        this.agreementRepository = agreementRepository;
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.workAssignmentRepository = workAssignmentRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.paymentAuthorizationRepository = paymentAuthorizationRepository;
        this.auditService = auditService;
        this.entityManager = entityManager;
    }

    @Transactional
    public ProjectMilestoneResponse createMilestone(CreateMilestoneRequest request, User currentUser) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + request.getProjectId()));

        VendorAgreement agreement = agreementRepository.findById(request.getAgreementId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Agreement not found with id: " + request.getAgreementId()));

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + request.getVendorId()));

        if (agreement.getStatus() == AgreementStatus.TERMINATED || agreement.getStatus() == AgreementStatus.EXPIRED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot create milestones for agreement in status: " + agreement.getStatus());
        }

        if (!agreement.getVendor().getId().equals(vendor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agreement does not belong to vendor: " + vendor.getCompanyName());
        }

        if (!agreement.getProject().getId().equals(project.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agreement does not belong to project: " + project.getProjectName());
        }

        if (request.getMilestoneValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Milestone value must be greater than zero");
        }

        // Percentage of contract calculation if not explicitly provided
        BigDecimal percentageOfContract = request.getPercentageOfContract();
        if (percentageOfContract == null && agreement.getContractValue().compareTo(BigDecimal.ZERO) > 0) {
            percentageOfContract = request.getMilestoneValue()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(agreement.getContractValue(), 2, RoundingMode.HALF_UP);
        }

        String code = generateMilestoneCode();

        ProjectMilestone milestone = new ProjectMilestone();
        milestone.setMilestoneCode(code);
        milestone.setProject(project);
        milestone.setAgreement(agreement);
        milestone.setVendor(vendor);
        milestone.setName(request.getName());
        milestone.setDescription(request.getDescription());
        milestone.setSequenceNumber(request.getSequenceNumber());
        milestone.setMilestoneType(request.getMilestoneType());
        milestone.setMilestoneValue(request.getMilestoneValue());
        milestone.setCurrency(request.getCurrency() != null ? request.getCurrency() : agreement.getCurrency());
        milestone.setPercentageOfContract(percentageOfContract);
        milestone.setPlannedStartDate(request.getPlannedStartDate());
        milestone.setPlannedEndDate(request.getPlannedEndDate());
        milestone.setStatus(MilestoneStatus.DRAFT);
        milestone.setPaymentPolicy(request.getPaymentPolicy());
        milestone.setCreatedBy(currentUser);

        ProjectMilestone saved = milestoneRepository.save(milestone);

        // Associate assignments if provided
        if (request.getAssignmentIds() != null && !request.getAssignmentIds().isEmpty()) {
            for (String asnId : request.getAssignmentIds()) {
                WorkAssignment assignment = workAssignmentRepository.findById(asnId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found with id: " + asnId));
                MilestoneWorkAssignment mwa = new MilestoneWorkAssignment(saved, assignment);
                mwaRepository.save(mwa);
            }
        }

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "MILESTONE_CREATED",
                "MILESTONE",
                saved.getId(),
                "Created milestone " + saved.getMilestoneCode() + " (" + saved.getName() + ")",
                "Value: " + saved.getCurrency() + " " + saved.getMilestoneValue()
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ProjectMilestoneResponse updateMilestone(String milestoneId, UpdateMilestoneRequest request, User currentUser) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));

        if (milestone.getStatus() == MilestoneStatus.PAID) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot edit already PAID milestone");
        }

        milestone.setName(request.getName());
        if (request.getDescription() != null) milestone.setDescription(request.getDescription());
        milestone.setSequenceNumber(request.getSequenceNumber());
        if (request.getMilestoneType() != null) milestone.setMilestoneType(request.getMilestoneType());
        milestone.setMilestoneValue(request.getMilestoneValue());
        if (request.getPercentageOfContract() != null) milestone.setPercentageOfContract(request.getPercentageOfContract());
        if (request.getPlannedStartDate() != null) milestone.setPlannedStartDate(request.getPlannedStartDate());
        if (request.getPlannedEndDate() != null) milestone.setPlannedEndDate(request.getPlannedEndDate());
        if (request.getActualCompletionDate() != null) milestone.setActualCompletionDate(request.getActualCompletionDate());
        if (request.getStatus() != null) milestone.setStatus(request.getStatus());
        if (request.getPaymentPolicy() != null) milestone.setPaymentPolicy(request.getPaymentPolicy());

        ProjectMilestone updated = milestoneRepository.save(milestone);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "MILESTONE_UPDATED",
                "MILESTONE",
                updated.getId(),
                "Updated milestone " + updated.getMilestoneCode(),
                "Status: " + updated.getStatus()
        );

        return mapToResponse(updated);
    }

    @Transactional
    public ProjectMilestoneResponse associateAssignments(String milestoneId, AssociateMilestoneAssignmentsRequest request, User currentUser) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));

        for (String assignmentId : request.getAssignmentIds()) {
            WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found with id: " + assignmentId));

            if (!mwaRepository.existsByMilestoneIdAndAssignmentId(milestone.getId(), assignment.getId())) {
                MilestoneWorkAssignment mwa = new MilestoneWorkAssignment(milestone, assignment);
                mwaRepository.save(mwa);
            }
        }

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "MILESTONE_ASSIGNMENTS_UPDATED",
                "MILESTONE",
                milestone.getId(),
                "Associated " + request.getAssignmentIds().size() + " assignments with milestone " + milestone.getMilestoneCode(),
                null
        );

        return mapToResponse(milestone);
    }

    @Transactional
    public ProjectMilestoneResponse removeAssignment(String milestoneId, String assignmentId, User currentUser) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));

        mwaRepository.deleteByMilestoneIdAndAssignmentId(milestoneId, assignmentId);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "MILESTONE_ASSIGNMENT_REMOVED",
                "MILESTONE",
                milestone.getId(),
                "Removed assignment " + assignmentId + " from milestone " + milestone.getMilestoneCode(),
                null
        );

        return mapToResponse(milestone);
    }

    @Transactional(readOnly = true)
    public ProjectMilestoneResponse getMilestoneById(String milestoneId) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));
        return mapToResponse(milestone);
    }

    @Transactional(readOnly = true)
    public List<ProjectMilestoneResponse> getMilestonesByProject(String projectId) {
        return milestoneRepository.findByProjectIdOrderBySequenceNumberAsc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectMilestoneResponse> getMilestonesByAgreement(String agreementId) {
        return milestoneRepository.findByAgreementIdOrderBySequenceNumberAsc(agreementId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectMilestoneResponse> getMilestonesByVendor(String vendorId) {
        return milestoneRepository.findByVendorId(vendorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProjectMilestoneResponse> getMilestones(Pageable pageable) {
        return milestoneRepository.findAll(pageable).map(this::mapToResponse);
    }

    private String generateMilestoneCode() {
        try {
            Object res = entityManager.createNativeQuery("SELECT nextval('milestone_seq')").getSingleResult();
            long nextVal = res instanceof BigInteger ? ((BigInteger) res).longValue() : ((Number) res).longValue();
            return String.format("MLS-%04d", nextVal);
        } catch (Exception e) {
            return "MLS-" + System.currentTimeMillis() % 100000;
        }
    }

    public ProjectMilestoneResponse mapToResponse(ProjectMilestone m) {
        ProjectMilestoneResponse dto = new ProjectMilestoneResponse();
        dto.setId(m.getId());
        dto.setMilestoneCode(m.getMilestoneCode());
        if (m.getProject() != null) {
            dto.setProjectId(m.getProject().getId());
            dto.setProjectName(m.getProject().getProjectName());
        }
        if (m.getAgreement() != null) {
            dto.setAgreementId(m.getAgreement().getId());
            dto.setAgreementCode(m.getAgreement().getAgreementCode());
        }
        if (m.getVendor() != null) {
            dto.setVendorId(m.getVendor().getId());
            dto.setVendorCode(m.getVendor().getVendorCode());
            dto.setVendorName(m.getVendor().getCompanyName());
        }
        dto.setName(m.getName());
        dto.setDescription(m.getDescription());
        dto.setSequenceNumber(m.getSequenceNumber());
        dto.setMilestoneType(m.getMilestoneType());
        dto.setMilestoneValue(m.getMilestoneValue());
        dto.setCurrency(m.getCurrency());
        dto.setPercentageOfContract(m.getPercentageOfContract());
        dto.setPlannedStartDate(m.getPlannedStartDate());
        dto.setPlannedEndDate(m.getPlannedEndDate());
        dto.setActualCompletionDate(m.getActualCompletionDate());
        dto.setStatus(m.getStatus());
        dto.setPaymentPolicy(m.getPaymentPolicy());

        // Calculate balances
        BigDecimal authorized = paymentAuthorizationRepository.sumAuthorizedAmountByMilestoneId(m.getId());
        BigDecimal settled = paymentAuthorizationRepository.sumSettledAmountByMilestoneId(m.getId());
        BigDecimal remaining = m.getMilestoneValue().subtract(authorized);

        dto.setAuthorizedAmount(authorized);
        dto.setSettledAmount(settled);
        dto.setRemainingBalance(remaining.max(BigDecimal.ZERO));
        dto.setEligibleForPayment(m.getStatus() == MilestoneStatus.ELIGIBLE_FOR_PAYMENT ||
                (m.getStatus() == MilestoneStatus.PARTIALLY_PAID && remaining.compareTo(BigDecimal.ZERO) > 0));

        // Associated work assignments
        List<MilestoneWorkAssignment> mwaList = mwaRepository.findByMilestoneId(m.getId());
        dto.setAssignmentCount(mwaList.size());
        List<ProjectMilestoneResponse.MilestoneAssignmentSummaryDto> asnDtos = new ArrayList<>();
        for (MilestoneWorkAssignment mwa : mwaList) {
            if (mwa.getAssignment() != null) {
                WorkAssignment a = mwa.getAssignment();
                ProjectMilestoneResponse.MilestoneAssignmentSummaryDto asDto = new ProjectMilestoneResponse.MilestoneAssignmentSummaryDto();
                asDto.setId(a.getId());
                asDto.setAssignmentCode(a.getAssignmentCode());
                asDto.setTitle(a.getTitle());
                asDto.setWorkType(a.getWorkType() != null ? a.getWorkType().getDisplayName() : null);
                asDto.setZoneName(a.getWorkZone() != null ? a.getWorkZone().getZoneName() : null);
                asDto.setStatus(a.getStatus() != null ? a.getStatus().name() : null);
                asDto.setReleaseStatus(a.getReleaseStatus() != null ? a.getReleaseStatus().name() : null);
                asnDtos.add(asDto);
            }
        }
        dto.setAssignments(asnDtos);

        if (m.getCreatedBy() != null) {
            dto.setCreatedById(m.getCreatedBy().getId());
            dto.setCreatedByName(m.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(m.getCreatedAt());
        dto.setUpdatedAt(m.getUpdatedAt());
        return dto;
    }
}
