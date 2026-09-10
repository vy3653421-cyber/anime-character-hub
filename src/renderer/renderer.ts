import "./chat-stream-ui";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AvatarRuntime } from "./avatar-runtime";
import { AvatarVoiceController } from "./avatar-voice-controller";
import { HumanVoicePlayback } from "./human-voice-playback";
import { validateAvatar } from "./avatar-validator";
import { getVoiceAvailability, resolveRecordedVoiceLine, validateVoiceManifest, type VoiceManifest } from "../core/voice-manifest";
import { BrowserSpeechInput } from "../core/speech-input";

type DesktopMateSettings = {
  name: string;
  responseStyle: "concise" | "balanced" | "detailed";
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  voiceEnabled: boolean;
  microphoneEnabled: boolean;
  toolConfirmations: boolean;
};

type DesktopTool = { id: string; description: string; risk: string; requiresConfirmation: boolean };

type DesktopMateBridge = {
  chat(text: string): Promise<{ requestId: string; text: string; model: string; provider: string }>;
  resetSession(): Promise<{ ok: boolean; reason?: string }>;
  getSettings(): Promise<DesktopMateSettings>;
  updateSettings(patch: Partial<DesktopMateSettings>): Promise<DesktopMateSettings>;
  listTools(): Promise<DesktopTool[]>;
  executeTool(request: { toolId: string; input?: unknown; confirmed?: boolean }): Promise<{ ok: boolean; requiresConfirmation?: boolean; reason?: string; data?: unknown }>;
};

declare global { interface Window { desktopMate?: DesktopMateBridge; } }

const mount = document.querySelector<HTMLDivElement>("#avatar");
const status = document.querySelector<HTMLDivElement>("#status");
const capabilities = document.querySelector<HTMLDivElement>("#capabilities");
const chatLog = document.querySelector<HTMLDivElement>("#chatLog");
const toolsList = document.querySelector<HTMLDivElement>("#toolsList");
const chatForm = document.querySelector<HTMLFormElement>("#chatForm");
const chatInput = document.querySelector<HTMLInputElement>("#chatInput");
const resetSessionButton = document.querySelector<HTMLButtonElement>("#resetSession");
const alwaysOnTopButton = document.querySelector<HTMLButtonElement>("#alwaysOnTop");
const voiceEnabledButton = document.querySelector<HTMLButtonElement>("#voiceEnabled");
const microphoneButton = document.querySelector<HTMLButtonElement>("#microphone");
if (!mount || !status || !capabilities || !chatLog || !toolsList || !chatForm || !chatInput || !resetSessionButton || !alwaysOnTopButton || !voiceEnabledButton || !microphoneButton) throw new Error("Desktop Mate renderer mount failed");

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
const speechInput = new BrowserSpeechInput("en-IN");
let avatarRoot: THREE.Object3D | undefined;
let voiceManifest: VoiceManifest | undefined;

const updateVoiceButton = (settings: DesktopMateSettings) => {
  const availability = getVoiceAvailability(voiceManifest);
  if (availability !== "ready") {
    voiceEnabledButton.textContent = "Voice: unavailable";
    voiceEnabledButton.title = availability === "not-installed"
      ? "Install a licensed human-recorded voice pack to enable playback."
      : "The voice pack contains no recordings.";
    return;
  }
  voiceEnabledButton.textContent = `Voice: ${settings.voiceEnabled ? "on" : "off"}`;
  voiceEnabledButton.title = "Playback uses only exact licensed human-recorded lines; no TTS is generated.";
};

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
  capabilities.appendChild(card);
  card.append(labelEl, valueEl);
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
    const availability = getVoiceAvailability(voiceManifest);
    renderCard("Voice manifest", availability === "ready" ? `${value.displayName} · ${value.assets.length} recorded lines` : "No recordings", availability === "ready");
    const settings = await window.desktopMate?.getSettings();
    if (settings) updateVoiceButton(settings);
  } catch (error) {
    voiceManifest = undefined;
    renderCard("Voice manifest", "Human voice pack not installed", false);
    if (window.desktopMate) {
      const settings = await window.desktopMate.getSettings();
      updateVoiceButton(settings);
    }
  }
};

const loadTools = async (bridge: DesktopMateBridge) => {
  try {
    const tools = await bridge.listTools();
    for (const tool of tools) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tool.id;
      button.title = tool.description;
      button.addEventListener("click", async () => {
        const settings = await bridge.getSettings();
        const needsConfirmation = tool.requiresConfirmation || tool.risk === "confirm";
        if (needsConfirmation && settings.toolConfirmations) {
          const approved = window.confirm(`Allow Desktop Mate to run “${tool.id}”?\n\n${tool.description}`);
          if (!approved) {
            status.textContent = `Action cancelled · ${tool.id}`;
            return;
          }
        }
        button.disabled = true;
        try {
          const result = await bridge.executeTool({ toolId: tool.id, confirmed: needsConfirmation });
          status.textContent = result.ok ? `Action completed · ${tool.id}` : `Action blocked · ${result.reason || "permission denied"}`;
        } catch (error) {
          status.textContent = `Action failed · ${error instanceof Error ? error.message : "unknown error"}`;
        } finally {
          button.disabled = false;
        }
      });
      toolsList.appendChild(button);
    }
    renderCard("Desktop tools", `${tools.length} policy-gated`, true);
  } catch (error) {
    renderCard("Desktop tools", "Unavailable", false);
    console.warn("[Tools] unavailable", error);
  }
};

