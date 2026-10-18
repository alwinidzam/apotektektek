const { chromium } = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');

async function testResponsive() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Tablet (iPad Air: 820x1180)
  const tabletCtx = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const tabletPage = await tabletCtx.newPage();
  await tabletPage.goto('http://localhost:3000/login');
  await tabletPage.fill('input[type="text"]', 'alwinizam');
  await tabletPage.fill('input[type="password"]', 'admin123');
  await tabletPage.click('button[type="submit"]');
  await tabletPage.waitForTimeout(3000);
  await tabletPage.click('text=Resep Dokter');
  await tabletPage.waitForTimeout(500);
  await tabletPage.click('text=Paracetamol 500 mg');
  await tabletPage.waitForTimeout(500);
  await tabletPage.screenshot({ path: path.join(artifactDir, 'pos_tablet_820.png'), fullPage: false });
  console.log('Saved pos_tablet_820.png');
  await tabletCtx.close();

  // 2. Mobile (iPhone 14/15: 390x844)
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto('http://localhost:3000/login');
  await mobilePage.fill('input[type="text"]', 'alwinizam');
  await mobilePage.fill('input[type="password"]', 'admin123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForTimeout(3000);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'pos_mobile_390.png'), fullPage: false });
  console.log('Saved pos_mobile_390.png');
  await mobileCtx.close();

  await browser.close();
}

testResponsive().catch(console.error);
