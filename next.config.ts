import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next appends its own block to AGENTS.md on `next dev`; keep that file as the project wrote it.
  agentRules: false,
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
