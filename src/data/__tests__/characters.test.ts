import { describe, it, expect } from 'vitest';
import { CHARACTERS, getCharacter, CHARACTER_ORDER } from '../characters';

describe('characters', () => {
  it('should have 4 characters', () => {
    expect(Object.keys(CHARACTERS).length).toBe(4);
  });

  it('should have correct order', () => {
    expect(CHARACTER_ORDER).toEqual(['programmer', 'sales', 'freelancer', 'civil-servant']);
  });

  it('should return programmer with correct stats', () => {
    const c = getCharacter('programmer');
    expect(c.startingCash).toBe(30000);
    expect(c.dailySalary).toBe(800);
    expect(c.dailyLivingCost).toBe(200);
    expect(c.eventFrequency).toBe(0.5);
    expect(c.commissionRate).toBe(0.01);
    expect(c.emoji).toBe('🧑‍💻');
    expect(c.difficulty).toBe(3);
    expect(c.playstyle).toBe('信息流选手');
  });

  it('should return sales with social discount', () => {
    const c = getCharacter('sales');
    expect(c.startingCash).toBe(20000);
    expect(c.socialDiscount).toBe(0.8);
    expect(c.emoji).toBe('👔');
    expect(c.difficulty).toBe(2);
  });

  it('should return freelancer with low commission and random salary', () => {
    const c = getCharacter('freelancer');
    expect(c.startingCash).toBe(50000);
    expect(c.dailySalary).toEqual([0, 1000]);
    expect(c.commissionRate).toBe(0.005);
    expect(c.emoji).toBe('🏠');
    expect(c.difficulty).toBe(4);
  });

  it('should return civil-servant with research interval', () => {
    const c = getCharacter('civil-servant');
    expect(c.startingCash).toBe(15000);
    expect(c.researchInterval).toBe(3);
    expect(c.emoji).toBe('👩‍🏫');
    expect(c.difficulty).toBe(2);
  });

  it('should throw for unknown character', () => {
    expect(() => getCharacter('unknown')).toThrow();
  });
});
