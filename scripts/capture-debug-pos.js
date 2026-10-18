const { chromium } = require('C:/Users/ASUS/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');

async function main() {
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\bf522651-5cc6-4d86-abc1-0167bf90c7db';
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // Test at 1280x800
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="text"]', 'alwinizam');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Switch to Resep Dokter
  await page.click('text=Resep Dokter');
  await page.waitForTimeout(500);
  
  // Click first product to add to cart
  await page.click('text=Paracetamol 500 mg');
  await page.waitForTimeout(500);
  await page.click('text=Amoxicillin 500 mg');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: path.join(artifactDir, 'debug_pos_resep_1280.png'), fullPage: false });
  console.log('Saved debug_pos_resep_1280.png');

  // Switch to Tabel mode
  await page.click('button:has-text("Tabel")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'debug_pos_table_view.png'), fullPage: false });
  console.log('Saved debug_pos_table_view.png');
  
  await browser.close();
}

main().catch(console.error);
