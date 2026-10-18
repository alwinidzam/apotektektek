const { chromium } = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');

async function capture() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  const outPathArtifact = path.join(artifactDir, 'pos_screenshot_landscape.png');
  const outPathPublic = path.join(__dirname, '..', 'public', 'pos_screenshot_landscape.png');

  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1200 x 900 (exact 4:3 landscape ratio) with 2x Retina sharpness
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  console.log('Authenticating...');
  await page.fill('input[type="text"]', 'alwinizam');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  console.log('Waiting for POS dashboard...');
  await page.waitForURL('http://localhost:3000/**', { timeout: 15000 });

  // Wait 4.5 seconds for toast to fade away completely
  await page.waitForTimeout(4500);

  // Add sample items to cart
  console.log('Populating cart with sample items...');
  const pcm = await page.$$('text=Paracetamol 500 mg');
  if (pcm.length > 0) {
    await pcm[0].click();
    await page.waitForTimeout(300);
  }
  const amox = await page.$$('text=Amoxicillin 500 mg');
  if (amox.length > 0) {
    await amox[0].click();
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(1000);

  const metrics = await page.evaluate(() => {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    };
  });
  console.log('Metrics at 1200x900:', metrics);

  console.log('Capturing screenshot...');
  await page.screenshot({ path: outPathArtifact, fullPage: false });
  await page.screenshot({ path: outPathPublic, fullPage: false });

  console.log('✓ Successfully saved screenshot to:', outPathArtifact);
  console.log('✓ Public copy saved to:', outPathPublic);

  await browser.close();
}

capture().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
