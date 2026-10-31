package com.infrapulse.modules.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.ai.client.AiInferenceClient;
import com.infrapulse.modules.ai.dto.AiDetectionDto;
import com.infrapulse.modules.ai.dto.AiImageQualityDto;
import com.infrapulse.modules.ai.dto.AiModelMetadataDto;
import com.infrapulse.modules.ai.dto.BoundingBoxDto;
import com.infrapulse.modules.ai.repository.AiInferenceRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import com.infrapulse.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AiProcessingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private WorkAssignmentRepository assignmentRepository;

    @Autowired
    private WorkEvidenceRepository evidenceRepository;

    @Autowired
    private AiInferenceRepository inferenceRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private AiInferenceClient aiInferenceClient;

    @MockBean
    private EvidenceStorageService storageService;

    private User adminUser;
    private User vendorUser1;
    private User vendorUser2;
    private Vendor vendor1;
    private Vendor vendor2;
    private Project project;
    private WorkZone workZone;
    private WorkAssignment assignment;
    private WorkEvidence evidence;

    private String adminToken;
    private String vendor1Token;
    private String vendor2Token;

    @AfterEach
    void tearDown() {
        inferenceRepository.deleteAll();
        evidenceRepository.deleteAll();
        assignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() throws Exception {
        tearDown();

        // 1. Admin user
        adminUser = userRepository.save(new User(
                UUID.randomUUID().toString(), "Platform Admin", "admin.ai@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 11111", UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE
        ));
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);

        // 2. Vendor 1 user & vendor
        vendorUser1 = userRepository.save(new User(
                UUID.randomUUID().toString(), "Vendor Alpha Rep", "v1.ai@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 22222", UserRole.VENDOR, UserStatus.ACTIVE
        ));
        vendor1Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);

        vendor1 = vendorRepository.save(new Vendor(
                UUID.randomUUID().toString(), "VND-AI-1", "Alpha Civils Ltd", "Alpha Manager",
                "alpha@ai.example", "+91 98888 11111", null, "Plot 10 Industrial Zone",
                "Bengaluru", "Bengaluru Urban", "Karnataka", "560001", "33AAAAA1111A1Z1", "REG-001",
                VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING),
                vendorUser1, adminUser
        ));

        // 3. Vendor 2 user & vendor
        vendorUser2 = userRepository.save(new User(
                UUID.randomUUID().toString(), "Vendor Beta Rep", "v2.ai@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 33333", UserRole.VENDOR, UserStatus.ACTIVE
        ));
        vendor2Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);

        vendor2 = vendorRepository.save(new Vendor(
                UUID.randomUUID().toString(), "VND-AI-2", "Beta Civils Ltd", "Beta Manager",
                "beta@ai.example", "+91 98888 22222", null, "Unit 4 Tech Corridor",
                "Bengaluru", "Bengaluru Urban", "Karnataka", "560058", "29BBBBB2222B1Z2", "REG-002",
                VendorStatus.ACTIVE, Set.of(ServiceCategory.UNDERGROUND_CABLE_INSTALLATION),
                vendorUser2, adminUser
        ));

        // 4. Project
        project = projectRepository.save(new Project(
                UUID.randomUUID().toString(), "PRJ-AI-01", "Highway Optical Grid", "Metro optical rollout",
                ProjectType.FIBER_OPTIC, "National Highway Authority", "Bengaluru Urban", "Karnataka", "Bengaluru",
                "560001", LocalDate.now(), LocalDate.now().plusMonths(6), new BigDecimal("10000000.00"),
                ProjectStatus.ACTIVE, adminUser, adminUser
        ));

        // 5. Work Zone
        workZone = workZoneRepository.save(new WorkZone(
                UUID.randomUUID().toString(), "WZ-AI-01", project, "North Highway Sector A", "Commercial Zone",
                "560001", "Central Bengaluru", "Bengaluru Urban", "Karnataka", new BigDecimal("12.975000"), new BigDecimal("77.605000"),
                ZoneStatus.AVAILABLE, adminUser
        ));

        // 6. Assignment for Vendor 1
        assignment = assignmentRepository.save(new WorkAssignment(
                UUID.randomUUID().toString(), "WA-AI-001", project, workZone, vendor1, WorkType.TRENCHING,
                "Culvert Trenching Section 1", "Trenching instructions", LocalDate.now(), LocalDate.now().plusDays(10),
                AssignmentPriority.HIGH, AssignmentStatus.IN_PROGRESS, "Protective gear mandatory", adminUser
        ));

        // 7. Work Evidence for Assignment
        evidence = new WorkEvidence();
        evidence.setEvidenceCode("EVD-AI-001");
        evidence.setProject(project);
        evidence.setWorkZone(workZone);
        evidence.setWorkAssignment(assignment);
        evidence.setVendor(vendor1);
        evidence.setUploadedBy(vendorUser1);
        evidence.setEvidenceCategory(EvidenceCategory.WORK_IN_PROGRESS);
        evidence.setOriginalFileName("trench_depth.jpg");
        evidence.setStorageKey("evidence/PRJ-AI-001/trench_depth.jpg");
        evidence.setMimeType("image/jpeg");
        evidence.setFileSize(204800L);
        evidence.setChecksumSha256("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
        evidence = evidenceRepository.save(evidence);

        // Mock Storage
        byte[] dummyBytes = new byte[]{1, 2, 3, 4, 5};
        ByteArrayResource resource = new ByteArrayResource(dummyBytes);
        Mockito.when(storageService.retrieve(anyString())).thenReturn(resource);

        // Mock AI Client Analysis Result
        AiInferenceClient.AiRawAnalysisResult mockResult = new AiInferenceClient.AiRawAnalysisResult();
        mockResult.status = "SUCCESS";
        mockResult.modelId = "infrapulse-cv-v1";
        mockResult.modelVersion = "1.0.0";
        mockResult.durationMs = 120L;

        AiImageQualityDto q = new AiImageQualityDto(1920, 1080, 245.5, 128.0, 55.4, "ACCEPTABLE", List.of());
        mockResult.imageQuality = q;

        BoundingBoxDto bb = new BoundingBoxDto(0.1, 0.2, 0.8, 0.9);
        AiDetectionDto det = new AiDetectionDto("det-1", "crack", "Surface Crack", 0.88, bb, null);
        mockResult.detections = List.of(det);
        mockResult.warnings = List.of();
        mockResult.unsupportedCategories = List.of("Trench depth (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)");

        Mockito.when(aiInferenceClient.analyzeImage(any(), anyString(), anyString())).thenReturn(mockResult);

        // Mock Available Models
        AiModelMetadataDto modelDto = new AiModelMetadataDto(
                "infrapulse-cv-v1",
                "InfraPulse Infrastructure Computer Vision Engine",
                "1.0.0",
                "OpenCV + ResNet Backbones",
                "OBJECT_DETECTION_AND_QUALITY",
                List.of("crack", "pothole", "excavation_trench"),
                "Proprietary",
                "Computer vision engine for infrastructure evidence analysis",
                "ACTIVE"
        );
        Mockito.when(aiInferenceClient.getAvailableModels()).thenReturn(List.of(modelDto));
    }

    @Test
    @DisplayName("Should successfully analyze evidence image and return AI detections")
    void testAnalyzeEvidenceSuccess() throws Exception {
        mockMvc.perform(post("/api/v1/evidence/{evidenceId}/analyze", evidence.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.evidenceId").value(evidence.getId()))
                .andExpect(jsonPath("$.data.modelId").value("infrapulse-cv-v1"))
                .andExpect(jsonPath("$.data.processingStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.data.imageQuality.qualityStatus").value("ACCEPTABLE"))
                .andExpect(jsonPath("$.data.detections", hasSize(1)))
                .andExpect(jsonPath("$.data.detections[0].classId").value("crack"))
                .andExpect(jsonPath("$.data.detections[0].confidence").value(0.88));

        assertFalse(inferenceRepository.findByEvidenceIdOrderByCreatedAtDesc(evidence.getId()).isEmpty());
    }

    @Test
    @DisplayName("Vendor isolation: Vendor 2 cannot trigger analysis on Vendor 1 evidence")
    void testVendorIsolationAnalyze() throws Exception {
        mockMvc.perform(post("/api/v1/evidence/{evidenceId}/analyze", evidence.getId())
                        .header("Authorization", vendor2Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Vendor 1 can trigger analysis on their own uploaded evidence")
    void testVendorOwnEvidenceAnalyze() throws Exception {
        mockMvc.perform(post("/api/v1/evidence/{evidenceId}/analyze", evidence.getId())
                        .header("Authorization", vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Should retrieve AI models")
    void testGetModels() throws Exception {
        mockMvc.perform(get("/api/v1/ai/models")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].modelId").value("infrapulse-cv-v1"));
    }
}
