import { showError } from "./ui.js";

function getWebGPURecommendation() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  if (/iphone|ipad|ipod/i.test(ua)) {
    return "If you are on iOS, WebGPU is only supported in Safari.";
  }
  if (/android/i.test(ua)) {
    return "If you are on Android, WebGPU is only supported in Chrome.";
  }
  if (/windows/i.test(ua)) {
    return "If you are on Windows, WebGPU is supported in Chrome and Edge. Firefox 141+ works with some known issues.";
  }
  if (/macintosh|mac os x/i.test(ua)) {
    return `If you are on macOS, WebGPU is supported in Safari and Chrome.
      Safari 26 and Safari Technology Preview work out of the box in Tahoe, but in earlier versions it needs to be enabled manually under Experimental Features.
      Firefox Nightly works with some known issues.`;
  }
  return ""; // other OS → no recommendation
}

export async function getWebGPUAdapter() {
  if (!navigator.gpu) {
    showError("WebGPU Not Supported", "This demo requires a browser with WebGPU support.<br/>" + getWebGPURecommendation());
    throw new Error("WebGPU not supported");
  }

  let adapter = null;
  try {
    adapter = await navigator.gpu.requestAdapter();
  } catch (err) {
    console.error("Error while requesting WebGPU adapter:", err);
  }

  if (!adapter) {
    showError("No GPU Adapter", "No appropriate GPUAdapter was found on this system.<br/>" + getWebGPURecommendation());
    throw new Error("No appropriate GPUAdapter found");
  }

  return adapter;
}
