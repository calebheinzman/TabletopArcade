import { test, expect } from '@playwright/test';

test('should navigate to join game page when clicking Join Game button', async ({ page }) => {
  // Navigate to the home page
  await page.goto('http://localhost:3000/');
  
  // Wait for navigation before clicking
  const joinGameButton = page.getByText('Join Game');
  await joinGameButton.click();
  
  // Wait for the URL to change
  await page.waitForURL('**/join-game');
  
  // Verify we're on the correct page
  expect(page.url()).toContain('/join-game');
});

test('should navigate to game select page when clicking Start Game button', async ({ page }) => {
  // Navigate to the home page
  await page.goto('http://localhost:3000/');
  
  // Wait for navigation before clicking
  const startGameButton = page.getByText('Start Game');
  await startGameButton.click();
  
  // Wait for the URL to change
  await page.waitForURL('**/game-select');
  
  // Verify we're on the correct page
  expect(page.url()).toContain('/game-select');
});

test('should navigate to game review page when selecting hearts', async ({ page }) => {
  // Navigate to the game select page
  await page.goto('http://localhost:3000/game-select');
  
  // Find and click the hearts button
  const heartsButton = page.getByRole('button', { name: 'Hearts' });
  await heartsButton.click();
  
  // Wait for the URL to change and include the game ID parameter
  await page.waitForURL('**/game-review?gameId=*');
  
  // Verify we're on the correct page
  expect(page.url()).toContain('/game-review');
});

test('should navigate to create custom game page when clicking Create Custom Game button', async ({ page }) => {
  // Navigate to the game select page
  await page.goto('http://localhost:3000/game-select');
  
  // Find and click the Create Custom Game button
  const createCustomButton = page.getByRole('button', { name: 'Create Custom Game' });
  await createCustomButton.click();
  
  // Wait for the URL to change
  await page.waitForURL('**/create-custom-game');
  
  // Verify we're on the correct page
  expect(page.url()).toContain('/create-custom-game');
});

test('should show hearts when Social Deduction tag is selected', async ({ page }) => {
  // Navigate to the game select page
  await page.goto('http://localhost:3000/game-select');
  
  // Wait for the page to load and tags to be visible
  await page.waitForSelector('[role="button"]');
  
  // Find and click the Social Deduction tag
  const socialDeductionTag = page.getByRole('button', { name: 'Classic Card Game' });
  await expect(socialDeductionTag).toBeVisible();
  await socialDeductionTag.click();
  
  // Verify that the hearts button is still visible
  const heartsButton = page.getByRole('button', { name: 'Hearts' });
  await expect(heartsButton).toBeVisible();
});

test('should filter games when entering text in search field', async ({ page }) => {
  await page.goto('http://localhost:3000/game-select');
  
  const searchInput = page.getByPlaceholder('Search games...');
  await expect(searchInput).toBeVisible();
  
  await searchInput.fill('Hearts');
  
  const heartsButton = page.getByRole('button', { name: 'Hearts' });
  await expect(heartsButton).toBeVisible();
});

