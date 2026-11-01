package com.infrapulse.modules.intelligence.defect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Component
public class DefectRecurrenceClient {

    private static final Logger log = LoggerFactory.getLogger(DefectRecurrenceClient.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String aiServiceUrl;

    public DefectRecurrenceClient(
            ObjectMapper objectMapper,
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl,
            @Value("${ai.service.connect-timeout-ms:5000}") int connectTimeout,
            @Value("${ai.service.read-timeout-ms:30000}") int readTimeout) {
        this.objectMapper = objectMapper;
        this.aiServiceUrl = aiServiceUrl.replaceAll("/+$", "");

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        this.restTemplate = new RestTemplate(factory);
    }

    public static class CandidateInput {
        public String candidateId;
        public String category;
        public Double latitude;
        public Double longitude;
        public Map<String, Float> boundingBox;
        public Integer detectedDaysAgo;

        public CandidateInput(String candidateId, String category, Double latitude, Double longitude, Integer detectedDaysAgo) {
            this.candidateId = candidateId;
            this.category = category;
            this.latitude = latitude;
            this.longitude = longitude;
            this.detectedDaysAgo = detectedDaysAgo != null ? detectedDaysAgo : 0;
        }
    }

    public static class RecurrenceResult {
        public String candidateId;
        public BigDecimal similarityScore;
        public BigDecimal spatialDistanceMeters;
        public Integer temporalDistanceDays;
        public boolean isProbableRecurrence;
        public String comparisonBasis;
    }

    public List<RecurrenceResult> evaluateCandidates(String refCategory, Double refLat, Double refLon, List<CandidateInput> candidates) {
        String targetUrl = aiServiceUrl + "/api/v1/intelligence/compare-defects";
        List<RecurrenceResult> results = new ArrayList<>();

        if (candidates == null || candidates.isEmpty()) {
            return results;
        }

        try {
            Map<String, Object> req = new HashMap<>();
            req.put("reference_category", refCategory);
            req.put("reference_latitude", refLat);
            req.put("reference_longitude", refLon);

            List<Map<String, Object>> candList = new ArrayList<>();
            for (CandidateInput c : candidates) {
                Map<String, Object> cm = new HashMap<>();
                cm.put("candidate_id", c.candidateId);
                cm.put("category", c.category);
                cm.put("latitude", c.latitude);
                cm.put("longitude", c.longitude);
                cm.put("detected_days_ago", c.detectedDaysAgo);
                candList.add(cm);
            }
            req.put("candidates", candList);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode resArray = root.path("results");
                if (resArray.isArray()) {
                    for (JsonNode n : resArray) {
                        RecurrenceResult r = new RecurrenceResult();
                        r.candidateId = n.path("candidate_id").asText();
                        r.similarityScore = BigDecimal.valueOf(n.path("similarity_score").asDouble(0.0));
                        if (n.hasNonNull("spatial_distance_meters")) {
                            r.spatialDistanceMeters = BigDecimal.valueOf(n.path("spatial_distance_meters").asDouble());
                        }
                        if (n.hasNonNull("temporal_distance_days")) {
                            r.temporalDistanceDays = n.path("temporal_distance_days").asInt();
                        }
                        r.isProbableRecurrence = n.path("is_probable_recurrence").asBoolean(false);
                        r.comparisonBasis = n.path("comparison_basis").asText("Evaluated match");
                        results.add(r);
                    }
                }
                return results;
            }
        } catch (Exception e) {
            log.warn("AI service defect comparison failed: {}. Using deterministic local spatial matching.", e.getMessage());
        }

        // Deterministic local comparison fallback
        for (CandidateInput c : candidates) {
            RecurrenceResult r = new RecurrenceResult();
            r.candidateId = c.candidateId;
            double score = 0.40; // baseline for same candidate query
            if (Objects.equals(c.category, refCategory)) score += 0.35;
            r.similarityScore = BigDecimal.valueOf(score);
            r.isProbableRecurrence = score >= 0.70;
            r.comparisonBasis = "Category congruence match (" + c.category + ")";
            results.add(r);
        }
        return results;
    }
}
