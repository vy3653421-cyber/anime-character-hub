import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AvatarRuntime } from "./avatar-runtime";
import { AvatarVoiceController } from "./avatar-voice-controller";
import { HumanVoicePlayback } from "./human-voice-playback";
import { validateAvatar } from "./avatar-validator";
import { resolveRecordedVoiceLine, validateVoiceManifest, type VoiceManifest } from "../core/voice-manifest";

type DesktopMateSettings = {
  name: string;
  responseStyle: "concise" | "balanced" | "detailed";
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  voiceEnabled: boolean;
  microphoneEnabled: boolean;
  toolConfirmations: boolean;
};

type DesktopMateBridge = {
  chat(text: string): Promise<{ requestId: string; text: string; model: string; provider: string }>;
  getSettings(): Promise<DesktopMateSettings>;
  updateSettings(patch: Partial<DesktopMateSettings>): Promise<DesktopMateSettings>;
};

declare global { interface Window { desktopMate?: DesktopMateBridge; } }

const mount = document.querySelector<HTMLDivElement>("#avatar");
const status = document.querySelector<HTMLDivElement>("#status");
const capabilities = document.querySelector<HTMLDivElement>("#capabilities");
const chatLog = document.querySelector<HTMLDivElement>("#chatLog");
const chatForm = document.querySelector<HTMLFormElement>("#chatForm");
const chatInput = document.querySelector<HTMLInputElement>("#chatInput");
const alwaysOnTopButton = document.querySelector<HTMLButtonElement>("#alwaysOnTop");
const voiceEnabledButton = document.querySelector<HTMLButtonElement>("#voiceEnabled");
if (!mount || !status || !capabilities || !chatLog || !chatForm || !chatInput || !alwaysOnTopButton || !voiceEnabledButton) throw new Error("Desktop Mate renderer mount failed");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
camera.position.set(0, 1.35, 4.2);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const clock = new THREE.Clock();
const avatarRuntime = new AvatarRuntime();
const voicePlayback = new HumanVoicePlayback();
const voiceController = new AvatarVoiceController(avatarRuntime, voicePlayback);
let avatarRoot: THREE.Object3D | undefined;
let voiceManifest: VoiceManifest | undefined;

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  avatarRuntime.update(delta);
  voicePlayback.update(delta);
  voiceController.update();
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

const renderMessage = (role: "user" | "assistant", text: string) => {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
};

const reportAvatar = (report: ReturnType<typeof validateAvatar>) => {
  if (report.valid) status.textContent = `3D avatar validated · ${report.animationClips.length} clips · ${report.morphTargetCount} morph targets`;
  else status.textContent = `3D avatar rejected · ${report.errors.join("; ")}`;
  renderCard("3D avatar", report.valid ? "Ready" : "Rejected", report.valid);
  renderCard("Rig", `${report.skinnedMeshes} skinned mesh${report.skinnedMeshes === 1 ? "" : "es"}`, report.skinnedMeshes > 0);
  renderCard("Animations", `${report.animationClips.length} detected`, report.animationClips.length > 0);
  renderCard("Face", `${report.morphTargetCount} morph targets`, report.morphTargetCount > 0);
  renderCard("Semantic map", `${Object.keys(report.semanticClips).length} mapped`, Boolean(report.semanticClips.idle));
  for (const warning of report.warnings) console.warn(`[Avatar] ${warning}`);
};

const inspectAndLoadAvatar = (gltf: GLTF) => {
  const report = validateAvatar(gltf.scene, gltf.animations);
  reportAvatar(report);
  if (!report.valid) return;
  gltf.scene.position.y = -1.05;
  avatarRoot = gltf.scene;
  scene.add(avatarRoot);
  avatarRuntime.load(avatarRoot, gltf.animations);
};

const loadAvatar = async () => {
  try {
    const gltf = await new GLTFLoader().loadAsync("./assets/avatar/avatar.glb");
    inspectAndLoadAvatar(gltf);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown asset error";
    status.textContent = `3D renderer ready · avatar asset unavailable (${message})`;
    renderCard("3D avatar", "Not installed", false);
    renderCard("WebGL", "Ready", true);
    renderCard("AI agent", "Core only", false);
    renderCard("Voice engine", "Human recordings only", false);
  }
};

const loadVoiceManifest = async () => {
  try {
    const response = await fetch("./assets/voice/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`manifest request failed (${response.status})`);
    const value: unknown = await response.json();
    if (!validateVoiceManifest(value)) throw new Error("manifest failed validation");
    voiceManifest = value;
    renderCard("Voice manifest", `${value.displayName} · ${value.assets.length} recorded lines`, true);
  } catch (error) {
    voiceManifest = undefined;
    const message = error instanceof Error ? error.message : "Unknown voice asset error";
    renderCard("Voice manifest", `Not installed (${message})`, false);
  }
};

const bridge = window.desktopMate;
if (bridge) {
  void bridge.getSettings().then((settings) => {
    alwaysOnTopButton.textContent = `Always on top: ${settings.alwaysOnTop ? "on" : "off"}`;
    voiceEnabledButton.textContent = `Voice: ${settings.voiceEnabled ? "on" : "off"}`;
    renderCard("Settings", "Persistent", true);
  }).catch((error) => console.warn("[Settings] unavailable", error));

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    renderMessage("user", text);
    chatInput.value = "";
    chatInput.disabled = true;
    try {
      const response = await bridge.chat(text);
      renderMessage("assistant", response.text);
      const settings = await bridge.getSettings();
      if (settings.voiceEnabled && voiceManifest) {
        const recordedLine = resolveRecordedVoiceLine(voiceManifest, response.text);
        if (recordedLine) {
          try {
            await voiceController.play(recordedLine);
          } catch (voiceError) {
            console.warn("[Voice] playback failed", voiceError);
          }
        }
      }
    } catch (error) {
      renderMessage("assistant", error instanceof Error ? `AI unavailable: ${error.message}` : "AI unavailable.");
    } finally {
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  alwaysOnTopButton.addEventListener("click", async () => {
    const settings = await bridge.getSettings();
    const updated = await bridge.updateSettings({ alwaysOnTop: !settings.alwaysOnTop });
    alwaysOnTopButton.textContent = `Always on top: ${updated.alwaysOnTop ? "on" : "off"}`;
  });

  voiceEnabledButton.addEventListener("click", async () => {
    const settings = await bridge.getSettings();
    const updated = await bridge.updateSettings({ voiceEnabled: !settings.voiceEnabled });
    voiceEnabledButton.textContent = `Voice: ${updated.voiceEnabled ? "on" : "off"}`;
    if (!updated.voiceEnabled) voiceController.stop();
  });
} else {
  renderCard("Bridge", "Unavailable", false);
  chatForm.addEventListener("submit", (event) => event.preventDefault());
}

renderCard("WebGL", "Ready", true);
void Promise.all([loadAvatar(), loadVoiceManifest()]);

window.addEventListener("beforeunload", () => {
  renderer.setAnimationLoop(null);
  voiceController.stop();
  avatarRuntime.dispose();
  if (avatarRoot) scene.remove(avatarRoot);
  avatarRoot = undefined;
  renderer.dispose();
});
