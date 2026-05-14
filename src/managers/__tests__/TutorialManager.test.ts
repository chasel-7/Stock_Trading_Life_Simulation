import { describe, it, expect } from 'vitest';
import { TutorialManager } from '../TutorialManager';

describe('TutorialManager', () => {
  it('should return steps for day 1 pre-market', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(1, 'pre-market');
    expect(steps.length).toBe(1);
    expect(steps[0].id).toBe('welcome');
  });

  it('should return no steps for day 3+', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(3, 'pre-market');
    expect(steps.length).toBe(0);
  });

  it('should track completed steps', () => {
    const mgr = new TutorialManager();
    expect(mgr.isCompleted('welcome')).toBe(false);
    mgr.complete('welcome');
    expect(mgr.isCompleted('welcome')).toBe(true);
  });

  it('should detect first-time player', () => {
    const mgr = new TutorialManager();
    expect(mgr.isFirstTime()).toBe(true);
    mgr.markTutorialDone();
    expect(mgr.isFirstTime()).toBe(false);
  });

  it('should allow skipping', () => {
    const mgr = new TutorialManager();
    mgr.skipAll();
    expect(mgr.getStepsForPhase(1, 'pre-market').length).toBe(0);
  });

  it('should filter out completed steps from results', () => {
    const mgr = new TutorialManager();
    mgr.complete('welcome');
    const steps = mgr.getStepsForPhase(1, 'pre-market');
    expect(steps.length).toBe(0);
  });

  it('should return trading steps for day 1', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(1, 'trading');
    expect(steps.length).toBe(2);
    expect(steps[0].id).toBe('trading-intro');
    expect(steps[1].id).toBe('after-buy');
  });

  it('should return post-market steps for day 2', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(2, 'post-market');
    expect(steps.length).toBe(2);
    expect(steps[0].id).toBe('post-market-intro');
  });
});
