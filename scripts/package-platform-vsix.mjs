#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getPlatformPackage, platformTargets } from "./platforms.mjs";
import { stagePlatformBinary } from "./stage-platform-binary.mjs";

export function packagePlatformVsix({ root = process.cwd(), target } = {}) {
  if (!target) {
    throw new Error(`Missing target. Expected one of: ${platformTargets.join(", ")}`);
  }

  getPlatformPackage(target);
  stagePlatformBinary({ root, target });

  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const outDir = path.join(root, "dist");
  const outputPath = path.join(outDir, `${manifest.name}-${manifest.version}-${target}.vsix`);
  const vsceBin = path.join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vsce.cmd" : "vsce"
  );

  fs.mkdirSync(outDir, { recursive: true });

  const result = spawnSync(
    vsceBin,
    ["package", "--target", target, "-o", outputPath],
    { cwd: root, stdio: "inherit" }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`vsce package failed for ${target} with exit code ${result.status}`);
  }

  return outputPath;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const outputPath = packagePlatformVsix({ target: process.argv[2] });
    console.log(`packaged ${outputPath}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
