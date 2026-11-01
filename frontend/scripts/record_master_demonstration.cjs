const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE_URL = 'http://127.0.0.1:3000';
const DEMO_DIR = path.resolve(__dirname, '../../artifacts/demo');
const RAW_VIDEO_DIR = path.join(DEMO_DIR, 'raw_video');

if (!fs.existsSync(DEMO_DIR)) fs.mkdirSync(DEMO_DIR, { recursive: true });
if (!fs.existsSync(RAW_VIDEO_DIR)) fs.mkdirSync(RAW_VIDEO_DIR, { recursive: true });

async function smoothScroll(page, distance, steps = 12, delay = 80) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, distance / steps);
    await page.waitForTimeout(delay);
  }
}

async function loginAs(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  
  // Fill credentials cleanly
  await page.fill('input[type="email"]', email);
  await page.waitForTimeout(300);
  await page.fill('input[type="password"]', password);
  await page.waitForTimeout(400);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
}

async function logout(page) {
  // Clear auth token and return to login
  await page.evaluate(() => {
    localStorage.removeItem('infrapulse_auth_token');
    localStorage.removeItem('infrapulse_user');
  });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
}

async function runMasterRecording() {
  console.log('================================================================');
  console.log('   INFRAPULSE AI — MASTER FULL-HD DEMO SCREEN RECORDING        ');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  try {
    // =========================================================================
    // PART 1 — LANDING PAGE & INTRODUCTION
    // =========================================================================
    console.log('[RECORDING] Part 1: Landing Page Showcase');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Smooth showcase of the landing page
    await smoothScroll(page, 450);
    await page.waitForTimeout(1200);
    await smoothScroll(page, 550);
    await page.waitForTimeout(1500);
    await smoothScroll(page, 650);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -1650, 15, 60);
    await page.waitForTimeout(1000);

    // Click CTA to login
    const loginCta = page.locator('a[href="/login"], button:has-text("Sign In"), button:has-text("Command Portal")').first();
    if (await loginCta.count() > 0) {
      await loginCta.click();
      await page.waitForTimeout(1200);
    } else {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    }

    // =========================================================================
    // PART 2 — AUTHENTICATION & FIVE USER ROLES
    // =========================================================================
    console.log('[RECORDING] Part 2: Authentication & Five Roles Overview');
    await page.waitForTimeout(1500);

    // =========================================================================
    // PART 3 — ADMIN DASHBOARD & GOVERNANCE
    // =========================================================================
    console.log('[RECORDING] Part 3: Platform Admin Dashboard');
    await loginAs(page, 'admin@infrapulse.gov.in', 'Admin@InfraPulse2025!');
    await page.waitForTimeout(2000);

    // Overview Page
    await smoothScroll(page, 400);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -400);
    await page.waitForTimeout(1000);

    // Projects Page
    console.log('[RECORDING] Admin: Projects Directory');
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await smoothScroll(page, 300);
    await page.waitForTimeout(1000);

    // Work Zones
    console.log('[RECORDING] Admin: Geospatial Work Zones');
    await page.goto(`${BASE_URL}/work-zones`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Work Allocation & Dependencies
    console.log('[RECORDING] Admin: Work Allocation & DAG Dependencies');
    await page.goto(`${BASE_URL}/work-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(`${BASE_URL}/work-dependencies`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // User Management
    console.log('[RECORDING] Admin: User RBAC Directory');
    await page.goto(`${BASE_URL}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Cryptographic Audit Trail
    console.log('[RECORDING] Admin: Cryptographic Audit Trail Verification');
    await page.goto(`${BASE_URL}/audit-trail`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const verifyBtn = page.locator('button:has-text("Verify Integrity"), button:has-text("Verify Ledger")').first();
    if (await verifyBtn.count() > 0) {
      await verifyBtn.click();
      await page.waitForTimeout(2000);
    }

    // Analytics Hub
    console.log('[RECORDING] Admin: Analytics & Vendor Scorecards');
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await smoothScroll(page, 400);
    await page.waitForTimeout(1500);

    // =========================================================================
    // PART 4 — PROJECT MANAGER WORKFLOW & DAG CONFLICT BLOCK
    // =========================================================================
    console.log('[RECORDING] Part 4: Project Manager & DAG Dependency Conflict');
    await logout(page);
    await loginAs(page, 'pm@infrapulse.gov.in', 'Password123!');
    await page.waitForTimeout(2000);

    // Navigate to Work Dependencies & Allocation
    await page.goto(`${BASE_URL}/work-dependencies`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Highlight sequential dependency blocking
    await smoothScroll(page, 350);
    await page.waitForTimeout(2000);
    await smoothScroll(page, -350);
    await page.waitForTimeout(1000);

    // =========================================================================
    // PART 5 — VENDOR DASHBOARD & WORK EXECUTION
    // =========================================================================
    console.log('[RECORDING] Part 5: Vendor Contractor Portal');
    await logout(page);
    await loginAs(page, 'vendor@infrapulse.gov.in', 'Password123!');
    await page.waitForTimeout(2000);

    // My Work Orders
    await page.goto(`${BASE_URL}/my-work`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Evidence Center
    console.log('[RECORDING] Vendor: Photo Evidence Submission');
    await page.goto(`${BASE_URL}/evidence`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await smoothScroll(page, 300);
    await page.waitForTimeout(1500);

    // =========================================================================
    // PART 6 & 7 — FIELD ENGINEER & AI QUALITY INSPECTION
    // =========================================================================
    console.log('[RECORDING] Part 6 & 7: Field Quality Inspector & AI Computer Vision');
    await logout(page);
    await loginAs(page, 'field@infrapulse.gov.in', 'Password123!');
    await page.waitForTimeout(2000);

    // Quality Inspection
    await page.goto(`${BASE_URL}/quality-inspection`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Human Review Queue
    await page.goto(`${BASE_URL}/human-review`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await smoothScroll(page, 300);
    await page.waitForTimeout(1500);

    // =========================================================================
    // PART 8 — WORKERTRUST WORKFORCE MODULE
    // =========================================================================
    console.log('[RECORDING] Part 8: WorkerTrust Workforce Safety & Verification');
    await page.goto(`${BASE_URL}/workertrust`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await smoothScroll(page, 450);
    await page.waitForTimeout(2000);
    await smoothScroll(page, -450);
    await page.waitForTimeout(1000);

    // =========================================================================
    // PART 9 — INTELLIGENCE SUITE
    // =========================================================================
    console.log('[RECORDING] Part 9: InfraPulse Intelligence Suite');
    await page.goto(`${BASE_URL}/intelligence`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Defect Intelligence & Predictive Risk Tabs
    const tabs = page.locator('button[role="tab"], button:has-text("Defect"), button:has-text("Risk"), button:has-text("Contract")');
    const tabCount = await tabs.count();
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1500);
    }

    // =========================================================================
    // PART 10 — FINANCE / PAYMENT OFFICER
    // =========================================================================
    console.log('[RECORDING] Part 10: Finance Officer & Milestone Authorization');
    await logout(page);
    await loginAs(page, 'finance@infrapulse.gov.in', 'Password123!');
    await page.waitForTimeout(2000);

    // Milestones & Payments
    await page.goto(`${BASE_URL}/milestones`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await smoothScroll(page, 400);
    await page.waitForTimeout(2000);

    // =========================================================================
    // PART 11 — RE-INSPECT AUDIT TRAIL
    // =========================================================================
    console.log('[RECORDING] Part 11: Final Tamper-Evident Audit Ledger');
    await page.goto(`${BASE_URL}/audit-trail`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // =========================================================================
    // PART 12 — RESPONSIVE WEBSITE DEMONSTRATION
    // =========================================================================
    console.log('[RECORDING] Part 12: Multi-Device Responsive Viewports');
    
    // Laptop: 1366 x 768
    console.log('   -> Testing Laptop (1366x768)');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`${BASE_URL}/overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await smoothScroll(page, 300);
    await page.waitForTimeout(1000);

    // Tablet: 768 x 1024
    console.log('   -> Testing Tablet (768x1024)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await smoothScroll(page, 300);
    await page.waitForTimeout(1000);

    // Mobile: 390 x 844
    console.log('   -> Testing Mobile (390x844)');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await smoothScroll(page, 400);
    await page.waitForTimeout(1500);

    // Mobile Landing Page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await smoothScroll(page, 500);
    await page.waitForTimeout(1500);

    // =========================================================================
    // PART 13 — FINAL CONCLUSION
    // =========================================================================
    console.log('[RECORDING] Part 13: Final Conclusion');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    console.log('[RECORDING] Demonstration complete! Closing page and context...');
    await page.close();
    await context.close();
    await browser.close();

    console.log('[RECORDING] Browser session closed. Locating recorded raw video...');
    const rawFiles = fs.readdirSync(RAW_VIDEO_DIR).filter(f => f.endsWith('.webm'));
    if (rawFiles.length === 0) {
      throw new Error('No .webm raw video file was captured by Playwright!');
    }

    const latestWebm = path.join(RAW_VIDEO_DIR, rawFiles[rawFiles.length - 1]);
    const finalMp4 = path.join(DEMO_DIR, 'InfraPulse_AI_Complete_Demo.mp4');

    console.log(`[ENCODING] Found raw video: ${latestWebm}`);
    console.log(`[ENCODING] Transcoding to Full HD 1080p MP4: ${finalMp4}`);

    const ffmpegPath = path.resolve(
      process.env.LOCALAPPDATA,
      'ms-playwright/ffmpeg-1013/ffmpeg-win64.exe'
    );

    if (fs.existsSync(ffmpegPath)) {
      const ffmpegCmd = `"${ffmpegPath}" -y -i "${latestWebm}" -c:v libx264 -pix_fmt yuv420p -r 30 -preset fast -crf 23 "${finalMp4}"`;
      console.log(`[ENCODING] Executing: ${ffmpegCmd}`);
      execSync(ffmpegCmd, { stdio: 'inherit' });
      console.log('✅ Final MP4 video successfully created and verified!');
    } else {
      console.log(`[WARN] Playwright FFmpeg not found at ${ffmpegPath}, copying raw video to ${finalMp4}.webm`);
      fs.copyFileSync(latestWebm, finalMp4.replace('.mp4', '.webm'));
    }

    console.log('================================================================');
    console.log('   DEMONSTRATION RECORDING SUCCESSFULLY DELIVERED!              ');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ Error during master demonstration recording:', err);
    process.exit(1);
  }
}

runMasterRecording();
