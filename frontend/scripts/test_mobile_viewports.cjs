const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');

async function testMobile() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:3000';
  const viewports = [
    { name: 'android_360x800', width: 360, height: 800, label: 'Android Standard' },
    { name: 'iphone_375x812', width: 375, height: 812, label: 'iPhone X/11/12 Mini' },
    { name: 'iphone_390x844', width: 390, height: 844, label: 'iPhone 12/13/14' },
    { name: 'iphone_430x932', width: 430, height: 932, label: 'iPhone 14/15 Pro Max' },
    { name: 'ipad_768x1024', width: 768, height: 1024, label: 'iPad Portrait' },
    { name: 'ipad_1024x768', width: 1024, height: 768, label: 'iPad Landscape' }
  ];

  console.log('--- STARTING MOBILE VIEWPORT TESTS (6 RESOLUTIONS) ---');

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.width < 768,
      hasTouch: true
    });

    // 1. Mobile Login
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const loginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[${vp.label} ${vp.width}x${vp.height}] Login Page Overflow:`, loginOverflow);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `mobile_${vp.name}_01_login.png`) });

    // 2. Mobile Login action (Vendor)
    await page.fill('input[type="email"]', 'vendor@infrapulse.gov.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const portalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[${vp.label} ${vp.width}x${vp.height}] Vendor Portal Overflow:`, portalOverflow);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `mobile_${vp.name}_02_vendor_work.png`) });

    // 3. Mobile Evidence Center
    await page.goto(`${baseUrl}/evidence`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const evidenceOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[${vp.label} ${vp.width}x${vp.height}] Evidence Page Overflow:`, evidenceOverflow);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `mobile_${vp.name}_03_evidence.png`) });

    // 4. Test Mobile Hamburger Menu if present (for < 1024px)
    if (vp.width < 1024) {
      const menuBtn = page.locator('button[aria-label="Open sidebar"], button:has(svg.lucide-menu)');
      if (await menuBtn.count() > 0) {
        await menuBtn.first().click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `mobile_${vp.name}_04_sidebar_opened.png`) });
        console.log(`[${vp.label}] Mobile sidebar opened successfully`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('--- ALL MOBILE VIEWPORT TESTS COMPLETE ---');
}

testMobile().catch(console.error);
