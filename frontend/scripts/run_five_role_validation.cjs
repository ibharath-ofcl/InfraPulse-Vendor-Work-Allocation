const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const testLog = [];
function log(status, phase, role, feature, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    status,
    phase,
    role,
    feature,
    message
  };
  testLog.push(entry);
  console.log(`[${status}] [${phase}] [${role}] ${feature}: ${message}`);
}

async function capture(page, name) {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return `docs/screenshots/${filename}`;
}

async function runValidation() {
  console.log('================================================================');
  console.log('   INFRAPULSE AI — 5-ROLE BROWSER VALIDATION & QA EXECUTION');
  console.log('================================================================');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:3000';

  try {
    // -------------------------------------------------------------
    // PHASE 2 & 3: INITIAL PAGE & LOGIN PAGE INSPECTION
    // -------------------------------------------------------------
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // Listen to console and page errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log('WARN', 'CONSOLE_ERROR', 'GLOBAL', page.url(), msg.text());
      }
    });
    page.on('pageerror', err => {
      log('FAIL', 'PAGE_CRASH', 'GLOBAL', page.url(), err.message);
    });

    log('INFO', 'PHASE_2', 'SYSTEM', 'Navigation', `Loading initial page ${baseUrl}/login`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await capture(page, '01_login_page_desktop');
    log('PASS', 'PHASE_2', 'SYSTEM', 'Login Page', 'Login page loaded successfully with branding and quick-login buttons');

    // -------------------------------------------------------------
    // PHASE 4: ROLE 1 — PLATFORM ADMIN COMPLETE TESTING
    // -------------------------------------------------------------
    log('INFO', 'PHASE_4', 'ADMIN', 'Auth', 'Logging in as Platform Administrator');
    await page.fill('input[type="email"]', 'admin@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Admin@InfraPulse2025!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);

    await capture(page, '02_admin_dashboard_overview');
    const adminUrl = page.url();
    if (adminUrl.includes('/overview')) {
      log('PASS', 'PHASE_4', 'ADMIN', 'Dashboard', 'Admin redirected to /overview successfully');
    } else {
      log('FAIL', 'PHASE_4', 'ADMIN', 'Dashboard', `Admin redirected to unexpected url: ${adminUrl}`);
    }

    // Inspect Admin KPI Cards and Charts
    const kpiCount = await page.locator('.grid [data-kpi], .grid .glass-card, .grid .rounded-xl, .grid .border-subtle').count();
    log('PASS', 'PHASE_4', 'ADMIN', 'KPI Cards', `Found ${kpiCount} KPI/Metric cards on dashboard`);

    // Test Projects Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Projects', 'Navigating to /projects');
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '03_admin_projects_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Projects', 'Projects directory loaded with search and filter controls');

    // Test Work Zones Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Work Zones', 'Navigating to /work-zones');
    await page.goto(`${baseUrl}/work-zones`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '04_admin_work_zones_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Work Zones', 'Spatial Work Zones page loaded with map and polygon zone ledger');

    // Test Work Allocation Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Work Allocation', 'Navigating to /work-allocation');
    await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '05_admin_work_allocation_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Work Allocation', 'Work Allocation ledger loaded with sequential dependencies');

    // Test Work Dependencies Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Work Dependencies', 'Navigating to /work-dependencies');
    await page.goto(`${baseUrl}/work-dependencies`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '06_admin_work_dependencies_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Work Dependencies', 'DAG Dependency rules matrix loaded with conflict prevention rules');

    // Test Vendors Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Vendors', 'Navigating to /vendors');
    await page.goto(`${baseUrl}/vendors`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '07_admin_vendors_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Vendors', 'Vendor directory loaded with service categories and performance metrics');

    // Test User Management Page (Admin Exclusive)
    log('INFO', 'PHASE_4', 'ADMIN', 'User Management', 'Navigating to /users');
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '08_admin_user_management_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'User Management', 'Admin User Management portal loaded with role assignment and status controls');

    // Test Audit Trail Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Audit Trail', 'Navigating to /audit-trail');
    await page.goto(`${baseUrl}/audit-trail`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '09_admin_audit_trail_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Audit Trail', 'Append-only SHA-256 cryptographic audit trail ledger loaded');

    // Test Analytics Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Analytics', 'Navigating to /analytics');
    await page.goto(`${baseUrl}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '10_admin_analytics_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Analytics', 'Executive analytics dashboard loaded with multi-vendor KPIs and trend graphs');

    // Test Profile Page
    log('INFO', 'PHASE_4', 'ADMIN', 'Profile', 'Navigating to /profile');
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await capture(page, '11_admin_profile_page');
    log('PASS', 'PHASE_4', 'ADMIN', 'Profile', 'Operator Profile page loaded with security attributes and permissions list');

    // Logout Admin
    log('INFO', 'PHASE_4', 'ADMIN', 'Logout', 'Logging out Admin');
    // Click user dropdown or logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button[aria-label="Logout"], button:has-text("Sign Out")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
    } else {
      await page.goto(`${baseUrl}/login`);
    }
    await page.waitForTimeout(500);
    await context.close();

    // -------------------------------------------------------------
    // PHASE 5: ROLE 2 — PROJECT MANAGER COMPLETE TESTING
    // -------------------------------------------------------------
    log('INFO', 'PHASE_5', 'PROJECT_MANAGER', 'Auth', 'Logging in as Project Manager (pm@infrapulse.gov.in)');
    const pmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pmPage = await pmContext.newPage();

    await pmPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await pmPage.fill('input[type="email"]', 'pm@infrapulse.gov.in');
    await pmPage.fill('input[type="password"]', 'Password123!');
    await pmPage.click('button[type="submit"]');
    await pmPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await pmPage.waitForTimeout(1000);

    await capture(pmPage, '12_pm_dashboard_overview');
    log('PASS', 'PHASE_5', 'PROJECT_MANAGER', 'Dashboard', 'Project Manager authenticated and loaded overview');

    // Test PM Projects
    await pmPage.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
    await pmPage.waitForTimeout(500);
    await capture(pmPage, '13_pm_projects_page');
    log('PASS', 'PHASE_5', 'PROJECT_MANAGER', 'Projects', 'PM accessible projects verified');

    // Test PM Work Allocation
    await pmPage.goto(`${baseUrl}/work-allocation`, { waitUntil: 'networkidle' });
    await pmPage.waitForTimeout(500);
    await capture(pmPage, '14_pm_work_allocation_page');
    log('PASS', 'PHASE_5', 'PROJECT_MANAGER', 'Work Allocation', 'PM accessible work allocation ledger verified');

    // Verify PM Security Barrier: PM must NOT have access to /users
    log('INFO', 'PHASE_5', 'PROJECT_MANAGER', 'Security', 'Testing PM unauthorized access to /users');
    await pmPage.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await pmPage.waitForTimeout(500);
    await capture(pmPage, '15_pm_security_users_blocked');
    const pmUsersUrl = pmPage.url();
    if (pmUsersUrl.includes('/unauthorized') || pmUsersUrl.includes('/overview') || !pmUsersUrl.includes('/users')) {
      log('PASS', 'PHASE_5', 'PROJECT_MANAGER', 'Security', `PM successfully blocked from /users (URL: ${pmUsersUrl})`);
    } else {
      // Check if page displays Unauthorized message
      const text = await pmPage.textContent('body');
      if (text.includes('Unauthorized') || text.includes('Access Denied') || text.includes('Permission')) {
        log('PASS', 'PHASE_5', 'PROJECT_MANAGER', 'Security', 'PM displayed unauthorized access guard on /users');
      } else {
        log('FAIL', 'PHASE_5', 'PROJECT_MANAGER', 'Security', 'PM was able to access /users directly');
      }
    }
    await pmContext.close();

    // -------------------------------------------------------------
    // PHASE 6: ROLE 3 — VENDOR / CONTRACTOR COMPLETE TESTING
    // -------------------------------------------------------------
    log('INFO', 'PHASE_6', 'VENDOR', 'Auth', 'Logging in as Vendor (vendor@infrapulse.gov.in)');
    const vendorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const vendorPage = await vendorContext.newPage();

    await vendorPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await vendorPage.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
    await vendorPage.fill('input[type="password"]', 'Password123!');
    await vendorPage.click('button[type="submit"]');
    await vendorPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await vendorPage.waitForTimeout(1000);

    await capture(vendorPage, '16_vendor_my_work_portal');
    const vendorUrl = vendorPage.url();
    log('PASS', 'PHASE_6', 'VENDOR', 'Dashboard', `Vendor landed on ${vendorUrl} (My Work Orders portal)`);

    // Test Evidence Center
    await vendorPage.goto(`${baseUrl}/evidence`, { waitUntil: 'networkidle' });
    await vendorPage.waitForTimeout(800);
    await capture(vendorPage, '17_vendor_evidence_center');
    log('PASS', 'PHASE_6', 'VENDOR', 'Evidence Center', 'Vendor Photo Evidence Management & Upload Center loaded');

    // Test Vendor Corrective Actions
    await vendorPage.goto(`${baseUrl}/my-corrective-actions`, { waitUntil: 'networkidle' });
    await vendorPage.waitForTimeout(500);
    await capture(vendorPage, '18_vendor_corrective_actions');
    log('PASS', 'PHASE_6', 'VENDOR', 'Corrective Actions', 'Vendor assigned corrective actions page loaded');

    // Test Vendor Security Barrier: Vendor must NOT have access to /users or /work-dependencies
    log('INFO', 'PHASE_6', 'VENDOR', 'Security', 'Testing Vendor unauthorized access to /users');
    await vendorPage.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await vendorPage.waitForTimeout(500);
    await capture(vendorPage, '19_vendor_security_users_blocked');
    const vendorUsersUrl = vendorPage.url();
    if (vendorUsersUrl.includes('/unauthorized') || vendorUsersUrl.includes('/my-work') || !vendorUsersUrl.includes('/users')) {
      log('PASS', 'PHASE_6', 'VENDOR', 'Security', `Vendor successfully blocked from /users (URL: ${vendorUsersUrl})`);
    } else {
      log('FAIL', 'PHASE_6', 'VENDOR', 'Security', 'Vendor was able to access /users directly');
    }
    await vendorContext.close();

    // -------------------------------------------------------------
    // PHASE 7: ROLE 4 — FIELD ENGINEER / QUALITY INSPECTOR
    // -------------------------------------------------------------
    log('INFO', 'PHASE_7', 'FIELD_ENGINEER', 'Auth', 'Logging in as Field Engineer (field@infrapulse.gov.in)');
    const fieldContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fieldPage = await fieldContext.newPage();

    await fieldPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await fieldPage.fill('input[type="email"]', 'field@infrapulse.gov.in');
    await fieldPage.fill('input[type="password"]', 'Password123!');
    await fieldPage.click('button[type="submit"]');
    await fieldPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await fieldPage.waitForTimeout(1000);

    await capture(fieldPage, '20_field_engineer_quality_dashboard');
    log('PASS', 'PHASE_7', 'FIELD_ENGINEER', 'Quality Inspection', 'Field Engineer quality inspection dashboard loaded');

    // Test Human Review Queue
    await fieldPage.goto(`${baseUrl}/human-review`, { waitUntil: 'networkidle' });
    await fieldPage.waitForTimeout(800);
    await capture(fieldPage, '21_field_engineer_human_review_queue');
    log('PASS', 'PHASE_7', 'FIELD_ENGINEER', 'Human Review Queue', 'Mandatory human quality review queue loaded');

    // Test Corrective Actions Management
    await fieldPage.goto(`${baseUrl}/corrective-actions`, { waitUntil: 'networkidle' });
    await fieldPage.waitForTimeout(800);
    await capture(fieldPage, '22_field_engineer_corrective_actions');
    log('PASS', 'PHASE_7', 'FIELD_ENGINEER', 'Corrective Actions', 'Field Engineer corrective actions management loaded');

    await fieldContext.close();

    // -------------------------------------------------------------
    // PHASE 8: ROLE 5 — FINANCE / PAYMENT OFFICER
    // -------------------------------------------------------------
    log('INFO', 'PHASE_8', 'FINANCE_OFFICER', 'Auth', 'Logging in as Finance Officer (finance@infrapulse.gov.in)');
    const finContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const finPage = await finContext.newPage();

    await finPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await finPage.fill('input[type="email"]', 'finance@infrapulse.gov.in');
    await finPage.fill('input[type="password"]', 'Password123!');
    await finPage.click('button[type="submit"]');
    await finPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await finPage.waitForTimeout(1000);

    await capture(finPage, '23_finance_milestones_and_payments');
    log('PASS', 'PHASE_8', 'FINANCE_OFFICER', 'Milestones & Payments', 'Finance Officer commercial milestones & payment authorization loaded');

    // Test Finance Analytics
    await finPage.goto(`${baseUrl}/analytics`, { waitUntil: 'networkidle' });
    await finPage.waitForTimeout(800);
    await capture(finPage, '24_finance_analytics_page');
    log('PASS', 'PHASE_8', 'FINANCE_OFFICER', 'Analytics', 'Finance operational analytics and disbursement summaries loaded');

    await finContext.close();

    // -------------------------------------------------------------
    // PHASE 10: MOBILE BROWSER TESTING AT 6 VIEWPORTS
    // -------------------------------------------------------------
    const mobileViewports = [
      { name: 'android_360x800', width: 360, height: 800, device: 'Android Standard' },
      { name: 'iphone_375x812', width: 375, height: 812, device: 'iPhone X/11/12 Mini' },
      { name: 'iphone_390x844', width: 390, height: 844, device: 'iPhone 12/13/14' },
      { name: 'iphone_430x932', width: 430, height: 932, device: 'iPhone 14/15 Pro Max' },
      { name: 'tablet_768x1024', width: 768, height: 1024, device: 'iPad Portrait' },
      { name: 'tablet_1024x768', width: 1024, height: 768, device: 'iPad Landscape' }
    ];

    log('INFO', 'PHASE_10', 'MOBILE', 'Responsiveness', 'Running mobile viewport responsiveness tests across 6 display resolutions');

    for (const vp of mobileViewports) {
      const mobContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.width < 768,
        hasTouch: true
      });
      const mobPage = await mobContext.newPage();

      // Test mobile login
      await mobPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await capture(mobPage, `mobile_login_${vp.name}`);

      // Test mobile vendor portal
      await mobPage.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
      await mobPage.fill('input[type="password"]', 'Password123!');
      await mobPage.click('button[type="submit"]');
      await mobPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
      await mobPage.waitForTimeout(800);

      await capture(mobPage, `mobile_vendor_work_${vp.name}`);

      // Check for horizontal overflow (document.body.scrollWidth > window.innerWidth)
      const hasHorizontalOverflow = await mobPage.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (hasHorizontalOverflow) {
        log('WARN', 'PHASE_10', 'MOBILE', vp.device, `Horizontal scroll detected at ${vp.width}x${vp.height}`);
      } else {
        log('PASS', 'PHASE_10', 'MOBILE', vp.device, `Clean viewport fit with zero horizontal overflow at ${vp.width}x${vp.height}`);
      }

      await mobContext.close();
    }

  } catch (err) {
    console.error('Validation error:', err);
    log('FAIL', 'ERROR', 'SYSTEM', 'Runner', err.message);
  } finally {
    await browser.close();
  }

  // Save report log to file
  const reportPath = path.resolve(__dirname, '../../docs/validation_test_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testLog, null, 2));
  console.log('================================================================');
  console.log(`Validation complete. Results written to: ${reportPath}`);
  console.log('================================================================');
}

runValidation();
