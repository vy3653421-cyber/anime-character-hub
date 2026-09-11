import { defineConfig } from "vite";

export default defineConfig({
  root: "src/renderer",
  // Electron loads the production renderer with file://. Vite's default "/" base
  // points module scripts at the filesystem root, leaving the packaged window as
  // static HTML. A relative base keeps renderer chunks and public assets beside
  // index.html inside the packaged application.
  base: "./",
  // Assets live in the repository-level public/ directory, not src/renderer/public.
  // Explicitly wiring it here makes the packaged Electron renderer carry the real
  // avatar and any installed human-recorded voice pack instead of shipping code only.
  publicDir: "../../public",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
