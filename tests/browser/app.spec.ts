import { test, expect } from '@playwright/test';

test('onboarding, search, favorites, real playback, seeking, speed, restoration and completion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await expect(page.getByText('Your daily frequency.')).toBeVisible();
  await page.getByRole('tab', { name: 'Library', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search lessons' }).fill('doubt');
  await expect(page.getByText('1 PRACTICE', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Favorite When doubt gets loud', exact: true }).click();
  await page.getByRole('button', { name: 'Open When doubt gets loud, 3 minute demo sample' }).click();
  await page.getByRole('button', { name: 'Play this practice' }).click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Pause practice');
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  await page.getByTestId('player-toggle').click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  await page.getByRole('slider', { name: 'Seek audio' }).fill('30');
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  await page.getByRole('button', { name: 'Skip forward 15 seconds' }).click();
  await expect(page.getByTestId('audio-position')).toHaveText('0:45');
  await page.getByRole('button', { name: 'Skip back 15 seconds' }).click();
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  await page.getByRole('button', { name: 'Playback speed 1x. Change speed' }).click();
  await expect(page.getByRole('button', { name: 'Playback speed 1.25x. Change speed' })).toBeVisible();
  await page.getByRole('button', { name: 'Reflective text', exact: true }).click();
  await expect(page.getByText('Reading companion for the demo.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  await expect(page.getByRole('button', { name: 'Remove favorite' })).toBeVisible();
  await page.getByRole('slider', { name: 'Seek audio' }).fill('177');
  await page.getByTestId('player-toggle').click();
  await expect(page.getByText('PRACTICE COMPLETE', { exact: true })).toBeVisible({ timeout: 12000 });
  await page.getByRole('button', { name: 'Close player' }).click();
  // A reload restores data, not the in-memory native navigation stack.
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Open player for When doubt gets loud' })).toBeVisible();
  await page.getByRole('tab', { name: 'My Path', exact: true }).click();
  await page.getByRole('button', { name: 'Mark day 1 practiced', exact: true }).click();
  await expect(page.getByText('1 / 14 days practiced')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 / 14 days practiced')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rewired-fm.local-demo.v1')!).completedLessons)).toContain('doubt');
  expect(errors).toEqual([]);
});

test('mobile layout, reduced motion, large text and edited preferences', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: '3 minutes', exact: true }).click();
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('tab', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: 'Receiving', exact: true }).click();
  await expect(page.getByText('Make peace with receiving', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search lessons' }).fill('no such practice');
  await expect(page.getByText('No practices found', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  await expect(page.getByRole('button', { name: '3 minutes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '9 minutes', exact: true }).click();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  await expect(page.getByRole('button', { name: '9 minutes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Simulate increased text sizes in the responsive web layout. Native Dynamic
  // Type remains a separate physical-device check.
  await page.evaluate(() => document.querySelectorAll('[dir="auto"]').forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    const computed = getComputedStyle(node);
    node.style.fontSize = `${parseFloat(computed.fontSize) * 1.4}px`;
    if (computed.lineHeight !== 'normal') node.style.lineHeight = `${parseFloat(computed.lineHeight) * 1.4}px`;
  }));
  await page.getByRole('button', { name: 'Save preferences' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Save preferences' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-onboarding.png', fullPage: true });
});

test('failed audio can be retried and rapid pause does not leave an unhandled play promise', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.route('**/*.mp3*', route => route.abort());
  await page.getByRole('button', { name: 'Play today’s practice' }).click();
  await expect(page.getByRole('alert')).toContainText(/could not/);
  await page.unroute('**/*.mp3*');
  await page.getByRole('button', { name: 'Retry audio', exact: true }).click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Pause practice');
  await page.getByTestId('player-toggle').click();
  await page.getByTestId('player-toggle').click();
  await page.getByTestId('player-toggle').click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  expect(errors).toEqual([]);
});

test('waveform moves only during playback and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('button', { name: 'Play today’s practice' }).click();
  await expect(page.getByText('IN THE FLOW', { exact: true })).toBeVisible();
  const bar = page.getByTestId('playback-bar-0');
  const transform = () => bar.evaluate(node => getComputedStyle(node).transform);
  const first = await transform();
  await expect.poll(transform).not.toBe(first);
  await page.getByTestId('player-toggle').click();
  await expect(page.getByText('YOUR DAILY FREQUENCY', { exact: true })).toBeVisible();
  const resting = await transform();
  await page.waitForTimeout(400); expect(await transform()).toBe(resting);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('player-toggle').click();
  await expect(page.getByText('IN THE FLOW', { exact: true })).toBeVisible();
  const reduced = await transform();
  await page.waitForTimeout(400); expect(await transform()).toBe(reduced);
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  await page.screenshot({ path: 'test-results/player-waveform.png', fullPage: true });
});
