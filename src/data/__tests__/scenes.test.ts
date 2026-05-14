import { describe, it, expect } from 'vitest';
import { getUnlockedScenes, getRandomEvents, SCENE_CONFIGS, SCENE_EVENTS } from '../scenes';
import { MoodLevel } from '../../config/constants';

describe('SCENE_CONFIGS', () => {
  it('should have 10 scenes', () => {
    expect(SCENE_CONFIGS.length).toBe(10);
  });

  it('should have unique ids', () => {
    const ids = SCENE_CONFIGS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('SCENE_EVENTS', () => {
  it('should have 21 events', () => {
    expect(SCENE_EVENTS.length).toBe(21);
  });

  it('every event should reference a valid scene', () => {
    const sceneIds = new Set(SCENE_CONFIGS.map(s => s.id));
    SCENE_EVENTS.forEach(e => {
      expect(sceneIds.has(e.sceneId)).toBe(true);
    });
  });
});

describe('getUnlockedScenes', () => {
  it('DEVASTATED should unlock 3 scenes (home, park, phone)', () => {
    const scenes = getUnlockedScenes(MoodLevel.DEVASTATED);
    expect(scenes.length).toBe(3);
    const ids = scenes.map(s => s.id);
    expect(ids).toContain('home');
    expect(ids).toContain('park');
    expect(ids).toContain('phone');
  });

  it('SAD should unlock 6 scenes (+ food-stall, bookstore, convenience)', () => {
    const scenes = getUnlockedScenes(MoodLevel.SAD);
    expect(scenes.length).toBe(6);
    const ids = scenes.map(s => s.id);
    expect(ids).toContain('home');
    expect(ids).toContain('food-stall');
    expect(ids).toContain('bookstore');
    expect(ids).toContain('convenience');
  });

  it('NEUTRAL should unlock same 6 as SAD (no scenes require NEUTRAL)', () => {
    const scenes = getUnlockedScenes(MoodLevel.NEUTRAL);
    expect(scenes.length).toBe(6);
  });

  it('HAPPY should unlock 8 scenes (+ bar, restaurant)', () => {
    const scenes = getUnlockedScenes(MoodLevel.HAPPY);
    expect(scenes.length).toBe(8);
    const ids = scenes.map(s => s.id);
    expect(ids).toContain('bar');
    expect(ids).toContain('restaurant');
  });

  it('EUPHORIC should unlock all 10 scenes', () => {
    const scenes = getUnlockedScenes(MoodLevel.EUPHORIC);
    expect(scenes.length).toBe(10);
    const ids = scenes.map(s => s.id);
    expect(ids).toContain('ktv');
    expect(ids).toContain('spa');
  });
});

describe('getRandomEvents', () => {
  it('should return events for food-stall', () => {
    const events = getRandomEvents('food-stall', 2);
    expect(events.length).toBe(2);
    events.forEach(e => expect(e.sceneId).toBe('food-stall'));
  });

  it('should not exceed pool size', () => {
    const events = getRandomEvents('home', 10);
    expect(events.length).toBe(2); // home only has 2 events
  });

  it('should return 1 event for convenience (only has 1)', () => {
    const events = getRandomEvents('convenience', 2);
    expect(events.length).toBe(1);
  });
});
