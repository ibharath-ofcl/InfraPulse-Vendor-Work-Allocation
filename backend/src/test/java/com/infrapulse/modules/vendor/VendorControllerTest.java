package com.infrapulse.modules.vendor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.dto.CreateVendorRequest;
import com.infrapulse.modules.vendor.dto.UpdateVendorRequest;
import com.infrapulse.modules.vendor.dto.UpdateVendorStatusRequest;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private com.infrapulse.modules.workzone.repository.WorkZoneRepository workZoneRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User vendorUser1;
    private User vendorUser2;
    private User fieldUser;
    private String adminToken;
    private String vendorToken1;
    private String vendorToken2;
    private String fieldToken;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Platform Admin",
            "admin@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999991",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));

        vendorUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor One Rep",
            "vendor1@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999992",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        vendorUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor Two Rep",
            "vendor2@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999993",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        fieldUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Field Engineer",
            "field@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999994",
            UserRole.FIELD_ENGINEER,
            UserStatus.ACTIVE
        ));

        adminToken = jwtTokenProvider.generateAccessToken(adminUser);
        vendorToken1 = jwtTokenProvider.generateAccessToken(vendorUser1);
        vendorToken2 = jwtTokenProvider.generateAccessToken(vendorUser2);
        fieldToken = jwtTokenProvider.generateAccessToken(fieldUser);
    }

    @Test
    @DisplayName("Admin creates vendor; starts PENDING_VERIFICATION")
    void createVendor_Admin_Success() throws Exception {
        CreateVendorRequest req = new CreateVendorRequest();
        req.setCompanyName("ABC Infrastructure Services");
        req.setContactPerson("Rajesh Kumar");
        req.setEmail("contact@abcinfra.com");
        req.setPhoneNumber("9876543210");
        req.setAddressLine("Industrial Estate, Guindy");
        req.setCity("Chennai");
        req.setDistrict("Chennai");
        req.setState("Tamil Nadu");
        req.setPincode("600032");
        req.setGstNumber("33AAAAA0000A1Z5");
        req.setServiceCategories(Set.of(ServiceCategory.TRENCHING, ServiceCategory.ROAD_RESURFACING));

        mockMvc.perform(post("/api/v1/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.vendorCode", notNullValue()))
            .andExpect(jsonPath("$.data.companyName", is("ABC Infrastructure Services")))
            .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
            .andExpect(jsonPath("$.data.serviceCategories", hasItem("TRENCHING")));
    }

    @Test
    @DisplayName("Duplicate vendor email is rejected with 409 Conflict")
    void createVendor_DuplicateEmail_Conflict() throws Exception {
        vendorRepository.save(new Vendor(
            null, "VND-EXISTING", "Existing Vendor", "Contact",
            "duplicate@vendor.com", "9876543210", null, "Address",
            "City", "District", "State", "600001", null, null,
            VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));

        CreateVendorRequest req = new CreateVendorRequest();
        req.setCompanyName("Another Vendor");
        req.setContactPerson("Person");
        req.setEmail("duplicate@vendor.com");
        req.setPhoneNumber("9876543211");
        req.setPincode("600001");
        req.setServiceCategories(Set.of(ServiceCategory.TRENCHING));

        mockMvc.perform(post("/api/v1/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Invalid email is rejected")
    void createVendor_InvalidEmail_Rejected() throws Exception {
        CreateVendorRequest req = new CreateVendorRequest();
        req.setCompanyName("Vendor");
        req.setContactPerson("Person");
        req.setEmail("invalid-email-format");
        req.setPhoneNumber("9876543210");
        req.setPincode("600001");
        req.setServiceCategories(Set.of(ServiceCategory.TRENCHING));

        mockMvc.perform(post("/api/v1/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Authorized admin activates vendor")
    void updateVendorStatus_Admin_Activate_Success() throws Exception {
        Vendor vendor = vendorRepository.save(new Vendor(
            null, "VND-ACT", "Vendor Pending", "Contact",
            "pending@vendor.com", "9876543210", null, "Address",
            "City", "District", "State", "600001", null, null,
            VendorStatus.PENDING_VERIFICATION, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));

        UpdateVendorStatusRequest req = new UpdateVendorStatusRequest(VendorStatus.ACTIVE, "Verification completed.");

        mockMvc.perform(patch("/api/v1/vendors/" + vendor.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("Unauthorized user cannot activate vendor (403 Forbidden)")
    void updateVendorStatus_Unauthorized_Forbidden() throws Exception {
        Vendor vendor = vendorRepository.save(new Vendor(
            null, "VND-ACT2", "Vendor Pending", "Contact",
            "pending2@vendor.com", "9876543210", null, "Address",
            "City", "District", "State", "600001", null, null,
            VendorStatus.PENDING_VERIFICATION, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));

        UpdateVendorStatusRequest req = new UpdateVendorStatusRequest(VendorStatus.ACTIVE, "Unauthorized attempt");

        mockMvc.perform(patch("/api/v1/vendors/" + vendor.getId() + "/status")
                .header("Authorization", "Bearer " + fieldToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Vendor user cannot access another vendor's profile (403 Forbidden)")
    void getVendorDetails_Vendor_OtherProfile_Forbidden() throws Exception {
        // Vendor 1 linked to vendorUser1
        Vendor v1 = vendorRepository.save(new Vendor(
            null, "VND-OWN", "Vendor One", "Contact",
            "v1@vendor.com", "9876543210", null, "Address",
            "City", "District", "State", "600001", null, null,
            VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING), vendorUser1, adminUser
        ));

        // Vendor 2 linked to vendorUser2
        Vendor v2 = vendorRepository.save(new Vendor(
            null, "VND-OTHER", "Vendor Two", "Contact",
            "v2@vendor.com", "9876543211", null, "Address",
            "City", "District", "State", "600002", null, null,
            VendorStatus.ACTIVE, Set.of(ServiceCategory.ROAD_RESURFACING), vendorUser2, adminUser
        ));

        // Vendor 1 tries to access Vendor 2's details -> 403 Forbidden
        mockMvc.perform(get("/api/v1/vendors/" + v2.getId())
                .header("Authorization", "Bearer " + vendorToken1))
            .andExpect(status().isForbidden());

        // Vendor 1 accesses own details -> 200 OK
        mockMvc.perform(get("/api/v1/vendors/" + v1.getId())
                .header("Authorization", "Bearer " + vendorToken1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.companyName", is("Vendor One")));
    }

    @Test
    @DisplayName("Vendor update records audit events")
    void updateVendor_RecordsAudit() throws Exception {
        Vendor vendor = vendorRepository.save(new Vendor(
            null, "VND-AUD", "Original Company", "Original Contact",
            "orig@vendor.com", "9876543210", null, "Address",
            "City", "District", "State", "600001", null, null,
            VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));

        UpdateVendorRequest req = new UpdateVendorRequest();
        req.setCompanyName("Updated Company");
        req.setContactPerson("Updated Contact");
        req.setEmail("orig@vendor.com");
        req.setPhoneNumber("9998887776");
        req.setPincode("600001");
        req.setServiceCategories(Set.of(ServiceCategory.TRENCHING, ServiceCategory.BACKFILLING));

        mockMvc.perform(put("/api/v1/vendors/" + vendor.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.companyName", is("Updated Company")));

        mockMvc.perform(get("/api/v1/vendors/" + vendor.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.auditTrail", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.data.auditTrail[0].eventType", is("VENDOR_UPDATED")));
    }
}
