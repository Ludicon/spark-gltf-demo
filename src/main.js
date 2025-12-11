import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import { Spark } from "@ludicon/spark.js";
import { registerSparkLoader } from "@ludicon/spark.js/three-gltf";
import { Models } from "./models.js";

const errorEl = document.getElementById("error");
const viewerEl = document.getElementById("viewer");
const downloadLink = document.getElementById("downloadLink");
const barchartEl = document.getElementById("barchart");
const modelSelectWrapEl = document.getElementById("modelSelectWrap");

const errorHTML = (title, body) => `
<h1>${title}</h1>
<p>${body}</p>
<p>More info: <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API" target="_blank" rel="noreferrer">MDN: WebGPU API</a></p>
`;

function showError(title, body) {
  errorEl.style.display = "";
  errorEl.innerHTML = errorHTML(title, body);
  viewerEl.style.display = "none";
}
function getWebGPURecommendation() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  if (/iphone|ipad|ipod/i.test(ua)) {
    return "If you are on iOS, WebGPU is only supported in Safari.";
  }
  if (/android/i.test(ua)) {
    return "If you are on Android, WebGPU is only supported in Chrome.";
  }
  if (/windows/i.test(ua)) {
    return "If you are on Windows, WebGPU is supported in Chrome or Edge. Firefox 141+ works with some known issues.";
  }
  if (/macintosh|mac os x/i.test(ua)) {
    return "If you are on macOS, WebGPU is supported in Safari or Chrome. Safari 26 and Safari Technology Preview work out of the box, but on earlier versions you need to enable WebGPU manually. Firefox Nightly works with some known issues.";
  }
  return ""; // other OS → no recommendation
}

// Basic capability checks
if (!navigator.gpu) {
  showError("WebGPU Not Supported", "This demo requires a browser with WebGPU support. " + getWebGPURecommendation());
  throw new Error("WebGPU not supported");
}

// Keep a single adapter/device for three.js + Spark
let adapter = null;
try {
  adapter = await navigator.gpu.requestAdapter();
} catch (err) {
  console.error("Error while requesting WebGPU adapter:", err);
}
if (!adapter) {
  showError("No GPU Adapter", "No appropriate GPUAdapter was found on this system." + getWebGPURecommendation());
  throw new Error("No appropriate GPUAdapter found");
}

const threeRevision = parseInt(THREE.REVISION, 10);
if (threeRevision < 180) {
  showError("Three.js too old", `Three.js r180 or newer is required (found r${THREE.REVISION}).`);
  throw new Error(`Three.js r180 or newer is required (found r${THREE.REVISION})`);
}

const requiredFeatures = Spark.getRequiredFeatures(adapter);
const device = await adapter.requestDevice({ requiredFeatures });

// Canvas inside the viewer DIV
const canvas = document.createElement("canvas");
viewerEl.appendChild(canvas);
const context = canvas.getContext("webgpu");

// Renderer using our device & context
const renderer = new THREE.WebGPURenderer({
  device,
  context,
  antialias: true,
});
await renderer.init();

//renderer.xr.enabled = true;
//import { VRButton } from "../../three.js/examples/jsm/webxr/VRButton.js";
//document.body.appendChild(VRButton.createButton(renderer));

// Spark device (preload common formats)
const spark = await Spark.create(device, {
  preload: ["rgba", "rgb", "rg", "r"],
  preloadLowQuality: true,
});

// Scene setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(2, 2, 3);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 5, 2);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const neutralEnvironment = pmremGenerator.fromScene(new RoomEnvironment()).texture;
scene.environment = neutralEnvironment;

const overlay = {
  el: document.getElementById("overlay"),
  pct: document.getElementById("pct"),
  bar: document.getElementById("bar"),
  msg: document.getElementById("overlayMsg"),
};

let isLoading = false;

function setLoading(on) {
  isLoading = on;
  //overlay.el.classList.toggle('show', on);
  overlay.el.classList.toggle("hide", !on);
  overlay.el.setAttribute("aria-busy", on ? "true" : "false");
  // Disable UI
  modelbarEl?.classList.toggle("disabled", on);
  modelSelect?.toggleAttribute("disabled", on);
  downloadLink?.classList.toggle("disabled", on);
  barchartEl?.classList.toggle("disabled", on);
  barchartEl?.classList.remove("hidden");
  modelSelectWrapEl?.classList.remove("hidden");

  // Disable camera interaction
  if (controls) controls.enabled = !on;
}

function setProgress(percent, note) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  overlay.pct.textContent = `${p}%`;
  overlay.bar.style.width = `${p}%`;
  if (note) overlay.msg.textContent = note;
}

// Create one manager for ALL loaders:
const manager = new THREE.LoadingManager();

// manager.onStart = (url, itemsLoaded, itemsTotal) => {
//   setProgress(0, 'Loading…');
//   setLoading(true);
// };

// manager.onProgress = (url, itemsLoaded, itemsTotal) => {
//   // item-based progress (coarse). If we have byte progress for the GLB we’ll overwrite it.
//   const pct = (itemsLoaded / itemsTotal) * 100;
//   setProgress(pct);
// };

// manager.onLoad = () => {
//   setProgress(100, 'Loaded');
//   // small delay so users can see 100%
//   setTimeout(() => setLoading(false), 500);
// };

// Create two GLTF loaders, one with spark another with KTX plugins.
const loaderDefault = new GLTFLoader();
loaderDefault.setMeshoptDecoder(MeshoptDecoder);

