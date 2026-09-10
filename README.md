# Desktop Mate

Advanced native desktop companion foundation.

## Current implementation

- **Native desktop runtime:** Electron with secure IPC, context isolation, Node integration disabled, and sandboxing.
- **Renderer:** TypeScript + Three.js 3D avatar runtime with responsive HUD, conversation UI, desktop actions, and quick settings.
- **Avatar:** generated rigged GLB plus Blender source are checked into `public/assets/avatar/`; validation covers the rig, semantic animation clips, and facial morph targets.
- **AI:** provider-agnostic agent layer with personality, persistent memory retrieval, and transparent tool-use rules.
- **Tools:** explicit registry with safe/confirmation/restricted permission gates; no arbitrary shell execution.
- **Memory:** durable JSON persistence with retrieval and atomic writes.
- **Voice:** human-recorded audio only; voice assets require attribution/license metadata and optional viseme cues. No TTS or voice cloning. Production recordings are intentionally not fabricated.
- **QA:** GitHub Actions runs tests, typecheck, renderer build, performance guardrails, security checks, packaging, and an Electron startup smoke test.

## Release completion criteria

Desktop Mate is considered release-complete only when all of these are true:

1. CI is green on the release commit for Linux verification plus Windows and macOS packaging.
2. The packaged application starts successfully and its runtime assets validate.
3. The avatar is visually reviewed in the running application in addition to structural asset validation.
4. AI chat is verified against a real configured provider in a local environment; credentials are never committed.
5. Desktop actions remain permission-gated and allowlisted; arbitrary shell execution remains unavailable.
6. Persistent memory and settings survive application restart.
7. Window state, tray behavior, close-to-tray behavior, and launch-at-login behavior are manually checked on supported desktop platforms.
8. If spoken responses are enabled for release, `public/assets/voice/manifest.json` and the referenced **human-recorded** audio files must be supplied with valid attribution/license metadata. Until then, voice stays unavailable and the product remains text-first.
9. Release installers/artifacts are retained from the successful release CI run.

## Development

```bash
npm install
npm test
npm run build
npm run perf
node scripts/security-check.mjs
npm run package:dir
```

Copy `.env.example` to your local environment and provide an OpenAI-compatible provider configuration if AI chat is required. Never commit real API credentials.

## Asset requirements

The repository does not fake production voice assets. Before enabling spoken responses in a release, provide:

1. `public/assets/voice/manifest.json` — validated metadata identifying the human voice actor, license, recordings, and optional viseme cues.
2. The referenced **human-recorded** audio files under `public/assets/voice/`.

Until those recordings exist, the application remains text-first and reports voice as unavailable. The avatar asset is already present and is validated in CI.

## Security model

Desktop actions are allowlisted and policy-gated. Unknown actions are denied, restricted actions cannot be executed, and confirmation-classified actions require explicit approval. The renderer has no Node.js access and communicates with the main process through the preload bridge.
