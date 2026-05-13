import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const devPort = parseInt(process.env.PORT || process.env.VITE_DEV_PORT || '8082', 10);
  return {
    server: {
      host: '::',
      port: devPort,
      hmr: {
        overlay: false,
        // ensure the HMR client connects to the same port the server is listening on
        clientPort: devPort,
      },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:4000`,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: `http://127.0.0.1:4000`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      copyPublicDir: true,
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
