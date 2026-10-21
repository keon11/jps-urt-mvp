import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  root: "apps/web",
  define: { __FIXTURE_PREVIEW__: JSON.stringify(mode === "preview") },
  build: {
    outDir: mode === "preview" ? "../../dist-preview" : "../../dist",
    emptyOutDir: true,
  },
}));
