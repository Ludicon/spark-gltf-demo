#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <directory>" >&2
    exit 1
fi

mkdir -p "$1"

# Normal map always encoded with uastc
gltf-transform uastc $1.glb $1-uastc.glb --zstd 21 --slots "normalTexture"

# Compress the remaining maps:
gltf-transform etc1s $1-uastc.glb $1-etc1s.glb --quality 255
gltf-transform uastc $1-uastc.glb $1-uastc.glb --zstd 21

# Compress mesh data:
gltf-transform meshopt $1-etc1s.glb $1-etc1s.glb
gltf-transform meshopt $1-uastc.glb $1-uastc.glb

echo "ETC1S: "
gzip -9 -c $1-etc1s.glb | wc -c | numfmt --to=iec

echo "UASTC: "
gzip -9 -c $1-uastc.glb | wc -c | numfmt --to=iec

cp "$1-etc1s.glb" "../$1-etc1s.glb"
cp "$1-uastc.glb" "../$1-uastc.glb"
