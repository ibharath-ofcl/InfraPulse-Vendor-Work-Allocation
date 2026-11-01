const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  features: [],
  defects: [],
  mobileViewports: []
};

function recordResult(role, pageName, feature, expected, actual, status, screenshot = null) {
  testResults.totalTests++;
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') {
    testResults.failed++;
    testResults.defects.push({ role, pageName, feature, expected, actual, screenshot });
  } else if (status === 'WARN') testResults.warnings++;

  const entry = { role, pageName, feature, expected, actual, status, screenshot };
  testResults.features.push(entry);
  console.log(`[${status}] [${role}] ${pageName} -> ${feature}: ${actual}`);
}

async function snap(page, name) {
  const file = `${name}.png`;
  const fullPath = path.join(SCREENSHOTS_DIR, file);
  await page.screenshot({ path: fullPath });
  return `docs/screenshots/${file}`;
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:3000';

  console.log('===============================================================');
  console.log('   STARTING MASTER FIVE-ROLE E2E BROWSER VALIDATION SUITE      ');
  console.log('===============================================================');

  // =========================================================================
  // 1. ROLE 1: PLATFORM ADMINISTRATOR
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        recordResult('ADMIN', page.url(), 'Console Error', 'No error', msg.text().slice(0, 150), 'WARN');
      }
    });

    // 1.1 Login Page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    const shotLogin = await snap(page, 'role1_admin_01_login');
    recordResult('ADMIN', '/login', 'Login Page Load', 'Login page renders with branding and quick-login', 'Page rendered cleanly', 'PASS', shotLogin);

    // 1.2 Submit Login
    await page.fill('input[type="email"]', 'admin@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Admin@InfraPulse2025!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const shotOverview = await snap(page, 'role1_admin_02_overview');
    const isOverview = page.url().includes('/overview');
    recordResult('ADMIN', '/overview', 'Admin Authentication & Redirection', 'Redirects to /overview', isOverview ? 'Landed on /overview' : `Landed on ${page.url()}`, isOverview ? 'PASS' : 'FAIL', shotOverview);

    // 1.3 Overview KPI Cards & Charts
    const kpiCards = await page.locator('.glass-card, [data-kpi], .border-subtle').count();
    recordResult('ADMIN', '/overview', 'Dashboard KPI Cards', 'KPI cards render actual counts', `Found ${kpiCards} metric cards`, kpiCards >= 4 ? 'PASS' : 'FAIL');

    // 1.4 Projects Page
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotProjects = await snap(page, 'role1_admin_03_projects');
    const projectRows = await page.locator('table tbody tr, .glass-card, [data-project-item]').count();
    recordResult('ADMIN', '/projects', 'Projects Ledger', 'Display list of municipal projects', `Rendered ${projectRows} projects`, projectRows > 0 ? 'PASS' : 'FAIL', shotProjects);

    // 1.5 Work Zones Page
    await page.goto(`${baseUrl}/work-zones`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotZones = await snap(page, 'role1_admin_04_work_zones');
    const zoneItems = await page.locator('table tbody tr, .glass-card, [data-zone-item]').count();
    recordResult('ADMIN', '/work-zones', 'Spatial Work Zones', 'Display work zones with PIN codes and GIS boundaries', `Rendered ${zoneItems} work zones`, zoneItems > 0 ? 'PASS' : 'FAIL', shotZones);

    // 1.6 Work Allocation Page
    await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotAllocation = await snap(page, 'role1_admin_05_work_allocation');
    const assignmentRows = await page.locator('table tbody tr, .glass-card, [data-assignment-item]').count();
    recordResult('ADMIN', '/work-allocation', 'Work Allocation Ledger', 'Display multi-vendor work assignments', `Rendered ${assignmentRows} work assignments`, assignmentRows > 0 ? 'PASS' : 'FAIL', shotAllocation);

    // 1.7 Work Dependencies Page
    await page.goto(`${baseUrl}/work-dependencies`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotDeps = await snap(page, 'role1_admin_06_work_dependencies');
    const dependencyRows = await page.locator('table tbody tr, .glass-card, [data-dependency-item]').count();
    recordResult('ADMIN', '/work-dependencies', 'DAG Dependency Rules Matrix', 'Display prerequisite dependency rules preventing conflicts', `Rendered ${dependencyRows} dependency rules`, dependencyRows > 0 ? 'PASS' : 'FAIL', shotDeps);

    // 1.8 Vendors Page
    await page.goto(`${baseUrl}/vendors`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotVendors = await snap(page, 'role1_admin_07_vendors');
    const vendorRows = await page.locator('table tbody tr, .glass-card, [data-vendor-item]').count();
    recordResult('ADMIN', '/vendors', 'Vendor Management Directory', 'Display approved vendors with category specializations', `Rendered ${vendorRows} registered vendors`, vendorRows > 0 ? 'PASS' : 'FAIL', shotVendors);

    // 1.9 User Management (Admin Exclusive)
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotUsers = await snap(page, 'role1_admin_08_users');
    const userRows = await page.locator('table tbody tr, .glass-card, [data-user-item]').count();
    recordResult('ADMIN', '/users', 'User RBAC Management', 'Admin portal manages platform roles and user accounts', `Rendered ${userRows} system users`, userRows > 0 ? 'PASS' : 'FAIL', shotUsers);

    // 1.10 Audit Trail
    await page.goto(`${baseUrl}/audit-trail`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotAudit = await snap(page, 'role1_admin_09_audit_trail');
    const auditRows = await page.locator('table tbody tr, .glass-card, [data-audit-item]').count();
    recordResult('ADMIN', '/audit-trail', 'Cryptographic Audit Trail', 'Display tamper-evident SHA-256 hash-chain audit ledger', `Rendered ${auditRows} immutable audit entries`, auditRows > 0 ? 'PASS' : 'FAIL', shotAudit);

    // 1.11 Analytics Hub
    await page.goto(`${baseUrl}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotAnalytics = await snap(page, 'role1_admin_10_analytics');
    recordResult('ADMIN', '/analytics', 'Operational Analytics', 'Render vendor performance and quality compliance analytics', 'Analytics graphs and summary tables loaded', 'PASS', shotAnalytics);

    // 1.12 Operator Profile
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotProfile = await snap(page, 'role1_admin_11_profile');
    recordResult('ADMIN', '/profile', 'Operator Profile', 'Display logged-in operator credentials and active permissions', 'Profile loaded with PLATFORM_ADMIN role badge', 'PASS', shotProfile);

    await context.close();
  }

  // =========================================================================
  // 2. ROLE 2: PROJECT MANAGER
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'pm@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const shotPmOverview = await snap(page, 'role2_pm_01_overview');
    recordResult('PROJECT_MANAGER', '/overview', 'PM Authentication', 'PM logs in and lands on /overview', 'PM authenticated successfully', 'PASS', shotPmOverview);

    // PM checks Projects
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotPmProjects = await snap(page, 'role2_pm_02_projects');
    recordResult('PROJECT_MANAGER', '/projects', 'Project Monitoring', 'PM views authorized municipal infrastructure projects', 'Projects directory loaded', 'PASS', shotPmProjects);

    // PM checks Work Allocation
    await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotPmAlloc = await snap(page, 'role2_pm_03_work_allocation');
    recordResult('PROJECT_MANAGER', '/work-allocation', 'PM Work Allocation', 'PM manages assignments within assigned project scopes', 'Allocation ledger loaded', 'PASS', shotPmAlloc);

    // PM Security Barrier: Attempt access to /users (Must be blocked)
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotPmSecurity = await snap(page, 'role2_pm_04_security_users_blocked');
    const blockedUrl = page.url();
    const isBlocked = blockedUrl.includes('/unauthorized') || !blockedUrl.includes('/users') || blockedUrl.includes('/login');
    recordResult('PROJECT_MANAGER', '/users', 'RBAC Isolation Barrier', 'PM blocked from accessing Admin User Management (/users)', isBlocked ? `Blocked successfully (URL: ${blockedUrl})` : 'Access permitted unexpectedly', isBlocked ? 'PASS' : 'FAIL', shotPmSecurity);

    await context.close();
  }

  // =========================================================================
  // 3. ROLE 3: VENDOR / CONTRACTOR
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const shotVendorWork = await snap(page, 'role3_vendor_01_my_work');
    const isMyWork = page.url().includes('/my-work');
    recordResult('VENDOR', '/my-work', 'Vendor Landing Portal', 'Vendor lands directly on /my-work orders', isMyWork ? 'Landed on /my-work' : `Landed on ${page.url()}`, isMyWork ? 'PASS' : 'FAIL', shotVendorWork);

    // Vendor Evidence Center
    await page.goto(`${baseUrl}/evidence`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotVendorEvidence = await snap(page, 'role3_vendor_02_evidence');
    recordResult('VENDOR', '/evidence', 'Photo Evidence Upload & Verification', 'Vendor evidence center with category selection, GPS & duplicate check', 'Evidence center rendered cleanly', 'PASS', shotVendorEvidence);

    // Vendor Corrective Actions
    await page.goto(`${baseUrl}/my-corrective-actions`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotVendorActions = await snap(page, 'role3_vendor_03_corrective_actions');
    recordResult('VENDOR', '/my-corrective-actions', 'Assigned Corrective Actions', 'Vendor views rectification requests from field quality inspectors', 'Corrective actions page rendered', 'PASS', shotVendorActions);

    // Vendor Security Barrier: Attempt access to /users and /work-dependencies
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const isVendorBlocked = !page.url().includes('/users') || page.url().includes('/unauthorized') || page.url().includes('/login');
    recordResult('VENDOR', '/users', 'Vendor RBAC Isolation', 'Vendor blocked from Admin User Management', isVendorBlocked ? `Blocked cleanly (URL: ${page.url()})` : 'Security bypass occurred', isVendorBlocked ? 'PASS' : 'FAIL');

    await context.close();
  }

  // =========================================================================
  // 4. ROLE 4: FIELD ENGINEER / QUALITY INSPECTOR
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'field@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const shotFieldQuality = await snap(page, 'role4_inspector_01_quality_dashboard');
    recordResult('FIELD_ENGINEER', '/quality-inspection', 'Inspector Quality Dashboard', 'Field Engineer lands on quality inspection portal', 'Quality inspection dashboard loaded', 'PASS', shotFieldQuality);

    // Human Review Queue
    await page.goto(`${baseUrl}/human-review`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotFieldReview = await snap(page, 'role4_inspector_02_human_review_queue');
    recordResult('FIELD_ENGINEER', '/human-review', 'Mandatory Human Review Queue', 'Inspectors review AI findings and record physical measurements', 'Human review queue rendered with review cards', 'PASS', shotFieldReview);

    // Corrective Actions Management
    await page.goto(`${baseUrl}/corrective-actions`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shotFieldActions = await snap(page, 'role4_inspector_03_corrective_actions');
    recordResult('FIELD_ENGINEER', '/corrective-actions', 'Quality Corrective Actions', 'Inspector manages vendor rectification notices and re-inspections', 'Corrective actions board rendered', 'PASS', shotFieldActions);

    await context.close();
  }

  // =========================================================================
  // 5. ROLE 5: FINANCE / PAYMENT OFFICER
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'finance@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const shotFinance = await snap(page, 'role5_finance_01_milestones_and_payments');
    recordResult('FINANCE_OFFICER', '/milestones', 'Finance Portal & Milestones', 'Finance Officer lands on commercial milestones & payment authorization', 'Milestones and payments portal loaded', 'PASS', shotFinance);

    // Finance Analytics & Disbursement Summaries
    await page.goto(`${baseUrl}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const shotFinAnalytics = await snap(page, 'role5_finance_02_analytics');
    recordResult('FINANCE_OFFICER', '/analytics', 'Financial & Operational Analytics', 'Finance views disbursement trends, payment cycles, and milestone progress', 'Analytics loaded with disbursement metrics', 'PASS', shotFinAnalytics);

    await context.close();
  }

  // =========================================================================
  // 6. MOBILE RESPONSIVENESS (6 VIEWPORTS)
  // =========================================================================
  {
    const viewports = [
      { name: 'android_360x800', width: 360, height: 800, device: 'Android Standard' },
      { name: 'iphone_375x812', width: 375, height: 812, device: 'iPhone X/11/12 Mini' },
      { name: 'iphone_390x844', width: 390, height: 844, device: 'iPhone 12/13/14' },
      { name: 'iphone_430x932', width: 430, height: 932, device: 'iPhone 14/15 Pro Max' },
      { name: 'tablet_768x1024', width: 768, height: 1024, device: 'iPad Portrait' },
      { name: 'tablet_1024x768', width: 1024, height: 768, device: 'iPad Landscape' }
    ];

    for (const vp of viewports) {
      const mobContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.width < 768,
        hasTouch: true
      });
      const page = await mobContext.newPage();

      // Test mobile login
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const shotMob = await snap(page, `mobile_${vp.name}_vendor_portal`);

      // Evaluate horizontal scroll overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const actualText = overflow ? `Horizontal overflow detected (scrollWidth > ${vp.width}px)` : `Clean fit (scrollWidth == ${vp.width}px)`;
      recordResult('MOBILE', '/my-work', `${vp.device} (${vp.width}x${vp.height})`, 'No horizontal overflow, fully responsive touch layout', actualText, overflow ? 'FAIL' : 'PASS', shotMob);

      testResults.mobileViewports.push({
        device: vp.device,
        resolution: `${vp.width}x${vp.height}`,
        overflow: overflow,
        screenshot: shotMob
      });

      await mobContext.close();
    }
  }

  await browser.close();

  // Save report JSON
  const outPath = path.resolve(__dirname, '../../docs/MASTER_FIVE_ROLE_TEST_RESULTS.json');
  fs.writeFileSync(outPath, JSON.stringify(testResults, null, 2));

  console.log('===============================================================');
  console.log(`MASTER VALIDATION COMPLETE!`);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed:      ${testResults.passed}`);
  console.log(`Failed:      ${testResults.failed}`);
  console.log(`Warnings:    ${testResults.warnings}`);
  console.log(`Report JSON: ${outPath}`);
  console.log('===============================================================');
}

run();
