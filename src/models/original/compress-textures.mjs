#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

import { NodeIO } from "@gltf-transform/core";
import { listTextureSlots } from "@gltf-transform/functions";
import {
  EXTTextureAVIF,
  EXTTextureWebP,
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVariants,
  KHRMaterialsVolume,
  KHRMaterialsUnlit,
  KHRMaterialsSheen,
  KHRTextureTransform,
  EXTMeshoptCompression,
  KHRMeshQuantization,
  KHRLightsPunctual,
  KHRDracoMeshCompression,
} from "@gltf-transform/extensions";

import { MeshoptDecoder } from "meshoptimizer";
import draco3d from "draco3dgltf";

const quality = Number(process.argv[4] ?? 80);
const speed = 2; // 0-10: slowest - fastest
const avif = true;

function run(cmd, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", d => (out += d.toString()));
    p.stderr.on("data", d => (err += d.toString()));
    p.on("error", reject);
    p.on("close", code => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} ${args.join(" ")} failed (code ${code})\n${err || out}`));
    });
  });
}

function avifArgsForTexture(slots) {
  if (avif) {
    // Encode normals using identity color transform.
    if (slots.length === 1 && slots[0] === "normalTexture") {
      return ["-q", `${quality}`, "-s", `${speed}`, "-c", "aom", "-a", "tune=ssim", "--cicp", "1/8/0"];
    }

    // If the texture is only used for occlusion, then store as greyscale.
    if (slots.length === 1 && slots[0] === "occlusionTexture") {
      return ["-q", `${quality}`, "-s", `${speed}`, "-c", "aom", "-a", "tune=ssim", "--yuv", "400"];
    }

    // Encode ORM textures using identity color transform.
    if (slots.includes("metallicRoughnessTexture")) {
      return ["-q", `${quality}`, "-s", `${speed}`, "-c", "aom", "-a", "tune=ssim", "--cicp", "1/8/0"];
    }

    // Everything else (baseColor, emissive, etc) uses yuv 4:4:4 and tune iq.
    return ["-q", `${quality}`, "-s", `${speed}`, "-c", "aom", "-a", "tune=iq"];
  } else {
    // @@
  }
}

async function processTextureWebP(inPath, outPath, slots) {
  if (slots.includes("normalTexture")) {
    // Normalize normals and store as XXXY.
    // prettier-ignore
    await run("magick", [
      `${inPath}`,
      "-channel", "R", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); nx/len/2+0.5',
      "-channel", "G", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); nx/len/2+0.5',
      "-channel", "B", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); nx/len/2+0.5',
      "-channel", "A", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); ny/len/2+0.5',
      "tmp.png",
    ]);

    await run("cwebp", ["-near_lossless", "50", "tmp.png", "-o", outPath]);

    await run("rm", ["tmp.png"]);
    return true;
  }

  return false;
}

async function processTextureAVIF(inPath, outPath, slots) {
  let args = avifArgsForTexture(slots);

  if (slots.length === 1 && slots[0] === "normalTexture") {
    // Normalize normals and clear Z component.
    // prettier-ignore
    await run("magick", [
      `${inPath}`,
      "-channel", "R", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); nx/len/2+0.5',
      "-channel", "G", "-fx", 'nx=(r-0.5)*2; ny=(g-0.5)*2; nz=(b-0.5)*2; len=sqrt(max(0, nx*nx+ny*ny+nz*nz)); len=max(len,1e-6); ny/len/2+0.5',
      "-channel", "B", "-evaluate", "set", "0", "+channel",
      "tmp.png",
    ]);

    // Clear Z channel:
    //await run("magick", ["tmp.png", "-channel", "B", "-evaluate", "set", "127", "+channel", "tmp.png"]);

    await run("avifenc", [...args, "tmp.png", outPath]);

    // Clean up temporary file.
    await run("rm", ["tmp.png"]);
  } else if (false && slots.length === 1 && slots[0] === "occlusionTexture") {
    // @@ Note, this is shifting the occlusion values, probably assuming srgb at some step of the pipeline, so this is disabled for now.

    // Replicate R channel across RGB:
    await run("magick", [`${inPath}`, "-channel", "R", "-separate", "-set", "colorspace", "RGB", "-combine", "tmp.png"]);

    await run("avifenc", [...args, "tmp.png", outPath]);

    // Clean up temporary file.
    await run("rm", ["tmp.png"]);
  } else {
    await run("avifenc", [...args, inPath, outPath]);
  }
}

async function decodeWebpTexture(inPath, outPath) {
  await run("dwebp", [inPath, "-o", outPath]);
}

// Get file extension for mime type.
function getFileExt(mimeType) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/avif") return ".avif";
  return ".bin";
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error("Usage: processs.mjs <input.glb> <output.glb> [quality]");
    process.exit(1);
  }

  const io = new NodeIO().registerExtensions([
    EXTTextureAVIF,
    EXTTextureWebP,
    KHRMaterialsClearcoat,
    KHRMaterialsIOR,
    KHRMaterialsTransmission,
    KHRMaterialsVariants,
    KHRMaterialsVolume,
    KHRMaterialsSheen,
    KHRMaterialsUnlit,
    KHRTextureTransform,
    EXTMeshoptCompression,
    KHRMeshQuantization,
    KHRLightsPunctual,
    KHRDracoMeshCompression,
  ]);
  io.registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  io.registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });

  const doc = await io.read(inputPath);

  // Only create extensions we need to emit.
  const avifExt = doc.createExtension(EXTTextureAVIF).setRequired(avif);
  const webpExt = doc.createExtension(EXTTextureWebP).setRequired(!avif);

  const root = doc.getRoot();
  const textures = root.listTextures();

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gltf-avif-"));
  const outDir = path.parse(inputPath).name;

  try {
    for (let i = 0; i < textures.length; i++) {
      const tex = textures[i];
      const image = tex.getImage();
      if (!image) continue;

      const name = tex.getName() || `tex_${i}`;
      const extension = getFileExt(tex.getMimeType());
      let inPath = path.join(outDir, `${name}${extension}`);
      const outPath = path.join(outDir, `${name}.${avif ? "avif" : "webp"}`);

      const slots = listTextureSlots(tex);

      await fs.writeFile(inPath, image);

      console.log(`Encoding ${inPath} -> ${outPath} with slots: `, slots);

      // Decode WebP textures.
      if (extension === ".webp") {
        await decodeWebpTexture(inPath, "tmp.png");
        inPath = "tmp.png";
      }

      let success = true;
      if (avif) {
        await processTextureAVIF(inPath, outPath, slots);
        tex.setMimeType("image/avif");
      } else {
        // The avif encoder only processes some textures for now.
        success = await processTextureWebP(inPath, outPath, slots);
        tex.setMimeType("image/webp");
      }

      if (success) {
        const avifBytes = await fs.readFile(outPath);
        tex.setImage(avifBytes);
      }
    }

    await io.write(outputPath, doc);
    console.log(`Wrote ${outputPath}`);
  } finally {
    // Cleanup temp dir.
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch(e => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
