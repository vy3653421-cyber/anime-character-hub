import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AvatarRuntime } from "./avatar-runtime";

const mount = document.querySelector<HTMLDivElement>("#avatar");
const status = document.querySelector<HTMLDivElement>("#status");
const capabilities = document.querySelector<HTMLDivElement>("#capabilities");
if (!mount || !status || !capabilities) throw new Error("Desktop Mate renderer mount failed");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
camera.position.set(0, 1.35, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const clock = new THREE.Clock();
const avatarRuntime = new AvatarRuntime();
let avatarRoot: THREE.Object3D | undefined;

renderer.setAnimationLoop(() => {
  avatarRuntime.update(clock.getDelta());
  renderer.render(scene, camera);
});
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x202030, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(2, 4, 3);
scene.add(key);

const resize = () => {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};
new ResizeObserver(resize).observe(mount);
resize();

const renderCard = (label: string, value: string, ready: boolean) => {
  const card = document.createElement("div");
  card.className = "card";
  const labelEl = document.createElement("div");
  labelEl.className = "label";
  labelEl.textContent = label;
  const valueEl = document.createElement("div");
  valueEl.className = `value ${ready ? "ready" : "pending"}`;
  valueEl.textContent = value;
  card.append(labelEl, valueEl);
  capabilities.appendChild(card);
};

const inspectAvatar = (gltf: GLTF) => {
  const clips = gltf.animations.map((clip) => clip.name).filter(Boolean);
  let skinnedMeshes = 0;
  let morphTargets = 0;
  gltf.scene.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh) {
      skinnedMeshes += 1;
      if (object.morphTargetDictionary) morphTargets += Object.keys(object.morphTargetDictionary).length;
    }
  });
  return { clips, skinnedMeshes, morphTargets };
};

const loadAvatar = async () => {
  try {
    const gltf = await new GLTFLoader().loadAsync("/assets/avatar/avatar.glb");
    const report = inspectAvatar(gltf);
    if (report.skinnedMeshes === 0) throw new Error("Avatar GLB has no skinned mesh");
    if (report.clips.length === 0) throw new Error("Avatar GLB has no animation clips");

    gltf.scene.position.y = -1.05;
    avatarRoot = gltf.scene;
    scene.add(avatarRoot);
    const runtimeStatus = avatarRuntime.load(avatarRoot, gltf.animations);

    status.textContent = `3D avatar loaded · ${report.clips.length} animation clips · ${report.morphTargets} morph targets`;
    renderCard("3D avatar", "Ready", true);
    renderCard("Rig", `${report.skinnedMeshes} skinned mesh${report.skinnedMeshes === 1 ? "" : "es"}`, true);
    renderCard("Animations", `${report.clips.length} verified`, true);
    renderCard("Face", `${runtimeStatus.morphTargetCount} morph targets`, runtimeStatus.morphTargetCount > 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown asset error";
    status.textContent = `3D renderer ready · avatar asset unavailable (${message})`;
    renderCard("3D avatar", "Not installed", false);
    renderCard("WebGL", "Ready", true);
    renderCard("AI agent", "Core only", false);
    renderCard("Voice", "Not installed", false);
  }
};

renderCard("WebGL", "Ready", true);
void loadAvatar();

window.addEventListener("beforeunload", () => {
  renderer.setAnimationLoop(null);
  avatarRuntime.dispose();
  if (avatarRoot) scene.remove(avatarRoot);
  avatarRoot = undefined;
  renderer.dispose();
});
