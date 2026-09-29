import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:5199",
  },
  webServer: {
    command: "npm run dev -- --port 5199 --host 127.0.0.1",
    url: "http://127.0.0.1:5199",
    reuseExistingServer: true,
  },
});
