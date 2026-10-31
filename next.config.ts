import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next appends its own block to AGENTS.md on `next dev`; keep that file as the project wrote it.
  agentRules: false,
  experimental: {
    // Three 10 MB photos plus multipart overhead; the default is 1 MB. The action re-checks every file.
    serverActions: { bodySizeLimit: "32mb" },
  },
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
