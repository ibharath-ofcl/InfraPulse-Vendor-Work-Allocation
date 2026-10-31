package com.infrapulse.modules.finance.service;

import com.infrapulse.modules.finance.dto.FinanceDashboardSummaryResponse;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class FinanceDashboardService {

    private final VendorAgreementRepository agreementRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final PaymentAuthorizationRepository authorizationRepository;
    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;

    public FinanceDashboardService(
            VendorAgreementRepository agreementRepository,
            ProjectMilestoneRepository milestoneRepository,
            VendorPaymentRequestRepository paymentRequestRepository,
            PaymentAuthorizationRepository authorizationRepository,
            ProjectRepository projectRepository,
            VendorRepository vendorRepository) {
        this.agreementRepository = agreementRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentRequestRepository = paymentRequestRepository;
        this.authorizationRepository = authorizationRepository;
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public FinanceDashboardSummaryResponse getDashboardSummary() {
        FinanceDashboardSummaryResponse response = new FinanceDashboardSummaryResponse();

        List<VendorAgreement> agreements = agreementRepository.findAll();
        List<ProjectMilestone> milestones = milestoneRepository.findAll();
        List<VendorPaymentRequest> paymentRequests = paymentRequestRepository.findAll();

        BigDecimal totalContractValue = BigDecimal.ZERO;
        for (VendorAgreement a : agreements) {
            if (a.getContractValue() != null) {
                totalContractValue = totalContractValue.add(a.getContractValue());
            }
        }
        response.setTotalContractualValue(totalContractValue);

        BigDecimal totalMilestoneVal = BigDecimal.ZERO;
        BigDecimal eligibleMilestoneVal = BigDecimal.ZERO;
        for (ProjectMilestone m : milestones) {
            if (m.getMilestoneValue() != null) {
                totalMilestoneVal = totalMilestoneVal.add(m.getMilestoneValue());
                if (m.getStatus() == MilestoneStatus.ELIGIBLE_FOR_PAYMENT ||
                        m.getStatus() == MilestoneStatus.PARTIALLY_PAID) {
                    BigDecimal auth = authorizationRepository.sumAuthorizedAmountByMilestoneId(m.getId());
                    BigDecimal remaining = m.getMilestoneValue().subtract(auth).max(BigDecimal.ZERO);
                    eligibleMilestoneVal = eligibleMilestoneVal.add(remaining);
                }
            }
        }
        response.setTotalMilestoneValue(totalMilestoneVal);
        response.setEligibleMilestoneValue(eligibleMilestoneVal);

        long pending = 0;
        long underReview = 0;
        long rejected = 0;
        long onHold = 0;
        Map<String, Long> statusCounts = new HashMap<>();

        for (VendorPaymentRequest pr : paymentRequests) {
            String s = pr.getStatus().name();
            statusCounts.put(s, statusCounts.getOrDefault(s, 0L) + 1);

            if (pr.getStatus() == PaymentRequestStatus.SUBMITTED) pending++;
            else if (pr.getStatus() == PaymentRequestStatus.UNDER_FINANCIAL_REVIEW) underReview++;
            else if (pr.getStatus() == PaymentRequestStatus.REJECTED) rejected++;
            else if (pr.getStatus() == PaymentRequestStatus.CLARIFICATION_REQUIRED) onHold++;
        }

        response.setPendingPaymentRequests(pending);
        response.setRequestsUnderReview(underReview);
        response.setRejectedRequests(rejected);
        response.setOnHoldRequests(onHold);
        response.setStatusBreakdown(statusCounts);

        BigDecimal totalAuthorized = authorizationRepository.sumTotalAuthorizedAmount();
        BigDecimal totalSettled = authorizationRepository.sumTotalSettledAmount();
        BigDecimal outstanding = totalMilestoneVal.subtract(totalAuthorized).max(BigDecimal.ZERO);

        response.setApprovedPaymentAmount(totalAuthorized);
        response.setSimulatedSettledAmount(totalSettled);
        response.setOutstandingMilestoneBalance(outstanding);

        // Project Breakdown
        List<Project> projects = projectRepository.findAll();
        List<FinanceDashboardSummaryResponse.ProjectFinancialBreakdownDto> prjBreakdowns = new ArrayList<>();
        for (Project p : projects) {
            FinanceDashboardSummaryResponse.ProjectFinancialBreakdownDto pDto = new FinanceDashboardSummaryResponse.ProjectFinancialBreakdownDto();
            pDto.setProjectId(p.getId());
            pDto.setProjectName(p.getProjectName());
            pDto.setProjectCode(p.getProjectCode());

            BigDecimal pContract = BigDecimal.ZERO;
            for (VendorAgreement a : agreementRepository.findByProjectId(p.getId())) {
                if (a.getContractValue() != null) pContract = pContract.add(a.getContractValue());
            }
            pDto.setTotalContractValue(pContract);

            BigDecimal pAuth = BigDecimal.ZERO;
            BigDecimal pSettle = BigDecimal.ZERO;
            for (ProjectMilestone m : milestoneRepository.findByProjectId(p.getId())) {
                pAuth = pAuth.add(authorizationRepository.sumAuthorizedAmountByMilestoneId(m.getId()));
                pSettle = pSettle.add(authorizationRepository.sumSettledAmountByMilestoneId(m.getId()));
            }
            pDto.setAuthorizedAmount(pAuth);
            pDto.setSettledAmount(pSettle);
            pDto.setOutstandingBalance(pContract.subtract(pAuth).max(BigDecimal.ZERO));
            prjBreakdowns.add(pDto);
        }
        response.setProjectBreakdown(prjBreakdowns);

        // Vendor Breakdown
        List<Vendor> vendors = vendorRepository.findAll();
        List<FinanceDashboardSummaryResponse.VendorFinancialBreakdownDto> vBreakdowns = new ArrayList<>();
        for (Vendor v : vendors) {
            FinanceDashboardSummaryResponse.VendorFinancialBreakdownDto vDto = new FinanceDashboardSummaryResponse.VendorFinancialBreakdownDto();
            vDto.setVendorId(v.getId());
            vDto.setVendorName(v.getCompanyName());
            vDto.setVendorCode(v.getVendorCode());

            BigDecimal vReq = BigDecimal.ZERO;
            for (VendorPaymentRequest pr : paymentRequestRepository.findByVendorId(v.getId())) {
                if (pr.getRequestedAmount() != null) vReq = vReq.add(pr.getRequestedAmount());
            }
            vDto.setRequestedAmount(vReq);

            BigDecimal vAuth = BigDecimal.ZERO;
            BigDecimal vSettle = BigDecimal.ZERO;
            BigDecimal vMilestoneTotal = BigDecimal.ZERO;
            for (ProjectMilestone m : milestoneRepository.findByVendorId(v.getId())) {
                vMilestoneTotal = vMilestoneTotal.add(m.getMilestoneValue());
                vAuth = vAuth.add(authorizationRepository.sumAuthorizedAmountByMilestoneId(m.getId()));
                vSettle = vSettle.add(authorizationRepository.sumSettledAmountByMilestoneId(m.getId()));
            }
            vDto.setApprovedAmount(vAuth);
            vDto.setSettledAmount(vSettle);
            vDto.setOutstandingBalance(vMilestoneTotal.subtract(vAuth).max(BigDecimal.ZERO));
            vBreakdowns.add(vDto);
        }
        response.setVendorBreakdown(vBreakdowns);

        return response;
    }
}
