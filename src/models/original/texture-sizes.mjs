#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

import { NodeIO } from "@gltf-transform/core";
import { listTextureSlots } from "@gltf-transform/functions";
import {
  EXTTextureAVIF,
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVariants,
  KHRMaterialsVolume,
  KHRTextureTransform,
  KHRMaterialsSheen,
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";

import { MeshoptDecoder } from 'meshoptimizer';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

async function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error("Usage: texture-sizes.mjs <input.glb>");
    process.exit(1);
  }

  const io = new NodeIO().registerExtensions([
    EXTTextureAVIF,
    KHRMaterialsClearcoat,
    KHRMaterialsIOR,
    KHRMaterialsTransmission,
    KHRMaterialsVariants,
    KHRMaterialsVolume,
    KHRTextureTransform,
    KHRMaterialsSheen,
    EXTMeshoptCompression,
    KHRMeshQuantization,
  ]);
  io.registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(inputPath);

  const root = doc.getRoot();
  const textures = root.listTextures();

  let totalSize = 0;

  for (let i = 0; i < textures.length; i++) {
    const tex = textures[i];
    const image = tex.getImage();
    if (!image) continue;

    const name = tex.getName() || `tex_${i}`;
    const mimeType = tex.getMimeType();
    const slots = listTextureSlots(tex);
    const size = image.length;

    totalSize += size;

    console.log(`Texture ${name}, ${mimeType}, `, slots, `: size = ${formatBytes(size)}`);
  }

  console.log(`Total size: ${formatBytes(totalSize)}`);
}

main().catch(e => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
