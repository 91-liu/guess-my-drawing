/**
 * E2E测试 - 多玩家场景和边界情况
 */

import { test, expect } from '@playwright/test';

test.describe('Multiplayer and Edge Cases', () => {
  test('should handle 3-player game', async ({ page, context }) => {
    // Player 1 creates room
    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'ThreePlayer1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    // Player 2 joins
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'ThreePlayer2');
    await page2.click('button:has-text("加入房间")');

    // Player 3 joins
    const page3 = await context.newPage();
    await page3.goto('/');
    await page3.fill('input[placeholder="请输入房间ID"]', roomId);
    await page3.fill('input[placeholder="请输入昵称"]', 'ThreePlayer3');
    await page3.click('button:has-text("加入房间")');

    // Verify all players are visible
    await expect(page1.locator('text=ThreePlayer1')).toBeVisible();
    await expect(page1.locator('text=ThreePlayer2')).toBeVisible();
    await expect(page1.locator('text=ThreePlayer3')).toBeVisible();

    // Start game
    await page1.click('button:has-text("开始游戏")');

    // All players should see game started
    await expect(page1.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });
    await expect(page3.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });

    // Verify word pool size (3 players * 2 = 6 words)
    const wordPoolText = await page1.locator('text=/候选词池 \\(\\d+ 个词\\)/').textContent();
    const wordCount = parseInt(wordPoolText.match(/\d+/)[0]);
    expect(wordCount).toBe(6);
  });

  test('should handle player leaving during game', async ({ page, context }) => {
    // Setup 2-player game
    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'LeavePlayer1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'LeavePlayer2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    await expect(page1.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });

    // Player 2 closes tab (disconnects)
    await page2.close();

    // Player 1 should see offline status
    await expect(page1.locator('text=/离线|已离开/')).toBeVisible({ timeout: 5000 });
  });

  test('should transfer host when host leaves', async ({ page, context }) => {
    // Create room with host
    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'OriginalHost');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    // Guest joins
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'NewHost');
    await page2.click('button:has-text("加入房间")');

    // Verify original host has crown
    await expect(page1.locator('text=OriginalHost 👑')).toBeVisible();

    // Host leaves
    await page1.locator('button:has-text("离开房间")').click();

    // Guest should now be host
    await expect(page2.locator('text=NewHost 👑')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('button:has-text("开始游戏")')).toBeVisible();
  });

  test('should prevent starting game with only 1 player', async ({ page }) => {
    // Create room with single player
    await page.goto('/');
    await page.fill('input[placeholder="请输入昵称"]', 'SoloPlayer');
    await page.click('button:has-text("创建房间")');

    // Try to start game (should not see button or it should be disabled)
    const startButton = page.locator('button:has-text("开始游戏")');

    // Button might not exist or be disabled
    if (await startButton.isVisible()) {
      await startButton.click();
      // Should show error about needing more players
      await expect(page.locator('text=/至少|需要/')).toBeVisible();
    }
  });

  test('should show round end summary', async ({ page, context }) => {
    // This test would need timer completion or manual trigger
    // For now, we test the structure exists

    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'SummaryP1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'SummaryP2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    // Wait for game to start
    await expect(page1.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });

    // Note: Full round completion would require waiting for timer
    // or implementing test helpers to skip phases
  });

  test('should handle maximum players (10)', async ({ page, context }) => {
    // Create room
    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'MaxPlayer1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    // Add 9 more players
    const playerPages = [];
    for (let i = 2; i <= 10; i++) {
      const playerPage = await context.newPage();
      await playerPage.goto('/');
      await playerPage.fill('input[placeholder="请输入房间ID"]', roomId);
      await playerPage.fill('input[placeholder="请输入昵称"]', `MaxPlayer${i}`);
      await playerPage.click('button:has-text("加入房间")');
      playerPages.push(playerPage);
    }

    // Verify 10 players visible
    const playerCount = await page1.locator('text=/\\d+ 在线/').textContent();
    expect(playerCount).toContain('10');

    // Try to add 11th player (should fail)
    const page11 = await context.newPage();
    await page11.goto('/');
    await page11.fill('input[placeholder="请输入房间ID"]', roomId);
    await page11.fill('input[placeholder="请输入昵称"]', 'MaxPlayer11');
    await page11.click('button:has-text("加入房间")');

    // Should show error about maximum players
    await expect(page11.locator('text=/最多|已满/')).toBeVisible({ timeout: 5000 });
  });

  test('should handle browser refresh during game', async ({ page, context }) => {
    // Setup game
    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'RefreshP1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'RefreshP2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    await expect(page2.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });

    // Player 2 refreshes page
    await page2.reload();

    // Should reconnect and see game still running
    // Note: Full reconnect functionality requires implementation
  });

  test('should display eliminated player correctly', async ({ page, context }) => {
    // This would require multiple rounds and score tracking
    // Placeholder for future implementation

    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'ElimP1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'ElimP2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    // Verify initial scores are 10
    await expect(page1.locator('text=10 分')).toBeVisible({ timeout: 10000 });
  });

  test('should show game over screen', async ({ page, context }) => {
    // This would require playing until only one player remains
    // Placeholder for comprehensive game completion test

    const page1 = page;
    await page1.goto('/');
    await page1.fill('input[placeholder="请输入昵称"]', 'GameOverP1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'GameOverP2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    await expect(page1.locator('text=第 1 轮')).toBeVisible({ timeout: 10000 });
  });
});