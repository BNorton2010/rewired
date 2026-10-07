import { test, expect } from '@playwright/test';

test('onboarding, search, favorites, real playback, seeking, speed, restoration and completion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await expect(page.getByText('Make room for yourself.')).toBeVisible();
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
  await page.getByRole('button', { name: 'Start listening' }).click();
  await expect(page.getByRole('alert')).toContainText(/could not/);
  await page.unroute('**/*.mp3*');
  await expect(page.getByRole('button', { name: 'Retry audio', exact: true })).toBeVisible();
  await page.getByTestId('player-toggle').click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Pause practice');
  await page.getByTestId('player-toggle').click();
  await page.getByTestId('player-toggle').click();
  await page.getByTestId('player-toggle').click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  expect(errors).toEqual([]);
});

test('gold aurora changes shape, stays behind controls, idles and respects reduced motion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('button', { name: 'Start listening' }).click();
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  const visualizer = page.getByTestId('playback-visualizer');
  const paths = visualizer.locator('path[id*="-ribbon-"]');
  const shape = () => paths.first().getAttribute('d');
  const opacity = () => page.getByTestId('waveform-intensity').evaluate(node => Number(getComputedStyle(node).opacity));
  await expect.poll(opacity).toBeGreaterThan(.23);
  expect(await opacity()).toBeLessThanOrEqual(.25);
  expect(await paths.count()).toBe(6);
  const playing = await shape();
  await expect.poll(shape).not.toBe(playing);
  expect(playing).toMatch(/Z$/);

  // The path itself evolves; the SVG isn't a static image translated across the page.
  expect(await visualizer.locator('svg').evaluate(node => getComputedStyle(node).transform)).toBe('none');
  const before = await shape();
  await page.waitForTimeout(450);
  const after = await shape();
  expect(after).not.toBe(before);
  const coordinates = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const a = coordinates(before!); const b = coordinates(after!);
  const deltas = a.map((value, i) => b[i] - value).filter((_, i) => i % 2 === 1);
  expect(Math.max(...deltas) - Math.min(...deltas)).toBeGreaterThan(1);
  const bounds = await visualizer.boundingBox();
  expect(bounds?.x).toBe(0); expect(bounds?.width).toBe(390);
  expect(await visualizer.evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none');
  expect(await page.getByTestId('player-foreground').evaluate(node => Number(getComputedStyle(node).zIndex))).toBeGreaterThan(await visualizer.evaluate(node => Number(getComputedStyle(node).zIndex)));
  const hitControl = await page.getByTestId('player-toggle').evaluate(node => {
    const box = node.getBoundingClientRect();
    return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  });
  expect(hitControl).toBe(true);
  const gradientIds = await page.locator('linearGradient[id^="wave-"]').evaluateAll(nodes => nodes.map(node => node.id));
  expect(new Set(gradientIds).size).toBe(gradientIds.length);

  await page.getByTestId('player-toggle').click();
  await expect.poll(opacity).toBeLessThan(.12);
  const idle = await shape(); await expect.poll(shape).not.toBe(idle);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(200);
  const frozenIdle = await shape();
  await page.waitForTimeout(400); expect(await shape()).toBe(frozenIdle);
  await page.getByTestId('player-toggle').click();
  await expect.poll(opacity).toBeGreaterThan(.23);
  await page.waitForTimeout(200);
  const frozenPlaying = await shape();
  await page.waitForTimeout(400); expect(await shape()).toBe(frozenPlaying);
  await page.screenshot({ path: 'test-results/player-gold-aurora.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('bundled typography and artwork, player controls and large-text layouts remain usable on small screens', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await expect(page.getByText('Make room for yourself.')).toBeVisible();
  const typography = await page.evaluate(() => {
    let background = '';
    let node = document.querySelector('[role="tab"]');
    while (node) {
      const color = getComputedStyle(node).backgroundColor;
      if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') { background = color; break; }
      node = node.parentElement;
    }
    return {
      fonts: Array.from(document.fonts).filter(font => ['CormorantGaramond', 'DMSans', 'DMSansMedium', 'DMSansSemiBold'].includes(font.family)).map(font => ({ family: font.family, status: font.status })),
      background,
    };
  });
  expect(typography.fonts).toHaveLength(4);
  expect(typography.fonts.every(font => font.status === 'loaded')).toBe(true);
  expect(typography.background).toBe('rgb(8, 6, 11)');
  expect(await page.getByRole('heading', { name: 'Make room for yourself.' }).evaluate(node => getComputedStyle(node).fontFamily)).toContain('CormorantGaramond');
  await expect.poll(async () => page.getByTestId('celestial-artwork').evaluateAll(nodes => {
    const images = nodes.flatMap(node => Array.from(node.querySelectorAll('img')));
    return nodes.length > 0 && images.length >= nodes.length && images.every(img => img.complete && img.naturalWidth > 0 && new URL(img.src).origin === location.origin);
  })).toBe(true);

  const enlargeText = () => page.evaluate(() => document.querySelectorAll('[dir="auto"]').forEach(node => {
    if (!(node instanceof HTMLElement) || node.dataset.enlarged) return;
    const computed = getComputedStyle(node);
    node.style.fontSize = `${parseFloat(computed.fontSize) * 1.6}px`;
    if (computed.lineHeight !== 'normal') node.style.lineHeight = `${parseFloat(computed.lineHeight) * 1.6}px`;
    node.dataset.enlarged = 'true';
  }));
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && Array.from(document.querySelectorAll('[role="tab"]')).every(node => node.getBoundingClientRect().right <= innerWidth));
  await enlargeText();
  expect(await noOverflow()).toBe(true);
  await page.getByRole('button', { name: 'Start listening', exact: true }).click();
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  await page.getByTestId('player-toggle').click();
  await enlargeText();
  expect(await noOverflow()).toBe(true);
  for (const name of ['Skip back 15 seconds', 'Skip forward 15 seconds', 'Playback speed 1x. Change speed', 'Reflective text', 'Save practice']) {
    const control = page.getByRole('button', { name, exact: true });
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove favorite', exact: true })).toBeVisible();
  const seek = page.getByRole('slider', { name: 'Seek audio' });
  const beforeSeek = Number(await seek.inputValue());
  const beforeTime = await page.getByTestId('audio-position').textContent();
  await seek.focus();
  await page.keyboard.press('ArrowRight');
  await expect(seek).toHaveValue(String(beforeSeek + 1));
  await expect(page.getByTestId('audio-position')).not.toHaveText(beforeTime!);
  await page.getByRole('button', { name: 'Reflective text', exact: true }).click();
  await expect(page.getByText('Reading companion for the demo.', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'test-results/player-large-text-320.png', fullPage: true });

  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  for (const tab of ['Library', 'My Path'] as const) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await enlargeText();
    expect(await noOverflow()).toBe(true);
    if (tab === 'Library') {
      await expect(page.getByRole('textbox', { name: 'Search lessons' })).toBeVisible();
      await page.getByRole('button', { name: 'Focus', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Open Return to one thing, 5 minute demo sample' })).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Mark day 14 practiced', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Day 14 completed', exact: true })).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test('seeking holds the dragged position and commits on release, including track taps and outside release', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('button', { name: 'Start listening', exact: true }).click();
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  await page.getByTestId('player-toggle').click();
  const slider = page.getByRole('slider', { name: 'Seek audio' });
  await slider.fill('30');
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  const bounds = (await slider.boundingBox())!;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + bounds.width * .1, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .7, y, { steps: 12 });
  const heldValue = Number(await slider.inputValue());
  expect(heldValue).toBeGreaterThan(200);
  await page.waitForTimeout(600);
  await expect(slider).toHaveValue(String(heldValue));
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  await page.mouse.up();
  await expect(page.getByTestId('audio-position')).not.toHaveText('0:30');
  await expect(slider).toHaveValue(String(heldValue));
  await page.mouse.click(bounds.x + bounds.width * .25, y);
  expect(Number(await slider.inputValue())).toBeGreaterThan(60);
  expect(Number(await slider.inputValue())).toBeLessThan(85);
  await page.mouse.move(bounds.x + bounds.width * .25, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 100, y, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue('0');
  await expect(page.getByTestId('audio-position')).toHaveText('0:00');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('1');
  await expect(page.getByTestId('audio-position')).toHaveText('0:01');
  expect(errors).toEqual([]);
});

test('quick-reset and mini-player controls stay in sync and resume the same listening position', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('button', { name: 'Play Before you post', exact: true }).click();
  await expect.poll(async () => page.getByTestId('audio-position').textContent()).not.toBe('0:00');
  await page.getByTestId('player-toggle').click();
  await page.getByRole('slider', { name: 'Seek audio' }).fill('30');
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play audio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Before you post', exact: true }).click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Pause practice');
  await expect.poll(async () => Number(await page.getByRole('slider', { name: 'Seek audio' }).inputValue())).toBeGreaterThanOrEqual(30);
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await page.getByRole('button', { name: 'Pause Before you post', exact: true }).click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await page.getByRole('button', { name: 'Play audio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause Before you post', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Library', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause audio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open player for Before you post', exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole('slider', { name: 'Seek audio' }).inputValue())).toBeGreaterThanOrEqual(30);
  expect(errors).toEqual([]);
});
