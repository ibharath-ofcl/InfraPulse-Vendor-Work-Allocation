package com.infrapulse.security;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.springframework.core.annotation.Order;
import java.util.UUID;

@Component
@Order(1)
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${security.bootstrap.admin-email:admin@infrapulse.gov.in}")
    private String adminEmail;

    @Value("${security.bootstrap.admin-password:Admin@InfraPulse2025!}")
    private String adminPassword;

    @Value("${security.bootstrap.admin-name:Platform Administrator}")
    private String adminName;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        provisionInitialAdmin();
        provisionDemoAccountsIfEmpty();
    }

    private void provisionInitialAdmin() {
        long adminCount = userRepository.countByRole(UserRole.PLATFORM_ADMIN);
        if (adminCount == 0) {
            String normalizedEmail = adminEmail.toLowerCase().trim();
            if (userRepository.findByEmail(normalizedEmail).isEmpty()) {
                User admin = new User(
                    UUID.randomUUID().toString(),
                    adminName,
                    normalizedEmail,
                    passwordEncoder.encode(adminPassword),
                    "+91 80 2297 5000",
                    UserRole.PLATFORM_ADMIN,
                    UserStatus.ACTIVE
                );
                userRepository.save(admin);
                log.info("Initialized secure Platform Administrator account: {}", normalizedEmail);
            }
        }
    }

    private void provisionDemoAccountsIfEmpty() {
        createAccountIfNotExists(
            "pm@infrapulse.gov.in",
            "Priya Sharma (PM)",
            "+91 98450 11223",
            UserRole.PROJECT_MANAGER,
            "Password123!"
        );
        createAccountIfNotExists(
            "vendor@infrapulse.gov.in",
            "Apex Infrastructure Ltd (Vendor)",
            "+91 99801 44556",
            UserRole.VENDOR,
            "Password123!"
        );
        createAccountIfNotExists(
            "field@infrapulse.gov.in",
            "Kavita Reddy (Field QA)",
            "+91 97410 77889",
            UserRole.FIELD_ENGINEER,
            "Password123!"
        );
        createAccountIfNotExists(
            "finance@infrapulse.gov.in",
            "Rohan Mehta (Finance)",
            "+91 96112 33445",
            UserRole.FINANCE_OFFICER,
            "Password123!"
        );
    }

    private void createAccountIfNotExists(String email, String name, String phone, UserRole role, String rawPassword) {
        String normalizedEmail = email.toLowerCase().trim();
        if (userRepository.findByEmail(normalizedEmail).isEmpty()) {
            User user = new User(
                UUID.randomUUID().toString(),
                name,
                normalizedEmail,
                passwordEncoder.encode(rawPassword),
                phone,
                role,
                UserStatus.ACTIVE
            );
            userRepository.save(user);
            log.info("Provisioned initial demonstration role account for {}: {}", role.name(), normalizedEmail);
        }
    }
}
