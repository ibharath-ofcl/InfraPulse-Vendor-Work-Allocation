package com.infrapulse.modules.evidence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.model.EvidenceReviewStatus;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EvidenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private WorkAssignmentRepository assignmentRepository;

    @Autowired
    private WorkEvidenceRepository evidenceRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User pmUser;
    private User vendorUser1;
    private User vendorUser2;
    private User fieldEngineer;

    private String adminToken;
    private String pmToken;
    private String vendor1Token;
    private String vendor2Token;
    private String feToken;

    private Project testProject;
    private WorkZone testZone;
    private Vendor testVendor1;
    private Vendor testVendor2;
    private WorkAssignment activeAssignment;
    private WorkAssignment cancelledAssignment;

    @BeforeEach
    void setUp() {
        evidenceRepository.deleteAll();
        assignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        userRepository.deleteAll();
        auditEventRepository.deleteAll();

        // 1. Users
        adminUser = userRepository.save(new User(
                UUID.randomUUID().toString(), "Admin User", "admin.evd@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 11111", UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE
        ));

        pmUser = userRepository.save(new User(
                UUID.randomUUID().toString(), "Project Manager", "pm.evd@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 22222", UserRole.PROJECT_MANAGER, UserStatus.ACTIVE
        ));

        vendorUser1 = userRepository.save(new User(
                UUID.randomUUID().toString(), "Vendor 1 Rep", "vendor1.evd@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 33333", UserRole.VENDOR, UserStatus.ACTIVE
        ));

        vendorUser2 = userRepository.save(new User(
                UUID.randomUUID().toString(), "Vendor 2 Rep", "vendor2.evd@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 44444", UserRole.VENDOR, UserStatus.ACTIVE
        ));

        fieldEngineer = userRepository.save(new User(
                UUID.randomUUID().toString(), "Field Engineer", "fe.evd@test.com",
                passwordEncoder.encode("Pass@123"), "+91 99999 55555", UserRole.FIELD_ENGINEER, UserStatus.ACTIVE
        ));

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        pmToken = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser);
        vendor1Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);
        vendor2Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);
        feToken = "Bearer " + jwtTokenProvider.generateAccessToken(fieldEngineer);

        // 2. Project
        testProject = projectRepository.save(new Project(
                UUID.randomUUID().toString(), "PRJ-EVD-01", "Highway Optical Grid", "Metro optical rollout",
                ProjectType.FIBER_OPTIC, "National Highway Authority", "Bengaluru Urban", "Karnataka", "Bengaluru",
                "560001", LocalDate.now(), LocalDate.now().plusMonths(6), new BigDecimal("10000000.00"),
                ProjectStatus.ACTIVE, pmUser, adminUser
        ));

        // 3. Work Zone
        testZone = workZoneRepository.save(new WorkZone(
                UUID.randomUUID().toString(), "WZ-EVD-01", testProject, "North Highway Sector A", "Commercial Zone",
                "560001", "Central Bengaluru", "Bengaluru Urban", "Karnataka", new BigDecimal("12.975000"), new BigDecimal("77.605000"),
                ZoneStatus.AVAILABLE, adminUser
        ));

        // 4. Vendors
        testVendor1 = vendorRepository.save(new Vendor(
                UUID.randomUUID().toString(), "VND-EVD-1", "Apex Roadworks Private Limited", "Apex Director",
                "apex@contractor.example", "+91 98888 11111", null, "Plot 10 Industrial Zone",
                "Bengaluru", "Bengaluru Urban", "Karnataka", "560001", "33AAAAA1111A1Z1", "REG-001",
                VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING, ServiceCategory.ROAD_RESURFACING),
                vendorUser1, adminUser
        ));

        testVendor2 = vendorRepository.save(new Vendor(
                UUID.randomUUID().toString(), "VND-EVD-2", "Zenith Excavation Services", "Zenith Manager",
                "zenith@contractor.example", "+91 98888 22222", null, "Unit 4 Tech Corridor",
                "Bengaluru", "Bengaluru Urban", "Karnataka", "560058", "29BBBBB2222B1Z2", "REG-002",
                VendorStatus.ACTIVE, Set.of(ServiceCategory.UNDERGROUND_CABLE_INSTALLATION),
                vendorUser2, adminUser
        ));

        // 5. Work Assignments
        activeAssignment = assignmentRepository.save(new WorkAssignment(
                UUID.randomUUID().toString(), "WA-EVD-001", testProject, testZone, testVendor1, WorkType.TRENCHING,
                "Culvert Trenching and Reinforcement", "Trenching instructions", LocalDate.now(), LocalDate.now().plusDays(10),
                AssignmentPriority.HIGH, AssignmentStatus.IN_PROGRESS, "Use protective barrier", adminUser
        ));

        cancelledAssignment = assignmentRepository.save(new WorkAssignment(
                UUID.randomUUID().toString(), "WA-EVD-002", testProject, testZone, testVendor1, WorkType.ROAD_RESURFACING,
                "Cancelled Resurfacing Section", "Resurfacing instructions", LocalDate.now(), LocalDate.now().plusDays(5),
                AssignmentPriority.LOW, AssignmentStatus.CANCELLED, "Route cancelled", adminUser
        ));
    }

    private byte[] createSampleImageBytes(int width, int height, String format) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(40, 80, 160));
        g.fillRect(0, 0, width, height);
        g.setColor(Color.WHITE);
        g.drawString("InfraPulse Evidence " + format.toUpperCase(), 20, 40);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, format, baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Vendor 1 can successfully upload a valid JPEG evidence photo to their assigned work")
    void testUploadValidJpegEvidence() throws Exception {
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile(
                "files",
                "site_condition_before.jpg",
                "image/jpeg",
                jpegBytes
        );

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .param("description", "Pre-work ground inspection of culvert foundation")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].evidenceCode", startsWith("EVD-")))
                .andExpect(jsonPath("$.data[0].evidenceCategory").value("BEFORE_WORK"))
                .andExpect(jsonPath("$.data[0].mimeType").value("image/jpeg"))
                .andExpect(jsonPath("$.data[0].imageWidth").value(640))
                .andExpect(jsonPath("$.data[0].imageHeight").value(480))
                .andExpect(jsonPath("$.data[0].checksumSha256").isString())
                .andExpect(jsonPath("$.data[0].processingStatus").value("READY"))
                .andExpect(jsonPath("$.data[0].reviewStatus").value("NOT_REVIEWED"))
                .andExpect(jsonPath("$.data[0].hasPreview").value(true));

        // Verify assignment status was NOT automatically changed to completed
        WorkAssignment refreshed = assignmentRepository.findById(activeAssignment.getId()).orElseThrow();
        assertEquals(AssignmentStatus.IN_PROGRESS, refreshed.getStatus());

        // Verify audit event was logged
        assertTrue(auditEventRepository.findAll().stream().anyMatch(e -> "EVIDENCE_UPLOADED".equals(e.getEventType())));
    }

    @Test
    @DisplayName("Vendor 1 can upload a valid PNG evidence photo")
    void testUploadValidPngEvidence() throws Exception {
        byte[] pngBytes = createSampleImageBytes(800, 600, "png");
        MockMultipartFile file = new MockMultipartFile(
                "files",
                "excavation_progress.png",
                "image/png",
                pngBytes
        );

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "WORK_IN_PROGRESS")
                        .param("description", "Trench excavation at 1.5m depth")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].mimeType").value("image/png"))
                .andExpect(jsonPath("$.data[0].imageWidth").value(800))
                .andExpect(jsonPath("$.data[0].imageHeight").value(600));
    }

    @Test
    @DisplayName("Multiple photos can be uploaded in a single request")
    void testUploadMultipleEvidencePhotos() throws Exception {
        byte[] img1 = createSampleImageBytes(640, 480, "jpeg");
        byte[] img2 = createSampleImageBytes(640, 480, "png");

        MockMultipartFile file1 = new MockMultipartFile("files", "img1.jpg", "image/jpeg", img1);
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.png", "image/png", img2);

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file1)
                        .file(file2)
                        .param("category", "SITE_CONDITION")
                        .param("description", "Dual angle site documentation")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    @DisplayName("Vendor 2 is strictly forbidden from uploading evidence to Vendor 1's assignment")
    void testVendorIsolationOnUpload() throws Exception {
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile("files", "intruder.jpg", "image/jpeg", jpegBytes);

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .header("Authorization", vendor2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Uploading evidence to a cancelled assignment is rejected")
    void testUploadToCancelledAssignmentRejected() throws Exception {
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", jpegBytes);

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", cancelledAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Corrupted image file with false extension is rejected")
    void testCorruptedImageRejected() throws Exception {
        byte[] fakeContent = "This is not an image at all, just plain text.".getBytes();
        MockMultipartFile file = new MockMultipartFile("files", "fake.jpg", "image/jpeg", fakeContent);

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Executable file upload is rejected")
    void testExecutableFileRejected() throws Exception {
        byte[] exeContent = new byte[]{0x4D, 0x5A, 0x00, 0x00}; // MZ header
        MockMultipartFile file = new MockMultipartFile("files", "malicious.exe", "application/x-msdownload", exeContent);

        mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Evidence can be retrieved and cryptographically verified for SHA-256 integrity")
    void testEvidenceRetrievalAndIntegrityVerification() throws Exception {
        // 1. Upload
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile("files", "culvert.jpg", "image/jpeg", jpegBytes);

        String responseStr = mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "MATERIAL_EVIDENCE")
                        .param("description", "Steel reinforcement mesh placement")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String evidenceId = objectMapper.readTree(responseStr).path("data").get(0).path("id").asText();
        assertNotNull(evidenceId);

        // 2. Retrieve Details
        mockMvc.perform(get("/api/v1/evidence/{id}", evidenceId)
                        .header("Authorization", pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(evidenceId))
                .andExpect(jsonPath("$.data.evidenceCategory").value("MATERIAL_EVIDENCE"));

        // 3. Stream original file
        mockMvc.perform(get("/api/v1/evidence/{id}/file", evidenceId)
                        .header("Authorization", vendor1Token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(header().string("Content-Disposition", containsString("culvert.jpg")));

        // 4. Stream preview thumbnail
        mockMvc.perform(get("/api/v1/evidence/{id}/preview", evidenceId)
                        .header("Authorization", pmToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));

        // 5. Verify Cryptographic Integrity
        mockMvc.perform(get("/api/v1/evidence/{id}/integrity", evidenceId)
                        .header("Authorization", pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.integrityValid").value(true))
                .andExpect(jsonPath("$.data.storedChecksum").isString())
                .andExpect(jsonPath("$.data.calculatedChecksum").isString());
    }

    @Test
    @DisplayName("Field engineer can review and approve evidence; Vendor cannot review their own evidence")
    void testEvidenceReviewWorkflow() throws Exception {
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile("files", "inspection.jpg", "image/jpeg", jpegBytes);

        String responseStr = mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "COMPLETION_EVIDENCE")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String evidenceId = objectMapper.readTree(responseStr).path("data").get(0).path("id").asText();

        // Vendor attempting to review their own evidence -> 403 Forbidden
        mockMvc.perform(post("/api/v1/evidence/{id}/review", evidenceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reviewStatus", "APPROVED",
                                "reviewNotes", "Vendor self approval attempt"
                        )))
                        .header("Authorization", vendor1Token))
                .andExpect(status().isForbidden());

        // Field Engineer reviews and approves -> 200 OK
        mockMvc.perform(post("/api/v1/evidence/{id}/review", evidenceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reviewStatus", "APPROVED",
                                "reviewNotes", "Verified on site. Base compaction and mesh meets IRC specifications."
                        )))
                        .header("Authorization", feToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.reviewedByName").value(fieldEngineer.getFullName()));

        // Verify in DB
        WorkEvidence ev = evidenceRepository.findById(evidenceId).orElseThrow();
        assertEquals(EvidenceReviewStatus.APPROVED, ev.getReviewStatus());
        assertEquals(fieldEngineer.getId(), ev.getReviewedBy().getId());
    }

    @Test
    @DisplayName("Uploader can withdraw their evidence before approval")
    void testWithdrawEvidence() throws Exception {
        byte[] jpegBytes = createSampleImageBytes(640, 480, "jpeg");
        MockMultipartFile file = new MockMultipartFile("files", "draft_photo.jpg", "image/jpeg", jpegBytes);

        String responseStr = mockMvc.perform(multipart("/api/v1/work-assignments/{id}/evidence", activeAssignment.getId())
                        .file(file)
                        .param("category", "BEFORE_WORK")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String evidenceId = objectMapper.readTree(responseStr).path("data").get(0).path("id").asText();

        // Vendor withdraws evidence
        mockMvc.perform(delete("/api/v1/evidence/{id}", evidenceId)
                        .param("reason", "Uploaded wrong angle by mistake")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isOk());

        // Subsequent get -> 400 (withdrawn)
        mockMvc.perform(get("/api/v1/evidence/{id}", evidenceId)
                        .header("Authorization", vendor1Token))
                .andExpect(status().isBadRequest());
    }

    @AfterEach
    void tearDown() {
        evidenceRepository.deleteAll();
        assignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();
    }
}
