import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.chattanoogashooting.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
