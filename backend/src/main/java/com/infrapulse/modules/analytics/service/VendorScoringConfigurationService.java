package com.infrapulse.modules.analytics.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.analytics.dto.ScoringConfigurationDto;
import com.infrapulse.modules.analytics.entity.VendorScoringConfiguration;
import com.infrapulse.modules.analytics.repository.VendorScoringConfigurationRepository;
import com.infrapulse.modules.auth.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VendorScoringConfigurationService {

    private final VendorScoringConfigurationRepository repository;
    private final AuditService auditService;

    public VendorScoringConfigurationService(VendorScoringConfigurationRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional
    public VendorScoringConfiguration getActiveConfigurationEntity() {
        return repository.findFirstByActiveTrueOrderByVersionDesc()
                .orElseGet(() -> {
                    VendorScoringConfiguration defaultConfig = new VendorScoringConfiguration();
                    defaultConfig.setId("cfg-default-v1");
                    defaultConfig.setConfigurationName("Standard Enterprise Infrastructure Weighting");
                    defaultConfig.setVersion(1);
                    defaultConfig.setQualityWeight(new BigDecimal("30.00"));
                    defaultConfig.setOnTimeWeight(new BigDecimal("25.00"));
                    defaultConfig.setEvidenceWeight(new BigDecimal("15.00"));
                    defaultConfig.setReworkWeight(new BigDecimal("20.00"));
                    defaultConfig.setCompletionWeight(new BigDecimal("10.00"));
                    defaultConfig.setActive(true);
                    return repository.save(defaultConfig);
                });
    }

    @Transactional
    public ScoringConfigurationDto getActiveConfiguration() {
        return mapToDto(getActiveConfigurationEntity());
    }

    @Transactional(readOnly = true)
    public List<ScoringConfigurationDto> getAllConfigurations() {
        return repository.findAllByOrderByVersionDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScoringConfigurationDto createConfiguration(ScoringConfigurationDto request, User user) {
        BigDecimal sum = BigDecimal.ZERO;
        if (request.getQualityWeight() != null) sum = sum.add(request.getQualityWeight());
        if (request.getOnTimeWeight() != null) sum = sum.add(request.getOnTimeWeight());
        if (request.getEvidenceWeight() != null) sum = sum.add(request.getEvidenceWeight());
        if (request.getReworkWeight() != null) sum = sum.add(request.getReworkWeight());
        if (request.getCompletionWeight() != null) sum = sum.add(request.getCompletionWeight());

        if (sum.compareTo(new BigDecimal("100.00")) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weights must sum to exactly 100.00%. Current sum: " + sum);
        }

        int nextVersion = repository.findTopByOrderByVersionDesc()
                .map(c -> c.getVersion() + 1)
                .orElse(1);

        VendorScoringConfiguration config = new VendorScoringConfiguration();
        config.setId(UUID.randomUUID().toString());
        config.setConfigurationName(request.getConfigurationName() != null ? request.getConfigurationName() : "Custom Configuration v" + nextVersion);
        config.setVersion(nextVersion);
        config.setQualityWeight(request.getQualityWeight());
        config.setOnTimeWeight(request.getOnTimeWeight());
        config.setEvidenceWeight(request.getEvidenceWeight());
        config.setReworkWeight(request.getReworkWeight());
        config.setCompletionWeight(request.getCompletionWeight());
        config.setActive(request.isActive());
        config.setCreatedBy(user);

        if (config.isActive()) {
            deactivateAll();
        }

        VendorScoringConfiguration saved = repository.save(config);

        auditService.recordRichEvent(
                user, AuditCategory.SYSTEM, "SCORING_CONFIGURATION_CREATED", "CREATE_SCORING_CONFIG",
                "SCORING_CONFIG", saved.getId(), saved.getConfigurationName(), null, null,
                AuditOutcome.SUCCESS, "Created scoring configuration v" + nextVersion, null, null, "ANALYTICS_MODULE", null, null, null
        );

        return mapToDto(saved);
    }

    @Transactional
    public ScoringConfigurationDto activateConfiguration(String configurationId, User user) {
        VendorScoringConfiguration config = repository.findById(configurationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scoring configuration not found: " + configurationId));

        deactivateAll();
        config.setActive(true);
        VendorScoringConfiguration saved = repository.save(config);

        auditService.recordRichEvent(
                user, AuditCategory.SYSTEM, "SCORING_CONFIGURATION_ACTIVATED", "ACTIVATE_SCORING_CONFIG",
                "SCORING_CONFIG", saved.getId(), saved.getConfigurationName(), null, null,
                AuditOutcome.SUCCESS, "Activated scoring configuration v" + saved.getVersion(), null, null, "ANALYTICS_MODULE", null, null, null
        );

        return mapToDto(saved);
    }

    private void deactivateAll() {
        List<VendorScoringConfiguration> all = repository.findAll();
        for (VendorScoringConfiguration c : all) {
            if (c.isActive()) {
                c.setActive(false);
                repository.save(c);
            }
        }
    }

    public ScoringConfigurationDto mapToDto(VendorScoringConfiguration entity) {
        ScoringConfigurationDto dto = new ScoringConfigurationDto();
        dto.setId(entity.getId());
        dto.setConfigurationName(entity.getConfigurationName());
        dto.setVersion(entity.getVersion());
        dto.setQualityWeight(entity.getQualityWeight());
        dto.setOnTimeWeight(entity.getOnTimeWeight());
        dto.setEvidenceWeight(entity.getEvidenceWeight());
        dto.setReworkWeight(entity.getReworkWeight());
        dto.setCompletionWeight(entity.getCompletionWeight());
        dto.setActive(entity.isActive());
        if (entity.getCreatedBy() != null) {
            dto.setCreatedByName(entity.getCreatedBy().getFullName());
        }
        if (entity.getCreatedAt() != null) {
            dto.setCreatedAt(entity.getCreatedAt().toString());
        }
        return dto;
    }
}
