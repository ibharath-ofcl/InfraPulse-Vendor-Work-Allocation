package com.infrapulse.modules.quality.dto;

import com.infrapulse.modules.quality.entity.QualityInspectionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public class QualityTemplateDto {
    private String id;
    private String templateCode;
    private String workType;
    private String name;
    private String version;
    private String description;
    private boolean isActive;
    private List<QualityCriterionDto> criteria;
    private Instant createdAt;

    public QualityTemplateDto() {}

    public static QualityTemplateDto fromEntity(QualityInspectionTemplate t) {
        QualityTemplateDto dto = new QualityTemplateDto();
        dto.setId(t.getId());
        dto.setTemplateCode(t.getTemplateCode());
        dto.setWorkType(t.getWorkType() != null ? t.getWorkType().name() : null);
        dto.setName(t.getName());
        dto.setVersion(t.getVersion());
        dto.setDescription(t.getDescription());
        dto.setActive(t.isActive());
        if (t.getCriteria() != null) {
            dto.setCriteria(t.getCriteria().stream().map(QualityCriterionDto::fromEntity).collect(Collectors.toList()));
        }
        dto.setCreatedAt(t.getCreatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public List<QualityCriterionDto> getCriteria() { return criteria; }
    public void setCriteria(List<QualityCriterionDto> criteria) { this.criteria = criteria; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
