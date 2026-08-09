import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Loads .env into process.env for `vite dev` (nitro doesn't do this on its own —
// see src/server.ts for the equivalent in the built production server).
try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if secrets are set as real environment variables instead.
}

export default defineConfig({
  server: {
    port: 8080,
  },
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Redirects TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    tanstackStart({
      server: { entry: "server" },
    }),
    // "node-server" runs anywhere with Node; switch the preset if this ends up
    // deployed somewhere specific (e.g. "cloudflare-module", "vercel").
    nitro({ preset: "node-server" }),
    viteReact(),
  ],
});
