import { execFileSync } from "node:child_process";
export const screenshotRun =
  process.env.SCREENSHOT_RUN ||
  "run-" +
    execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim() +
    "-" +
    new Date().toISOString().replace(/[-:.]/g, "");
