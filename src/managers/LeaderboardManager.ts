import type { LeaderboardEntry, LeaderboardCategory } from '../models/leaderboardTypes';
import { LEADERBOARD_CONFIGS } from '../models/leaderboardTypes';

const STORAGE_KEY = 'stock-life-leaderboard';

export class LeaderboardManager {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  submit(data: Omit<LeaderboardEntry, 'id' | 'timestamp'>): void {
    const entry: LeaderboardEntry = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    this.save();
  }

  getTop(category: LeaderboardCategory, limit: number): LeaderboardEntry[] {
    const config = LEADERBOARD_CONFIGS.find(c => c.category === category);
    if (!config) return [];
    const field = config.sortField;
    return [...this.entries]
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, limit);
  }

  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries)); } catch { /* noop */ }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.entries = raw ? JSON.parse(raw) : [];
    } catch {
      this.entries = [];
    }
  }
}
