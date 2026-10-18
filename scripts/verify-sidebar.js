const { chromium } = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');

async function run() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[type="text"]', { timeout: 30000 });

  console.log('Logging in...');
  await page.fill('input[type="text"]', 'alwinizam');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForTimeout(3000); // wait for POS hydration and toast to fade

  console.log('Capturing Kasir sidebar...');
  await page.screenshot({ path: path.join(artifactDir, 'sidebar_kasir.png'), fullPage: false });

  console.log('Navigating to Gudang...');
  await page.goto('http://localhost:3000/inventory', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=Stok & Opname Gudang', { timeout: 30000 });
  await page.waitForTimeout(1000);
  console.log('Capturing Gudang sidebar...');
  await page.screenshot({ path: path.join(artifactDir, 'sidebar_gudang.png'), fullPage: false });

  console.log('Navigating to Procurement...');
  await page.goto('http://localhost:3000/procurement', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  console.log('Capturing Procurement sidebar...');
  await page.screenshot({ path: path.join(artifactDir, 'sidebar_procurement.png'), fullPage: false });

  await browser.close();
  console.log('Visual audit complete! All screenshots saved.');
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