const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath("./libs/basis/");
ktx2.detectSupport(renderer);
loaderDefault.setKTX2Loader(ktx2);

const loaderSpark = new GLTFLoader();
loaderSpark.setMeshoptDecoder(MeshoptDecoder);
registerSparkLoader(loaderSpark, spark, { preferLowQuality: false });

const loaderSparkLow = new GLTFLoader();
loaderSparkLow.setMeshoptDecoder(MeshoptDecoder);
registerSparkLoader(loaderSparkLow, spark, { preferLowQuality: true });

// Track current model to dispose when switching
let current = /** @type {import('three/addons/loaders/GLTFLoader.js').GLTF | null} */ (null);

function disposeGLTF(gltf) {
  if (!gltf) return;
  gltf.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.geometry?.dispose?.();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.filter(Boolean).forEach(m => {
        // Dispose regular textures; ExternalTexture (spark) has no GPU-side disposal in three.js yet
        ["map", "normalMap", "metalnessMap", "roughnessMap", "aoMap", "emissiveMap", "specularMap", "alphaMap", "envMap"].forEach(k => {
          const t = m[k];
          if (t && t.isTexture && !t.isExternalTexture) t.dispose();
        });
        m.dispose?.();
      });
    }
  });
  if (gltf.animations) gltf.animations.length = 0;
  scene.remove(gltf.scene);
}

async function loadModel(url, useSpark) {
  setLoading(true);
  setProgress(0, "Loading…");
  console.time(`Load ${url}`);
  try {
    const loader = useSpark ? (useSpark == "lo" ? loaderSparkLow : loaderSpark) : loaderDefault;

    //const gltf = await loader.loadAsync(url);

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
    disposeGLTF(current);
    current = gltf;

    // Normalize scale for visibility
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    gltf.scene.scale.setScalar(4 / size);

    // Offset at the origin
    const center = box.getCenter(new THREE.Vector3());
    center.multiplyScalar(gltf.scene.scale.x);
    gltf.scene.position.sub(center);

    scene.add(gltf.scene);
  } finally {
    console.timeEnd(`Load ${url}`);
    setProgress(100, "Loaded");
    setTimeout(() => setLoading(false), 250);
    updateDownloadLink(url);
    render();
  }
}

function updateDownloadLink(url) {
  downloadLink.href = url;

  // optional: suggest a filename
  const parts = url.split("/");
  downloadLink.download = parts[parts.length - 1];
}

// Init model selector:
const modelSelect = document.getElementById("modelSelect");
const modelbarEl = document.getElementById("modelbar");

for (const name of Object.keys(Models)) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  modelSelect.appendChild(opt);
}

modelSelect.addEventListener("change", async e => {
  models = updateModelBar(e.target.value);

  await loadModel(models[0].url, models[0].useSpark);

  updateChart(models, models[0]);
});

// Initialize with first entry
modelSelect.value = "SciFiHelmet";
let maxModelSize = 0;
let maxModelVram = 0;
let models = updateModelBar(modelSelect.value);

function updateModelBar(name) {
  const models = Models[name];

  modelbarEl.innerHTML = "";
  models.forEach((m, i) => {
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.index = i; // @@ We should use the index to access the other attributes.
    a.dataset.model = m.url;
    a.dataset.vram = m.vram;
    a.dataset.size = m.size;
    if (m.spark) a.dataset.spark = m.spark;
    a.textContent = m.label;
    if (i === 0) a.classList.add("active");

    m.el = a;
    modelbarEl.appendChild(a);
  });

  maxModelSize = Math.max(...models.map(m => m.size));
  maxModelVram = Math.max(...models.map(m => m.vram));

  return models;
}

function setActive(el) {
  for (const { el: link } of models) link.classList.toggle("active", link === el);
}

// Find elements
const chartEls = {
  fileBar: document.querySelector("#barchart .bar.file"),
  gpuBar: document.querySelector("#barchart .bar.gpu"),
  fileVal: document.querySelector("#barchart .value.file"),
  gpuVal: document.querySelector("#barchart .value.gpu"),
};

function updateChart(models, model) {
  const sizePct = (model.size / maxModelSize) * 100;
  const vramPct = (model.vram / maxModelVram) * 100;

  chartEls.fileBar.style.width = `${sizePct}%`;
  chartEls.gpuBar.style.width = `${vramPct}%`;

  chartEls.fileVal.textContent = `${model.size.toFixed(2)} MB`;
  chartEls.gpuVal.textContent = `${model.vram.toFixed(2)} MB`;
}

modelbarEl.addEventListener("click", async e => {
  const a = e.target.closest("a[data-model]");
  if (!a) return;
  e.preventDefault();
  const url = a.getAttribute("data-model");
  if (!url) return;
  const useSpark = a.getAttribute("data-spark");

  setActive(a);
  updateChart(a);
  await loadModel(url, useSpark);
});

updateChart(models, models[0]);
await loadModel(models[0].url, false);

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
  render();
}
const ro = new ResizeObserver(resize);
ro.observe(viewerEl);
window.addEventListener("resize", resize, { passive: true });
resize();

// Render loop
function animate() {
  //requestAnimationFrame(animate);

  if (controls.enableDamping || controls.autoRotate) {
    controls.update();
  }
  render();
}

function render() {
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

//controls.addEventListener('change', render);
animate();
