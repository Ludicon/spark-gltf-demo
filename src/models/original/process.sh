#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <directory>" >&2
    exit 1
fi

mkdir -p "$1"

./compress-textures.mjs "$1.glb" "$1/$1-avif.glb" 80

# Display size of all avif files:
echo "Size of all avif files:"
du -ch "$1"/*.avif | tail -n 1

gltf-transform meshopt "$1/$1-avif.glb" "$1/$1-avif.glb"

echo "Compressed glb size:"
gzip -9 -c "$1/$1-avif.glb" | wc -c | numfmt --to=iec

cp "$1/$1-avif.glb" "../$1-avif.glb"
