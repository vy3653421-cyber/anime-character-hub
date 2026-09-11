import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] ?? "public/assets/avatar/avatar.glb";
const absolute = path.resolve(file);

if (!fs.existsSync(absolute)) {
  console.error(`Avatar GLB not found: ${file}`);
  process.exit(1);
}

const buffer = fs.readFileSync(absolute);
if (buffer.length < 20) throw new Error("GLB is too small");
if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error("Invalid GLB magic");
if (buffer.readUInt32LE(4) !== 2) throw new Error("Unsupported GLB version");
if (buffer.readUInt32LE(8) !== buffer.length) throw new Error("GLB length header mismatch");

let offset = 12;
let gltf = null;
while (offset + 8 <= buffer.length) {
  const chunkLength = buffer.readUInt32LE(offset);
  const chunkType = buffer.readUInt32LE(offset + 4);
  const start = offset + 8;
  const end = start + chunkLength;
  if (end > buffer.length) throw new Error("GLB chunk exceeds file bounds");
  if (chunkType === 0x4e4f534a) {
    gltf = JSON.parse(buffer.subarray(start, end).toString("utf8").replace(/\u0000+$/g, ""));
    break;
  }
  offset = end;
}

if (!gltf) throw new Error("GLB has no JSON chunk");

const animations = gltf.animations ?? [];
const animationNames = animations.map((a) => a.name).filter(Boolean);
const nodes = gltf.nodes ?? [];
const skins = gltf.skins ?? [];
const meshes = gltf.meshes ?? [];
const morphTargetMeshes = meshes.filter((m) => (m.primitives ?? []).some((p) => Array.isArray(p.targets) && p.targets.length > 0));
const requiredAnimations = ["idle", "breathing", "blink", "talking", "happy", "surprised", "concerned", "thinking", "sleeping"];
const missingAnimations = requiredAnimations.filter((name) => !animationNames.some((actual) => actual.toLowerCase() === name));
const requiredBones = ["root", "spine", "head", "hair_left", "hair_right", "ribbon_left", "ribbon_right"];
const missingBones = requiredBones.filter((name) => !nodes.some((node) => node.name === name));
const animationProblems = animations.flatMap((animation) => {
  const channels = animation.channels ?? [];
  if (!channels.length) return [`${animation.name ?? "<unnamed>"}: no animation channels`];
  return channels.flatMap((channel) => {
    const target = channel.target ?? {};
    const problems = [];
    if (!Number.isInteger(target.node) || !nodes[target.node]) problems.push("invalid target node");
    if (!["translation", "rotation", "scale", "weights"].includes(target.path)) problems.push("invalid target path");
    if (!Number.isInteger(channel.sampler) || !(animation.samplers ?? [])[channel.sampler]) problems.push("invalid sampler");
    return problems.length ? [`${animation.name ?? "<unnamed>"}: ${problems.join(", ")}`] : [];
  });
});

const failures = [];
if (skins.length === 0) failures.push("No glTF skin found");
if (meshes.length === 0) failures.push("No glTF meshes found");
if (morphTargetMeshes.length === 0) failures.push("No morph-target mesh found");
if (missingAnimations.length) failures.push(`Missing animations: ${missingAnimations.join(", ")}`);
if (animationProblems.length) failures.push(`Invalid animation channels: ${animationProblems.join(" | ")}`);
if (missingBones.length) failures.push(`Missing rig nodes: ${missingBones.join(", ")}`);

console.log(JSON.stringify({
  file,
  bytes: buffer.length,
  version: gltf.asset?.version,
  meshes: meshes.length,
  skins: skins.length,
  morphTargetMeshes: morphTargetMeshes.length,
  animations: animationNames,
  missingAnimations,
  missingBones,
}, null, 2));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