test('should clone Hearts game successfully', async ({ page }) => {
  // Navigate to the game select page
  await page.goto('http://localhost:3000/game-select');
  
  // Search for Hearts
  const searchInput = page.getByPlaceholder('Search games...');
  await searchInput.fill('Hearts');
  
  // Click on Hearts game
  const heartsButton = page.getByRole('button', { name: 'Hearts' });
  await heartsButton.click();
  
  // Wait for game review page to load
  await page.waitForURL('**/game-review?gameId=*');
  
  // Find and click the Clone button
  const cloneButton = page.getByRole('button', { name: 'Clone' });
  await cloneButton.click();
  
  // Verify we're redirected to create-custom-game with clone parameter
  await page.waitForURL('**/create-custom-game?clone=true');
  
  // Wait for the game name input to be populated
  const nameInput = page.getByRole('textbox', { name: /game name/i });
  await expect(nameInput).toHaveValue('Hearts (Clone)');
  
  // Verify some of the game data was loaded correctly
  const rulesSection = page.locator('[data-color-mode="light"]');
  await expect(rulesSection).toBeVisible();
  
  // Verify decks section is populated
  const decksSection = page.getByText(/deck\(s\) created with/i);
  await expect(decksSection).toBeVisible();
  
  // Verify there is exactly one deck
  const deckCards = page.locator('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div').first();
  await expect(deckCards).toBeVisible();
  await expect(page.locator('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div')).toHaveCount(1);
  
  // Click Configure Discard Piles button
  const configureDiscardPilesButton = page.getByRole('button', { name: 'Configure Discard Piles' });
  await configureDiscardPilesButton.click();
  
  // Verify board discard piles
  const boardDiscardPilesTitle = page.getByText('Board Discard Piles');
  await expect(boardDiscardPilesTitle).toBeVisible();
  const boardDiscardPiles = page.locator('text=Card 1-1').first();
  await expect(boardDiscardPiles).toBeVisible();
  
  // Verify player discard piles
  const playerDiscardPilesTitle = page.getByText('Player Discard Piles');
  await expect(playerDiscardPilesTitle).toBeVisible();
  const playerDiscardPiles = page.locator('text=Card 1-1').last();
  await expect(playerDiscardPiles).toBeVisible();
});

test('should start a game session and allow players to join', async ({ browser }) => {
  // Create three browser contexts
  const hostContext = await browser.newContext();
  const player1Context = await browser.newContext();
  const player2Context = await browser.newContext();
  
  // Create pages for each context
  const hostPage = await hostContext.newPage();
  const player1Page = await player1Context.newPage();
  const player2Page = await player2Context.newPage();

  // Host starts the game
  await hostPage.goto('http://localhost:3000/game-review?gameId=48');
  await expect(hostPage.getByText('Game Review')).toBeVisible();
  
  const startGameButton = hostPage.getByRole('button', { name: 'Start Game' });
  await startGameButton.click();
  
  await hostPage.waitForURL(/.*\/session\/\d+\/host-start/);
  await expect(hostPage.getByText("Host Game")).toBeVisible();
  
  // Extract the game code
  const gameCode = await hostPage.locator('.text-2xl.font-bold').textContent();
  console.log('Game code:', gameCode);

  // Player 1 joins the game
  await player1Page.goto('http://localhost:3000/join-game');
  await expect(player1Page.getByRole('heading', { name: 'Join Game' })).toBeVisible();

  // Fill in the join game form for Player 1
  await player1Page.locator('input[placeholder="Enter game code"]').fill(gameCode || '');
  await player1Page.locator('input[placeholder="Enter your name"]').fill('Test User 1');
  await player1Page.getByRole('button', { name: /Join Game|Joining.../ }).click();

  // Verify Player 1 is redirected to waiting room
  await player1Page.waitForURL(/.*\/waiting-room/);
  await expect(player1Page.getByText('Waiting Room')).toBeVisible();

  // Player 2 joins the game
  await player2Page.goto('http://localhost:3000/join-game');
  await expect(player2Page.getByRole('heading', { name: 'Join Game' })).toBeVisible();

  // Fill in the join game form for Player 2
  await player2Page.locator('input[placeholder="Enter game code"]').fill(gameCode || '');
  await player2Page.locator('input[placeholder="Enter your name"]').fill('Test User 2');
  await player2Page.getByRole('button', { name: /Join Game|Joining.../ }).click();

  // Verify Player 2 is redirected to waiting room
  await player2Page.waitForURL(/.*\/waiting-room/);
  await expect(player2Page.getByText('Waiting Room')).toBeVisible();

  // Host starts the game after players have joined
  const startGameWithPlayersButton = hostPage.getByRole('button', { name: 'Start Game' });
  await startGameWithPlayersButton.click();

  // Verify host is redirected to the game board
  await hostPage.waitForURL(/.*\/session\/\d+\/board/);

  // Clean up
  await hostContext.close();
  await player1Context.close();
  await player2Context.close();
});

