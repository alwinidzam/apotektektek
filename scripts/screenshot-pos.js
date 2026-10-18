let chromium;
try {
  chromium = require('playwright-core').chromium;
} catch (e) {
  chromium = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core').chromium;
}
const path = require('path');
const fs = require('fs');

async function capturePOS() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  const outPathClean = path.join(artifactDir, 'pos_screenshot_landscape.png');
  const outPathActive = path.join(artifactDir, 'pos_screenshot_active_cart.png');
  const outPublicClean = path.join(__dirname, '..', 'public', 'pos_screenshot_landscape.png');
  const outPublicActive = path.join(__dirname, '..', 'public', 'pos_screenshot_active_cart.png');

  console.log('Launching browser (msedge channel)...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // Aspect ratio 4:3 landscape (1440 x 1080) with 2x scale factor for ultra-sharp Retina resolution
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  console.log('Logging in...');
  await page.fill('input[type="text"]', 'alwinizam');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  console.log('Waiting for POS interface...');
  await page.waitForURL('http://localhost:3000/**', { timeout: 15000 });

  // Wait 4.5s for initial toast to fade out completely
  await page.waitForTimeout(4500);

  console.log('Capturing clean POS dashboard (4:3 landscape)...');
  await page.screenshot({ path: outPathClean, fullPage: false });
  await page.screenshot({ path: outPublicClean, fullPage: false });

  // Now click on a couple of product cards to populate cart
  console.log('Adding sample items to cart...');
  const productCards = await page.$$('text=Paracetamol 500 mg');
  if (productCards.length > 0) {
    await productCards[0].click();
    await page.waitForTimeout(400);
  }

  const amoxCards = await page.$$('text=Amoxicillin 500 mg');
  if (amoxCards.length > 0) {
    await amoxCards[0].click();
    await page.waitForTimeout(400);
  }

  const ctmCards = await page.$$('text=CTM 4 mg');
  if (ctmCards.length > 0) {
    await ctmCards[0].click();
    await page.waitForTimeout(400);
  }

  await page.waitForTimeout(1000);

  console.log('Capturing active cart POS dashboard (4:3 landscape)...');
  await page.screenshot({ path: outPathActive, fullPage: false });
  await page.screenshot({ path: outPublicActive, fullPage: false });

  console.log('✓ Successfully saved clean screenshot:', outPathClean);
  console.log('✓ Successfully saved active cart screenshot:', outPathActive);

  await browser.close();
}

capturePOS().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
