import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Auto-rename the default Vercel favicon to prevent it from overriding the logo icon
const faviconPath = path.join(process.cwd(), "src", "app", "favicon.ico");
const backupPath = path.join(process.cwd(), "src", "app", "favicon.ico.bak");
if (fs.existsSync(faviconPath)) {
  try {
    fs.renameSync(faviconPath, backupPath);
    console.log("Successfully renamed default Vercel favicon.ico to favicon.ico.bak");
  } catch (err) {
    console.error("Failed to rename Vercel favicon:", err);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
};

export default nextConfig;
