/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@prisma/client");
    }

    // ✅ Usa filesystem cache (más seguro y rápido)
    config.cache = { type: "filesystem" };

    // ✅ Ignora rutas específicas correctamente
    config.watchOptions = {
      ignored: [
        "**/node_modules/**",
        "C:/Users/**",
        "**/Configuración local/**",
      ],
    };

    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };

    config.snapshot = {
      managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      immutablePaths: [],
    };

    config.infrastructureLogging = { level: "error" };
    config.ignoreWarnings = [/EPERM/, /scandir/];

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
