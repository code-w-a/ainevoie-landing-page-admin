import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@integrations-config": fileURLToPath(
        new URL("./integrations.config.tsx", import.meta.url),
      ),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    restoreMocks: true,
  },
});
