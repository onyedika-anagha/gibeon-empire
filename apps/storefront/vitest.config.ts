import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Force a single physical React copy — npm nests a second one under the app,
// which otherwise gives two hook dispatchers ("useState of null") under jsdom.
const root = (p: string) => fileURLToPath(new URL(`../../node_modules/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      { find: /^react-dom\/(.*)$/, replacement: `${root("react-dom")}/$1` },
      { find: /^react-dom$/, replacement: root("react-dom") },
      { find: /^react\/(.*)$/, replacement: `${root("react")}/$1` },
      { find: /^react$/, replacement: root("react") },
    ],
    dedupe: ["react", "react-dom"],
  },
});
