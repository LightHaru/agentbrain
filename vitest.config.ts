import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // First test to touch the plugin pays a one-time cost to load the ONNX
    // embedding model; the default 5s can flake on cold cache / slower disks.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
