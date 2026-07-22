import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to the monorepo root so Turbopack resolves
  // workspace packages (@gibeon/*) correctly.
  turbopack: { root: join(__dirname, "..", "..") },
  // Shared workspace packages ship raw TS/TSX — transpile them here.
  transpilePackages: ["@gibeon/ui", "@gibeon/types"],
};

export default nextConfig;
