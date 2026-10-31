package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.MilestoneWorkAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneWorkAssignmentRepository extends JpaRepository<MilestoneWorkAssignment, String> {

    List<MilestoneWorkAssignment> findByMilestoneId(String milestoneId);

    List<MilestoneWorkAssignment> findByAssignmentId(String assignmentId);

    Optional<MilestoneWorkAssignment> findByMilestoneIdAndAssignmentId(String milestoneId, String assignmentId);

    boolean existsByMilestoneIdAndAssignmentId(String milestoneId, String assignmentId);

    void deleteByMilestoneIdAndAssignmentId(String milestoneId, String assignmentId);
}
