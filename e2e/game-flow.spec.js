/**
 * E2E测试 - 基本游戏流程
 */

import { test, expect } from '@playwright/test';

test.describe('Game Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('你画我猜');
  });

  test('should create a room successfully', async ({ page }) => {
    // Enter nickname
    await page.fill('input[placeholder="请输入昵称"]', 'Player1');

    // Click create room button
    await page.click('button:has-text("创建房间")');

    // Wait for room creation
    await expect(page.locator('h2')).toContainText('房间');

    // Verify room ID is displayed
    const roomId = await page.locator('text=房间ID:').textContent();
    expect(roomId).toMatch(/房间ID: [A-Z0-9]{6}/);

    // Verify player is marked as host
    await expect(page.locator('text=Player1')).toBeVisible();
    await expect(page.locator('text=👑')).toBeVisible();
  });

  test('should join an existing room', async ({ page, context }) => {
    // Create room in first tab
    const page1 = page;
    await page1.fill('input[placeholder="请输入昵称"]', 'HostPlayer');
    await page1.click('button:has-text("创建房间")');

    await expect(page1.locator('h2')).toContainText('房间');

    // Get room ID
    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    // Open second tab and join room
    const page2 = await context.newPage();
    await page2.goto('/');

    // Enter room ID and nickname
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'GuestPlayer');

    // Click join button
    await page2.click('button:has-text("加入房间")');

    // Verify joined successfully
    await expect(page2.locator('h2')).toContainText('房间');
    await expect(page2.locator('text=GuestPlayer')).toBeVisible();

    // Verify host sees new player
    await expect(page1.locator('text=GuestPlayer')).toBeVisible();
  });

  test('should start game with enough players', async ({ page, context }) => {
    // Create room
    const page1 = page;
    await page1.fill('input[placeholder="请输入昵称"]', 'Player1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    // Add second player
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'Player2');
    await page2.click('button:has-text("加入房间")');

    // Host starts game
    await expect(page1.locator('button:has-text("开始游戏")')).toBeVisible();
    await page1.click('button:has-text("开始游戏")');

    // Verify game started
    await expect(page1.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });
    await expect(page1.locator('text=你的秘密词汇')).toBeVisible();

    // Verify second player also sees game
    await expect(page2.locator('text=绘画阶段')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=你的秘密词汇')).toBeVisible();
  });

  test('should display canvas points', async ({ page, context }) => {
    // Setup game
    const page1 = page;
    await page1.fill('input[placeholder="请输入昵称"]', 'Drawer1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'Drawer2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    // Wait for canvas
    await expect(page1.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Verify point count
    const pointCountText = await page1.locator('text=/共 \\d+ 个点/').textContent();
    expect(pointCountText).toMatch(/共 \d+ 个点/);

    // Click a point on canvas
    const canvas = page1.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({
        position: { x: 100, y: 100 }
      });
    }
  });

  test('should show timer countdown', async ({ page, context }) => {
    // Setup game
    await page.fill('input[placeholder="请输��昵称"]', 'Timer1');
    await page.click('button:has-text("创建房间")');

    const roomIdText = await page.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'Timer2');
    await page2.click('button:has-text("加入房间")');

    await page.click('button:has-text("开始游戏")');

    // Wait for timer to appear
    await expect(page.locator('text=剩余时间')).toBeVisible({ timeout: 10000 });

    // Verify initial time (120 seconds = 2:00)
    const timerText = await page.locator('text=/\\d:\\d{2}/').textContent();
    expect(timerText).toContain(':');
  });

  test('should handle invalid nickname', async ({ page }) => {
    // Try to create room with empty nickname
    await page.click('button:has-text("创建房间")');

    // Should show error
    await expect(page.locator('text=/昵称/')).toBeVisible();
  });

  test('should handle invalid room ID', async ({ page }) => {
    // Enter invalid room ID
    await page.fill('input[placeholder="请输入房间ID"]', 'INVALID');
    await page.fill('input[placeholder="请输入昵称"]', 'Player');
    await page.click('button:has-text("加入房间")');

    // Should show error message
    await expect(page.locator('text=/不存在|错误/')).toBeVisible();
  });

  test('should show secret word to each player', async ({ page, context }) => {
    // Setup game
    const page1 = page;
    await page1.fill('input[placeholder="请输入昵称"]', 'WordPlayer1');
    await page1.click('button:has-text("创建房间")');

    const roomIdText = await page1.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'WordPlayer2');
    await page2.click('button:has-text("加入房间")');

    await page1.click('button:has-text("开始游戏")');

    // Get secret word from player 1
    await expect(page1.locator('text=你的秘密词汇')).toBeVisible({ timeout: 10000 });
    const secretWord1 = await page1.locator('div[class*="text-"][class*="bold"]').nth(0).textContent();

    // Get secret word from player 2
    await expect(page2.locator('text=你的秘密词汇')).toBeVisible({ timeout: 10000 });
    const secretWord2 = await page2.locator('div[class*="text-"][class*="bold"]').nth(0).textContent();

    // They should have different secret words
    expect(secretWord1).not.toBe(secretWord2);
  });

  test('should display word pool', async ({ page, context }) => {
    // Setup game
    await page.fill('input[placeholder="请输入昵称"]', 'PoolPlayer1');
    await page.click('button:has-text("创建房间")');

    const roomIdText = await page.locator('text=房间ID:').textContent();
    const roomId = roomIdText.match(/[A-Z0-9]{6}/)[0];

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder="请输入房间ID"]', roomId);
    await page2.fill('input[placeholder="请输入昵称"]', 'PoolPlayer2');
    await page2.click('button:has-text("加入房间")');

    await page.click('button:has-text("开始游戏")');

    // Verify word pool display
    await expect(page.locator('text=候选词池')).toBeVisible({ timeout: 10000 });

    const wordPoolText = await page.locator('text=/候选词池 \\(\\d+ 个词\\)/').textContent();
    expect(wordPoolText).toMatch(/\d+ 个词/);
  });
});