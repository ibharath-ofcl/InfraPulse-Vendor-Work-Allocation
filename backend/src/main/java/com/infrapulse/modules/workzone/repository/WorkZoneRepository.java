package com.infrapulse.modules.workzone.repository;

import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkZoneRepository extends JpaRepository<WorkZone, String>, JpaSpecificationExecutor<WorkZone> {

    Optional<WorkZone> findByZoneCode(String zoneCode);

    boolean existsByZoneCode(String zoneCode);

    List<WorkZone> findByProjectId(String projectId);

    List<WorkZone> findByPincode(String pincode);

    List<WorkZone> findByProjectIdAndPincode(String projectId, String pincode);

    long countByProjectId(String projectId);

    long countByProjectIdAndStatus(String projectId, ZoneStatus status);
}
