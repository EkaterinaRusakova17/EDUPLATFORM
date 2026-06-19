import { mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const watermark = Buffer.from(`
  <svg width="500" height="100">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="DejaVu Sans" font-size="42" font-weight="bold"
      fill="black" fill-opacity="0.38" stroke="white" stroke-opacity="0.8"
      stroke-width="2">EDU PLATFORM</text>
  </svg>
`);

export async function processImage(
  storageDir: string,
  inputFilename: string,
  outputFilename: string,
) {
  const outputDir = join(storageDir, 'processed');
  await mkdir(outputDir, { recursive: true });

  await sharp(join(storageDir, 'originals', inputFilename))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .composite([{ input: watermark, gravity: 'southeast' }])
    .webp({ quality: 82 })
    .toFile(join(outputDir, outputFilename));
}
