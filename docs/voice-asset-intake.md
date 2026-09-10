# Desktop Mate — Human Voice Asset Intake

Desktop Mate supports **human-recorded voice audio only**. This document defines the production gate for adding a voice pack.

## 1. Acceptable sources

A voice pack may be added when we have clear permission to redistribute and use the recordings in Desktop Mate. Examples include:

- recordings commissioned from a human voice actor with written project rights;
- recordings released under a license that explicitly permits the intended use and redistribution;
- recordings created by the project team with all required rights retained by the project.

A video being publicly viewable on YouTube or another site is **not** sufficient permission. The default YouTube license does not grant a general reuse right; Creative Commons material must satisfy its specific license conditions and attribution requirements.

## 2. Voice direction

The target should be an **original anime-inspired character voice**, not a recording or imitation of a named anime character or identifiable voice actor.

Good direction examples:

- soft, warm, gentle female protagonist;
- bright, energetic slice-of-life companion;
- calm, mature anime-style guide;
- shy but expressive conversational delivery.

Do not label or market the asset as the voice of a specific copyrighted character or performer.

## 3. Required manifest metadata

Every production recording must have:

- a stable `voiceId`;
- performer/actor credit;
- license name and/or contractual basis;
- source or rights-reference URL when applicable;
- attribution text when required;
- the exact audio asset path;
- duration;
- optional viseme timing data for lip-sync.

The manifest must contain enough provenance information for a later maintainer to understand why the project is allowed to ship the recording.

## 4. Recording requirements

Preferred production characteristics:

- lossless source recording retained by the project owner;
- clean spoken dialogue with no copyrighted background music;
- consistent microphone position and room treatment;
- 48 kHz source capture where practical;
- normalized delivery suitable for real-time playback;
- short reusable lines for greetings, confirmations, reactions, and tool feedback.

The repository may contain optimized runtime files, but the original source recordings and rights documentation should be retained separately when appropriate.

## 5. Lip-sync

Each line may optionally include viseme timing. Visemes describe mouth-shape changes and are not a substitute for the audio provenance requirement.

The runtime must remain functional when viseme data is absent; spoken audio must never be fabricated merely to fill a missing asset.

## 6. Release gate

A voice pack is not release-ready until:

1. every referenced audio file exists;
2. every recording has documented rights;
3. manifest metadata validates;
4. playback works in the packaged application;
5. lip-sync is visually checked where viseme data exists;
6. attribution requirements are preserved;
7. no TTS or voice-cloning fallback is silently substituted.

Until these checks pass, Desktop Mate stays text-first and reports voice as unavailable.
