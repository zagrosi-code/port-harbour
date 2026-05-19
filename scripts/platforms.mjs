import path from "node:path";

export const platformPackages = {
  "darwin-arm64": {
    rustTarget: "aarch64-apple-darwin",
    cargoBinary: "portharbour",
    extensionBinary: "portharbour-darwin-arm64"
  },
  "darwin-x64": {
    rustTarget: "x86_64-apple-darwin",
    cargoBinary: "portharbour",
    extensionBinary: "portharbour-darwin-x64"
  },
  "linux-x64": {
    rustTarget: "x86_64-unknown-linux-gnu",
    cargoBinary: "portharbour",
    extensionBinary: "portharbour-linux-x64"
  },
  "win32-x64": {
    rustTarget: "x86_64-pc-windows-msvc",
    cargoBinary: "portharbour.exe",
    extensionBinary: "portharbour-win32-x64.exe"
  }
};

export const platformTargets = Object.keys(platformPackages);

export function getPlatformPackage(target) {
  const config = platformPackages[target];
  if (!config) {
    throw new Error(`Unknown VS Code target "${target}". Expected one of: ${platformTargets.join(", ")}`);
  }
  return config;
}

export function hostVsixTarget() {
  const os =
    process.platform === "win32"
      ? "win32"
      : process.platform === "darwin"
        ? "darwin"
        : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `${os}-${arch}`;
}

export function cargoBinaryCandidates(root, target) {
  const config = getPlatformPackage(target);
  const candidates = [
    path.join(root, "rust", "target", config.rustTarget, "release", config.cargoBinary)
  ];

  if (target === hostVsixTarget()) {
    candidates.push(path.join(root, "rust", "target", "release", config.cargoBinary));
  }

  return candidates;
}
