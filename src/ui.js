import { Models } from "./models.js";

const errorEl = document.getElementById("error");
const viewerEl = document.getElementById("viewer");
const downloadLink = document.getElementById("downloadLink");
const barchartEl = document.getElementById("barchart");
const modelbarEl = document.getElementById("modelbar");
const modelSelect = document.getElementById("modelSelect");
const modelSelectWrapEl = document.getElementById("modelSelectWrap");

// Initialized by initModelSelector
let maxModelSize = 0;
let maxModelVram = 0;
let models;
let loadModel;

/**
 * Get user-friendly recommendations for WebGPU/WebGL support
 * @returns {string}
 */
export function getRendererRecommendation() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  if (/iphone|ipad|ipod/i.test(ua)) {
    return "On iOS, WebGPU is supported in Safari 18+. WebGL 2 is supported in Safari 15+.";
  }
  if (/android/i.test(ua)) {
    return "On Android, WebGPU is supported in Chrome 113+. WebGL 2 is widely supported.";
  }
  if (/windows/i.test(ua)) {
    return "On Windows, WebGPU is supported in Chrome 113+, Edge 113+, and Firefox 141+. WebGL 2 is widely supported.";
  }
  if (/macintosh|mac os x/i.test(ua)) {
    return "On macOS, WebGPU is supported in Safari 18+, Chrome 113+, and Firefox Nightly. WebGL 2 is widely supported.";
  }
  return "Please use a modern browser with WebGPU or WebGL 2 support.";
}

export function showError(title, body) {
  errorEl.style.display = "";

  // Check if we're in WebGL fallback mode
  const urlParams = new URLSearchParams(window.location.search);
  const forcedRenderer = urlParams.get("renderer");

  let extraHelp = "";
  if (forcedRenderer !== "webgl") {
    extraHelp = `<p><a href="?renderer=webgl" style="color: #e76f51; font-weight: bold;">Try WebGL fallback mode</a></p>`;
  }

  const recommendation = getRendererRecommendation();

  errorEl.innerHTML = `
    <h1>${title}</h1>
    <p>${body}</p>
    ${extraHelp}
    <p>${recommendation}</p>
    <p>Check browser implementation status at
       <a href="https://caniuse.com/webgpu" target="_blank" rel="noreferrer">WebGPU</a> /
       <a href="https://caniuse.com/webgl2" target="_blank" rel="noreferrer">WebGL 2</a>
    </p>
  `;

  viewerEl.style.display = "none";
}

export function initUI(backend) {
  // Only show badge if renderer was explicitly selected via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const forcedRenderer = urlParams.get("renderer");

  if (forcedRenderer) {
    // Add a badge showing which renderer is active
    const badge = document.createElement("div");
    badge.id = "renderer-badge";
    badge.textContent = backend === "webgpu" ? "WebGPU" : "WebGL";
    badge.className = backend === "webgpu" ? "badge-webgpu" : "badge-webgl";
    badge.title = `Using ${backend === "webgpu" ? "WebGPU" : "WebGL"} renderer`;
    document.body.appendChild(badge);
  } else {
    // If using WebGL fallback without explicit selection, just log it
    if (backend === "webgl") {
      console.log("Using WebGL fallback (WebGPU not available)");
    }
  }
}

export function updateDownloadLink(url) {
  downloadLink.href = url;

  // optional: suggest a filename
  const parts = url.split("/");
  downloadLink.download = parts[parts.length - 1];
}

const overlay = {
  el: document.getElementById("overlay"),
  pct: document.getElementById("pct"),
  bar: document.getElementById("bar"),
  msg: document.getElementById("overlayMsg"),
};

export function setLoading(on) {
  overlay.el.classList.toggle("hide", !on);
  overlay.el.setAttribute("aria-busy", on ? "true" : "false");
  // Disable UI
  modelbarEl?.classList.toggle("disabled", on);
  modelSelect?.toggleAttribute("disabled", on);
  downloadLink?.classList.toggle("disabled", on);
  barchartEl?.classList.toggle("disabled", on);
  barchartEl?.classList.remove("hidden");
  modelSelectWrapEl?.classList.remove("hidden");
}

export function setProgress(percent, note) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  overlay.pct.textContent = `${p}%`;
  overlay.bar.style.width = `${p}%`;
  if (note) overlay.msg.textContent = note;
}

export async function initModelSelector(onLoadModel) {
  loadModel = onLoadModel;

  // Init model selector:
  for (const name of Object.keys(Models)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    modelSelect.appendChild(opt);
  }

  modelSelect.addEventListener("change", async e => {
    models = updateModelBar(e.target.value);

    await loadModel(models[0].url, models[0].useSpark);
    updateChart(models[0]);
  });

  // Initialize with first entry
  modelSelect.value = "SciFiHelmet";
  models = updateModelBar(modelSelect.value);

  updateChart(models[0]);
  await loadModel(models[0].url, false);
}

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
  for (const model of models) {
    const link = model.el;
    link.classList.toggle("active", model.el === el);
    if (model.el === el) updateChart(model);
  }
}

// Find elements
const chartEls = {
  fileBar: document.querySelector("#barchart .bar.file"),
  gpuBar: document.querySelector("#barchart .bar.gpu"),
  fileVal: document.querySelector("#barchart .value.file"),
  gpuVal: document.querySelector("#barchart .value.gpu"),
};

function updateChart(model) {
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
  await loadModel(url, useSpark);
});
