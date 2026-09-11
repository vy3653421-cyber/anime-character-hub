import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] ?? "public/assets/avatar/avatar.glb";
const data = fs.readFileSync(file);
if (data.length < 20) throw new Error(`GLB is too small: ${file}`);
if (data.readUInt32LE(0) !== 0x46546c67) throw new Error("Invalid GLB magic");
if (data.readUInt32LE(4) !== 2) throw new Error("Unsupported GLB version");
if (data.readUInt32LE(8) !== data.length) throw new Error("GLB length header mismatch");

const chunkLength = data.readUInt32LE(12);
const chunkType = data.readUInt32LE(16);
if (chunkType !== 0x4e4f534a) throw new Error("First GLB chunk is not JSON");
const json = JSON.parse(data.subarray(20, 20 + chunkLength).toString("utf8").replace(/\u0000+$/g, ""));

const animations = json.animations ?? [];
const animationNames = new Set(animations.map((a) => String(a.name ?? "").toLowerCase()));
const required = ["idle", "breathing", "blink", "talking", "thinking", "happy", "surprised", "concerned", "sleeping"];
const missing = required.filter((name) => !animationNames.has(name));
const meshes = json.meshes ?? [];
const skins = json.skins ?? [];
const nodes = json.nodes ?? [];
const morphTargets = meshes.reduce((count, mesh) => count + (mesh.primitives ?? []).reduce((n, primitive) => n + ((primitive.targets ?? []).length > 0 ? 1 : 0), 0), 0);
const skinnedNodes = nodes.filter((node) => Number.isInteger(node.mesh) && Number.isInteger(node.skin));
const skinnedPrimitives = meshes.reduce((count, mesh) => count + (mesh.primitives ?? []).reduce((n, primitive) => {
  const attributes = primitive.attributes ?? {};
  return n + (Number.isInteger(attributes.JOINTS_0) && Number.isInteger(attributes.WEIGHTS_0) ? 1 : 0);
}, 0), 0);
const validSkinJoints = skins.reduce((count, skin) => count + ((skin.joints ?? []).filter((joint) => Number.isInteger(joint) && nodes[joint]).length > 0 ? 1 : 0), 0);
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

if (!json.scenes?.length || !nodes.length) throw new Error("GLB has no scene/nodes");
if (!skins.length) throw new Error("GLB has no skin/armature");
if (!animations.length) throw new Error("GLB has no animations");
if (missing.length) throw new Error(`Missing semantic animations: ${missing.join(", ")}`);
if (animationProblems.length) throw new Error(`Invalid animation channels: ${animationProblems.join(" | ")}`);
if (!morphTargets) throw new Error("GLB has no morph-target primitives");
if (!skinnedNodes.length) throw new Error("GLB has no mesh node referencing a skin");
if (!skinnedPrimitives) throw new Error("GLB has no primitive with JOINTS_0 and WEIGHTS_0");
if (!validSkinJoints) throw new Error("GLB skin has no valid joint nodes");

console.log(JSON.stringify({
  file: path.normalize(file),
  bytes: data.length,
  nodes: nodes.length,
  meshes: meshes.length,
  skins: skins.length,
  skinnedNodes: skinnedNodes.length,
  skinnedPrimitives,
  animations: animationNames.size,
  morphTargetPrimitives: morphTargets,
}, null, 2));
