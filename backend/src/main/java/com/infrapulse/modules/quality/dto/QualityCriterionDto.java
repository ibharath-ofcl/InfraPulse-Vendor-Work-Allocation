package com.infrapulse.modules.quality.dto;

import com.infrapulse.modules.quality.entity.QualityInspectionCriterion;

public class QualityCriterionDto {
    private String id;
    private String criterionCode;
    private String name;
    private String description;
    private String category;
    private boolean isMandatory;
    private String severity;
    private String targetDetectionClass;
    private String evaluationRuleJson;
    private int orderIndex;

    public QualityCriterionDto() {}

    public static QualityCriterionDto fromEntity(QualityInspectionCriterion c) {
        QualityCriterionDto dto = new QualityCriterionDto();
        dto.setId(c.getId());
        dto.setCriterionCode(c.getCriterionCode());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setCategory(c.getCategory() != null ? c.getCategory().name() : null);
        dto.setMandatory(c.isMandatory());
        dto.setSeverity(c.getSeverity() != null ? c.getSeverity().name() : "HIGH");
        dto.setTargetDetectionClass(c.getTargetDetectionClass());
        dto.setEvaluationRuleJson(c.getEvaluationRuleJson());
        dto.setOrderIndex(c.getOrderIndex());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCriterionCode() { return criterionCode; }
    public void setCriterionCode(String criterionCode) { this.criterionCode = criterionCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isMandatory() { return isMandatory; }
    public void setMandatory(boolean mandatory) { isMandatory = mandatory; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTargetDetectionClass() { return targetDetectionClass; }
    public void setTargetDetectionClass(String targetDetectionClass) { this.targetDetectionClass = targetDetectionClass; }

    public String getEvaluationRuleJson() { return evaluationRuleJson; }
    public void setEvaluationRuleJson(String evaluationRuleJson) { this.evaluationRuleJson = evaluationRuleJson; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
