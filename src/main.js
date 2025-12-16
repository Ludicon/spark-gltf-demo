import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { UltraHDRLoader } from "three/addons/loaders/UltraHDRLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import { Spark } from "@ludicon/spark.js";
import { registerSparkLoader } from "@ludicon/spark.js/three-gltf";
import { initModelSelector, showError, updateDownloadLink, setLoading, setProgress } from "./ui.js";
import { getWebGPUAdapter } from "./webgpu.js";
import { makeTextureDebugger } from "./three-gltf-debug.js";

// Make sure Three.js is up to date
const threeRevision = parseInt(THREE.REVISION, 10);
if (threeRevision < 180) {
  showError("Three.js too old", `Three.js r180 or newer is required (found r${THREE.REVISION}).`);
  throw new Error(`Three.js r180 or newer is required (found r${THREE.REVISION})`);
}

let canvas, viewerEl;
let camera, scene, renderer, controls;
let loaderDefault, loaderSpark, loaderSparkLow;
let currentModel = null; // Track current GLTF model to dispose when switching
let dbg = null;

await init();

async function init() {
  // Initialize WebGPU device
  const adapter = await getWebGPUAdapter();
  const requiredFeatures = Spark.getRequiredFeatures(adapter);
  const device = await adapter.requestDevice({ requiredFeatures });

  // Create spark object and preload codecs for all formats.
  const spark = await Spark.create(device, {
    preload: ["rgba", "rgb", "rg", "r"],
    preloadLowQuality: true,
  });

  // Create canvas inside the viewer DIV
  canvas = document.createElement("canvas");
  viewerEl = document.getElementById("viewer");
  viewerEl.appendChild(canvas);
  const context = canvas.getContext("webgpu");

  // Renderer using our device & context
  renderer = new THREE.WebGPURenderer({ device, context, antialias: true });
  await renderer.init();
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // Scene setup
  scene = new THREE.Scene();

  new UltraHDRLoader().setPath("assets/").load("royal_esplanade_2k.hdr.jpg", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.backgroundBlurriness = 0.5;
    scene.backgroundIntensity = 0.25;
    scene.environment = texture;
  });
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  //scene.add(new THREE.DirectionalLight(0xffffff, 3.5));

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(2, 2, 3);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("./libs/draco/");

  // Create multiple GLTF loaders with KTX and Spark plugins.
  loaderDefault = new GLTFLoader();
  loaderDefault.setMeshoptDecoder(MeshoptDecoder);
  loaderDefault.setDRACOLoader(dracoLoader);

  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath("./libs/basis/");
  ktx2.detectSupport(renderer);
  loaderDefault.setKTX2Loader(ktx2);

  loaderSpark = new GLTFLoader();
  loaderSpark.setMeshoptDecoder(MeshoptDecoder);
  loaderSpark.setDRACOLoader(dracoLoader);
  registerSparkLoader(loaderSpark, spark, { preferLowQuality: false });

  loaderSparkLow = new GLTFLoader();
  loaderSparkLow.setMeshoptDecoder(MeshoptDecoder);
  loaderSparkLow.setDRACOLoader(dracoLoader);
  registerSparkLoader(loaderSparkLow, spark, { preferLowQuality: true });

  // Init model selector UI:
  initModelSelector(loadModel);

  window.addEventListener("resize", resize, { passive: true });
  resize();

  document.addEventListener("keydown", event => {
    if (dbg) {
      if (event.key === "1") {
        dbg.restore();
      } else if (event.key === "2") {
        dbg.showBaseColor();
      } else if (event.key === "3") {
        dbg.showNormalMap();
      } else if (event.key === "4") {
        dbg.showRoughness();
      } else if (event.key === "5") {
        dbg.showOcclusion();
      } else if (event.key === "6") {
        dbg.showEmissive();
      }
    }
  });

  renderer.setAnimationLoop(animate);
}

async function loadModel(url, useSpark) {
  setLoading(true);
  if (controls) controls.enabled = false;
  setProgress(0, "Loading…");
  console.time(`Load ${url}`);
  try {
    const loader = useSpark ? (useSpark === "lo" ? loaderSparkLow : loaderSpark) : loaderDefault;

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        url,
        g => resolve(g),
        e => {
          if (e && e.lengthComputable) {
            const pct = (e.loaded / e.total) * 100;
            setProgress(pct, "Downloading…");
          } else {
            // no Content-Length → fall back to manager-based updates already happening
          }
        },
        err => reject(err)
      );
    });

    // Remove previous
    disposeModel(currentModel);
    currentModel = gltf;

    // Normalize scale for visibility
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    gltf.scene.scale.setScalar(4 / size);

    // Offset at the origin
    const center = box.getCenter(new THREE.Vector3());
    center.multiplyScalar(gltf.scene.scale.x);
    gltf.scene.position.sub(center);

    scene.add(gltf.scene);
    dbg = makeTextureDebugger(gltf.scene);
  } finally {
    console.timeEnd(`Load ${url}`);
    setProgress(100, "Loaded");
    setTimeout(() => setLoading(false), 250);
    if (controls) controls.enabled = true;
    updateDownloadLink(url);
    animate();
  }
}

function disposeModel(gltf) {
  if (!gltf) return;
  dbg.remove();
  dbg = null;
  gltf.scene.traverse(node => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => {
        material.dispose();
      });
    }
  });
  gltf.scene.clear();
  scene.remove(gltf.scene);
}

// Resize to the viewer DIV (not the whole window)
function resize() {
  const w = viewerEl.clientWidth;
  const h = viewerEl.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  renderer.render(scene, camera);
}

// Render loop
function animate() {
  if (controls.enableDamping || controls.autoRotate) {
    controls.update();
  }
  renderer.render(scene, camera);
}
