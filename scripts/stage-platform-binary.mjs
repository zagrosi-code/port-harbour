#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { cargoBinaryCandidates, getPlatformPackage, platformTargets } from "./platforms.mjs";

export function stagePlatformBinary({ root = process.cwd(), target, source } = {}) {
  if (!target) {
    throw new Error(`Missing target. Expected one of: ${platformTargets.join(", ")}`);
  }

  const config = getPlatformPackage(target);
  const candidates = source
    ? [path.resolve(root, source)]
    : cargoBinaryCandidates(root, target);
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!sourcePath) {
    throw new Error(
      [
        `Missing Rust scanner binary for ${target}.`,
        `Build it with: cd rust && cargo build --release --target ${config.rustTarget}`,
        "Checked:",
        ...candidates.map((candidate) => `  - ${candidate}`)
      ].join("\n")
    );
  }

  const binDir = path.join(root, "bin");
  const resolvedSourcePath = path.resolve(sourcePath);
  fs.mkdirSync(binDir, { recursive: true });

  for (const entry of fs.readdirSync(binDir)) {
    const entryPath = path.join(binDir, entry);
    if (entry.startsWith("portharbour-") && path.resolve(entryPath) !== resolvedSourcePath) {
      fs.rmSync(entryPath, { force: true });
    }
  }

  const destinationPath = path.join(binDir, config.extensionBinary);
  if (resolvedSourcePath !== path.resolve(destinationPath)) {
    fs.copyFileSync(sourcePath, destinationPath);
  }
  if (!config.extensionBinary.endsWith(".exe")) {
    fs.chmodSync(destinationPath, 0o755);
  }

  return { sourcePath, destinationPath };
}

function parseArgs(argv) {
  const [target, ...rest] = argv;
  const sourceIndex = rest.indexOf("--source");
  const source = sourceIndex >= 0 ? rest[sourceIndex + 1] : undefined;
  return { target, source };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = stagePlatformBinary(parseArgs(process.argv.slice(2)));
    console.log(`staged ${result.sourcePath} -> ${result.destinationPath}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
