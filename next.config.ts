import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
    // With a middleware present, Next buffers request bodies and drops anything over 10MB.
    // Clip and video uploads go through route handlers, so lift it to match STUDIO_FILE_MAX_MB.
    middlewareClientMaxBodySize: "1gb",
  },
  serverExternalPackages: ["@aws-sdk/client-s3", "@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
