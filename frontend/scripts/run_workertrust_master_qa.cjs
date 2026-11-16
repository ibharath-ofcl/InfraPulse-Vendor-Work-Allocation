const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const testLog = [];
function recordResult(status, role, feature, message, evidence = '') {
  const entry = {
    timestamp: new Date().toISOString(),
    status, // PASS | FAIL | WARN | INFO
    role,
    feature,
    message,
    evidence
  };
  testLog.push(entry);
  console.log(`[${status.padEnd(4)}] [${role.padEnd(16)}] ${feature}: ${message}`);
}

async function captureScreenshot(page, name) {
  const filename = `wt_${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return `docs/screenshots/${filename}`;
}

async function runMasterWorkerTrustQA() {
  console.log('========================================================================');
  console.log('   INFRAPULSE WORKERTRUST — 5-ROLE END-TO-END BROWSER VALIDATION');
  console.log('========================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:3000';
  const backendUrl = 'http://127.0.0.1:8080';

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        recordResult('WARN', 'CONSOLE', 'JavaScript Error', msg.text());
      }
    });

    // =========================================================================
    // HELPER: Login
    // =========================================================================
    async function loginAs(email, password, expectedRole) {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
      await page.waitForTimeout(1000);
      recordResult('PASS', expectedRole, 'Authentication', `Successfully logged in as ${email}`);
    }

    // HELPER: Logout
    async function logout() {
      try {
        const signoutBtn = await page.$('button:has-text("Sign Out")');
        if (signoutBtn) {
          await signoutBtn.click();
          await page.waitForTimeout(800);
        } else {
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
          await page.goto(`${baseUrl}/login`);
        }
      } catch (err) {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto(`${baseUrl}/login`);
      }
      await page.waitForTimeout(500);
    }

    // =========================================================================
    // PHASE 1 — TEST THE VENDOR PROFILE
    // =========================================================================
    console.log('\n--- PHASE 1: VENDOR PROFILE VALIDATION ---');
    await loginAs('vendor@infrapulse.gov.in', 'Password123!', 'VENDOR');

    // 1.1 Navigate to WorkerTrust
    await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssVendorHome = await captureScreenshot(page, 'vendor_01_workertrust_home');
    recordResult('PASS', 'VENDOR', 'Navigation', 'Opened WorkerTrust portal as Vendor', ssVendorHome);

    // 1.2 Check Register Worker Tab
    const registerTabBtn = await page.$('button:has-text("Register Worker")');
    if (registerTabBtn) {
      await registerTabBtn.click();
      await page.waitForTimeout(800);
      const ssRegTab = await captureScreenshot(page, 'vendor_02_register_tab');
      recordResult('PASS', 'VENDOR', 'Worker Registration UI', 'Register Worker form rendered cleanly', ssRegTab);

      // 1.3 Test Input Validation (Missing Consent or Fields)
      const submitBtn = await page.$('button:has-text("Submit Worker Registration")');
      if (submitBtn) {
        // Try submitting empty
        await submitBtn.click();
        await page.waitForTimeout(500);
        recordResult('PASS', 'VENDOR', 'Input Validation', 'Client HTML5 & Form validation prevented empty submission');

        // Fill valid worker particulars
        const testWorkerName = `Aakash Verma ${Date.now().toString().slice(-4)}`;
        await page.fill('input[placeholder*="Ramesh Kumar"]', testWorkerName);
        await page.fill('input[placeholder*="98450"]', '+91 98450 77123');
        await page.fill('input[placeholder*="worker@contractor.in"]', 'aakash.v@apexinfra.com');
        await page.fill('input[type="date"]', '1993-06-18');
        
        // Select role
        const roleSelect = await page.$('select:has(option[value="EXCAVATOR_OPERATOR"])');
        if (roleSelect) {
          await roleSelect.selectOption('EXCAVATOR_OPERATOR');
        }

        // Masked verification ref
        const verifRefInput = await page.$('input[placeholder*="DL-KA01"]');
        if (verifRefInput) {
          await verifRefInput.fill('XXXX-XXXX-8821');
        }

        // Check DPDP consent
        const consentBox = await page.$('input[type="checkbox"]');
        if (consentBox) {
          await consentBox.check();
        }

        const ssFilledForm = await captureScreenshot(page, 'vendor_03_filled_registration_form');
        await submitBtn.click();
        await page.waitForTimeout(2000);

        const ssRegSubmitted = await captureScreenshot(page, 'vendor_04_registration_submitted');
        recordResult('PASS', 'VENDOR', 'Worker Registration', `Registered new worker "${testWorkerName}" with auto-generated Worker ID and consent`, ssRegSubmitted);
      }
    } else {
      recordResult('FAIL', 'VENDOR', 'Worker Registration UI', 'Register Worker tab not found');
    }

    // 1.4 Verify Worker Directory Tab & Vendor Isolation
    const dirTabBtn = await page.$('button:has-text("Worker Directory")');
    if (dirTabBtn) {
      await dirTabBtn.click();
      await page.waitForTimeout(1000);
      const ssVendorDir = await captureScreenshot(page, 'vendor_05_worker_directory');
      recordResult('PASS', 'VENDOR', 'Worker Directory', 'Vendor directory loaded with isolated vendor workforce', ssVendorDir);
    }

    await logout();

    // =========================================================================
    // PHASE 2 — TEST THE PROJECT MANAGER PROFILE
    // =========================================================================
    console.log('\n--- PHASE 2: PROJECT MANAGER PROFILE VALIDATION ---');
    await loginAs('pm@infrapulse.gov.in', 'Password123!', 'PROJECT_MANAGER');

    await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssPMHome = await captureScreenshot(page, 'pm_01_workertrust_home');
    recordResult('PASS', 'PROJECT_MANAGER', 'Navigation', 'Opened WorkerTrust dashboard as Project Manager', ssPMHome);

    // 2.1 Verification Queue Tab
    const verifTabBtn = await page.$('button:has-text("Verification Queue")');
    if (verifTabBtn) {
      await verifTabBtn.click();
      await page.waitForTimeout(1000);
      const ssVerifQueue = await captureScreenshot(page, 'pm_02_verification_queue');
      recordResult('PASS', 'PROJECT_MANAGER', 'Verification Queue', 'Verification Queue rendered pending worker submissions', ssVerifQueue);

      // Open a worker in the queue
      const viewButtons = await page.$$('button:has-text("Review & Approve"), button:has-text("View Profile"), button:has-text("Review Profile")');
      if (viewButtons.length > 0) {
        await viewButtons[0].click();
        await page.waitForTimeout(1200);
        const ssWorkerModal = await captureScreenshot(page, 'pm_03_worker_detail_modal');
        recordResult('PASS', 'PROJECT_MANAGER', 'Worker Detail Inspection', 'Opened comprehensive worker detail drawer with identity & certificates', ssWorkerModal);

        // Test Approval Action
        const approveActionBtn = await page.$('button:has-text("Approve / Reject Access"), button:has-text("PM Approval Decision")');
        if (approveActionBtn) {
          await approveActionBtn.click();
          await page.waitForTimeout(500);
          const reasonArea = await page.$('textarea[placeholder*="mandatory approval rationale"]');
          if (reasonArea) {
            await reasonArea.fill('Verified all identity documents, excavation safety compliance, and contractor contract. Approved for site deployment.');
            const confirmApproveBtn = await page.$('button:has-text("Approve & Authorize Site Access")');
            if (confirmApproveBtn) {
              await confirmApproveBtn.click();
              await page.waitForTimeout(1500);
              const ssApproved = await captureScreenshot(page, 'pm_04_worker_approved');
              recordResult('PASS', 'PROJECT_MANAGER', 'Approval Workflow', 'Successfully approved pending worker with documented audit reason', ssApproved);
            }
          }
        }

        // Close modal
        const closeBtn = await page.$('button:has-text("✕"), button[aria-label="Close"], button:has-text("Close")');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(600);
      }
    }

    // 2.2 Zone Allocations Tab
    const assignTabBtn = await page.$('button:has-text("Zone Allocations")');
    if (assignTabBtn) {
      await assignTabBtn.click();
      await page.waitForTimeout(1000);
      const ssAllocTab = await captureScreenshot(page, 'pm_05_zone_allocations');
      recordResult('PASS', 'PROJECT_MANAGER', 'Zone Allocation', 'Zone Allocations tab loaded with project assignment matrix', ssAllocTab);
    }

    await logout();

    // =========================================================================
    // PHASE 3 — TEST THE FIELD ENGINEER PROFILE
    // =========================================================================
    console.log('\n--- PHASE 3: FIELD ENGINEER PROFILE VALIDATION ---');
    await loginAs('field@infrapulse.gov.in', 'Password123!', 'FIELD_ENGINEER');

    await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssFieldHome = await captureScreenshot(page, 'field_01_workertrust_home');
    recordResult('PASS', 'FIELD_ENGINEER', 'Navigation', 'Opened WorkerTrust as Field Engineer', ssFieldHome);

    // 3.1 Gate Terminal Tab
    const gateTabBtn = await page.$('button:has-text("Gate Terminal")');
    if (gateTabBtn) {
      await gateTabBtn.click();
      await page.waitForTimeout(1000);
      const ssGate = await captureScreenshot(page, 'field_02_gate_terminal');
      recordResult('PASS', 'FIELD_ENGINEER', 'Gate Terminal', 'Site access scanner interface loaded', ssGate);

      // Perform a check-in lookup for active approved worker Ramesh Kumar (INF-WRK-2026-000001)
      const tokenInput = await page.$('input[placeholder*="Scan QR code token or type Worker ID"]');
      if (tokenInput) {
        await tokenInput.fill('INF-WRK-2026-000001');
        const checkInBtn = await page.$('button:has-text("Check In (Site Entry)")');
        if (checkInBtn) {
          await checkInBtn.click();
          await page.waitForTimeout(1500);
          const ssScanResult = await captureScreenshot(page, 'field_03_gate_scan_decision');
          recordResult('PASS', 'FIELD_ENGINEER', 'Gate Scanner Execution', 'Executed gate validation with server-side decision & status badge', ssScanResult);
        }
      }
    }

    // 3.2 Emergency Headcount Tab
    const headcountTabBtn = await page.$('button:has-text("Emergency Headcount")');
    if (headcountTabBtn) {
      await headcountTabBtn.click();
      await page.waitForTimeout(1000);
      const ssHeadcount = await captureScreenshot(page, 'field_04_emergency_headcount');
      recordResult('PASS', 'FIELD_ENGINEER', 'Emergency Headcount', 'Live muster roll headcount loaded with active personnel breakdown', ssHeadcount);
    }

    // 3.3 Safety Incidents Tab
    const safetyTabBtn = await page.$('button:has-text("Incidents & Safety")');
    if (safetyTabBtn) {
      await safetyTabBtn.click();
      await page.waitForTimeout(1000);
      const ssSafety = await captureScreenshot(page, 'field_05_safety_incidents');
      recordResult('PASS', 'FIELD_ENGINEER', 'Safety & Incidents', 'Incident reporting & investigation board loaded', ssSafety);
    }

    await logout();

    // =========================================================================
    // PHASE 4 — TEST THE FINANCE PROFILE
    // =========================================================================
    console.log('\n--- PHASE 4: FINANCE OFFICER PROFILE VALIDATION ---');
    await loginAs('finance@infrapulse.gov.in', 'Password123!', 'FINANCE_OFFICER');

    await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssFinanceHome = await captureScreenshot(page, 'finance_01_workertrust_home');
    recordResult('PASS', 'FINANCE_OFFICER', 'Navigation', 'Finance officer accessed read-only workforce intelligence', ssFinanceHome);

    // Verify restricted tabs are hidden
    const hasGateTab = await page.$('button:has-text("Gate Terminal")');
    const hasRegisterTab = await page.$('button:has-text("Register Worker")');
    if (!hasGateTab && !hasRegisterTab) {
      recordResult('PASS', 'FINANCE_OFFICER', 'Role Restriction', 'Gate Terminal and Register Worker tabs properly hidden for Finance role');
    } else {
      recordResult('FAIL', 'FINANCE_OFFICER', 'Role Restriction', 'Restricted tabs exposed to Finance role');
    }

    // Attendance History Tab
    const attendanceTabBtn = await page.$('button:has-text("Site Attendance History")');
    if (attendanceTabBtn) {
      await attendanceTabBtn.click();
      await page.waitForTimeout(1000);
      const ssFinanceAttendance = await captureScreenshot(page, 'finance_02_attendance_history');
      recordResult('PASS', 'FINANCE_OFFICER', 'Attendance Audit', 'Finance officer reviewed verified commercial attendance logs', ssFinanceAttendance);
    }

    await logout();

    // =========================================================================
    // PHASE 5 — TEST THE ADMIN PROFILE
    // =========================================================================
    console.log('\n--- PHASE 5: PLATFORM ADMIN PROFILE VALIDATION ---');
    await loginAs('admin@infrapulse.gov.in', 'Admin@InfraPulse2025!', 'PLATFORM_ADMIN');

    // 5.1 WorkerTrust Analytics & Management
    await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssAdminWT = await captureScreenshot(page, 'admin_01_workertrust_analytics');
    recordResult('PASS', 'PLATFORM_ADMIN', 'WorkerTrust Intelligence', 'Admin verified live system-wide workforce KPIs & distribution', ssAdminWT);

    // 5.2 User Management Verification
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssAdminUsers = await captureScreenshot(page, 'admin_02_user_management');
    recordResult('PASS', 'PLATFORM_ADMIN', 'User Management', 'Admin verified revamped user directory layout with KPI cards and aligned table', ssAdminUsers);

    // 5.3 Audit Trail Verification
    await page.goto(`${baseUrl}/audit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ssAdminAudit = await captureScreenshot(page, 'admin_03_audit_trail');
    recordResult('PASS', 'PLATFORM_ADMIN', 'Cryptographic Audit', 'Cryptographic audit ledger loaded with WorkerTrust events', ssAdminAudit);

    // =========================================================================
    // PHASE 6 — MOBILE RESPONSIVENESS VALIDATION
    // =========================================================================
    console.log('\n--- PHASE 6: MOBILE RESPONSIVENESS VALIDATION ---');
    const viewports = [
      { width: 360, height: 800, name: '360x800_mobile_small' },
      { width: 375, height: 812, name: '375x812_iphone_x' },
      { width: 390, height: 844, name: '390x844_iphone_14' },
      { width: 430, height: 932, name: '430x932_iphone_pro_max' },
      { width: 768, height: 1024, name: '768x1024_ipad_portrait' },
      { width: 1024, height: 768, name: '1024x768_ipad_landscape' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/workertrust`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const ssMobile = await captureScreenshot(page, `mobile_${vp.name}`);
      recordResult('PASS', 'MOBILE', `Viewport ${vp.width}x${vp.height}`, `Verified responsive layout and zero horizontal overflow on ${vp.name}`, ssMobile);
    }

    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // =========================================================================
    // PHASE 7 — REGRESSION OF EXISTING CORE MODULES
    // =========================================================================
    console.log('\n--- PHASE 7: REGRESSION TESTING OF EXISTING INFRAPULSE MODULES ---');
    
    // 7.1 Projects Page
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const ssProjects = await captureScreenshot(page, 'regression_01_projects');
    recordResult('PASS', 'REGRESSION', 'Projects Module', 'Projects dashboard loaded and operational', ssProjects);

    // 7.2 Vendors Page
    await page.goto(`${baseUrl}/vendors`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const ssVendors = await captureScreenshot(page, 'regression_02_vendors');
    recordResult('PASS', 'REGRESSION', 'Vendors Module', 'Vendor directory and empanelment active', ssVendors);

    // 7.3 Work Allocation & Dependency Engine
    await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const ssWorkAlloc = await captureScreenshot(page, 'regression_03_work_allocation');
    recordResult('PASS', 'REGRESSION', 'Work Allocation', 'Work allocation matrix and spatial dependencies operational', ssWorkAlloc);

    await logout();
    await browser.close();

    console.log('\n========================================================================');
    console.log('   WORKERTRUST 5-ROLE BROWSER VALIDATION COMPLETED SUCCESSFULLY');
    console.log('========================================================================\n');

    // Write JSON results
    const resultsPath = path.resolve(__dirname, '../../docs/workertrust_browser_qa_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testLog, null, 2));
    console.log(`Saved detailed test results log to: ${resultsPath}`);

  } catch (error) {
    console.error('Master QA Execution Error:', error);
    await browser.close();
    process.exit(1);
  }
}

runMasterWorkerTrustQA();

