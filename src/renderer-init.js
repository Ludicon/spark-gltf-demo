import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { Spark, SparkGL } from "@ludicon/spark.js";
import { showError } from "./ui.js";

/**
 * Initialize renderer with automatic WebGPU/WebGL fallback detection
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} options - Initialization options
 * @returns {Promise<{renderer: THREE.Renderer, spark: Spark, backend: string}>}
 */
export async function initializeRenderer(canvas, options = {}) {
  // Check URL params for manual renderer selection
  const urlParams = new URLSearchParams(window.location.search);
  const forceBackend = urlParams.get("renderer"); // ?renderer=webgl or ?renderer=webgpu

  let useWebGPU = true;

  if (forceBackend === "webgl") {
    console.log("WebGL renderer forced via URL parameter");
    useWebGPU = false;
  } else if (forceBackend === "webgpu") {
    console.log("WebGPU renderer forced via URL parameter");
    useWebGPU = true;
  } else {
    // Auto-detect: prefer WebGPU if available
    useWebGPU = await isWebGPUAvailable();
    console.log(`Auto-detected renderer: ${useWebGPU ? "WebGPU" : "WebGL"}`);
  }

  try {
    if (useWebGPU) {
      return await initWebGPURenderer(canvas);
    } else {
      return await initWebGLRenderer(canvas);
    }
  } catch (error) {
    console.error(`Failed to initialize ${useWebGPU ? "WebGPU" : "WebGL"} renderer:`, error);

    // If WebGPU failed and wasn't forced, try WebGL fallback
    if (useWebGPU && forceBackend !== "webgpu") {
      console.log("Falling back to WebGL...");
      try {
        return await initWebGLRenderer(canvas);
      } catch (fallbackError) {
        console.error("WebGL fallback also failed:", fallbackError);
        showError(
          "Renderer Initialization Failed",
          "Unable to initialize WebGPU or WebGL renderer. Your browser may not support these technologies."
        );
        throw fallbackError;
      }
    }

    showError(
      `${useWebGPU ? "WebGPU" : "WebGL"} Initialization Failed`,
      `Failed to initialize ${useWebGPU ? "WebGPU" : "WebGL"} renderer: ${error.message}`
    );
    throw error;
  }
}

/**
 * Check if WebGPU is available
 * @returns {Promise<boolean>}
 */
async function isWebGPUAvailable() {
  if (!navigator.gpu) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (error) {
    console.warn("WebGPU adapter request failed:", error);
    return false;
  }
}

/**
 * Initialize WebGPU renderer
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<{renderer: THREE.WebGPURenderer, spark: Spark, backend: string}>}
 */
async function initWebGPURenderer(canvas) {
  console.log("Initializing WebGPU renderer...");

  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No WebGPU adapter found");
  }

  const requiredFeatures = Spark.getRequiredFeatures(adapter);
  const device = await adapter.requestDevice({ requiredFeatures });

  // Create spark with WebGPU device
  const spark = await Spark.create(device, {
    preload: ["rgba", "rgb", "rg", "r"],
  });

  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to get WebGPU context");
  }

  const renderer = new WebGPURenderer({
    device,
    context,
    antialias: true,
  });

  await renderer.init();

  console.log("WebGPU renderer initialized successfully");

  return {
    renderer,
    spark,
    backend: "webgpu",
  };
}

/**
 * Initialize WebGL renderer
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<{renderer: THREE.WebGLRenderer, spark: Spark, backend: string}>}
 */
async function initWebGLRenderer(canvas) {
  console.log("Initializing WebGL renderer...");

  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    //powerPreference: "high-performance",
  });

  if (!gl) {
    throw new Error("WebGL 2 not supported");
  }

  // Create spark with WebGL context using SparkGL
  const spark = await SparkGL.create(gl, {
    preload: ["rgba", "rgb", "rg", "r"],
  });

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl,
    antialias: true,
    alpha: false,
  });

  console.log("WebGL renderer initialized successfully");

  return {
    renderer,
    spark,
    backend: "webgl",
  };
}
