/**
 * Model configurations
 * Each model has multiple variants with different compression formats
 */
export const Models = {
  SciFiHelmet: [
    { label: "Original PNG", url: "./models/SciFiHelmet.glb", size: 25.4, vram: 64, active: true },
    { label: "Basis UASTC", url: "./models/SciFiHelmet-uastc.glb", size: 12.04, vram: 22.36 },
    { label: "Spark⚡ AVIF", url: "./models/SciFiHelmet-avif.glb", size: 2.8, vram: 18.66, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/SciFiHelmet-etc1s.glb", size: 1.96, vram: 13.33 },
    { label: "Spark⚡ AVIF (low)", url: "./models/SciFiHelmet-avif-lo.glb", size: 1.2, vram: 13.33, spark: "lo" },
  ],
  StainedGlassLamp: [
    { label: "Original PNG", url: "./models/StainedGlassLamp.glb", size: 31.7, vram: 233.3, active: true },
    { label: "Basis UASTC", url: "./models/StainedGlassLamp-uastc.glb", size: 33.78, vram: 77.6 },
    { label: "Spark⚡ AVIF", url: "./models/StainedGlassLamp-avif.glb", size: 4.9, vram: 77.6, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/StainedGlassLamp-etc1s.glb", size: 12.18, vram: 52.3 },
    { label: "Spark⚡ AVIF (low)", url: "./models/StainedGlassLamp-avif-lo.glb", size: 2.4, vram: 48.3, spark: "lo" },
  ],
  ToyCar: [
    { label: "Original PNG", url: "./models/ToyCar.glb", size: 2.05, vram: 34.67, active: true },
    { label: "Basis UASTC", url: "./models/ToyCar-uastc.glb", size: 0.73, vram: 8.67 },
    { label: "Spark⚡ AVIF", url: "./models/ToyCar-avif.glb", size: 0.26, vram: 8.0, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/ToyCar-etc1s.glb", size: 0.34, vram: 5.2 },
    { label: "Spark⚡ AVIF (low)", url: "./models/ToyCar-avif-lo.glb", size: 0.19, vram: 5.2, spark: "lo" },
  ],
  FlightHelmet: [
    { label: "Original PNG", url: "./models/FlightHelmet.glb", size: 43.05, vram: 204, active: true },
    { label: "Basis UASTC", url: "./models/FlightHelmet-uastc.glb", size: 38.66, vram: 68 },
    { label: "Spark⚡ AVIF", url: "./models/FlightHelmet-avif.glb", size: 8.7, vram: 68, spark: "hi" },
    { label: "Basis ETC1S", url: "./models/FlightHelmet-etc1s.glb", size: 17.88, vram: 45.4 },
    { label: "Spark⚡ AVIF (low)", url: "./models/FlightHelmet-avif-lo.glb", size: 3.3, vram: 45.4, spark: "lo" },
  ],
  Teacup: [
    { label: "Original PNG+JPG", url: "./models/DiffuseTransmissionTeacup.glb", size: 1.7, vram: 36, active: true },
    { label: "Spark⚡ AVIF", url: "./models/DiffuseTransmissionTeacup-avif.glb", size: 0.34, vram: 12, spark: "hi" },
    { label: "Spark⚡ AVIF", url: "./models/DiffuseTransmissionTeacup-avif.glb", size: 0.13, vram: 7, spark: "lo" },
  ],
  ForestHouse: [
    { label: "Original AVIF", url: "./models/forest_house.glb", size: 1.7, vram: 48, active: true },
    { label: "Spark⚡ AVIF", url: "./models/forest_house.glb", size: 1.7, vram: 16, spark: "hi" },
  ],
};
