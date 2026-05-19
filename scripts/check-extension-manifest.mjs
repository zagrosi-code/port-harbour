import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function hasCommand(command) {
  return manifest.contributes.commands.some((entry) => entry.command === command);
}

assert.equal(manifest.publisher, "zagrosi-code");
assert.equal(manifest.name, "port-harbour");
assert.match(manifest.scripts.package, /--target darwin-arm64/);
assert.equal(manifest.icon, "assets/icon.png");
assert.ok(fs.existsSync(path.join(root, manifest.icon)), "Marketplace icon is missing");
assert.ok(fs.existsSync(path.join(root, "assets/harbour-activity.svg")), "Activity Bar icon is missing");

assert.ok(manifest.activationEvents.includes("onStartupFinished"));
assert.ok(manifest.activationEvents.includes("onCommand:harbour.show"));
assert.ok(manifest.activationEvents.includes("onCommand:harbour.openSidebar"));
assert.ok(manifest.activationEvents.includes("onView:harbour.sidebar"));

assert.ok(hasCommand("harbour.show"), "Open command is missing");
assert.ok(hasCommand("harbour.openSidebar"), "Sidebar command is missing");

const activityContainers = manifest.contributes.viewsContainers.activitybar;
assert.ok(
  activityContainers.some(
    (container) =>
      container.id === "port-harbour" &&
      container.title === "Port Harbour" &&
      container.icon === "assets/harbour-activity.svg"
  ),
  "Activity Bar container is missing"
);

const harbourViews = manifest.contributes.views["port-harbour"];
assert.ok(
  harbourViews.some(
    (view) =>
      view.type === "webview" &&
      view.id === "harbour.sidebar" &&
      view.name === "Harbour"
  ),
  "Harbour webview view is missing"
);

assert.ok(
  manifest.contributes.menus["view/title"].some(
    (menu) => menu.command === "harbour.show" && menu.when === "view == harbour.sidebar"
  ),
  "Sidebar title action is missing"
);

console.log("extension manifest checks passed");
