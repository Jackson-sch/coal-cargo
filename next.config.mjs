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

  experimental: {
    serverActions: {
      allowedOrigins: [
        // El origen local, si lo necesitas
        "localhost:3000", 
        // **AÑADE AQUÍ EL DOMINIO DEL TÚNEL**
        "*.devtunnels.ms", // Permite todos los subdominios de devtunnels.ms (RECOMENDADO)
        // O la URL específica de tu túnel si el comodín no funciona
        // "ckx0c2lj-3000.brs.devtunnels.ms", 
      ],
    },
  },
};

export default nextConfig;
