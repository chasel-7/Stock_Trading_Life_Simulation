import Phaser from 'phaser';
import { PositionSize } from '../config/constants';

export type OrderType = 'buy' | 'sell';

export interface OrderResult {
  type: OrderType;
  stockId: string;
  amount: number;
  positionSize: PositionSize;
}

export class OrderDialog extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle;
  private card: Phaser.GameObjects.Container;
  private titleTxt: Phaser.GameObjects.Text;
  private amountTxt: Phaser.GameObjects.Text;
  private feeTxt: Phaser.GameObjects.Text;
  private selectedSize: PositionSize = PositionSize.HALF;
  private sizeButtons: { bg: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text; size: PositionSize }[] = [];
  private availableCash = 0;
  private holdingValue = 0;
  private stockId = '';
  private orderType: OrderType = 'buy';
  private commissionRate = 0.01;
  private onConfirm: (result: OrderResult) => void = () => {};

  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, 0, 0);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    // 半透明遮罩
    this.overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0, 0).setInteractive();
    this.add(this.overlay);

    // 卡片
    this.card = scene.add.container(width / 2, height / 2);
    this.add(this.card);

    const cardW = 320, cardH = 280;
    const cardBg = scene.add.rectangle(0, 0, cardW, cardH, 0x1e1e3a, 1)
      .setStrokeStyle(1, 0x4a90d9, 0.5);
    this.card.add(cardBg);

    // 标题
    this.titleTxt = scene.add.text(0, -cardH / 2 + 30, '确认下单', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.card.add(this.titleTxt);

    // 仓位按钮
    const sizes = [
      { label: '全仓', size: PositionSize.FULL },
      { label: '半仓', size: PositionSize.HALF },
      { label: '1/4仓', size: PositionSize.QUARTER },
    ];
    sizes.forEach((s, i) => {
      const bx = -100 + i * 100;
      const bg = scene.add.rectangle(bx, 20, 80, 36, 0x333366, 1)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x4a90d9, 0);
      const txt = scene.add.text(bx, 20, s.label, {
        fontSize: '14px', color: '#ccc', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      bg.on('pointerup', () => this.selectSize(s.size));
      this.card.add(bg);
      this.card.add(txt);
      this.sizeButtons.push({ bg, txt, size: s.size });
    });

    // 金额/手续费
    this.amountTxt = scene.add.text(0, 70, '', {
      fontSize: '14px', color: '#e0e0e0', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.card.add(this.amountTxt);

    this.feeTxt = scene.add.text(0, 95, '', {
      fontSize: '12px', color: '#888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.card.add(this.feeTxt);

    // 确认按钮
    const confirmBg = scene.add.rectangle(-60, cardH / 2 - 40, 120, 40, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    const confirmTxt = scene.add.text(-60, cardH / 2 - 40, '确认', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    confirmBg.on('pointerup', () => this.confirm());
    this.card.add(confirmBg);
    this.card.add(confirmTxt);

    // 取消按钮
    const cancelBg = scene.add.rectangle(60, cardH / 2 - 40, 120, 40, 0x555555, 1)
      .setInteractive({ useHandCursor: true });
    const cancelTxt = scene.add.text(60, cardH / 2 - 40, '取消', {
      fontSize: '16px', color: '#ccc', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    cancelBg.on('pointerup', () => this.hide());
    this.card.add(cancelBg);
    this.card.add(cancelTxt);

    this.setVisible(false);
  }

  show(params: {
    type: OrderType;
    stockId: string;
    price: number;
    cash: number;
    holdingValue: number;
    commissionRate: number;
    onConfirm: (result: OrderResult) => void;
  }): void {
    this.orderType = params.type;
    this.stockId = params.stockId;
    this.availableCash = params.cash;
    this.holdingValue = params.holdingValue;
    this.commissionRate = params.commissionRate;
    this.onConfirm = params.onConfirm;
    this.selectedSize = PositionSize.HALF;

    this.titleTxt.setText(
      params.type === 'buy'
        ? `买入 ${params.stockId}`
        : `卖出 ${params.stockId}`
    );

    this.updateDisplay();
    this.setVisible(true);
    this.setDepth(1000);
  }

  hide(): void {
    this.setVisible(false);
  }

  private selectSize(size: PositionSize): void {
    this.selectedSize = size;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    // 高亮选中的仓位
    this.sizeButtons.forEach(b => {
      const active = b.size === this.selectedSize;
      b.bg.setStrokeStyle(active ? 2 : 0, 0x4a90d9, active ? 1 : 0);
      b.txt.setColor(active ? '#4a90d9' : '#ccc');
    });

    const base = this.orderType === 'buy' ? this.availableCash : this.holdingValue;
    const amount = Math.floor(base * this.selectedSize);
    const fee = Math.round(amount * this.commissionRate * 100) / 100;

    const label = this.orderType === 'buy' ? '预计花费' : '预计卖出';
    this.amountTxt.setText(`${label}: ¥${amount.toLocaleString()}`);
    this.feeTxt.setText(`手续费: ¥${fee.toFixed(2)}`);
  }

  private confirm(): void {
    const base = this.orderType === 'buy' ? this.availableCash : this.holdingValue;
    const amount = Math.floor(base * this.selectedSize);
    this.onConfirm({
      type: this.orderType,
      stockId: this.stockId,
      amount,
      positionSize: this.selectedSize,
    });
    this.hide();
  }
}
