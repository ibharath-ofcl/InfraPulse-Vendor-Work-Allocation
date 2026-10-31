package com.infrapulse.modules.analytics.repository;

import com.infrapulse.modules.analytics.entity.VendorScoringConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorScoringConfigurationRepository extends JpaRepository<VendorScoringConfiguration, String> {

    Optional<VendorScoringConfiguration> findFirstByActiveTrueOrderByVersionDesc();

    List<VendorScoringConfiguration> findAllByOrderByVersionDesc();

    Optional<VendorScoringConfiguration> findTopByOrderByVersionDesc();
}
