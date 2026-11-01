package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.Worker;
import com.infrapulse.modules.workertrust.enums.WorkerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, String> {

    Optional<Worker> findByWorkerCode(String workerCode);

    Page<Worker> findByCurrentStatus(WorkerStatus currentStatus, Pageable pageable);

    @Query(value = "SELECT nextval('worker_code_seq')", nativeQuery = true)
    Long getNextWorkerSequence();

    @Query("SELECT w FROM Worker w " +
           "JOIN WorkerVendorAssociation wva ON wva.worker.id = w.id " +
           "WHERE wva.vendor.id = :vendorId " +
           "AND (:status IS NULL OR w.currentStatus = :status) " +
           "AND (:search IS NULL OR LOWER(w.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(w.workerCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR w.mobileNumber LIKE CONCAT('%', :search, '%'))")
    Page<Worker> findByVendorIdWithFilters(
        @Param("vendorId") String vendorId,
        @Param("status") WorkerStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("SELECT w FROM Worker w " +
           "WHERE (:status IS NULL OR w.currentStatus = :status) " +
           "AND (:search IS NULL OR LOWER(w.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(w.workerCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR w.mobileNumber LIKE CONCAT('%', :search, '%'))")
    Page<Worker> findAllWithFilters(
        @Param("status") WorkerStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    long countByCurrentStatus(WorkerStatus status);
}
