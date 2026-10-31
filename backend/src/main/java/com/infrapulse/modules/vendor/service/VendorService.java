package com.infrapulse.modules.vendor.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.dto.AuditEventDto;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.dto.*;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class VendorService {

    private static final Logger log = LoggerFactory.getLogger(VendorService.class);

    private final VendorRepository vendorRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public VendorService(
        VendorRepository vendorRepository,
        ProjectVendorRepository projectVendorRepository,
        UserRepository userRepository,
        AuditService auditService
    ) {
        this.vendorRepository = vendorRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public VendorResponse createVendor(CreateVendorRequest request, User currentUser) {
        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform administrators can create vendors");
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (vendorRepository.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "A vendor with this email already exists: " + request.getEmail());
        }

        String vendorCode = generateUniqueVendorCode();

        User linkedUser = null;
        if (request.getUserId() != null && !request.getUserId().isBlank()) {
            linkedUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Linked user not found"));
        }

        Vendor vendor = new Vendor(
            null,
            vendorCode,
            request.getCompanyName().trim(),
            request.getContactPerson().trim(),
            normalizedEmail,
            request.getPhoneNumber().trim(),
            request.getAlternatePhone(),
            request.getAddressLine(),
            request.getCity(),
            request.getDistrict(),
            request.getState(),
            request.getPincode().trim(),
            request.getGstNumber(),
            request.getRegistrationNumber(),
            VendorStatus.PENDING_VERIFICATION,
            request.getServiceCategories(),
            linkedUser,
            currentUser
        );

        Vendor saved = vendorRepository.save(vendor);
        log.info("Vendor created: code={}, company={}", saved.getVendorCode(), saved.getCompanyName());

        auditService.recordEvent(
            currentUser.getId(),
            "VENDOR_CREATED",
            "VENDOR",
            saved.getId(),
            "Vendor " + saved.getCompanyName() + " (" + saved.getVendorCode() + ") created in PENDING_VERIFICATION status",
            null
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<VendorResponse> listVendors(
        String search,
        VendorStatus status,
        ServiceCategory category,
        String city,
        String district,
        User currentUser,
        Pageable pageable
    ) {
        // Scoping: Vendor user can only see their own vendor record
        if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> ownVendor = vendorRepository.findByUserId(currentUser.getId());
            if (ownVendor.isEmpty()) {
                return Page.empty(pageable);
            }
            Vendor v = ownVendor.get();
            // check if filter matches
            if (status != null && v.getStatus() != status) {
                return Page.empty(pageable);
            }
            return new org.springframework.data.domain.PageImpl<>(
                List.of(mapToResponse(v)),
                pageable,
                1
            );
        }

        Specification<Vendor> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("companyName")), pattern);
                Predicate personMatch = cb.like(cb.lower(root.get("contactPerson")), pattern);
                Predicate codeMatch = cb.like(cb.lower(root.get("vendorCode")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(nameMatch, personMatch, codeMatch, emailMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }

            if (district != null && !district.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("district")), district.trim().toLowerCase()));
            }

            if (category != null) {
                predicates.add(cb.isMember(category, root.get("serviceCategories")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Vendor> page = vendorRepository.findAll(spec, pageable);
        return page.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public VendorDetailResponse getVendorDetails(String id, User currentUser) {
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + id));

        // Enforce role scoping for Vendor users: can only see their own vendor record
        if (currentUser.getRole() == UserRole.VENDOR) {
            if (vendor.getUser() == null || !vendor.getUser().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: you can only view your own vendor profile");
            }
        }

        List<ProjectVendor> associations = projectVendorRepository.findByVendorId(vendor.getId());
        List<VendorProjectDto> projectDtos = associations.stream()
            .map(this::mapToVendorProjectDto)
            .collect(Collectors.toList());

        List<AuditEventDto> auditDtos = auditService.getEntityAuditTrail("VENDOR", vendor.getId()).stream()
            .map(ae -> new AuditEventDto(
                ae.getId(),
                ae.getActorId(),
                ae.getEventType(),
                ae.getEntityType(),
                ae.getEntityId(),
                ae.getSummary(),
                ae.getReason(),
                ae.getCreatedAt()
            ))
            .collect(Collectors.toList());

        VendorDetailResponse response = new VendorDetailResponse();
        populateBaseResponse(vendor, response);
        response.setAssociatedProjects(projectDtos);
        response.setAuditTrail(auditDtos);

        return response;
    }

    @Transactional
    public VendorResponse updateVendor(String id, UpdateVendorRequest request, User currentUser) {
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + id));

        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            // Vendors can only edit their own contact fields if linked
            if (currentUser.getRole() == UserRole.VENDOR && vendor.getUser() != null && vendor.getUser().getId().equals(currentUser.getId())) {
                // allowed to update phone, alternate phone, address
            } else {
                throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to update this vendor");
            }
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (!vendor.getEmail().equalsIgnoreCase(normalizedEmail) && vendorRepository.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "A vendor with this email already exists: " + request.getEmail());
        }

        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            vendor.setCompanyName(request.getCompanyName().trim());
            vendor.setGstNumber(request.getGstNumber());
            vendor.setRegistrationNumber(request.getRegistrationNumber());
            if (request.getServiceCategories() != null && !request.getServiceCategories().isEmpty()) {
                vendor.setServiceCategories(new HashSet<>(request.getServiceCategories()));
            }
        }

        vendor.setContactPerson(request.getContactPerson().trim());
        vendor.setEmail(normalizedEmail);
        vendor.setPhoneNumber(request.getPhoneNumber().trim());
        vendor.setAlternatePhone(request.getAlternatePhone());
        vendor.setAddressLine(request.getAddressLine());
        vendor.setCity(request.getCity());
        vendor.setDistrict(request.getDistrict());
        vendor.setState(request.getState());
        vendor.setPincode(request.getPincode().trim());

        Vendor updated = vendorRepository.save(vendor);
        log.info("Vendor updated: id={}, code={}", updated.getId(), updated.getVendorCode());

        auditService.recordEvent(
            currentUser.getId(),
            "VENDOR_UPDATED",
            "VENDOR",
            updated.getId(),
            "Vendor " + updated.getCompanyName() + " details updated by " + currentUser.getFullName(),
            null
        );

        return mapToResponse(updated);
    }

    @Transactional
    public VendorResponse updateVendorStatus(String id, UpdateVendorStatusRequest request, User currentUser) {
        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform administrators can change vendor status");
        }

        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + id));

        VendorStatus targetStatus = request.getStatus();
        if (!vendor.getStatus().canTransitionTo(targetStatus)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Invalid vendor status transition from " + vendor.getStatus() + " to " + targetStatus
            );
        }

        VendorStatus oldStatus = vendor.getStatus();
        vendor.setStatus(targetStatus);
        Vendor saved = vendorRepository.save(vendor);

        String reason = request.getReason() != null ? request.getReason().trim() : "No reason provided";
        String eventType = switch (targetStatus) {
            case ACTIVE -> "VENDOR_ACTIVATED";
            case SUSPENDED -> "VENDOR_SUSPENDED";
            case INACTIVE -> "VENDOR_DEACTIVATED";
            default -> "VENDOR_STATUS_CHANGED";
        };

        auditService.recordEvent(
            currentUser.getId(),
            eventType,
            "VENDOR",
            saved.getId(),
            "Vendor status changed from " + oldStatus + " to " + targetStatus + ". Reason: " + reason,
            reason
        );

        return mapToResponse(saved);
    }

    private String generateUniqueVendorCode() {
        String code;
        int attempts = 0;
        do {
            int randomNum = 1000 + new Random().nextInt(9000);
            code = "VND-" + randomNum;
            attempts++;
            if (attempts > 50) {
                code = "VND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }
        } while (vendorRepository.existsByVendorCode(code));
        return code;
    }

    public VendorResponse mapToResponse(Vendor vendor) {
        VendorResponse response = new VendorResponse();
        populateBaseResponse(vendor, response);
        return response;
    }

    private void populateBaseResponse(Vendor vendor, VendorResponse response) {
        response.setId(vendor.getId());
        response.setVendorCode(vendor.getVendorCode());
        response.setCompanyName(vendor.getCompanyName());
        response.setContactPerson(vendor.getContactPerson());
        response.setEmail(vendor.getEmail());
        response.setPhoneNumber(vendor.getPhoneNumber());
        response.setAlternatePhone(vendor.getAlternatePhone());
        response.setAddressLine(vendor.getAddressLine());
        response.setCity(vendor.getCity());
        response.setDistrict(vendor.getDistrict());
        response.setState(vendor.getState());
        response.setPincode(vendor.getPincode());
        response.setGstNumber(vendor.getGstNumber());
        response.setRegistrationNumber(vendor.getRegistrationNumber());
        response.setStatus(vendor.getStatus());
        response.setServiceCategories(vendor.getServiceCategories());
        response.setUserId(vendor.getUser() != null ? vendor.getUser().getId() : null);
        response.setCreatedAt(vendor.getCreatedAt());
        response.setUpdatedAt(vendor.getUpdatedAt());

        long activeCount = projectVendorRepository.findByVendorIdAndAssociationStatus(vendor.getId(), "ACTIVE").size();
        response.setActiveProjectsCount((int) activeCount);
    }

    private VendorProjectDto mapToVendorProjectDto(ProjectVendor pv) {
        Project p = pv.getProject();
        VendorProjectDto dto = new VendorProjectDto();
        dto.setAssociationId(pv.getId());
        dto.setProjectId(p.getId());
        dto.setProjectCode(p.getProjectCode());
        dto.setProjectName(p.getProjectName());
        dto.setProjectType(p.getProjectType());
        dto.setProjectStatus(p.getStatus());
        dto.setRegion(p.getRegion());
        dto.setState(p.getState());
        dto.setStartDate(p.getStartDate());
        dto.setTargetEndDate(p.getTargetEndDate());
        dto.setAssociationStatus(pv.getAssociationStatus());
        dto.setAssociatedAt(pv.getAssociatedAt());
        dto.setDeactivatedAt(pv.getDeactivatedAt());
        dto.setNotes(pv.getNotes());
        return dto;
    }
}
