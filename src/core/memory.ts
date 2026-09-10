import type { MemoryEntry } from "./contracts";

export class MemoryStore {
  private readonly entries = new Map<string, MemoryEntry>();

  save(content: string, tags: string[] = []): MemoryEntry {
    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      content,
      tags: [...tags],
    };
    this.entries.set(entry.id, entry);
    return entry;
  }

  list(): MemoryEntry[] {
    return [...this.entries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  search(query: string): MemoryEntry[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return this.list().filter((entry) =>
      `${entry.content} ${entry.tags.join(" ")}`.toLowerCase().includes(needle),
    );
  }
}
