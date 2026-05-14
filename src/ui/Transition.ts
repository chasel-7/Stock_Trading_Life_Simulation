import Phaser from 'phaser';
import { THEME } from './theme';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class Transition {
  /** 淡入淡出转场 */
  static fadeToScene(currentScene: Phaser.Scene, targetScene: string, data?: object): void {
    const overlay = currentScene.add.rectangle(
      0, 0, GAME_WIDTH, GAME_HEIGHT,
      THEME.colors.bgPrimary, 0,
    ).setOrigin(0, 0).setDepth(9999);

    currentScene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        currentScene.scene.start(targetScene, data);
      },
    });
  }

  /** 场景淡入 */
  static fadeIn(scene: Phaser.Scene, duration: number = 400): void {
    const overlay = scene.add.rectangle(
      0, 0, GAME_WIDTH, GAME_HEIGHT,
      THEME.colors.bgPrimary, 1,
    ).setOrigin(0, 0).setDepth(9998);

    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => overlay.destroy(),
    });
  }

  /** 数字跳动动画 */
  static countUp(
    scene: Phaser.Scene,
    textObj: Phaser.GameObjects.Text,
    from: number,
    to: number,
    duration: number = 800,
    prefix: string = '¥',
  ): void {
    const obj = { value: from };
    scene.tweens.add({
      targets: obj,
      value: to,
      duration,
      ease: 'Power2',
      onUpdate: () => {
        textObj.setText(`${prefix}${Math.round(obj.value).toLocaleString()}`);
      },
    });
  }
}
