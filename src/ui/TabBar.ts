import Phaser from 'phaser';

export class TabBar extends Phaser.GameObjects.Container {
  private tabs: { bg: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text }[] = [];
  private indicator: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number,
    labels: string[],
    onChange: (index: number) => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const TAB_H = 44;
    const tabW = width / labels.length;

    // 背景
    const bg = scene.add.rectangle(0, 0, width, TAB_H, 0x16213e, 1).setOrigin(0, 0);
    this.add(bg);

    labels.forEach((label, i) => {
      const tabBg = scene.add.rectangle(i * tabW, 0, tabW, TAB_H, 0x000000, 0)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      const txt = scene.add.text(i * tabW + tabW / 2, TAB_H / 2, label, {
        fontSize: '15px', color: i === 0 ? '#4a90d9' : '#888', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      tabBg.on('pointerup', () => {
        this.selectTab(i);
        onChange(i);
      });

      this.add(tabBg);
      this.add(txt);
      this.tabs.push({ bg: tabBg, txt });
    });

    // 底部指示条
    this.indicator = scene.add.rectangle(0, TAB_H - 3, tabW, 3, 0x4a90d9, 1).setOrigin(0, 0);
    this.add(this.indicator);
  }

  selectTab(index: number): void {
    this.tabs.forEach((t, i) => {
      t.txt.setColor(i === index ? '#4a90d9' : '#888');
    });
    const tabW = this.indicator.width;
    this.scene.tweens.add({
      targets: this.indicator,
      x: index * tabW,
      duration: 200,
      ease: 'Power2',
    });
  }
}
