import type { NextConfig } from "next";

// Phase 1 is a client-side app on mock data (localStorage), so Cache Components and
// partial prefetching are left off for predictable behaviour. See docs/decisions.md (D-01).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
