import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  serverExternalPackages: ["@aws-sdk/client-s3"],
};

export default nextConfig;
