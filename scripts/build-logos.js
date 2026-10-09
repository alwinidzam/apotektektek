const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function buildCleanLogos() {
  const publicDir = path.join(__dirname, '..', 'public');
  const inputPath = path.join(__dirname, '..', 'Logo Apotik putih.png');

  // Step 1: Clean and enhance the input logo
  const cleanedBuffer = await sharp(inputPath)
    .threshold(128)
    .blur(1.5)
    .threshold(100)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = cleanedBuffer.info;
  const data = cleanedBuffer.data;

  const whiteBuf = Buffer.alloc(width * height * 4);
  const tealBuf = Buffer.alloc(width * height * 4);
  const darkBuf = Buffer.alloc(width * height * 4);
  const cyanBuf = Buffer.alloc(width * height * 4);
  const amberBuf = Buffer.alloc(width * height * 4);

  const TEAL = [0, 139, 148]; // #008B94 (Kerso Waras Primary Teal)
  const DARK = [28, 28, 30];  // #1C1C1E (Apple Dark Slate / Receipt Monochrome)
  const CYAN = [0, 168, 181]; // #00A8B5 (Medical Cyan)
  const AMBER = [217, 119, 6]; // #D97706 (Executive Gold/Amber)

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    const r = data[srcIdx];
    const alpha = r > 40 ? Math.min(255, Math.round(((r - 40) / 215) * 255)) : 0;

    // 1. White Transparent
    whiteBuf[dstIdx] = 255;
    whiteBuf[dstIdx + 1] = 255;
    whiteBuf[dstIdx + 2] = 255;
    whiteBuf[dstIdx + 3] = alpha;

    // 2. Kerso Waras Teal
    tealBuf[dstIdx] = TEAL[0];
    tealBuf[dstIdx + 1] = TEAL[1];
    tealBuf[dstIdx + 2] = TEAL[2];
    tealBuf[dstIdx + 3] = alpha;

    // 3. Dark Slate / Monochrome
    darkBuf[dstIdx] = DARK[0];
    darkBuf[dstIdx + 1] = DARK[1];
    darkBuf[dstIdx + 2] = DARK[2];
    darkBuf[dstIdx + 3] = alpha;

    // 4. Medical Cyan
    cyanBuf[dstIdx] = CYAN[0];
    cyanBuf[dstIdx + 1] = CYAN[1];
    cyanBuf[dstIdx + 2] = CYAN[2];
    cyanBuf[dstIdx + 3] = alpha;

    // 5. Amber / Executive
    amberBuf[dstIdx] = AMBER[0];
    amberBuf[dstIdx + 1] = AMBER[1];
    amberBuf[dstIdx + 2] = AMBER[2];
    amberBuf[dstIdx + 3] = alpha;
  }

  // Save variant files
  await sharp(whiteBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-white-transparent.png'));
  console.log('✓ Created public/logo-white-transparent.png');

  await sharp(tealBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-teal.png'));
  console.log('✓ Created public/logo-teal.png');

  await sharp(darkBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-dark.png'));
  console.log('✓ Created public/logo-dark.png');

  await sharp(cyanBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-cyan.png'));
  console.log('✓ Created public/logo-cyan.png');

  await sharp(amberBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-amber.png'));
  console.log('✓ Created public/logo-amber.png');

  // Primary Squircle Logo: Kerso Waras Teal Background with White Emblem
  const tealBg = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 87, b: 93, alpha: 1 } // #00575D deep medical teal
    }
  }).png().toBuffer();

  const resizedWhite = await sharp(whiteBuf, { raw: { width, height, channels: 4 } })
    .resize(Math.round(width * 0.84), Math.round(height * 0.84))
    .png()
    .toBuffer();

  await sharp(tealBg)
    .composite([{ input: resizedWhite, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'logo-kerso-waras.png'));
  console.log('✓ Updated public/logo-kerso-waras.png');

  // App Icon with rounded corners
  const svgMask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="150" ry="150" fill="#fff"/></svg>`
  );

  await sharp(tealBg)
    .composite([
      { input: resizedWhite, gravity: 'center' },
      { input: svgMask, blend: 'dest-in' }
    ])
    .png()
    .toFile(path.join(publicDir, 'logo-app-icon.png'));
  console.log('✓ Created public/logo-app-icon.png');

  // Favicon 64x64
  await sharp(path.join(publicDir, 'logo-app-icon.png'))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('✓ Created public/icon.png (64x64)');
}

buildCleanLogos().catch(console.error);
