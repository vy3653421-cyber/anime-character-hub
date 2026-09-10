# Desktop Mate

Advanced native desktop companion project.

## Architecture

- Native desktop runtime: Electron target with secure IPC
- Renderer: TypeScript-based 3D avatar runtime
- Avatar: production GLB/GLTF asset, rigging, facial animation and physics
- AI: provider-agnostic agent layer with personality, memory and tool orchestration
- Tools: explicit registry with permission gates
- Memory: session memory with a path to durable storage and retrieval
- QA: GitHub Actions typecheck and test gates

## Important status

The repository foundation is being built incrementally. A real 3D character asset is intentionally not represented by a fake placeholder; it must be generated/imported and verified as an actual GLB/GLTF asset before being marked complete.
