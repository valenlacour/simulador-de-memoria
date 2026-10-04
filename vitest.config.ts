import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      // Las interfaces no tienen código ejecutable, no se les mide cobertura.
      exclude: ["src/interfaces/**"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 91, // la consigna pide estrictamente más de 90%
      },
    },
  },
});