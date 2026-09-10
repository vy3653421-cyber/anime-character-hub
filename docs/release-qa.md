# Desktop Mate release QA

## Real-provider AI E2E

Configure these environment variables locally (never commit the API key):

- `DESKTOP_MATE_AI_BASE_URL`
- `DESKTOP_MATE_AI_API_KEY`
- `DESKTOP_MATE_AI_MODEL`

Then run:

```bash
npm install
npm run qa:ai
```

The test performs both a normal `/chat/completions` request and an SSE streaming request, and requires non-empty assistant text plus a terminating stream event.

The same test is available from GitHub Actions through the **Desktop Mate Real AI E2E** workflow. Configure the three repository secrets before dispatching that workflow.

## Manual desktop / visual QA

Run the built application with `npm start` and verify:

1. The window opens and the avatar renders without a blank canvas or console error.
2. The avatar is visually inspected for rig pose, proportions, materials, facial presentation, animation playback, and obvious rendering defects.
3. Chat input sends and receives responses; streaming text appears progressively when a provider is configured.
4. Reset conversation clears the visible conversation while persistent memories remain available.
5. Always-on-top changes the native window state.
6. Voice and microphone settings reflect their actual availability; no unavailable voice is presented as working.
7. Tray Show/Hide toggles the window correctly.
8. Closing the window hides it rather than quitting when close-to-tray behavior is enabled.
9. Quit from the tray actually terminates the application.
10. Window size/position survives restart.
11. Launch-at-login changes the native login-item setting as expected on the supported platform.
12. Desktop actions requiring confirmation actually prompt before execution.

These checks intentionally remain human/runtime checks. CI startup and asset validation do not substitute for visual inspection or platform behavior verification.
