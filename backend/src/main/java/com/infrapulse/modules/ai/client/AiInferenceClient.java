package com.infrapulse.modules.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.ai.dto.AiDetectionDto;
import com.infrapulse.modules.ai.dto.AiImageQualityDto;
import com.infrapulse.modules.ai.dto.AiModelMetadataDto;
import com.infrapulse.modules.ai.dto.BoundingBoxDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class AiInferenceClient {

    private static final Logger log = LoggerFactory.getLogger(AiInferenceClient.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String aiServiceUrl;

    public AiInferenceClient(
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

    public static class AiRawAnalysisResult {
        public String status;
        public String modelId;
        public String modelVersion;
        public long durationMs;
        public AiImageQualityDto imageQuality;
        public List<AiDetectionDto> detections = new ArrayList<>();
        public List<String> warnings = new ArrayList<>();
        public List<String> unsupportedCategories = new ArrayList<>();
    }

    public AiRawAnalysisResult analyzeImage(byte[] imageBytes, String fileName, String evidenceId) {
        String targetUrl = aiServiceUrl + "/api/v1/inference/analyze";
        log.info("Submitting evidence image to AI Vision service: url={}, fileName={}, size={}", targetUrl, fileName, imageBytes.length);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return fileName != null ? fileName : "evidence.jpg";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);
        if (evidenceId != null) {
            body.add("evidence_id", evidenceId);
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, requestEntity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("AI vision service returned status: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            AiRawAnalysisResult result = new AiRawAnalysisResult();
            result.status = root.path("status").asText("SUCCESS");
            result.modelId = root.path("model_id").asText("infrapulse-cv-v1");
            result.modelVersion = root.path("model_version").asText("1.0.0");
            result.durationMs = root.path("processing_duration_ms").asLong(0);

            // Parse image quality
            JsonNode qNode = root.path("image_quality");
            if (!qNode.isMissingNode()) {
                List<String> qWarnings = new ArrayList<>();
                qNode.path("warnings").forEach(w -> qWarnings.add(w.asText()));

                AiImageQualityDto qDto = new AiImageQualityDto();
                qDto.setResolutionWidth(qNode.path("resolution_width").asInt());
                qDto.setResolutionHeight(qNode.path("resolution_height").asInt());
                qDto.setBlurScore(qNode.path("blur_score").asDouble());
                qDto.setBrightnessScore(qNode.path("brightness_score").asDouble());
                qDto.setContrastScore(qNode.path("contrast_score").asDouble());
                qDto.setQualityStatus(qNode.path("quality_status").asText());
                qDto.setWarnings(qWarnings);
                result.imageQuality = qDto;
            }

            // Parse detections
            JsonNode detsNode = root.path("detections");
            if (detsNode.isArray()) {
                for (JsonNode det : detsNode) {
                    JsonNode bb = det.path("bounding_box");
                    BoundingBoxDto bbDto = new BoundingBoxDto(
                            bb.path("ymin").asDouble(),
                            bb.path("xmin").asDouble(),
                            bb.path("ymax").asDouble(),
                            bb.path("xmax").asDouble()
                    );

                    AiDetectionDto detDto = new AiDetectionDto();
                    detDto.setId(det.path("detection_id").asText());
                    detDto.setClassId(det.path("class_id").asText());
                    detDto.setClassLabel(det.path("class_label").asText());
                    detDto.setConfidence(det.path("confidence").asDouble());
                    detDto.setBoundingBox(bbDto);
                    detDto.setSegmentationReference(det.path("segmentation_reference").isTextual() ? det.path("segmentation_reference").asText() : null);

                    result.detections.add(detDto);
                }
            }

            // Parse warnings
            root.path("warnings").forEach(w -> result.warnings.add(w.asText()));

            // Parse unsupported categories
            root.path("unsupported_categories").forEach(c -> result.unsupportedCategories.add(c.asText()));

            return result;
        } catch (Exception e) {
            log.error("Failed to execute AI inference request: url={}, error={}", targetUrl, e.getMessage());
            throw new RuntimeException("AI inference engine communication failure: " + e.getMessage(), e);
        }
    }

    public List<AiModelMetadataDto> getAvailableModels() {
        String targetUrl = aiServiceUrl + "/api/v1/models";
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(targetUrl, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            List<AiModelMetadataDto> models = new ArrayList<>();
            JsonNode list = root.path("models");
            if (list.isArray()) {
                for (JsonNode m : list) {
                    List<String> classes = new ArrayList<>();
                    m.path("supported_classes").forEach(c -> classes.add(c.asText()));

                    AiModelMetadataDto mDto = new AiModelMetadataDto();
                    mDto.setModelId(m.path("model_id").asText());
                    mDto.setModelName(m.path("model_name").asText());
                    mDto.setVersion(m.path("version").asText());
                    mDto.setFramework(m.path("framework").asText());
                    mDto.setModelType(m.path("model_type").asText());
                    mDto.setSupportedClasses(classes);
                    mDto.setLicense(m.path("license").asText());
                    mDto.setDescription(m.path("description").asText());
                    mDto.setActivationStatus(m.path("activation_status").asText());

                    models.add(mDto);
                }
            }
            return models;
        } catch (Exception e) {
            log.warn("Could not retrieve AI models from {}: {}", targetUrl, e.getMessage());
            return Collections.emptyList();
        }
    }
}
