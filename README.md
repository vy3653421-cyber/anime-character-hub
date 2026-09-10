# Desktop Mate

Advanced native desktop companion foundation.

## Architecture

- **Native desktop runtime:** Electron with secure IPC, context isolation, Node integration disabled, and sandboxing.
- **Renderer:** TypeScript + Three.js 3D avatar runtime.
- **Avatar:** production GLB/GLTF asset with rigging, facial animation, semantic animation clips, lip-sync hooks, and bounded secondary physics.
- **AI:** provider-agnostic agent layer with personality, persistent memory retrieval, and transparent tool-use rules.
- **Tools:** explicit registry with safe/confirmation/restricted permission gates; no arbitrary shell execution.
- **Memory:** durable JSON persistence with retrieval and atomic writes.
- **Voice:** human-recorded audio only; voice assets require attribution/license metadata and optional viseme cues. No TTS or voice cloning.
- **QA:** GitHub Actions runs tests, build, performance guardrails, and security static checks.

## Development

```bash
npm install
npm test
npm run build
npm run perf
node scripts/security-check.mjs
```

Copy `.env.example` to your local environment and provide an OpenAI-compatible provider configuration if AI chat is required. Never commit real API credentials.

## Asset requirements

The repository deliberately does **not** fake production assets. Before release, install and verify:

1. `public/assets/avatar/avatar.glb` — a real rigged 3D avatar with the required semantic animations and facial morph targets.
2. `public/assets/voice/manifest.json` — validated metadata identifying the human voice actor, license, recordings, and optional viseme cues.
3. The referenced human-recorded audio files under `public/assets/voice/`.

The application must report missing/unverified assets as unavailable rather than pretending they are production-ready.
