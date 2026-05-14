export class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  init(): void {
    try {
      this.ctx = new AudioContext();
    } catch {
      this.enabled = false;
    }
  }

  toggle(): void {
    this.enabled = !this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** 按钮点击音 */
  playClick(): void {
    this.playTone(800, 0.05, 'sine');
  }

  /** 买入音效 */
  playBuy(): void {
    this.playTone(523, 0.1, 'sine');
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
  }

  /** 卖出音效 */
  playSell(): void {
    this.playTone(659, 0.1, 'sine');
    setTimeout(() => this.playTone(523, 0.1, 'sine'), 100);
  }

  /** 价格跳动音（微弱） */
  playTick(): void {
    this.playTone(1200, 0.02, 'sine', 0.05);
  }

  /** 好消息 */
  playGood(): void {
    this.playTone(523, 0.1, 'sine');
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 120);
    setTimeout(() => this.playTone(784, 0.15, 'sine'), 240);
  }

  /** 坏消息 */
  playBad(): void {
    this.playTone(400, 0.15, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.12), 150);
  }

  /** 日结算 */
  playSettle(): void {
    this.playTone(440, 0.15, 'triangle');
    setTimeout(() => this.playTone(554, 0.15, 'triangle'), 200);
    setTimeout(() => this.playTone(659, 0.2, 'triangle'), 400);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.1,
  ): void {
    if (!this.enabled || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

/** 全局单例 */
export const audioManager = new AudioManager();
