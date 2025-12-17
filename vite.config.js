/* global process */
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import copy from "rollup-plugin-copy";
import summary from "rollup-plugin-summary";

export default defineConfig({
  root: "./src",
  plugins: [basicSsl()],
  server: {
    https: process.env.HTTPS == "true",
  },
  build: {
    outDir: "../dist",
    minify: true,
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      plugins: [
        copy({
          targets: [
            { src: "src/models/*.glb", dest: "dist/models" },
            { src: "src/assets/*", dest: "dist/assets" },
            { src: "src/libs/basis/*", dest: "dist/libs/basis" },
            { src: "src/libs/draco/*", dest: "dist/libs/draco" },
            { src: "public/*", dest: "dist" },
          ],
          hook: "writeBundle",
          verbose: true,
        }),
        summary({ showGzippedSize: true, showBrotliSize: true }),
      ],
    },
  },
});
