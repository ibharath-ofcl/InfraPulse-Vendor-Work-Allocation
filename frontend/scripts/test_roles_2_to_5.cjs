const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');

async function testRoles() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:3000';

  // =========================================================================
  // ROLE 2: PROJECT MANAGER
  // =========================================================================
  console.log('--- TEST ROLE 2: PROJECT MANAGER ---');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'pm@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    console.log('PM landed on:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role2_pm_01_overview.png') });

    // PM navigates to projects
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const pmProjects = await page.locator('.shadow-card').count();
    console.log('PM projects count:', pmProjects);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role2_pm_02_projects.png') });

    // PM navigates to work allocation
    await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role2_pm_03_work_allocation.png') });
    console.log('PM work allocation loaded');

    // PM attempts unauthorized access to /users
    await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log('PM accessed /users URL redirected to:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role2_pm_04_users_blocked.png') });

    await page.close();
  }

  // =========================================================================
  // ROLE 3: VENDOR / CONTRACTOR
  // =========================================================================
  console.log('--- TEST ROLE 3: VENDOR / CONTRACTOR ---');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    console.log('Vendor landed on:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role3_vendor_01_my_work.png') });

    // Vendor visits Evidence center
    await page.goto(`${baseUrl}/evidence`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role3_vendor_02_evidence.png') });
    console.log('Vendor evidence center loaded');

    // Vendor visits Corrective Actions
    await page.goto(`${baseUrl}/my-corrective-actions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role3_vendor_03_corrective_actions.png') });
    console.log('Vendor my-corrective-actions loaded');

    // Vendor visits Milestones
    await page.goto(`${baseUrl}/milestones`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role3_vendor_04_milestones.png') });
    console.log('Vendor milestones loaded');

    // Vendor attempts unauthorized access to /users
    await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log('Vendor accessed /users URL redirected to:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role3_vendor_05_users_blocked.png') });

    await page.close();
  }

  // =========================================================================
  // ROLE 4: FIELD ENGINEER / QUALITY INSPECTOR
  // =========================================================================
  console.log('--- TEST ROLE 4: FIELD ENGINEER / QUALITY INSPECTOR ---');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'field@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    console.log('Field Engineer landed on:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role4_inspector_01_quality.png') });

    // Human Review Queue
    await page.goto(`${baseUrl}/human-review`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role4_inspector_02_human_review.png') });
    console.log('Human review queue loaded');

    // Corrective Actions
    await page.goto(`${baseUrl}/corrective-actions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role4_inspector_03_corrective_actions.png') });
    console.log('Field Engineer corrective actions loaded');

    await page.close();
  }

  // =========================================================================
  // ROLE 5: FINANCE / PAYMENT OFFICER
  // =========================================================================
  console.log('--- TEST ROLE 5: FINANCE / PAYMENT OFFICER ---');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'finance@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    console.log('Finance Officer landed on:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role5_finance_01_milestones.png') });

    // Finance Analytics
    await page.goto(`${baseUrl}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role5_finance_02_analytics.png') });
    console.log('Finance analytics loaded');

    // Finance Reports
    await page.goto(`${baseUrl}/reports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'role5_finance_03_reports.png') });
    console.log('Finance reports loaded');

    await page.close();
  }

  await browser.close();
  console.log('--- ALL ROLES 2-5 TESTS COMPLETE ---');
}

testRoles().catch(console.error);
