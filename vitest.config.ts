import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    env: {
      SKIP_ENV_VALIDATION: "1",
      DATABASE_URL: "file::memory:",
    },
  },
});
