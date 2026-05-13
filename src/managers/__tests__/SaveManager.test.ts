import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../SaveManager';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
});

describe('SaveManager', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  it('should save and load state', () => {
    const state = { cash: 30000, currentDay: 3 };
    SaveManager.save(state as any);
    const loaded = SaveManager.load();
    expect(loaded).toEqual(state);
  });

  it('should return null when no save exists', () => {
    expect(SaveManager.load()).toBeNull();
  });

  it('should delete save', () => {
    SaveManager.save({ cash: 100 } as any);
    SaveManager.deleteSave();
    expect(SaveManager.load()).toBeNull();
  });

  it('should detect save existence', () => {
    expect(SaveManager.hasSave()).toBe(false);
    SaveManager.save({ cash: 100 } as any);
    expect(SaveManager.hasSave()).toBe(true);
  });
});
