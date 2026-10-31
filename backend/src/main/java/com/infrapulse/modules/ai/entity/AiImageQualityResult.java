package com.infrapulse.modules.ai.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "ai_image_quality")
public class AiImageQualityResult {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inference_id", nullable = false)
    private AiInferenceResult inference;

    @Column(name = "resolution_width", nullable = false)
    private Integer resolutionWidth;

    @Column(name = "resolution_height", nullable = false)
    private Integer resolutionHeight;

    @Column(name = "blur_score", nullable = false)
    private Double blurScore;

    @Column(name = "brightness_score", nullable = false)
    private Double brightnessScore;

    @Column(name = "contrast_score", nullable = false)
    private Double contrastScore;

    @Column(name = "quality_status", nullable = false, length = 64)
    private String qualityStatus;

    @Column(name = "warnings_json", columnDefinition = "TEXT")
    private String warningsJson;

    public AiImageQualityResult() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AiInferenceResult getInference() { return inference; }
    public void setInference(AiInferenceResult inference) { this.inference = inference; }

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

    public String getWarningsJson() { return warningsJson; }
    public void setWarningsJson(String warningsJson) { this.warningsJson = warningsJson; }
}
