#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

import { NodeIO, ImageUtils } from "@gltf-transform/core";
import { listTextureSlots } from "@gltf-transform/functions";
import {
  EXTTextureAVIF,
  EXTTextureWebP,
  KHRTextureBasisu,
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVariants,
  KHRMaterialsVolume,
  KHRTextureTransform,
  KHRMaterialsSheen,
  EXTMeshoptCompression,
  KHRMeshQuantization,
  KHRLightsPunctual,
  KHRDracoMeshCompression,
  KHRMaterialsUnlit,
} from "@gltf-transform/extensions";

import { MeshoptDecoder } from "meshoptimizer";
import draco3d from "draco3dgltf";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

// This is prescribed by WebGPU.
const BYTES_PER_ROW_ALIGNMENT = 256;

// Spark doesn't generate mips below this size:
const MIN_MIP_SIZE = 4;

function computeTextureSize(w, h, blockSize, mipmaps) {
  let outputSize = 0;

  do {
    const bw = Math.ceil(w / 4);
    const bh = Math.ceil(h / 4);
    const bytesPerRow = Math.ceil((bw * blockSize) / BYTES_PER_ROW_ALIGNMENT) * BYTES_PER_ROW_ALIGNMENT;
    const alignedSize = bh * bytesPerRow;

    outputSize += alignedSize;

    w = Math.max(1, Math.floor(w / 2));
    h = Math.max(1, Math.floor(h / 2));
  } while (mipmaps && (w >= MIN_MIP_SIZE || h >= MIN_MIP_SIZE));

  return outputSize;
}

function estimateCompressedSize(width, height, slots, lowQuality) {
  // Align the dimensions to the block extents
  const w = Math.ceil(width / 4) * 4;
  const h = Math.ceil(height / 4) * 4;

  let blockSize = 16; // Assume 16 bytes.

  if (slots.length === 1 && slots[0] === "occlusionTexture") {
    blockSize = 8;
  }
  if (lowQuality) {
    // @@ FIXME: Also exlude textures with alpha.
    if (!slots.includes("normalTexture")) {
      blockSize = 8;
    }
  }

  return computeTextureSize(w, h, blockSize, true);
}

function getDimensionsFromImageBytes(bytes, mimeType) {
  const size = ImageUtils.getSize(bytes, mimeType);
  return size ? [size[0], size[1]] : [0, 0];
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: texture-sizes.mjs <input.glb>");
    process.exit(1);
  }

  const io = new NodeIO().registerExtensions([
    EXTTextureAVIF,
    EXTTextureWebP,
    KHRTextureBasisu,
    KHRMaterialsClearcoat,
    KHRMaterialsIOR,
    KHRMaterialsTransmission,
    KHRMaterialsVariants,
    KHRMaterialsVolume,
    KHRTextureTransform,
    KHRMaterialsSheen,
    EXTMeshoptCompression,
    KHRMeshQuantization,
    KHRLightsPunctual,
    KHRDracoMeshCompression,
    KHRMaterialsUnlit,
  ]);
  io.registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  io.registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });

  const doc = await io.read(inputPath);

  const root = doc.getRoot();
  const textures = root.listTextures();

  let totalSize = 0;
  let totalVmemSize = 0;
  let totalVmemSizeLow = 0;
  let totalVmemSizeUncompressed = 0;

  for (let i = 0; i < textures.length; i++) {
    const tex = textures[i];
    const image = tex.getImage();
    if (!image) continue;

    const name = tex.getName() || `tex_${i}`;
    const mimeType = tex.getMimeType();
    const slots = listTextureSlots(tex);
    const size = image.length;

    const [w, h] = getDimensionsFromImageBytes(image, mimeType);
    const videoMemorySize = estimateCompressedSize(w, h, slots, false);
    const videoMemorySizeLow = estimateCompressedSize(w, h, slots, true);
    const videoMemorySizeUncompressed = w * h * 4;

    totalSize += size;
    totalVmemSize += videoMemorySize;
    totalVmemSizeLow += videoMemorySizeLow;
    totalVmemSizeUncompressed += videoMemorySizeUncompressed;

    console.log(
      `Texture ${name}, ${mimeType}, `,
      slots,
      `: size = ${formatBytes(size)} vmem = ${formatBytes(videoMemorySize)} vmem_low = ${formatBytes(videoMemorySizeLow)}`
    );
  }

  console.log(`Total size: ${formatBytes(totalSize)}`);
  console.log(`Total vmem size: ${formatBytes(totalVmemSize)}`);
  console.log(`Total vmem size low: ${formatBytes(totalVmemSizeLow)}`);
  console.log(`Total vmem size uncompressed: ${formatBytes(totalVmemSizeUncompressed)}`);
}

main().catch(e => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
