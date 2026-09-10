import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist/renderer");
const required = [
  "assets/avatar/avatar.glb",
];

const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length) {
  throw new Error(`Packaged renderer is missing required runtime assets: ${missing.join(", ")}`);
}

const avatar = path.join(root, "assets/avatar/avatar.glb");
const stat = fs.statSync(avatar);
if (stat.size < 20) throw new Error(`Packaged avatar is unexpectedly small: ${avatar}`);

const voiceManifest = path.join(root, "assets/voice/manifest.json");
const voicePack = fs.existsSync(voiceManifest) ? "installed" : "not-installed";

console.log(JSON.stringify({
  rendererRoot: root,
  avatar: { path: path.relative(root, avatar), bytes: stat.size },
  humanRecordedVoicePack: voicePack,
}, null, 2));
