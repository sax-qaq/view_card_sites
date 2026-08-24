#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const projectRoot = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(projectRoot, "destinations.json");
const publicRoot = path.join(projectRoot, "public");
const maxBytes = 500 * 1024;
const qualitySteps = [82, 76, 70, 64, 58];

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const successes = [];
const failures = [];

for (const destination of catalog.destinations) {
  const destinationDirectory = path.join(
    publicRoot,
    "assets",
    "images",
    "destinations",
    destination.id,
  );
  await mkdir(destinationDirectory, { recursive: true });

  for (const image of destination.gallery.requirements) {
    if (!image.sourceUrl) continue;

    try {
      const response = await fetch(image.sourceUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const original = Buffer.from(await response.arrayBuffer());
      let optimized;
      let quality = qualitySteps[0];

      for (const candidateQuality of qualitySteps) {
        quality = candidateQuality;
        optimized = await sharp(original)
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: candidateQuality, effort: 6 })
          .toBuffer();

        if (optimized.byteLength <= maxBytes) break;
      }

      const slotPrefix = `${String(image.slot).padStart(2, "0")}-`;
      const contentHash = createHash("sha256").update(optimized).digest("hex").slice(0, 12);
      const fileName = `${slotPrefix}${contentHash}.webp`;
      const outputPath = path.join(destinationDirectory, fileName);
      const assetUrl = `/assets/images/destinations/${destination.id}/${fileName}`;

      await writeFile(outputPath, optimized);
      for (const existingFile of await readdir(destinationDirectory)) {
        if (
          existingFile !== fileName
          && existingFile.startsWith(slotPrefix)
          && existingFile.endsWith(".webp")
        ) {
          await unlink(path.join(destinationDirectory, existingFile));
        }
      }
      image.assetUrl = assetUrl;
      successes.push({
        destinationId: destination.id,
        slot: image.slot,
        sourceUrl: image.sourceUrl,
        assetUrl,
        originalBytes: original.byteLength,
        optimizedBytes: optimized.byteLength,
        quality,
      });
    } catch (error) {
      failures.push({
        destinationId: destination.id,
        slot: image.slot,
        sourceUrl: image.sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const sum = (items, field) => items.reduce((total, item) => total + item[field], 0);
console.log(
  JSON.stringify(
    {
      localized: successes.length,
      failed: failures.length,
      originalBytes: sum(successes, "originalBytes"),
      optimizedBytes: sum(successes, "optimizedBytes"),
      images: successes,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length > 0) process.exitCode = 1;
