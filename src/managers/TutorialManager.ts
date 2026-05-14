import { TUTORIAL_STEPS, type TutorialStep } from '../data/tutorialSteps';

const STORAGE_KEY = 'stock-life-tutorial-done';

export class TutorialManager {
  private completedSteps = new Set<string>();
  private skipped = false;

  constructor() {
    try {
      this.skipped = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      // localStorage may not be available in test environment
      this.skipped = false;
    }
  }

  isFirstTime(): boolean {
    return !this.skipped;
  }

  getStepsForPhase(day: number, phase: string): TutorialStep[] {
    if (this.skipped) return [];
    return TUTORIAL_STEPS.filter(
      s => s.day === day && s.phase === phase && !this.completedSteps.has(s.id)
    );
  }

  complete(stepId: string): void {
    this.completedSteps.add(stepId);
  }

  isCompleted(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }

  skipAll(): void {
    this.skipped = true;
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }
  }

  markTutorialDone(): void {
    this.skipped = true;
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }
  }
}
