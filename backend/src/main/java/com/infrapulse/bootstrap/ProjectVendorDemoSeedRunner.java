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
    private final com.infrapulse.modules.workzone.repository.WorkZoneRepository workZoneRepository;
    private final com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository workAssignmentRepository;

    @Value("${app.seed-demo-data:true}")
    private boolean seedDemoData;

    public ProjectVendorDemoSeedRunner(
        ProjectRepository projectRepository,
        VendorRepository vendorRepository,
        ProjectVendorRepository projectVendorRepository,
        ProjectManagerAssignmentRepository pmAssignmentRepository,
        UserRepository userRepository,
        com.infrapulse.modules.workzone.repository.WorkZoneRepository workZoneRepository,
        com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository workAssignmentRepository
    ) {
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.pmAssignmentRepository = pmAssignmentRepository;
        this.userRepository = userRepository;
        this.workZoneRepository = workZoneRepository;
        this.workAssignmentRepository = workAssignmentRepository;
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

        if (workZoneRepository.count() == 0) {
            seedDemoWorkZonesAndAssignments();
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

        Optional<Vendor> v1Opt = vendorRepository.findByVendorCode("VND-1001");
        Optional<Vendor> v2Opt = vendorRepository.findByVendorCode("VND-1002");
        Optional<Vendor> v3Opt = vendorRepository.findByVendorCode("VND-1003");

        // 1. Chennai Fiber Network Expansion
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
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP1, pm, admin));
        if (v1Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP1, v1Opt.get(), admin, "Primary contractor for civil trenching and fiber ducting."));
        }

        // 2. Bengaluru Smart Utility Corridor
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
        Project savedP2 = projectRepository.save(p2);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP2, pm, admin));
        if (v2Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP2, v2Opt.get(), admin, "Contractor for underground power conduit encasement."));
        }

        // 3. Smart Grid Optical Fiber & Underground Ducting (Bengaluru Central)
        Project p3 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-BLR-101",
            "Smart Grid Optical Fiber & Underground Ducting",
            "High-density municipal optical conduit network and IoT sub-surface sensors.",
            ProjectType.FIBER_OPTIC,
            "Bengaluru Smart City Development Ltd",
            "Bengaluru Central",
            "Karnataka",
            "Bengaluru Urban",
            "560038",
            LocalDate.of(2026, 10, 1),
            LocalDate.of(2027, 5, 31),
            new BigDecimal("35000000.00"),
            ProjectStatus.ACTIVE,
            pm,
            admin
        );
        Project savedP3 = projectRepository.save(p3);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP3, pm, admin));
        if (v1Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP3, v1Opt.get(), admin, "Approved optical fiber package contractor."));
        }

        // 4. Cyberabad Telecom Conduit & 5G Micro-Cell Spine (Hyderabad West)
        Project p4 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-HYD-404",
            "Cyberabad Telecom Conduit & 5G Micro-Cell Spine",
            "Dedicated telecom corridor ducting and micro-cell station infrastructure.",
            ProjectType.TELECOM,
            "Hyderabad Metropolitan Development Authority",
            "Hyderabad West",
            "Telangana",
            "Hyderabad",
            "500081",
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2027, 7, 31),
            new BigDecimal("28500000.00"),
            ProjectStatus.ACTIVE,
            pm,
            admin
        );
        Project savedP4 = projectRepository.save(p4);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP4, pm, admin));
        if (v2Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP4, v2Opt.get(), admin, "Specialist telecom duct routing contractor."));
        }

        // 5. Pune Ring Road High-Tension Electrical Undergrounding (Pune East)
        Project p5 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-PUN-505",
            "Pune Ring Road High-Tension Electrical Undergrounding",
            "Safe underground encasement of overhead 33kV distribution lines and sub-station links.",
            ProjectType.ELECTRICAL,
            "Maharashtra State Electricity Distribution Co",
            "Pune East",
            "Maharashtra",
            "Pune",
            "411014",
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2027, 4, 30),
            new BigDecimal("64000000.00"),
            ProjectStatus.ACTIVE,
            pm,
            admin
        );
        Project savedP5 = projectRepository.save(p5);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP5, pm, admin));
        if (v3Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP5, v3Opt.get(), admin, "Civil excavation and high-tension trench shielding."));
        }

        // 6. National Capital Central Utility Vault Modernization (Delhi Central)
        Project p6 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-DEL-606",
            "National Capital Central Utility Vault Modernization",
            "Modular pre-cast concrete utility vaults and multi-operator shared conduits.",
            ProjectType.UTILITY,
            "Delhi Transco Limited",
            "Delhi Central",
            "Delhi",
            "New Delhi",
            "110001",
            LocalDate.of(2026, 6, 15),
            LocalDate.of(2027, 9, 30),
            new BigDecimal("75000000.00"),
            ProjectStatus.ON_HOLD,
            pm,
            admin
        );
        Project savedP6 = projectRepository.save(p6);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP6, pm, admin));
        if (v1Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP6, v1Opt.get(), admin, "Pre-cast vault placement and civil works."));
        }

        // 7. Mumbai Coastal Arterial Resurfacing & Drainage Package (Mumbai South)
        Project p7 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-MUM-707",
            "Mumbai Coastal Arterial Resurfacing & Drainage Package",
            "Heavy corridor mastic asphalt resurfacing, curb realignment, and storm runoff drainage.",
            ProjectType.ROAD_INFRASTRUCTURE,
            "Brihanmumbai Municipal Corporation",
            "Mumbai South",
            "Maharashtra",
            "Mumbai City",
            "400001",
            LocalDate.of(2027, 1, 10),
            LocalDate.of(2027, 11, 30),
            new BigDecimal("92000000.00"),
            ProjectStatus.PLANNED,
            pm,
            admin
        );
        Project savedP7 = projectRepository.save(p7);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP7, pm, admin));
        if (v3Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP7, v3Opt.get(), admin, "High-density asphalt paving and deep stormwater line laying."));
        }

        // 8. Kolkata Port Feeder Road & Utility Ducting Grid (Kolkata West)
        Project p8 = new Project(
            UUID.randomUUID().toString(),
            "PRJ-KOL-808",
            "Kolkata Port Feeder Road & Utility Ducting Grid",
            "Heavy-duty road foundation reconstruction and integrated stormwater drainage conduits.",
            ProjectType.ROAD_INFRASTRUCTURE,
            "Syama Prasad Mookerjee Port Authority",
            "Kolkata West",
            "West Bengal",
            "Kolkata",
            "700043",
            LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 10, 31),
            new BigDecimal("21000000.00"),
            ProjectStatus.COMPLETED,
            pm,
            admin
        );
        Project savedP8 = projectRepository.save(p8);
        if (pm != null) pmAssignmentRepository.save(new ProjectManagerAssignment(savedP8, pm, admin));
        if (v3Opt.isPresent()) {
            projectVendorRepository.save(new ProjectVendor(savedP8, v3Opt.get(), admin, "Sub-grade stabilization and finished asphalt wear course."));
        }

        log.info("Provisioned 8 initial municipal infrastructure demonstration projects across major metropolitan corridors!");
    }

    private void seedDemoWorkZonesAndAssignments() {
        Optional<Project> cheProjectOpt = projectRepository.findByProjectCode("PRJ-CHE-101");
        Optional<Project> blrProjectOpt = projectRepository.findByProjectCode("PRJ-BLR-202");
        Optional<User> adminOpt = userRepository.findByEmail("admin@infrapulse.gov.in");
        Optional<Vendor> v1Opt = vendorRepository.findByVendorCode("VND-1001");

        if (cheProjectOpt.isEmpty() || adminOpt.isEmpty()) {
            log.warn("Required projects or admin user missing. Skipping work zone and assignment seed.");
            return;
        }

        Project cheProject = cheProjectOpt.get();
        User admin = adminOpt.get();

        // 1. Chennai Work Zones
        com.infrapulse.modules.workzone.entity.WorkZone wz1 = new com.infrapulse.modules.workzone.entity.WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600040-001",
            cheProject,
            "Anna Nagar Sector A",
            "High-density commercial corridor along 2nd Avenue.",
            "600040",
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            new java.math.BigDecimal("13.085000"),
            new java.math.BigDecimal("80.210100"),
            com.infrapulse.modules.workzone.enums.ZoneStatus.ACTIVE,
            admin
        );
        workZoneRepository.save(wz1);

        com.infrapulse.modules.workzone.entity.WorkZone wz2 = new com.infrapulse.modules.workzone.entity.WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600040-002",
            cheProject,
            "Anna Nagar Sector B",
            "Residential grid and school zone along 5th Main Road.",
            "600040",
            "Anna Nagar East",
            "Chennai",
            "Tamil Nadu",
            new java.math.BigDecimal("13.088000"),
            new java.math.BigDecimal("80.218000"),
            com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
            admin
        );
        workZoneRepository.save(wz2);

        com.infrapulse.modules.workzone.entity.WorkZone wz3 = new com.infrapulse.modules.workzone.entity.WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600001-001",
            cheProject,
            "George Town Heritage Zone",
            "Historic arterial transit and harbor feeder route.",
            "600001",
            "George Town",
            "Chennai",
            "Tamil Nadu",
            new java.math.BigDecimal("13.090000"),
            new java.math.BigDecimal("80.290000"),
            com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
            admin
        );
        workZoneRepository.save(wz3);

        // 2. Bengaluru Work Zones
        if (blrProjectOpt.isPresent()) {
            Project blrProject = blrProjectOpt.get();
            com.infrapulse.modules.workzone.entity.WorkZone wzBlr1 = new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-560001-001",
                blrProject,
                "MG Road Metro Corridor",
                "Central business district and rapid transit underground ducting.",
                "560001",
                "MG Road",
                "Bengaluru Urban",
                "Karnataka",
                new java.math.BigDecimal("12.975600"),
                new java.math.BigDecimal("77.606600"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.ACTIVE,
                admin
            );
            workZoneRepository.save(wzBlr1);

            com.infrapulse.modules.workzone.entity.WorkZone wzBlr2 = new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-560001-002",
                blrProject,
                "Brigade Junction Sector 2",
                "Commercial intersection with pedestrian subways.",
                "560001",
                "Brigade Road",
                "Bengaluru Urban",
                "Karnataka",
                new java.math.BigDecimal("12.971600"),
                new java.math.BigDecimal("77.607000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            );
            workZoneRepository.save(wzBlr2);
        }

        // 3. Smart Grid Optical Fiber (Bengaluru Central - PRJ-BLR-101)
        projectRepository.findByProjectCode("PRJ-BLR-101").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-560038-001",
                p,
                "Indiranagar 100 Feet Road Corridor",
                "High-density commercial corridor with integrated optical fiber backbone.",
                "560038",
                "Indiranagar",
                "Bengaluru Urban",
                "Karnataka",
                new java.math.BigDecimal("12.978400"),
                new java.math.BigDecimal("77.640800"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.ACTIVE,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-560038-002",
                p,
                "CMH Road Sub-Surface Vault",
                "Metro feeder corridor sub-surface conduit chambers.",
                "560038",
                "CMH Road",
                "Bengaluru Urban",
                "Karnataka",
                new java.math.BigDecimal("12.979000"),
                new java.math.BigDecimal("77.644000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
        });

        // 4. Cyberabad Telecom (Hyderabad West - PRJ-HYD-404)
        projectRepository.findByProjectCode("PRJ-HYD-404").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-500081-001",
                p,
                "HITEC City Cyber Towers Ring",
                "IT tech corridor micro-trenching and 5G base conduit node.",
                "500081",
                "HITEC City",
                "Hyderabad",
                "Telangana",
                new java.math.BigDecimal("17.450400"),
                new java.math.BigDecimal("78.380800"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.ACTIVE,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-500081-002",
                p,
                "Madhapur Metro Station Flank",
                "Urban pedestrian thoroughfare sub-surface telecom ducting.",
                "500081",
                "Madhapur",
                "Hyderabad",
                "Telangana",
                new java.math.BigDecimal("17.448500"),
                new java.math.BigDecimal("78.390800"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
        });

        // 5. Pune Ring Road Electrical (Pune East - PRJ-PUN-505)
        projectRepository.findByProjectCode("PRJ-PUN-505").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-411014-001",
                p,
                "Viman Nagar Substation Corridor",
                "High-voltage 33kV cable encasement and concrete duct banks.",
                "411014",
                "Viman Nagar",
                "Pune",
                "Maharashtra",
                new java.math.BigDecimal("18.567900"),
                new java.math.BigDecimal("73.914300"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.ACTIVE,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-411014-002",
                p,
                "Kharadi IT Park Feeder Trench",
                "Underground distribution line trenching and safety shielding.",
                "411014",
                "Kharadi",
                "Pune",
                "Maharashtra",
                new java.math.BigDecimal("18.551500"),
                new java.math.BigDecimal("73.934800"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
        });

        // 6. National Capital Central Utility Vault (Delhi Central - PRJ-DEL-606)
        projectRepository.findByProjectCode("PRJ-DEL-606").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-110001-001",
                p,
                "Connaught Place Radial 1 Vault",
                "Modular pre-cast concrete multi-utility tunnel placement.",
                "110001",
                "Connaught Place",
                "New Delhi",
                "Delhi",
                new java.math.BigDecimal("28.632800"),
                new java.math.BigDecimal("77.219700"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-110001-002",
                p,
                "Barakhamba Road Junction Vault",
                "Deep utility vault inspection and automated monitoring system.",
                "110001",
                "Barakhamba Road",
                "New Delhi",
                "Delhi",
                new java.math.BigDecimal("28.629000"),
                new java.math.BigDecimal("77.227000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
        });

        // 7. Mumbai Coastal Arterial Resurfacing (Mumbai South - PRJ-MUM-707)
        projectRepository.findByProjectCode("PRJ-MUM-707").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-400001-001",
                p,
                "Marine Drive South Promenade Sector",
                "Mastic asphalt wear-course resurfacing and storm drain clearing.",
                "400001",
                "Marine Drive",
                "Mumbai City",
                "Maharashtra",
                new java.math.BigDecimal("18.943800"),
                new java.math.BigDecimal("72.823200"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-400001-002",
                p,
                "Nariman Point Stormwater Outfall",
                "Reinforced concrete tidal flap valve installation and trenching.",
                "400001",
                "Nariman Point",
                "Mumbai City",
                "Maharashtra",
                new java.math.BigDecimal("18.926000"),
                new java.math.BigDecimal("72.822000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.AVAILABLE,
                admin
            ));
        });

        // 8. Kolkata Port Feeder Road (Kolkata West - PRJ-KOL-808)
        projectRepository.findByProjectCode("PRJ-KOL-808").ifPresent(p -> {
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-700043-001",
                p,
                "Garden Reach Circular Road Port Link",
                "Heavy-duty sub-base reconstruction and drainage culverts.",
                "700043",
                "Garden Reach",
                "Kolkata",
                "West Bengal",
                new java.math.BigDecimal("22.541000"),
                new java.math.BigDecimal("88.305000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.COMPLETED,
                admin
            ));
            workZoneRepository.save(new com.infrapulse.modules.workzone.entity.WorkZone(
                UUID.randomUUID().toString(),
                "WZ-700043-002",
                p,
                "Kidderpore Dock Feeder Sector",
                "Industrial asphalt finishing and subterranean cable ducting.",
                "700043",
                "Kidderpore",
                "Kolkata",
                "West Bengal",
                new java.math.BigDecimal("22.535000"),
                new java.math.BigDecimal("88.318000"),
                com.infrapulse.modules.workzone.enums.ZoneStatus.COMPLETED,
                admin
            ));
        });

        log.info("Provisioned geographical work zones linked to all 8 municipal projects.");

        // 3. Initial Work Assignments
        if (v1Opt.isPresent() && workAssignmentRepository.count() == 0) {
            Vendor v1 = v1Opt.get();

            com.infrapulse.modules.workassignment.entity.WorkAssignment asn1 = new com.infrapulse.modules.workassignment.entity.WorkAssignment(
                UUID.randomUUID().toString(),
                "INF-WA-2026-001001",
                cheProject,
                wz1,
                v1,
                com.infrapulse.modules.workassignment.enums.WorkType.TRENCHING,
                "Trenching - Anna Nagar Sector A",
                "Mechanical excavation and trench preparation for optical fiber duct installation.",
                LocalDate.of(2026, 11, 10),
                LocalDate.of(2026, 11, 20),
                com.infrapulse.modules.workassignment.enums.AssignmentPriority.HIGH,
                com.infrapulse.modules.workassignment.enums.AssignmentStatus.ACCEPTED,
                "Follow approved infrastructure safety procedures and prepare trench for conduit laying.",
                admin
            );
            workAssignmentRepository.save(asn1);

            com.infrapulse.modules.workassignment.entity.WorkAssignment asn2 = new com.infrapulse.modules.workassignment.entity.WorkAssignment(
                UUID.randomUUID().toString(),
                "INF-WA-2026-001002",
                cheProject,
                wz3,
                v1,
                com.infrapulse.modules.workassignment.enums.WorkType.ROAD_RESURFACING,
                "Surface Restoration - George Town Heritage Corridor",
                "High-grade asphalt mastic resurfacing and compaction over backfilled trench line.",
                LocalDate.of(2026, 11, 15),
                LocalDate.of(2026, 11, 28),
                com.infrapulse.modules.workassignment.enums.AssignmentPriority.MEDIUM,
                com.infrapulse.modules.workassignment.enums.AssignmentStatus.ASSIGNED,
                "Ensure smooth transitions with existing pavement levels and clean curb edges.",
                admin
            );
            workAssignmentRepository.save(asn2);
        }

        log.info("Provisioned initial demonstration spatial work zones and assignments.");
    }
}
