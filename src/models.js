/**
 * Model configurations
 * Each model has multiple variants with different compression formats
 */
export const Models = {
  SciFiHelmet: [
    { label: "Original PNG", url: "./models/SciFiHelmet.glb", size: 26.64, vram: 85.33, active: true },
    { label: "Basis UASTC", url: "./models/SciFiHelmet-uastc.glb", size: 12.04, vram: 22.36 },
    { label: "Spark⚡ AVIF", url: "./models/SciFiHelmet-avif.glb", size: 2.5, vram: 18.66, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/SciFiHelmet-etc1s.glb", size: 1.96, vram: 13.33 },
    { label: "Spark⚡ AVIF (low)", url: "./models/SciFiHelmet-avif-lo.glb", size: 1.2, vram: 13.33, spark: "lo" },
  ],
  StainedGlassLamp: [
    { label: "Original PNG", url: "./models/StainedGlassLamp.glb", size: 31.7, vram: 311, active: true },
    { label: "Basis UASTC", url: "./models/StainedGlassLamp-uastc.glb", size: 33.78, vram: 77.75 },
    { label: "Spark⚡ AVIF", url: "./models/StainedGlassLamp-avif.glb", size: 4.9, vram: 77.54, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/StainedGlassLamp-etc1s.glb", size: 12.18, vram: 52.21 },
    { label: "Spark⚡ AVIF (low)", url: "./models/StainedGlassLamp-avif-lo.glb", size: 2.5, vram: 48.21, spark: "lo" },
  ],
  ToyCar: [
    { label: "Original PNG", url: "./models/ToyCar.glb", size: 2.05, vram: 34.67, active: true },
    { label: "Basis UASTC", url: "./models/ToyCar-uastc.glb", size: 0.34, vram: 8.67 },
    { label: "Spark⚡ AVIF", url: "./models/ToyCar-avif.glb", size: 0.26, vram: 8.0, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/ToyCar-etc1s.glb", size: 0.73, vram: 5.17 },
    { label: "Spark⚡ AVIF (low)", url: "./models/ToyCar-avif-lo.glb", size: 0.19, vram: 5.17, spark: "lo" },
  ],
  FlightHelmet: [
    { label: "Original PNG", url: "./models/FlightHelmet.glb", size: 43.05, vram: 272, active: true },
    { label: "Basis UASTC", url: "./models/FlightHelmet-uastc.glb", size: 38.66, vram: 68 },
    { label: "Spark⚡ AVIF", url: "./models/FlightHelmet-avif.glb", size: 7.2, vram: 68, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/FlightHelmet-etc1s.glb", size: 17.88, vram: 45.33 },
    { label: "Spark⚡ AVIF (low)", url: "./models/FlightHelmet-avif-lo.glb", size: 3.2, vram: 45.33, spark: "lo" },
  ],
};
