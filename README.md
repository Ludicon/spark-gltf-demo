# spark.js⚡ glTF Demo

An interactive WebGPU-based glTF viewer demonstrating real-time GPU texture compression using [spark.js](https://ludicon.com/sparkjs/) and [Three.js](https://threejs.org/).

[<img src="public/og2x.jpg">](https://ludicon.com/sparkjs/gltf-demo/)

## What is spark.js?

[spark.js](https://github.com/ludicon/spark.js) is a real-time texture compression library that enables the use of modern image formats (AVIF, WebP, JPEG XL) compressing them on the fly to optimize GPU memory and bandwidth usage with minimal GPU overhead.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Modern Browser** with WebGPU support

### Installation

```bash
# Clone the repository
git clone https://github.com/ludicon/spark-gltf-demo.git
cd spark-gltf-demo

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The demo will be available at `http://localhost:5173`

### Keyboard Shortcuts

- **1**: Normal rendering (lit mode)
- **2**: Show base color only
- **3**: Show normals
- **4**: Show roughness
- **5**: Show occlusion
- **6**: Show emissive

## Model Processing

The `src/models/original/` directory contains tools for generating glTF models with AVIF textures:

### Convert PBR Textures to AVIF

I've provided a script to convert the model textures to AVIF format using settings tailored to each specific PBR texture type. The script requires:

- avifenc
- magick (ImageMagick)
- gltf-transform

Run it as follows:

```bash
./compress-textures.mjs input.glb output.glb [quality]
```

**Example:**

```bash
# High quality (larger files)
./compress-textures.mjs FlightHelmet.glb ../FlightHelmet-avif.glb 80

# Lower quality (smaller files)
./compress-textures.mjs FlightHelmet.glb ../FlightHelmet-avif-lo.glb 50
```

### Adding New Models

1. Place your source glTF/GLB file in `src/models/original/`
2. Run `./process.sh`, `./process-lo.sh` and `./process-avif.sh` to generate processed models.
3. Add model entries to `src/models.js`:

```javascript
export const Models = {
  YourModel: [
    { label: "Original PNG", url: "./models/YourModel.glb", size: 10.5, vram: 42.0 },
    { label: "Spark⚡ AVIF", url: "./models/YourModel-avif.glb", size: 2.1, vram: 10.5, spark: "hi" },
  ],
};
```

4. Use `texture-sizes.mjs` script to calculate texture sizes and enter them in the Models table.

Note, this is not a robust or performant production pipeline. Contact us at <spark@ludicon.com> if you need a more robust solution!


## Links

- **spark.js Website**: https://ludicon.com/sparkjs/
- **spark.js GitHub**: https://github.com/ludicon/spark.js
- **Live Demo**: https://ludicon.com/sparkjs/gltf-demo/
- **Ludicon**: https://ludicon.com/

## Acknowledgments

- [Three.js](https://threejs.org/) for the excellent WebGPU renderer
- [gltf-transform.dev](https://gltf-transform.dev) for the excellent glTF model processing tools
- Sample models from [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- Basis Universal transcoder from [Binomial LLC](https://github.com/BinomialLLC/basis_universal)
