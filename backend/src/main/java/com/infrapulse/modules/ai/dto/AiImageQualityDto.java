package com.infrapulse.modules.ai.dto;

import java.util.List;

public class AiImageQualityDto {
    private Integer resolutionWidth;
    private Integer resolutionHeight;
    private Double blurScore;
    private Double brightnessScore;
    private Double contrastScore;
    private String qualityStatus;
    private List<String> warnings;

    public AiImageQualityDto() {}

    public AiImageQualityDto(Integer resolutionWidth, Integer resolutionHeight, Double blurScore,
                             Double brightnessScore, Double contrastScore, String qualityStatus, List<String> warnings) {
        this.resolutionWidth = resolutionWidth;
        this.resolutionHeight = resolutionHeight;
        this.blurScore = blurScore;
        this.brightnessScore = brightnessScore;
        this.contrastScore = contrastScore;
        this.qualityStatus = qualityStatus;
        this.warnings = warnings;
    }

    public Integer getResolutionWidth() { return resolutionWidth; }
    public void setResolutionWidth(Integer resolutionWidth) { this.resolutionWidth = resolutionWidth; }

    public Integer getResolutionHeight() { return resolutionHeight; }
    public void setResolutionHeight(Integer resolutionHeight) { this.resolutionHeight = resolutionHeight; }

    public Double getBlurScore() { return blurScore; }
    public void setBlurScore(Double blurScore) { this.blurScore = blurScore; }

    public Double getBrightnessScore() { return brightnessScore; }
    public void setBrightnessScore(Double brightnessScore) { this.brightnessScore = brightnessScore; }

    public Double getContrastScore() { return contrastScore; }
    public void setContrastScore(Double contrastScore) { this.contrastScore = contrastScore; }

    public String getQualityStatus() { return qualityStatus; }
    public void setQualityStatus(String qualityStatus) { this.qualityStatus = qualityStatus; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
}
