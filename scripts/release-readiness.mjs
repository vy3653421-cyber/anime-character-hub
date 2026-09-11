import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const hasText = (relativePath) => {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8").trim().length > 0;
  } catch {
    return false;
  }
};

const checks = [
  {
    name: "avatar asset present",
    status: exists("public/assets/avatar/avatar.glb") && exists("public/assets/avatar/desktop_mate_character.blend"),
    evidence: "public/assets/avatar/avatar.glb + desktop_mate_character.blend"
  },
  {
    name: "voice production pack supplied",
    status: exists("public/assets/voice/manifest.json"),
    evidence: "public/assets/voice/manifest.json"
  },
  {
    name: "AI provider configuration supplied locally",
    status: Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY),
    evidence: "OPENAI_API_KEY or AI_API_KEY environment variable"
  },
  {
    name: "AI provider base URL supplied locally",
    status: Boolean(process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL),
    evidence: "OPENAI_BASE_URL or AI_BASE_URL environment variable"
  },
  {
    name: "voice intake documentation present",
    status: hasText("docs/voice-asset-intake.md"),
    evidence: "docs/voice-asset-intake.md"
  },
  {
    name: "QA runbook present",
    status: hasText("docs/release-qa.md"),
    evidence: "docs/release-qa.md"
  }
];

console.log("Desktop Mate release readiness");
console.log("===============================");
for (const check of checks) {
  console.log(`${check.status ? "PASS" : "BLOCKED"}  ${check.name} — ${check.evidence}`);
}

const blocked = checks.filter((check) => !check.status).length;
console.log(`\n${checks.length - blocked}/${checks.length} local evidence checks satisfied.`);
console.log("Manual runtime checks and real-provider verification must still be performed where marked in the release criteria.");
process.exitCode = 0;
