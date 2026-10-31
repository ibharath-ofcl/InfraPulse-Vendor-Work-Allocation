package com.infrapulse.modules.ai.dto;

import java.util.List;

public class AiModelMetadataDto {
    private String modelId;
    private String modelName;
    private String version;
    private String framework;
    private String modelType;
    private List<String> supportedClasses;
    private String license;
    private String description;
    private String activationStatus;

    public AiModelMetadataDto() {}

    public AiModelMetadataDto(String modelId, String modelName, String version, String framework,
                              String modelType, List<String> supportedClasses, String license,
                              String description, String activationStatus) {
        this.modelId = modelId;
        this.modelName = modelName;
        this.version = version;
        this.framework = framework;
        this.modelType = modelType;
        this.supportedClasses = supportedClasses;
        this.license = license;
        this.description = description;
        this.activationStatus = activationStatus;
    }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getFramework() { return framework; }
    public void setFramework(String framework) { this.framework = framework; }

    public String getModelType() { return modelType; }
    public void setModelType(String modelType) { this.modelType = modelType; }

    public List<String> getSupportedClasses() { return supportedClasses; }
    public void setSupportedClasses(List<String> supportedClasses) { this.supportedClasses = supportedClasses; }

    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getActivationStatus() { return activationStatus; }
    public void setActivationStatus(String activationStatus) { this.activationStatus = activationStatus; }
}
