const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');

async function testAdmin() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const baseUrl = 'http://localhost:3000';

  console.log('--- ADMIN TEST START ---');

  // 1. Login
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'admin@infrapulse.gov.in');
  await page.fill('input[type="password"]', 'Admin@InfraPulse2025!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log('Admin landed on:', page.url());
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_01_overview.png') });

  // 2. Check Overview Metric Cards
  const metricValues = await page.locator('h2.text-2xl, h2.sm\\:text-3xl').allTextContents();
  console.log('Overview Metric Values:', metricValues);

  // 3. Projects Page & Open Create Project Modal
  await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_02_projects.png') });

  const projectCardsCount = await page.locator('.shadow-card').count();
  console.log('Projects rendered:', projectCardsCount);

  // Click "New Project" button
  const newProjectBtn = page.locator('button:has-text("New Project"), button:has-text("Create Project"), button:has-text("Add Project")');
  if (await newProjectBtn.count() > 0) {
    console.log('Found New Project button, clicking...');
    await newProjectBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_03_create_project_modal.png') });
    console.log('Modal visible:', await page.locator('.fixed.inset-0, [role="dialog"]').isVisible());
    
    // Close modal
    const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]');
    if (await closeBtn.count() > 0) await closeBtn.first().click();
    await page.waitForTimeout(300);
  }

  // 4. Work Zones Page
  await page.goto(`${baseUrl}/work-zones`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_04_work_zones.png') });
  console.log('Work Zones loaded, title:', await page.title());

  // 5. Work Allocation Page
  await page.goto(`${baseUrl}/work-allocation`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_05_work_allocation.png') });
  console.log('Work Allocation loaded');

  // 6. Work Dependencies Page
  await page.goto(`${baseUrl}/work-dependencies`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_06_work_dependencies.png') });
  console.log('Work Dependencies loaded');

  // 7. Vendors Page
  await page.goto(`${baseUrl}/vendors`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_07_vendors.png') });
  console.log('Vendors loaded');

  // 8. User Management Page
  await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_08_users.png') });
  const usersCount = await page.locator('table tbody tr').count();
  console.log('Users rendered in table:', usersCount);

  // 9. Audit Trail Page & Verify Integrity
  await page.goto(`${baseUrl}/audit-trail`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_09_audit_trail.png') });
  
  const verifyBtn = page.locator('button:has-text("Verify Integrity"), button:has-text("Verify Chain")');
  if (await verifyBtn.count() > 0) {
    console.log('Found Verify Integrity button, clicking...');
    await verifyBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_10_audit_verified.png') });
  }

  // 10. Analytics Page
  await page.goto(`${baseUrl}/analytics`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_11_analytics.png') });
  console.log('Analytics loaded');

  // 11. Profile Page
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_12_profile.png') });
  console.log('Profile loaded');

  await browser.close();
  console.log('--- ADMIN TEST COMPLETE ---');
}

testAdmin().catch(console.error);
