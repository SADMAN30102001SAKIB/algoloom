/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          monaco: {
            test: /[\\/]node_modules[\\/](@monaco-editor)[\\/]/,
            name: "monaco",
            priority: 30,
          },
        },
      };
    }

    // Suppress webpack cache warning for large strings (Monaco Editor)
    config.infrastructureLogging = {
      level: "error",
    };

    return config;
  },
};

export default nextConfig;
