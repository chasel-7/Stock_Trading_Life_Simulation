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

  /**
   * 在场景中注入教学气泡（消除重复代码）。
   * 使用动态 import 避免与 DialogBubble 的循环依赖。
   * @param scene Phaser Scene (uses registry to get TutorialManager)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static inject(scene: any, day: number, phase: string): void {
    const tutorial = scene.registry?.get('tutorialManager') as TutorialManager | undefined;
    if (!tutorial) return;
    const steps = tutorial.getStepsForPhase(day, phase);
    if (steps.length === 0) return;

    import('../ui/DialogBubble').then(({ DialogBubble }) => {
      let idx = 0;
      const showNext = () => {
        if (idx >= steps.length) return;
        const step = steps[idx];
        new DialogBubble(scene, {
          npcName: step.npcName,
          npcEmoji: step.npcEmoji,
          message: step.message,
          highlightArea: step.highlightArea,
          onDismiss: () => {
            tutorial.complete(step.id);
            idx++;
            showNext();
          },
          onSkip: () => tutorial.skipAll(),
        });
      };
      showNext();
    });
  }
}
