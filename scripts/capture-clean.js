const { chromium } = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');

async function main() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  const outPathArtifact = path.join(artifactDir, 'pos_screenshot_landscape.png');
  const outPathPublic = path.join(__dirname, '..', 'public', 'pos_screenshot_landscape.png');

  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 4:3 Landscape:
  // e.g. 1440 x 1080 (4:3), 1360 x 1020, 1400 x 1050
  // Let's create context with 1400 x 1050 (exact 4:3 ratio: 1400/1050 = 4/3 = 1.333...)
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1050 },
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

  // Wait 4.5s for toast notification to fade away
  await page.waitForTimeout(4500);

  // Add 2 items to cart: Paracetamol 500 mg and Amoxicillin 500 mg
  console.log('Adding items to cart...');
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

  // Check scrollHeight and bounding box of checkout elements
  const metrics = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bayarBtn = buttons.find(b => b.textContent && b.textContent.includes('Bayar'));
    const bayarRect = bayarBtn ? bayarBtn.getBoundingClientRect() : null;
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bayarBottom: bayarRect ? bayarRect.bottom : null,
      bayarTop: bayarRect ? bayarRect.top : null,
    };
  });

  console.log('Metrics at 1400x1050:', metrics);

  // If bayarBottom > 1050 or scrollHeight > 1050, we adjust viewport so 4:3 encompasses EVERYTHING with 30px breathing room below!
  const maxBottom = Math.max(metrics.scrollHeight, (metrics.bayarBottom || 0) + 40);
  if (maxBottom > 1050) {
    const newHeight = Math.ceil(maxBottom);
    const newWidth = Math.round(newHeight * (4 / 3));
    console.log(`Adjusting viewport to exact 4:3: ${newWidth}x${newHeight}`);
    await page.setViewportSize({ width: newWidth, height: newHeight });
    await page.waitForTimeout(1000);
  }

  console.log('Capturing screenshot...');
  await page.screenshot({ path: outPathArtifact, fullPage: false });
  await page.screenshot({ path: outPathPublic, fullPage: false });

  console.log('Screenshot saved successfully to:', outPathArtifact);
  console.log('Public copy saved to:', outPathPublic);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
