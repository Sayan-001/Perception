import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  turbopack: {
    root: typeof __dirname !== "undefined" ? __dirname : process.cwd(),
  },
};

export default nextConfig;
