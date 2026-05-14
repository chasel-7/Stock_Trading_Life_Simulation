import { test, expect } from '@playwright/test';

test.describe('Stock Life Simulator - Smoke Tests', () => {
  test('should load the game and show title screen', async ({ page }) => {
    await page.goto('/');
    // Phaser canvas should be present
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    // Wait for game to initialize
    await page.waitForTimeout(3000);
  });

  test('game container should fit viewport', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('#game-container');
    await expect(container).toBeVisible();
    const box = await container.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(5000);
    // Filter out known non-critical warnings
    const critical = errors.filter(e => !e.includes('favicon'));
    expect(critical).toEqual([]);
  });
});
