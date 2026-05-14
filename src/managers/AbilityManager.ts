import type { InfoItem } from '../models/types';
import { getCharacter } from '../data/characters';

export class AbilityManager {
  /** 互联网打工人：每天1条免费行业信息 */
  static programmerDailyInfo(stockIds: string[], day: number): InfoItem {
    const stockId = stockIds[Math.floor(Math.random() * stockIds.length)];
    const templates = [
      `行业消息：${stockId} 所在板块近期有政策利好`,
      `内部邮件提到 ${stockId} 相关技术突破`,
      `同事讨论 ${stockId} 所在行业景气度上升`,
    ];
    return {
      stockId,
      source: '工作内部',
      content: templates[Math.floor(Math.random() * templates.length)],
      accuracy: 0.55,
      day,
    };
  }

  /** 体制内青年：每3天1次免费研报（高准确度信息） */
  static civilServantResearch(stockIds: string[], day: number): InfoItem | null {
    const char = getCharacter('civil-servant');
    if (day % (char.researchInterval || 3) !== 0) return null;
    const stockId = stockIds[Math.floor(Math.random() * stockIds.length)];
    return {
      stockId,
      source: '免费研报',
      content: `研报分析：${stockId} 基本面评估为正面，建议关注`,
      accuracy: 0.75,
      day,
    };
  }

  /** 根据角色ID获取盘前阶段的特殊效果 */
  static getPreMarketAbility(
    characterId: string,
    stockIds: string[],
    day: number,
  ): { info?: InfoItem; message?: string } {
    switch (characterId) {
      case 'programmer':
        return {
          info: AbilityManager.programmerDailyInfo(stockIds, day),
          message: '💻 职业技能：获得一条免费行业信息',
        };
      case 'sales':
        // 社交折扣由GameManager.getSocialDiscount()处理，盘前仅显示提示
        return {
          message: '👔 人脉网络：今天社交消费打8折',
        };
      case 'freelancer':
        // 低手续费已在CharacterConfig中设置，盘前仅显示提示
        return {
          message: '🏠 自由职业：交易手续费0.5%（常驻）',
        };
      case 'civil-servant': {
        const research = AbilityManager.civilServantResearch(stockIds, day);
        if (research) {
          return {
            info: research,
            message: '👩‍🏫 体制内福利：今天获得免费研报！',
          };
        }
        const char = getCharacter('civil-servant');
        const nextDay = (char.researchInterval || 3) - (day % (char.researchInterval || 3));
        return {
          message: `👩‍🏫 距离下次免费研报还有${nextDay}天`,
        };
      }
      default:
        return {};
    }
  }
}
