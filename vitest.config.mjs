import { fileURLToPath } from "node:url";

const config = {
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["**/.kilo/**", "**/node_modules/**"],
  },
};

export default config;
