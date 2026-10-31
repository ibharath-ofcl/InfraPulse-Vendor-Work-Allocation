package com.infrapulse.bootstrap;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.entity.ProjectManagerAssignment;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectManagerAssignmentRepository;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import org.springframework.core.annotation.Order;
import java.util.UUID;

@Component
@Order(2)
@Profile("!test")
public class ProjectVendorDemoSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProjectVendorDemoSeedRunner.class);

    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final ProjectManagerAssignmentRepository pmAssignmentRepository;
    private final UserRepository userRepository;

    @Value("${app.seed-demo-data:true}")
    private boolean seedDemoData;

    public ProjectVendorDemoSeedRunner(
        ProjectRepository projectRepository,
        VendorRepository vendorRepository,
        ProjectVendorRepository projectVendorRepository,
        ProjectManagerAssignmentRepository pmAssignmentRepository,
        UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.pmAssignmentRepository = pmAssignmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedDemoData) {
            return;
        }

        if (vendorRepository.count() == 0) {
            seedDemoVendors();
        }

        if (projectRepository.count() == 0) {
            seedDemoProjects();
        }
    }

    private void seedDemoVendors() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@infrapulse.gov.in");
        if (adminOpt.isEmpty()) {
            log.warn("Platform Admin not found. Skipping demo vendor seeding.");
            return;
        }
        User admin = adminOpt.get();

        Optional<User> vendorUserOpt = userRepository.findByEmail("vendor@infrapulse.gov.in");
        User vendorUser = vendorUserOpt.orElse(null);

        Vendor v1 = new Vendor(
            UUID.randomUUID().toString(),
            "VND-1001",
            "ABC Infrastructure Services",
            "Rajesh Kumar",
            "contact@abcinfra.example",
            "+91 98765 43210",
            "+91 98765 43219",
            "Plot 14, Industrial Estate, Guindy",
            "Chennai",
            "Chennai",
            "Tamil Nadu",
            "600032",
            "33AAAAA1111A1Z1",
            "CIN-U45200TN2020PTC123456",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.TRENCHING, ServiceCategory.ROAD_RESURFACING),
            vendorUser,
            admin
        );
        vendorRepository.save(v1);

        Vendor v2 = new Vendor(
            UUID.randomUUID().toString(),
            "VND-1002",
            "Metro Utility Contractors",
            "Suresh Raina",
            "info@metroutility.example",
            "+91 98111 22334",
            null,
            "2nd Main, Peenya Industrial Area",
            "Bengaluru",
            "Bengaluru Urban",
            "Karnataka",
            "560058",
            "29BBBBB2222B1Z2",
            "CIN-U45300KA2019PTC654321",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.UNDERGROUND_CABLE_INSTALLATION, ServiceCategory.BACKFILLING),
            null,
            admin
        );
        vendorRepository.save(v2);

        Vendor v3 = new Vendor(
            UUID.randomUUID().toString(),
            "VND-1003",
            "Southern Roadworks Pvt Ltd",
            "Anand Murthy",
            "projects@southernroads.example",
            "+91 98450 99887",
            null,
            "NH-44 Bypass Junction",
            "Hyderabad",
            "Hyderabad",
            "Telangana",
            "500034",
            "36CCCCC3333C1Z3",
            "CIN-U45400TG2021PTC987654",
            VendorStatus.PENDING_VERIFICATION,
            Set.of(ServiceCategory.ROAD_RESURFACING, ServiceCategory.FINAL_INSPECTION),
            null,
            admin
        );
        vendorRepository.save(v3);

        log.info("Provisioned initial demonstration vendors (ABC Infrastructure Services, Metro Utility Contractors, Southern Roadworks Pvt Ltd)");
    }

    private void seedDemoProjects() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@infrapulse.gov.in");
        if (adminOpt.isEmpty()) {
            log.warn("Platform Admin not found. Skipping demo project seeding.");
            return;
        }
        User admin = adminOpt.get();

        Optional<User> pmOpt = userRepository.findByEmail("pm@infrapulse.gov.in");
        User pm = pmOpt.orElse(null);

        Project p1 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-CHE-101",
            "Chennai Fiber Network Expansion",
            "High-capacity optical fiber roll-out across northern operational zones.",
            ProjectType.FIBER_OPTIC,
            "Infrastructure Development Authority",
            "Chennai North",
            "Tamil Nadu",
            "Chennai",
            "600001",
            LocalDate.of(2026, 11, 10),
            LocalDate.of(2027, 6, 30),
            new BigDecimal("25000000.00"),
            ProjectStatus.ACTIVE,
            pm,
            admin
        );
        Project savedP1 = projectRepository.save(p1);

        if (pm != null && admin != null) {
            ProjectManagerAssignment pma = new ProjectManagerAssignment(savedP1, pm, admin);
            pmAssignmentRepository.save(pma);
        }

        // Associate demo vendor
        Optional<Vendor> v1Opt = vendorRepository.findByVendorCode("VND-1001");
        if (v1Opt.isPresent() && admin != null) {
            ProjectVendor pv = new ProjectVendor(
                savedP1,
                v1Opt.get(),
                admin,
                "Approved primary contractor for civil trenching and fiber ducting."
            );
            projectVendorRepository.save(pv);
        }

        Project p2 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-BLR-202",
            "Bengaluru Smart Utility Corridor",
            "Underground utility ducting and power grid resilience modernization.",
            ProjectType.UTILITY,
            "Karnataka Urban Infrastructure Corp",
            "Bengaluru South",
            "Karnataka",
            "Bengaluru Urban",
            "560001",
            LocalDate.of(2026, 12, 1),
            LocalDate.of(2027, 8, 15),
            new BigDecimal("42000000.00"),
            ProjectStatus.PLANNED,
            pm,
            admin
        );
        projectRepository.save(p2);

        log.info("Provisioned initial demonstration projects (Chennai Fiber Network Expansion, Bengaluru Smart Utility Corridor)");
    }
}
