import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [new URL("https://img.logo.dev/**")],
  },
};

export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    output: undefined,
    // Reports remain authenticated upstream. Intake stays disabled locally.
    async rewrites() {
      return [{
        source: "/__owner-report",
        destination: "https://empluzzed-activity.nothenrynguyen.workers.dev/report",
      }];
    },
  };
}
