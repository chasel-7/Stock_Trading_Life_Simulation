import type { GameState } from '../models/types';

const SAVE_KEY = 'stock-life-save';

export class SaveManager {
  static save(state: GameState): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      console.warn('SaveManager: Failed to save state');
    }
  }

  static load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  }

  static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  static deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      console.warn('SaveManager: Failed to delete save');
    }
  }
}
