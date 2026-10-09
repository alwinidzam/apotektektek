const sharp = require('sharp');
const potrace = require('potrace');
const fs = require('fs');
const path = require('path');

async function traceLogo() {
  const inputPath = path.join(__dirname, '..', 'Logo Apotik putih.png');
  
  // 1. Load original logo, extract alpha channel to create a high-contrast black/white mask
  // The original has white logo on transparent background.
  // We want the logo to be solid black on solid white for potrace.
  const { data, info } = await sharp(inputPath)
    .resize(3000, 3000, { kernel: 'lanczos3' }) // 4x supersampling for ultra smooth vector bezier curves
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maskBuf = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < info.width * info.height; i++) {
    const alpha = data[i * 4 + 3];
    const lum = data[i * 4]; // White is 255
    // Logo foreground should be black (0) for potrace, background white (255)
    if (alpha > 80 && lum > 80) {
      maskBuf[i] = 0; // Black = foreground trace
    } else {
      maskBuf[i] = 255; // White = background
    }
  }

  const cleanPng = await sharp(maskBuf, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toBuffer();

  const params = {
    color: '#008B94',
    optCurve: true,
    optTolerance: 0.15,
    turdSize: 15,
    turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY
  };

  potrace.trace(cleanPng, params, (err, svg) => {
    if (err) {
      console.error(err);
      return;
    }

    // Now let's calculate the tight viewBox for this 3000x3000 trace
    // Parse path coordinates or calculate exact bounding box
    console.log('Trace succeeded! Raw SVG length:', svg.length);
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'logo-raw.svg'), svg);

    // Let's find the tight bounding box
    sharp(Buffer.from(svg))
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data: svgData, info: svgInfo }) => {
        let minX = svgInfo.width, maxX = 0, minY = svgInfo.height, maxY = 0;
        for (let y = 0; y < svgInfo.height; y++) {
          for (let x = 0; x < svgInfo.width; x++) {
            const idx = (y * svgInfo.width + x) * svgInfo.channels;
            const a = svgInfo.channels === 4 ? svgData[idx + 3] : 255;
            if (a > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        console.log('Bounding box in 3000x3000:', { minX, maxX, minY, maxY });
        
        // Pad slightly by 8px
        const pad = 12;
        const vbX = Math.max(0, minX - pad);
        const vbY = Math.max(0, minY - pad);
        const vbW = (maxX - minX) + pad * 2;
        const vbH = (maxY - minY) + pad * 2;

        // Replace viewBox and width/height in SVG
        const tightSvg = svg
          .replace(/width="[^"]+"/, `width="${vbW}"`)
          .replace(/height="[^"]+"/, `height="${vbH}"`)
          .replace(/viewBox="[^"]+"/, `viewBox="${vbX} ${vbY} ${vbW} ${vbH}"`);

        fs.writeFileSync(path.join(__dirname, '..', 'public', 'logo-kerso-waras.svg'), tightSvg);
        console.log('✓ Successfully written tight vector SVG to public/logo-kerso-waras.svg');

        // Also output white vector SVG
        const whiteSvg = tightSvg.replace(/fill="#008B94"/g, 'fill="#FFFFFF"');
        fs.writeFileSync(path.join(__dirname, '..', 'public', 'logo-kerso-waras-white.svg'), whiteSvg);
        console.log('✓ Successfully written white vector SVG to public/logo-kerso-waras-white.svg');
      });
  });
}

traceLogo();
