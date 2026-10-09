const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateVariants() {
  const inputPath = path.join(__dirname, '..', 'Logo Apotik putih.png');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels; // 4 (RGBA)

  // Variant buffers
  const whiteTransparentBuf = Buffer.alloc(width * height * 4);
  const tealBuf = Buffer.alloc(width * height * 4);
  const darkBuf = Buffer.alloc(width * height * 4);
  const medicalCyanBuf = Buffer.alloc(width * height * 4);

  // Teal RGB: #008B94 -> (0, 139, 148)
  const TEAL_R = 0, TEAL_G = 139, TEAL_B = 148;
  // Dark Slate RGB: #1C1C1E -> (28, 28, 30)
  const DARK_R = 28, DARK_G = 28, DARK_B = 30;
  // Medical Cyan RGB: #00A8B5 -> (0, 168, 181)
  const CYAN_R = 0, CYAN_G = 168, CYAN_B = 181;

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    // Compute luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    let alpha = 0;
    if (lum > 25) {
      // Smooth alpha ramp
      alpha = Math.min(255, Math.round(((lum - 25) / (255 - 25)) * 255));
    }

    // 1. White Transparent
    whiteTransparentBuf[dstIdx] = 255;
    whiteTransparentBuf[dstIdx + 1] = 255;
    whiteTransparentBuf[dstIdx + 2] = 255;
    whiteTransparentBuf[dstIdx + 3] = alpha;

    // 2. Teal (#008B94)
    tealBuf[dstIdx] = TEAL_R;
    tealBuf[dstIdx + 1] = TEAL_G;
    tealBuf[dstIdx + 2] = TEAL_B;
    tealBuf[dstIdx + 3] = alpha;

    // 3. Dark Slate (#1C1C1E)
    darkBuf[dstIdx] = DARK_R;
    darkBuf[dstIdx + 1] = DARK_G;
    darkBuf[dstIdx + 2] = DARK_B;
    darkBuf[dstIdx + 3] = alpha;

    // 4. Medical Cyan (#00A8B5)
    medicalCyanBuf[dstIdx] = CYAN_R;
    medicalCyanBuf[dstIdx + 1] = CYAN_G;
    medicalCyanBuf[dstIdx + 2] = CYAN_B;
    medicalCyanBuf[dstIdx + 3] = alpha;
  }

  // Save White Transparent
  await sharp(whiteTransparentBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-white-transparent.png'));
  console.log('✓ Generated public/logo-white-transparent.png');

  // Save Teal Logo
  await sharp(tealBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-teal.png'));
  console.log('✓ Generated public/logo-teal.png');

  // Save Dark Logo (For receipt printing & light clean backgrounds)
  await sharp(darkBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-dark.png'));
  console.log('✓ Generated public/logo-dark.png');

  // Save Medical Cyan Logo
  await sharp(medicalCyanBuf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(publicDir, 'logo-cyan.png'));
  console.log('✓ Generated public/logo-cyan.png');

  // Branded App Icon / Squircle Icon
  // Create solid teal background
  const tealBg = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: TEAL_R, g: TEAL_G, b: TEAL_B, alpha: 1 }
    }
  })
  .png()
  .toBuffer();

  const resizedWhiteLogo = await sharp(whiteTransparentBuf, { raw: { width, height, channels: 4 } })
    .resize(Math.round(width * 0.82), Math.round(height * 0.82))
    .png()
    .toBuffer();

  // Create rounded corner mask
  const roundedCornersMask = Buffer.from(
    `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="140" ry="140"/></svg>`
  );

  await sharp(tealBg)
    .composite([
      { input: resizedWhiteLogo, gravity: 'center' }
    ])
    .png()
    .toFile(path.join(publicDir, 'logo-kerso-waras.png'));
  console.log('✓ Updated public/logo-kerso-waras.png');

  // App icon with squircle mask
  await sharp(tealBg)
    .composite([
      { input: resizedWhiteLogo, gravity: 'center' },
      { input: roundedCornersMask, blend: 'dest-in' }
    ])
    .png()
    .toFile(path.join(publicDir, 'logo-app-icon.png'));
  console.log('✓ Generated public/logo-app-icon.png');

  // Generate favicon / icon.png (64x64)
  await sharp(path.join(publicDir, 'logo-app-icon.png'))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('✓ Generated public/icon.png (64x64)');
}

generateVariants().catch(console.error);
