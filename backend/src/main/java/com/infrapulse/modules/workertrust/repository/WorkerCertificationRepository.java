package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerCertification;
import com.infrapulse.modules.workertrust.enums.CertificationStatus;
import com.infrapulse.modules.workertrust.enums.CertificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkerCertificationRepository extends JpaRepository<WorkerCertification, String> {

    List<WorkerCertification> findByWorkerId(String workerId);

    List<WorkerCertification> findByWorkerIdAndCertificationType(String workerId, CertificationType type);

    @Query("SELECT wc FROM WorkerCertification wc WHERE wc.expiryDate IS NOT NULL AND wc.expiryDate < :today")
    List<WorkerCertification> findExpiredCertifications(@Param("today") LocalDate today);

    @Query("SELECT wc FROM WorkerCertification wc WHERE wc.expiryDate IS NOT NULL AND wc.expiryDate BETWEEN :today AND :windowDate")
    List<WorkerCertification> findExpiringCertifications(@Param("today") LocalDate today, @Param("windowDate") LocalDate windowDate);

    long countByVerificationStatus(CertificationStatus status);

    @Query("SELECT COUNT(wc) FROM WorkerCertification wc WHERE wc.expiryDate IS NOT NULL AND wc.expiryDate < :today")
    long countExpiredCertifications(@Param("today") LocalDate today);

    @Query("SELECT COUNT(wc) FROM WorkerCertification wc WHERE wc.expiryDate IS NOT NULL AND wc.expiryDate BETWEEN :today AND :windowDate")
    long countExpiringWithinDays(@Param("today") LocalDate today, @Param("windowDate") LocalDate windowDate);
}
