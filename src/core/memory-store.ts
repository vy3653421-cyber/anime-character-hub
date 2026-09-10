import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { MemoryEntry } from "./contracts";

export interface MemoryPersistence {
  load(): Promise<MemoryEntry[]>;
  save(entries: MemoryEntry[]): Promise<void>;
}

export class JsonFileMemoryPersistence implements MemoryPersistence {
  constructor(private readonly filePath: string) {}

  async load(): Promise<MemoryEntry[]> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.filePath, "utf8"));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((entry): entry is MemoryEntry => {
        if (typeof entry !== "object" || entry === null) return false;
        const value = entry as Partial<MemoryEntry>;
        return typeof value.id === "string" && typeof value.createdAt === "string" &&
          typeof value.content === "string" && Array.isArray(value.tags) &&
          value.tags.every((tag) => typeof tag === "string");
      });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT") return [];
      throw error;
    }
  }

  async save(entries: MemoryEntry[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(entries, null, 2), "utf8");
    await rename(tempPath, this.filePath);
  }
}
