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

To generate glTF models with AVIF textures I recommend using: 

https://github.com/ludicon/gltf-tex/

## Links

- **spark.js Website**: https://ludicon.com/sparkjs/
- **spark.js GitHub**: https://github.com/ludicon/spark.js
- **Live Demo**: https://ludicon.com/sparkjs/gltf-demo/
- **Ludicon**: https://ludicon.com/

## Acknowledgments

- [Three.js](https://threejs.org/) for the WebGPU renderer
- [gltf-transform.dev](https://gltf-transform.dev) for the glTF model processing tools
- Sample models from [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- Basis Universal transcoder from [Binomial LLC](https://github.com/BinomialLLC/basis_universal)
