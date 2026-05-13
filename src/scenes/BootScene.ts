import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, '股票人生模拟器', {
      fontSize: '28px',
      color: '#e0e0e0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50, '所有的选择都有价格', {
      fontSize: '16px',
      color: '#888',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 2秒后进入角色选择
    this.time.delayedCall(2000, () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
