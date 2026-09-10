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

const animations = new Set((json.animations ?? []).map((a) => String(a.name ?? "").toLowerCase()));
const required = ["idle", "breathing", "blink", "talking", "thinking", "happy", "surprised", "concerned", "sleeping"];
const missing = required.filter((name) => !animations.has(name));
const meshes = json.meshes ?? [];
const skins = json.skins ?? [];
const morphTargets = meshes.reduce((count, mesh) => count + (mesh.primitives ?? []).reduce((n, primitive) => n + ((primitive.targets ?? []).length > 0 ? 1 : 0), 0), 0);

if (!json.scenes?.length || !json.nodes?.length) throw new Error("GLB has no scene/nodes");
if (!skins.length) throw new Error("GLB has no skin/armature");
if (!animations.length) throw new Error("GLB has no animations");
if (missing.length) throw new Error(`Missing semantic animations: ${missing.join(", ")}`);
if (!morphTargets) throw new Error("GLB has no morph-target primitives");

console.log(JSON.stringify({ file: path.normalize(file), bytes: data.length, nodes: json.nodes.length, skins: skins.length, animations: animations.size, morphTargetPrimitives: morphTargets }, null, 2));
