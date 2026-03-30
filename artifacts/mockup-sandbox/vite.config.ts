import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawPort = env.PORT;
  const port = rawPort ? Number(rawPort) : 5174;
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid dev server port: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH?.trim() || "/";

  return {
    base: basePath.endsWith("/") ? basePath : `${basePath}/`,
    plugins: [mockupPreviewPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
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