const sendChat = async (text: string) => {
  const bridge = window.desktopMate;
  if (!bridge || !text.trim()) return;
  renderMessage("user", text.trim());
  try {
    const response = await bridge.chat(text.trim());
    renderMessage("assistant", response.text);
    const settings = await bridge.getSettings();
    if (settings.voiceEnabled && getVoiceAvailability(voiceManifest) === "ready" && voiceManifest) {
      const recordedLine = resolveRecordedVoiceLine(voiceManifest, response.text);
      if (recordedLine) {
        try { await voiceController.play(recordedLine); }
        catch (voiceError) { console.warn("[Voice] playback failed", voiceError); }
      }
    }
  } catch (error) {
    renderMessage("assistant", error instanceof Error ? `AI unavailable: ${error.message}` : "AI unavailable.");
  }
};

const bridge = window.desktopMate;
if (bridge) {
  speechInput.onResult((result) => {
    if (!result.isFinal) return;
    const transcript = result.transcript.trim();
    if (!transcript) return;
    chatInput.value = transcript;
    void sendChat(transcript);
    chatInput.value = "";
  });
  speechInput.onError((error) => {
    status.textContent = `Microphone error · ${error.message}`;
    microphoneButton.textContent = "Mic: error";
  });

  void bridge.getSettings().then(async (settings) => {
    alwaysOnTopButton.textContent = `Always on top: ${settings.alwaysOnTop ? "on" : "off"}`;
    updateVoiceButton(settings);
    renderCard("Settings", "Persistent", true);

    if (settings.microphoneEnabled && speechInput.supported) {
      try {
        await speechInput.start();
        microphoneButton.textContent = "Mic: on";
        status.textContent = "Microphone listening · click Mic to stop";
      } catch (error) {
        await bridge.updateSettings({ microphoneEnabled: false });
        microphoneButton.textContent = "Mic: unavailable";
        status.textContent = error instanceof Error ? error.message : "Microphone unavailable";
      }
    } else {
      microphoneButton.textContent = `Mic: ${settings.microphoneEnabled ? "unavailable" : "off"}`;
      if (!settings.microphoneEnabled) status.textContent = "Microphone off";
    }
  }).catch((error) => console.warn("[Settings] unavailable", error));

  void loadTools(bridge);

  resetSessionButton.addEventListener("click", async () => {
    resetSessionButton.disabled = true;
    try {
      const result = await bridge.resetSession();
      if (!result.ok) {
        status.textContent = `Conversation reset unavailable · ${result.reason || "AI provider not configured"}`;
        return;
      }
      chatLog.replaceChildren();
      status.textContent = "Conversation session reset · persistent memories were kept";
      chatInput.focus();
    } catch (error) {
      status.textContent = `Conversation reset failed · ${error instanceof Error ? error.message : "unknown error"}`;
    } finally {
      resetSessionButton.disabled = false;
    }
  });

  alwaysOnTopButton.addEventListener("click", async () => {
    const settings = await bridge.getSettings();
    const updated = await bridge.updateSettings({ alwaysOnTop: !settings.alwaysOnTop });
    alwaysOnTopButton.textContent = `Always on top: ${updated.alwaysOnTop ? "on" : "off"}`;
  });

  voiceEnabledButton.addEventListener("click", async () => {
    const settings = await bridge.getSettings();
    if (getVoiceAvailability(voiceManifest) !== "ready") {
      status.textContent = "Voice unavailable · install a licensed human-recorded voice pack";
      updateVoiceButton(settings);
      return;
    }
    const updated = await bridge.updateSettings({ voiceEnabled: !settings.voiceEnabled });
    updateVoiceButton(updated);
    if (!updated.voiceEnabled) voiceController.stop();
  });

  microphoneButton.addEventListener("click", async () => {
    const settings = await bridge.getSettings();
    const enable = !settings.microphoneEnabled;
    if (enable) {
      try {
        await speechInput.start();
        await bridge.updateSettings({ microphoneEnabled: true });
        microphoneButton.textContent = "Mic: on";
        status.textContent = "Microphone listening · click Mic to stop";
      } catch (error) {
        await bridge.updateSettings({ microphoneEnabled: false });
        microphoneButton.textContent = "Mic: unavailable";
        status.textContent = error instanceof Error ? error.message : "Microphone unavailable";
      }
    } else {
      speechInput.stop();
      await bridge.updateSettings({ microphoneEnabled: false });
      microphoneButton.textContent = "Mic: off";
      status.textContent = "Microphone stopped";
    }
  });
} else {
  renderCard("Bridge", "Unavailable", false);
  resetSessionButton.disabled = true;
}

renderCard("WebGL", "Ready", true);
renderCard("Microphone", speechInput.status().supported ? "Available on request" : "Unsupported", speechInput.status().supported);
void Promise.all([loadAvatar(), loadVoiceManifest()]);

window.addEventListener("beforeunload", () => {
  speechInput.stop();
  renderer.setAnimationLoop(null);
  voiceController.stop();
  avatarRuntime.dispose();
  if (avatarRoot) scene.remove(avatarRoot);
  avatarRoot = undefined;
  renderer.dispose();
});
