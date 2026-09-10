import type { MemoryEntry } from "./contracts";

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "how", "i", "in", "is", "it", "me", "of", "on", "or", "tell", "that", "the",
  "this", "to", "what", "with", "you",
]);

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

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

    const queryTokens = new Set(tokenize(query));
    return this.list()
      .map((entry, index) => {
        const haystack = `${entry.content} ${entry.tags.join(" ")}`.toLowerCase();
        const contentTokens = new Set(tokenize(haystack));
        const overlap = [...queryTokens].filter((token) => contentTokens.has(token)).length;
        const exactPhrase = haystack.includes(needle) ? 1 : 0;
        return { entry, index, overlap, exactPhrase };
      })
      .filter(({ overlap }) => overlap > 0)
      .sort((a, b) =>
        b.exactPhrase - a.exactPhrase ||
        b.overlap - a.overlap ||
        b.index - a.index,
      )
      .map(({ entry }) => entry);
  }
}
