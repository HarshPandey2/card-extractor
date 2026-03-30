import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawPort = env.VITE_DEV_PORT || env.PORT;
  const port = rawPort ? Number(rawPort) : 5173;
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid dev server port: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH?.trim() || "/";

  return {
    base: basePath.endsWith("/") ? basePath : `${basePath}/`,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "localhost",
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "localhost",
    },
  };
});
