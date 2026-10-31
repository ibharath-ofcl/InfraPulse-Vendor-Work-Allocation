package com.infrapulse.modules.performance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PerformanceBenchmarkTest {

    private static final Logger log = LoggerFactory.getLogger(PerformanceBenchmarkTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private AuditService auditService;

    private User adminUser;
    private Vendor vendor;
    private String adminToken;
    private String uniqueSuffix;

    @BeforeEach
    public void setUp() {
        uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setEmail("perf_admin_" + uniqueSuffix + "@infrapulse.test");
        adminUser.setFullName("Perf Admin");
        adminUser.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456");
        adminUser.setRole(UserRole.PLATFORM_ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);

        vendor = new Vendor();
        vendor.setVendorCode("VND-PERF-" + uniqueSuffix);
        vendor.setCompanyName("Perf Build Corp " + uniqueSuffix);
        vendor.setContactPerson("Perf Rep");
        vendor.setEmail("perf_" + uniqueSuffix + "@vendor.com");
        vendor.setPhoneNumber("+919900990099");
        vendor.setAddressLine("Perf Road 1");
        vendor.setCity("Bengaluru");
        vendor.setDistrict("Bengaluru Urban");
        vendor.setState("Karnataka");
        vendor.setPincode("560001");
        vendor.setUser(adminUser);
        vendor.setStatus(VendorStatus.ACTIVE);
        vendor.setServiceCategories(Set.of(ServiceCategory.ROAD_RESURFACING));
        vendor = vendorRepository.save(vendor);

        // Prepopulate dataset for realistic query performance testing
        for (int i = 0; i < 5; i++) {
            Project p = new Project(
                    UUID.randomUUID().toString(),
                    "PRJ-PERF-" + i + "-" + uniqueSuffix,
                    "Performance Project " + i,
                    "Benchmark project",
                    ProjectType.ROAD_INFRASTRUCTURE,
                    "Highway Authority",
                    "Central", "Karnataka", "Bengaluru", "560001",
                    LocalDate.now(), LocalDate.now().plusMonths(3),
                    new BigDecimal("1000000.00"), ProjectStatus.ACTIVE,
                    adminUser, adminUser
            );
            p = projectRepository.save(p);

            projectVendorRepository.save(new ProjectVendor(p, vendor, adminUser, "Active vendor"));

            WorkZone z = new WorkZone(
                    UUID.randomUUID().toString(),
                    "WZ-PERF-" + i + "-" + uniqueSuffix,
                    p,
                    "Zone " + i,
                    "Sector " + i,
                    "560001",
                    "Central", "Bengaluru Urban", "Karnataka",
                    BigDecimal.ZERO, BigDecimal.ZERO,
                    ZoneStatus.ACTIVE, adminUser
            );
            z = workZoneRepository.save(z);

            for (int j = 0; j < 3; j++) {
                WorkAssignment wa = new WorkAssignment();
                wa.setId(UUID.randomUUID().toString());
                wa.setAssignmentCode("WA-PERF-" + i + "-" + j + "-" + uniqueSuffix);
                wa.setTitle("Paving Task " + j);
                wa.setProject(p);
                wa.setWorkZone(z);
                wa.setVendor(vendor);
                wa.setWorkType(WorkType.ROAD_RESURFACING);
                wa.setPriority(AssignmentPriority.MEDIUM);
                wa.setStatus(AssignmentStatus.IN_PROGRESS);
                wa.setReleaseStatus(ReleaseStatus.RELEASED);
                wa.setPlannedStartDate(LocalDate.now());
                wa.setTargetEndDate(LocalDate.now().plusDays(10));
                wa.setCreatedBy(adminUser);
                workAssignmentRepository.save(wa);
            }
        }

        // Prepopulate some audit events
        for (int k = 0; k < 10; k++) {
            auditService.recordEvent(
                    adminUser.getId(), "PERF_SETUP", "PROJECT", "PRJ-" + k,
                    "Performance test seed " + k, "Setup benchmark"
            );
        }
    }

    @AfterEach
    public void tearDown() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        vendorRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    private static class MetricResult {
        String endpoint;
        int totalRequests;
        double p50Ms;
        double p95Ms;
        double p99Ms;
        double avgMs;
        double throughputRps;
        double errorRate;
    }

    private MetricResult benchmarkEndpoint(String name, RunnableRequest request, int warmup, int iterations) throws Exception {
        // Warmup
        for (int i = 0; i < warmup; i++) {
            request.execute();
        }

        List<Double> latenciesMs = new ArrayList<>(iterations);
        int errors = 0;
        long totalStartNanos = System.nanoTime();

        for (int i = 0; i < iterations; i++) {
            long reqStart = System.nanoTime();
            try {
                request.execute();
            } catch (Throwable t) {
                errors++;
            }
            long reqEnd = System.nanoTime();
            latenciesMs.add((reqEnd - reqStart) / 1_000_000.0);
        }
        long totalEndNanos = System.nanoTime();

        Collections.sort(latenciesMs);
        double totalSeconds = (totalEndNanos - totalStartNanos) / 1_000_000_000.0;

        MetricResult res = new MetricResult();
        res.endpoint = name;
        res.totalRequests = iterations;
        res.p50Ms = latenciesMs.get((int) (iterations * 0.50));
        res.p95Ms = latenciesMs.get((int) (iterations * 0.95));
        res.p99Ms = latenciesMs.get((int) (iterations * 0.99));
        res.avgMs = latenciesMs.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        res.throughputRps = iterations / Math.max(totalSeconds, 0.001);
        res.errorRate = (errors * 100.0) / iterations;

        log.info(String.format("PERF BENCHMARK [%s] -> Req: %d, P50: %.2fms, P95: %.2fms, P99: %.2fms, Avg: %.2fms, Throughput: %.1f req/s, ErrorRate: %.1f%%",
                res.endpoint, res.totalRequests, res.p50Ms, res.p95Ms, res.p99Ms, res.avgMs, res.throughputRps, res.errorRate));

        return res;
    }

    @FunctionalInterface
    private interface RunnableRequest {
        void execute() throws Exception;
    }

    @Test
    @DisplayName("Performance Benchmark: Projects List Endpoint")
    public void benchmarkProjectsListEndpoint() throws Exception {
        MetricResult result = benchmarkEndpoint("GET /api/v1/projects", () -> {
            mockMvc.perform(get("/api/v1/projects")
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk());
        }, 5, 50);

        assertThat(result.errorRate).isEqualTo(0.0);
        assertThat(result.p95Ms).isLessThan(250.0); // SLA: < 250ms
    }

    @Test
    @DisplayName("Performance Benchmark: Work Assignments List Endpoint")
    public void benchmarkWorkAssignmentsEndpoint() throws Exception {
        MetricResult result = benchmarkEndpoint("GET /api/v1/work-assignments", () -> {
            mockMvc.perform(get("/api/v1/work-assignments")
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk());
        }, 5, 50);

        assertThat(result.errorRate).isEqualTo(0.0);
        assertThat(result.p95Ms).isLessThan(250.0); // SLA: < 250ms
    }

    @Test
    @DisplayName("Performance Benchmark: Operational Analytics Summary Endpoint")
    public void benchmarkAnalyticsSummaryEndpoint() throws Exception {
        MetricResult result = benchmarkEndpoint("GET /api/v1/analytics/dashboard/summary", () -> {
            mockMvc.perform(get("/api/v1/analytics/dashboard/summary")
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk());
        }, 5, 50);

        assertThat(result.errorRate).isEqualTo(0.0);
        assertThat(result.p95Ms).isLessThan(300.0); // SLA: < 300ms
    }

    @Test
    @DisplayName("Performance Benchmark: Cryptographic Audit Chain Integrity Verification Endpoint")
    public void benchmarkAuditChainVerificationEndpoint() throws Exception {
        MetricResult result = benchmarkEndpoint("POST /api/v1/audit-events/integrity/verify", () -> {
            mockMvc.perform(post("/api/v1/audit-events/integrity/verify")
                            .header("Authorization", adminToken)
                            .param("chainScope", "GLOBAL"))
                    .andExpect(status().isOk());
        }, 5, 30);

        assertThat(result.errorRate).isEqualTo(0.0);
        assertThat(result.p95Ms).isLessThan(500.0); // SLA: < 500ms
    }
}
