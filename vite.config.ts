import { defineConfig } from "vite";

export default defineConfig({
  root: "src/renderer",
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
