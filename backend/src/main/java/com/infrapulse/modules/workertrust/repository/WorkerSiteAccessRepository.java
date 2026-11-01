package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerSiteAccess;
import com.infrapulse.modules.workertrust.enums.SiteAccessStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerSiteAccessRepository extends JpaRepository<WorkerSiteAccess, String> {

    List<WorkerSiteAccess> findByWorkerIdOrderByEntryTimeDesc(String workerId);

    Optional<WorkerSiteAccess> findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus(
        String workerId, SiteAccessStatus accessStatus
    );

    @Query("SELECT wsa FROM WorkerSiteAccess wsa " +
           "WHERE wsa.accessStatus = 'ALLOW_ENTRY' AND wsa.exitTime IS NULL")
    List<WorkerSiteAccess> findAllCurrentlyOnSite();

    @Query("SELECT wsa FROM WorkerSiteAccess wsa " +
           "WHERE wsa.accessStatus = 'ALLOW_ENTRY' AND wsa.exitTime IS NULL " +
           "AND (:projectId IS NULL OR wsa.project.id = :projectId) " +
           "AND (:workZoneId IS NULL OR wsa.workZone.id = :workZoneId)")
    List<WorkerSiteAccess> findCurrentlyOnSiteByProjectAndZone(
        @Param("projectId") String projectId,
        @Param("workZoneId") String workZoneId
    );

    @Query("SELECT wsa FROM WorkerSiteAccess wsa " +
           "JOIN WorkerVendorAssociation wva ON wva.worker.id = wsa.worker.id " +
           "WHERE wva.vendor.id = :vendorId " +
           "ORDER BY wsa.entryTime DESC")
    Page<WorkerSiteAccess> findByVendorId(
        @Param("vendorId") String vendorId,
        Pageable pageable
    );

    long countByAccessStatus(SiteAccessStatus accessStatus);

    @Query("SELECT COUNT(wsa) FROM WorkerSiteAccess wsa " +
           "WHERE wsa.accessStatus = 'ALLOW_ENTRY' AND wsa.exitTime IS NULL")
    long countCurrentlyOnSite();
}

