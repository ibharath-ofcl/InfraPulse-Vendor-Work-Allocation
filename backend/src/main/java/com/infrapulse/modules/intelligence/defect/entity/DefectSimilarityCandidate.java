package com.infrapulse.modules.intelligence.defect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "defect_similarity_candidates")
public class DefectSimilarityCandidate {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defect_id", nullable = false)
    private InfrastructureDefect defect;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_defect_id", nullable = false)
    private InfrastructureDefect candidateDefect;

    @Column(name = "similarity_score", precision = 5, scale = 4, nullable = false)
    private BigDecimal similarityScore;

    @Column(name = "spatial_distance_meters", precision = 10, scale = 2)
    private BigDecimal spatialDistanceMeters;

    @Column(name = "temporal_distance_days")
    private Integer temporalDistanceDays;

    @Column(name = "comparison_basis", nullable = false, length = 128)
    private String comparisonBasis;

    @Column(name = "human_confirmed")
    private Boolean humanConfirmed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DefectSimilarityCandidate() {
        this.id = UUID.randomUUID().toString();
    }

    public DefectSimilarityCandidate(InfrastructureDefect defect, InfrastructureDefect candidateDefect, BigDecimal similarityScore, BigDecimal spatialDistanceMeters, Integer temporalDistanceDays, String comparisonBasis) {
        this();
        this.defect = defect;
        this.candidateDefect = candidateDefect;
        this.similarityScore = similarityScore;
        this.spatialDistanceMeters = spatialDistanceMeters;
        this.temporalDistanceDays = temporalDistanceDays;
        this.comparisonBasis = comparisonBasis;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public InfrastructureDefect getDefect() { return defect; }
    public void setDefect(InfrastructureDefect defect) { this.defect = defect; }

    public InfrastructureDefect getCandidateDefect() { return candidateDefect; }
    public void setCandidateDefect(InfrastructureDefect candidateDefect) { this.candidateDefect = candidateDefect; }

    public BigDecimal getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(BigDecimal similarityScore) { this.similarityScore = similarityScore; }

    public BigDecimal getSpatialDistanceMeters() { return spatialDistanceMeters; }
    public void setSpatialDistanceMeters(BigDecimal spatialDistanceMeters) { this.spatialDistanceMeters = spatialDistanceMeters; }

    public Integer getTemporalDistanceDays() { return temporalDistanceDays; }
    public void setTemporalDistanceDays(Integer temporalDistanceDays) { this.temporalDistanceDays = temporalDistanceDays; }

    public String getComparisonBasis() { return comparisonBasis; }
    public void setComparisonBasis(String comparisonBasis) { this.comparisonBasis = comparisonBasis; }

    public Boolean getHumanConfirmed() { return humanConfirmed; }
    public void setHumanConfirmed(Boolean humanConfirmed) { this.humanConfirmed = humanConfirmed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

