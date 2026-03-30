import fs from "node:fs";

for (const f of ["package-lock.json", "yarn.lock"]) {
  try {
    fs.unlinkSync(new URL(`../${f}`, import.meta.url));
  } catch {
    /* ignore */
  }
}

const ua = process.env.npm_config_user_agent ?? "";
if (!ua.includes("pnpm")) {
  console.error("Use pnpm instead of npm/yarn (see README).");
  process.exit(1);
}
