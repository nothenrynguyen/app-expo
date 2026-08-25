import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [new URL("https://img.logo.dev/**")],
  },
};

export default nextConfig;
